import { adminAuth, adminStorage, adminDb as db } from "@/firebase/firebase-admin-config";
import { AgentRegistrationRequest } from "@/interfaces/agentRegistrationRequest";
import { User } from "@/interfaces/user";
import { Timestamp as AdminTimestamp, CollectionReference, DocumentData, FieldValue } from "firebase-admin/firestore";
import { DocumentReference as ClientDocumentReference, Timestamp as ClientTimestamp } from "firebase/firestore";

type StorageBucket = ReturnType<typeof adminStorage.bucket>;

const listPaginated = async (
    col: CollectionReference<DocumentData>,
    page: number,
    limitSize: number,
    conditions: [string, FirebaseFirestore.WhereFilterOp, string | number | boolean][]
) => {
    let q: FirebaseFirestore.Query<DocumentData> = col;

    conditions.forEach(([field, op, value]) => {
        q = q.where(field, op, value);
    });

    const totalSnapshot = await q.count().get();
    const total = totalSnapshot.data().count;
    const totalPages = Math.ceil(total / limitSize);

    const paginatedQuery = q.limit(limitSize).offset((page - 1) * limitSize);
    const snapshot = await paginatedQuery.get();

    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { items, totalPages, total };
};

export const getUserCounts = async () => {
    const usersCollection = db.collection("users");
    const clientCountPromise = usersCollection.where("role", "==", "client").count().get();
    const agentCountPromise = usersCollection.where("role", "==", "agent").count().get();
    const adminCountPromise = usersCollection.where("role", "==", "admin").count().get();

    const [clientSnapshot, agentSnapshot, adminSnapshot] = await Promise.all([
        clientCountPromise,
        agentCountPromise,
        adminCountPromise,
    ]);

    return {
        client: clientSnapshot.data().count,
        agent: agentSnapshot.data().count,
        admin: adminSnapshot.data().count,
    };
};

export const listUsers = async (role: string, page: number, limitSize: number, status?: string) => {
    const usersCollection = db.collection("users");
    const conditions: [string, FirebaseFirestore.WhereFilterOp, string | number | boolean][] = [["role", "==", role]];
    if (status) {
        conditions.push(["status", "==", status]);
    }
    const { items, totalPages, total } = await listPaginated(usersCollection, page, limitSize, conditions);
    return { users: items as User[], totalPages, total };
};

export const listAgentRequests = async (status: string, page: number, limitSize: number) => {
    const requestsCollection = db.collection("agentRegistrationRequests");
    const conditions: [string, FirebaseFirestore.WhereFilterOp, string | number | boolean][] = [
        ["status", "==", status],
    ];
    const { items, totalPages, total } = await listPaginated(requestsCollection, page, limitSize, conditions);
    return { requests: items as AgentRegistrationRequest[], totalPages, total };
};

export const listAdminEmails = async (): Promise<string[]> => {
    const usersCollection = db.collection("users");
    const querySnapshot = await usersCollection.where("role", "==", "admin").get();
    const emails: string[] = [];

    querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.email) {
            emails.push(data.email);
        }
    });

    return emails;
};

export const createUser = async (userData: Partial<User> & { password?: string }) => {
    const { email, password, ...profileData } = userData;
    if (!email || !password) {
        throw new Error("Email and password are required to create a user.");
    }
    const userRecord = await adminAuth.createUser({ email, password, displayName: profileData.fullName });

    const user: Omit<User, "id"> = {
        id: userRecord.uid,
        email,
        role: profileData.role || "client",
        fullName: profileData.fullName || "",
        createdAt: AdminTimestamp.now() as unknown as ClientTimestamp,
        updatedAt: AdminTimestamp.now() as unknown as ClientTimestamp,
        ...profileData,
    };

    await db.collection("users").doc(userRecord.uid).set(user);
    return { id: userRecord.uid, ...user };
};

export const updateUser = async (userId: string, userData: Partial<User>) => {
    const userRef = db.collection("users").doc(userId);
    await userRef.update({ ...userData, updatedAt: AdminTimestamp.now() });
    const updatedDoc = await userRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() } as User;
};

export const deleteUser = async (userId: string) => {
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data() as User | undefined;

    if (userData && userData.id) {
        try {
            await adminAuth.deleteUser(userData.id);
        } catch (error: unknown) {
            // It's possible the auth user was already deleted.
            if (
                error instanceof Error &&
                "code" in error &&
                (error as { code: string }).code !== "auth/user-not-found"
            ) {
                throw error;
            }
        }
    }

    // Remove all Cloud Storage files related to this user
    try {
        const bucket = adminStorage.bucket();
        const prefixes = [`clientFiles/${userId}/`, `agentFiles/${userId}/`];

        // Delete files for each known prefix. If a prefix has no files, deleteFiles resolves without throwing.
        for (const prefix of prefixes) {
            try {
                await bucket.deleteFiles({ prefix });
                console.log(`Deleted storage files with prefix: ${prefix}`);
            } catch (err) {
                // Ignore NotFound or permission issues individually to attempt other prefixes
                console.warn(`Warning deleting files for prefix ${prefix}:`, err);
            }
        }
    } catch (storageErr) {
        console.warn("Warning while cleaning up user storage files:", storageErr);
    }

    // Remove agent registration request document if it exists (doc id equals userId)
    try {
        await db.collection("agentRegistrationRequests").doc(userId).delete();
    } catch (reqErr) {
        console.warn(`Warning deleting agentRegistrationRequests/${userId}:`, reqErr);
    }

    await userRef.delete();
};

export const approveAgentRequest = async (requestId: string) => {
    const requestRef = db.collection("agentRegistrationRequests").doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
        throw new Error("Request not found");
    }

    const requestData = requestDoc.data() as AgentRegistrationRequest;
    const { applicantData, requesterId } = requestData;

    if (!requesterId) {
        throw new Error("Requester ID not found in the request");
    }

    // The requesterId field can be a string (UID) or a DocumentReference object.
    // We need to get the user's document ID (which is the UID) from it.
    const userId = typeof requesterId === "string" ? requesterId : (requesterId as ClientDocumentReference).id;

    if (!userId) {
        throw new Error("Could not determine User ID from requesterId.");
    }

    const userRef = db.collection("users").doc(userId);

    const agentProfileData = {
        creci: applicantData.creci,
        city: applicantData.city,
        documents: {
            creciCardPhoto: applicantData.creciCardPhoto,
            creciCert: applicantData.creciCert,
        },
        groups: [],
    };

    await userRef.update({
        role: "agent",
        status: "approved",
        agentProfile: agentProfileData,
        fullName: applicantData.fullName,
        cpf: applicantData.cpf,
        rg: applicantData.rg,
        address: applicantData.address,
        updatedAt: AdminTimestamp.now(),
    });

    await requestRef.update({
        status: "approved",
        resolvedAt: AdminTimestamp.now(),
    });
};

export const denyAgentRequest = async (requestId: string, adminMsg: string) => {
    const requestRef = db.collection("agentRegistrationRequests").doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
        throw new Error("Request not found");
    }

    const requestData = requestDoc.data() as AgentRegistrationRequest;
    const { requesterId } = requestData;

    if (requesterId) {
        // The requesterId field can be a string (UID) or a DocumentReference object.
        const userId = typeof requesterId === "string" ? requesterId : (requesterId as ClientDocumentReference).id;

        if (userId) {
            const userRef = db.collection("users").doc(userId);
            await userRef.update({
                status: "denied",
                updatedAt: AdminTimestamp.now(),
            });
        }
    }

    await requestRef.update({
        status: "denied",
        adminMsg,
        resolvedAt: AdminTimestamp.now(),
    });
};

// --- New function to update profile data ---
export const updateUserProfileData = async (userId: string, dataToUpdate: Partial<User>) => {
    if (!userId) {
        throw new Error("User ID is required.");
    }
    const userRef = db.collection("users").doc(userId);

    const updatePayload: DocumentData = {
        ...dataToUpdate,
        updatedAt: AdminTimestamp.now(),
    };

    delete updatePayload.id;
    delete updatePayload.email;
    delete updatePayload.role;

    // The update method works correctly with AdminTimestamp
    await userRef.update(updatePayload); // No need to cast now
    console.log(`User profile data updated for userId: ${userId}`);
};

// --- New function to upload documents ---
// Recognized agent document keys
const AGENT_DOCUMENT_KEYS = new Set(["creciCardPhoto", "creciCert"]);

const sanitizeFileName = (fileName: string) => {
    if (!fileName) return "document";
    const noSlashes = fileName.replace(/[\\/]+/g, "_");
    const normalizedWhitespace = noSlashes.replace(/\s+/g, " ").trim();
    return normalizedWhitespace || "document";
};

const splitBaseAndExtension = (fileName: string) => {
    const lastDot = fileName.lastIndexOf(".");
    if (lastDot <= 0 || lastDot === fileName.length - 1) {
        return { base: fileName, ext: "" };
    }
    return { base: fileName.slice(0, lastDot), ext: fileName.slice(lastDot) };
};

const ensureUniqueFileName = async (
    bucket: StorageBucket,
    folderPath: string,
    requestedName: string,
    usedNames: Set<string>
): Promise<string> => {
    const sanitized = sanitizeFileName(requestedName);
    const { base, ext } = splitBaseAndExtension(sanitized);

    let copyIndex = 0;
    while (true) {
        const candidate = copyIndex === 0 ? sanitized : `${base} (${copyIndex})${ext}`;
        if (usedNames.has(candidate)) {
            copyIndex += 1;
            continue;
        }
        const [exists] = await bucket.file(`${folderPath}${candidate}`).exists();
        if (!exists) {
            usedNames.add(candidate);
            return candidate;
        }
        copyIndex += 1;
    }
};

export const uploadUserDocuments = async (
    userId: string,
    filesByField: Record<string, File[]>
): Promise<Record<string, string[]>> => {
    if (!userId) {
        throw new Error("User ID is required.");
    }
    const userRef = db.collection("users").doc(userId);
    const bucket = adminStorage.bucket(); // Get default bucket
    const uploadedUrls: Record<string, string[]> = {};
    const usedNamesPerField: Record<string, Set<string>> = {};

    const uploadPromises = Object.entries(filesByField).map(async ([fieldName, files]) => {
        const isAgentDoc = AGENT_DOCUMENT_KEYS.has(fieldName);
        const fieldUrls: string[] = [];
        const baseFolder = isAgentDoc ? "agentFiles" : "clientFiles";
        const folderPath = `${baseFolder}/${userId}/${fieldName}/`;
        const usedNames = (usedNamesPerField[fieldName] = usedNamesPerField[fieldName] || new Set<string>());
        for (const file of files) {
            // Enforce 5MB max per file server-side as well
            if (file.size && file.size > 5 * 1024 * 1024) {
                console.warn(`Skipping file over 5MB for field ${fieldName}: ${file.name}`);
                continue;
            }
            const uniqueFileName = await ensureUniqueFileName(bucket, folderPath, file.name || "document", usedNames);
            const filePath = `${folderPath}${uniqueFileName}`; // Structured path
            const fileUpload = bucket.file(filePath);

            // Convert File to Buffer (required for admin SDK upload)
            const buffer = Buffer.from(await file.arrayBuffer());

            // Upload the file buffer
            await fileUpload.save(buffer, {
                metadata: { contentType: file.type },
            });

            // Make file public (or use signed URLs for private files)
            await fileUpload.makePublic();

            // Get the public URL
            const publicUrl = fileUpload.publicUrl();
            fieldUrls.push(publicUrl);
            console.log(`Uploaded ${file.name} to ${publicUrl}`);
        }

        if (fieldUrls.length) {
            // Update Firestore document with the URLs for this specific field
            // Use dot notation for nested fields
            if (isAgentDoc) {
                await userRef.update({
                    [`agentProfile.documents.${fieldName}`]: FieldValue.arrayUnion(...fieldUrls),
                    updatedAt: AdminTimestamp.now(),
                });
            } else {
                await userRef.update({
                    [`documents.${fieldName}`]: FieldValue.arrayUnion(...fieldUrls), // Append URLs
                    updatedAt: AdminTimestamp.now(), // Update timestamp
                });
            }
        }

        uploadedUrls[fieldName] = fieldUrls;
    });

    await Promise.all(uploadPromises);
    console.log(`User documents updated for userId: ${userId}`);
    return uploadedUrls;
};

// Delete a single user document file (client or agent) by URL and update Firestore arrays accordingly
export const deleteUserDocument = async (userId: string, fieldName: string, fileUrl: string): Promise<void> => {
    if (!userId) throw new Error("User ID is required.");
    if (!fileUrl) throw new Error("File URL is required.");

    const bucket = adminStorage.bucket();
    const userRef = db.collection("users").doc(userId);
    const bucketName = bucket.name;

    // Try to derive the storage path from the public URL
    let storagePath: string | null = null;
    try {
        const u = new URL(fileUrl);
        const pathParts = decodeURIComponent(u.pathname).replace(/^\//, "").split("/");
        if (pathParts[0] === bucketName && pathParts.length > 1) {
            storagePath = pathParts.slice(1).join("/");
        } else {
            const ix = fileUrl.indexOf(`${bucketName}/`);
            if (ix !== -1) {
                storagePath = decodeURIComponent(fileUrl.slice(ix + bucketName.length + 1));
            }
        }
    } catch {
        // ignore, we'll try best effort below
    }

    if (storagePath) {
        try {
            await bucket.file(storagePath).delete({ ignoreNotFound: true });
        } catch {
            console.warn("Error deleting user document from storage:");
        }
    }

    const isAgentDoc = AGENT_DOCUMENT_KEYS.has(fieldName);
    if (isAgentDoc) {
        await userRef.update({
            [`agentProfile.documents.${fieldName}`]: FieldValue.arrayRemove(fileUrl),
            updatedAt: AdminTimestamp.now(),
        });
    } else {
        await userRef.update({
            [`documents.${fieldName}`]: FieldValue.arrayRemove(fileUrl),
            updatedAt: AdminTimestamp.now(),
        });
    }
};

export const uploadUserProfilePhoto = async (userId: string, file: File): Promise<string> => {
    if (!userId) throw new Error("User ID is required.");
    if (!file) throw new Error("No file provided.");

    const bucket = adminStorage.bucket();
    const userRef = db.collection("users").doc(userId);
    const bucketName = bucket.name;

    // Remove previous photo if exists
    try {
        const existing = await userRef.get();
        const data = existing.data() as User | undefined;
        const prevUrl = data?.photoUrl as string | undefined;
        if (prevUrl) {
            try {
                const u = new URL(prevUrl);
                // Expected pathname: /<bucket>/<path>
                const pathParts = decodeURIComponent(u.pathname).replace(/^\//, "").split("/");
                if (pathParts[0] === bucketName && pathParts.length > 1) {
                    const prevPath = pathParts.slice(1).join("/");
                    await bucket.file(prevPath).delete({ ignoreNotFound: true });
                } else {
                    // Fallback: try to find after bucket name in full URL string
                    const ix = prevUrl.indexOf(`${bucketName}/`);
                    if (ix !== -1) {
                        const prevPath = decodeURIComponent(prevUrl.slice(ix + bucketName.length + 1));
                        await bucket.file(prevPath).delete({ ignoreNotFound: true });
                    }
                }
            } catch (e) {
                console.warn("Could not delete previous profile photo:", e);
            }
        }
    } catch (e) {
        console.warn("Failed checking existing user photo:", e);
    }

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const fileExtension = (file.name.split(".").pop() || "jpg").toLowerCase();
    const safeExt = ["jpg", "jpeg", "png", "webp"].includes(fileExtension) ? fileExtension : "jpg";
    const uniqueFileName = `profile-${uniqueSuffix}.${safeExt}`;
    const filePath = `clientFiles/${userId}/profile/${uniqueFileName}`;
    const dest = bucket.file(filePath);

    const buffer = Buffer.from(await file.arrayBuffer());
    await dest.save(buffer, {
        metadata: { contentType: file.type || `image/${safeExt}` },
        validation: false,
    });

    await dest.makePublic();
    const publicUrl = dest.publicUrl();

    await userRef.update({ photoUrl: publicUrl, updatedAt: AdminTimestamp.now() });
    return publicUrl;
};

// --- Delete and clear profile photo ---
export const deleteUserProfilePhoto = async (userId: string): Promise<void> => {
    if (!userId) throw new Error("User ID is required.");
    const bucket = adminStorage.bucket();
    const userRef = db.collection("users").doc(userId);
    const bucketName = bucket.name;

    const snap = await userRef.get();
    if (!snap.exists) return;
    const data = snap.data() as User | undefined;
    const url = data?.photoUrl as string | undefined;
    if (url) {
        try {
            const u = new URL(url);
            const pathParts = decodeURIComponent(u.pathname).replace(/^\//, "").split("/");
            if (pathParts[0] === bucketName && pathParts.length > 1) {
                const filePath = pathParts.slice(1).join("/");
                await bucket.file(filePath).delete({ ignoreNotFound: true });
            } else {
                const ix = url.indexOf(`${bucketName}/`);
                if (ix !== -1) {
                    const filePath = decodeURIComponent(url.slice(ix + bucketName.length + 1));
                    await bucket.file(filePath).delete({ ignoreNotFound: true });
                }
            }
        } catch (e) {
            console.warn("Error deleting profile photo from storage:", e);
        }
    }

    await userRef.update({ photoUrl: FieldValue.delete(), updatedAt: AdminTimestamp.now() });
};
