import { adminAuth, adminStorage } from "@/firebase/firebase-admin-config";
import { AgentRegistrationRequest } from "@/interfaces/agentRegistrationRequest";
import { User } from "@/interfaces/user";
import { supabaseAdmin } from "@/supabase/supabase-admin";
import { Database, Json } from "@/supabase/types/types";

type StorageBucket = ReturnType<typeof adminStorage.bucket>;
type Tables = Database["public"]["Tables"];
type UserRow = Tables["users"]["Row"];
type UserInsert = Tables["users"]["Insert"];
type UserUpdate = Tables["users"]["Update"];
type AgentRow = Tables["agents"]["Row"];
type AgentInsert = Tables["agents"]["Insert"];
type AgentRelation = Partial<AgentRow> | null;
type AgentRequestRow = Tables["agent_registration_requests"]["Row"];
type AgentRequestInsert = Tables["agent_registration_requests"]["Insert"];
type RequestStatus = Database["public"]["Enums"]["request_status"];

const AGENT_DOCUMENT_KEYS = new Set(["creciCardPhoto", "creciCert"]);

const nowIso = () => new Date().toISOString();

const getAgentRelation = (relation?: AgentRelation | AgentRelation[] | null): AgentRelation =>
    Array.isArray(relation) ? (relation[0] ?? null) : (relation ?? null);

const toAgentDocuments = (
    documents?: Record<string, string[]> | null
): NonNullable<User["agentProfile"]>["documents"] => ({
    creciCardPhoto: documents?.creciCardPhoto ?? [],
    creciCert: documents?.creciCert ?? [],
});

const mapAgentRowToProfile = (agent?: AgentRelation): User["agentProfile"] | undefined => {
    if (!agent) return undefined;
    return {
        creci: agent.creci ?? "",
        city: agent.city ?? "",
        groups: agent.groups ?? [],
        documents: toAgentDocuments((agent.agent_documents as Record<string, string[]>) ?? {}),
    };
};

const mapUserRowToUser = (row: UserRow & { agents?: AgentRow | AgentRow[] | null }): User => {
    const agentProfile = mapAgentRowToProfile(getAgentRelation(row.agents));

    return {
        id: row.id,
        email: row.email,
        role: row.role as User["role"],
        status: row.status as User["status"],
        fullName: row.full_name ?? "",
        rg: row.rg ?? undefined,
        cpf: row.cpf ?? undefined,
        address: row.address ?? undefined,
        phone: row.phone ?? undefined,
        photoUrl: row.photo_url ?? undefined,
        documents: (row.documents as User["documents"]) ?? {},
        agentProfile,
        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
        updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    };
};

const parseApplicantData = (data: AgentRequestRow["applicant_data"]): AgentRegistrationRequest["applicantData"] => {
    const payload = (data as Record<string, unknown>) ?? {};
    return {
        email: (payload.email as string) ?? "",
        fullName: (payload.fullName as string) ?? "",
        cpf: (payload.cpf as string) ?? "",
        rg: (payload.rg as string) ?? "",
        address: (payload.address as string) ?? "",
        city: (payload.city as string) ?? "",
        creci: (payload.creci as string) ?? "",
        phone: (payload.phone as string) ?? "",
        creciCardPhoto: ((payload.creciCardPhoto as string[]) ?? []).filter(Boolean),
        creciCert: ((payload.creciCert as string[]) ?? []).filter(Boolean),
    };
};

const mapAgentRequestRow = (row: AgentRequestRow): AgentRegistrationRequest => ({
    id: row.user_id,
    userId: row.user_id,
    requesterId: row.user_id,
    status: (row.status as AgentRegistrationRequest["status"]) ?? "pending",
    applicantData: parseApplicantData(row.applicant_data),
    adminMsg: row.admin_msg ?? undefined,
    submittedAt: row.created_at ? new Date(row.created_at) : new Date(),
    resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
});

const buildUserUpdatePayload = (data: Partial<User>): UserUpdate => {
    const payload: UserUpdate = {};

    if (data.fullName !== undefined) payload.full_name = data.fullName;
    if (data.cpf !== undefined) payload.cpf = data.cpf;
    if (data.rg !== undefined) payload.rg = data.rg;
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.address !== undefined) payload.address = data.address;
    if (data.status !== undefined) payload.status = data.status;
    if (data.photoUrl !== undefined) payload.photo_url = data.photoUrl;
    if (data.documents !== undefined) {
        payload.documents = JSON.parse(JSON.stringify(data.documents)) as Json;
    }
    if (data.role !== undefined) payload.role = data.role;

    if (Object.keys(payload).length > 0) {
        payload.updated_at = nowIso();
    }

    return payload;
};

const buildAgentPayload = (userId: string, agentProfile?: User["agentProfile"]): AgentInsert | null => {
    if (!agentProfile || !agentProfile.creci || !agentProfile.city) return null;
    return {
        user_id: userId,
        creci: agentProfile.creci,
        city: agentProfile.city,
        groups: agentProfile.groups ?? [],
        agent_documents: JSON.parse(JSON.stringify(toAgentDocuments(agentProfile.documents ?? undefined))) as Json,
    };
};

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

const extractStoragePathFromUrl = (bucketName: string, fileUrl?: string | null) => {
    if (!fileUrl) return null;
    try {
        const url = new URL(fileUrl);
        const pathParts = decodeURIComponent(url.pathname).replace(/^\//, "").split("/");
        if (pathParts[0] === bucketName && pathParts.length > 1) {
            return pathParts.slice(1).join("/");
        }
        const altIndex = fileUrl.indexOf(`${bucketName}/`);
        if (altIndex !== -1) {
            return decodeURIComponent(fileUrl.slice(altIndex + bucketName.length + 1));
        }
    } catch {
        return null;
    }
    return null;
};

const deleteFileByUrl = async (bucket: StorageBucket, fileUrl?: string | null) => {
    if (!fileUrl) return;
    const path = extractStoragePathFromUrl(bucket.name, fileUrl);
    if (!path) return;
    try {
        await bucket.file(path).delete({ ignoreNotFound: true });
    } catch (error) {
        console.warn("Failed to delete storage file", error);
    }
};

export const getUserCounts = async () => {
    const fetchCount = async (role: User["role"]) => {
        const { count, error } = await supabaseAdmin
            .from("users")
            .select("id", { head: true, count: "exact" })
            .eq("role", role);

        if (error) throw new Error(error.message);
        return count ?? 0;
    };

    const [client, agent, admin] = await Promise.all([fetchCount("client"), fetchCount("agent"), fetchCount("admin")]);

    return { client, agent, admin };
};

export const listUsers = async (role: User["role"], page: number, limitSize: number, status?: User["status"]) => {
    const from = (page - 1) * limitSize;
    const to = from + limitSize - 1;

    let query = supabaseAdmin
        .from("users")
        .select("*, agents(*)", { count: "exact" })
        .eq("role", role)
        .order("created_at", { ascending: false })
        .range(from, to);

    if (status) {
        query = query.eq("status", status);
    }

    const { data, count, error } = await query;

    if (error) throw new Error(error.message);

    const users = (data ?? []).map(mapUserRowToUser);
    const total = count ?? users.length;
    const totalPages = total === 0 ? 1 : Math.ceil(total / limitSize);

    return { users, totalPages, total };
};

export const listAgentRequests = async (status: RequestStatus, page: number, limitSize: number) => {
    const from = (page - 1) * limitSize;
    const to = from + limitSize - 1;

    const { data, count, error } = await supabaseAdmin
        .from("agent_registration_requests")
        .select("*", { count: "exact" })
        .eq("status", status)
        .order("created_at", { ascending: false })
        .range(from, to);

    if (error) throw new Error(error.message);

    const requests = (data ?? []).map(mapAgentRequestRow);
    const total = count ?? requests.length;
    const totalPages = total === 0 ? 1 : Math.ceil(total / limitSize);

    return { requests, totalPages, total };
};

export const listAdminEmails = async (): Promise<string[]> => {
    const { data, error } = await supabaseAdmin.from("users").select("email").eq("role", "admin");
    if (error) throw new Error(error.message);
    return (data ?? []).map(row => row.email).filter((email): email is string => Boolean(email));
};

export const createUser = async (userData: Partial<User> & { password?: string }) => {
    const { password, id: providedId, ...profileData } = userData;
    let userId = providedId;

    if (!userId) {
        if (!profileData.email || !password) {
            throw new Error("Email and password are required to create a user.");
        }
        const userRecord = await adminAuth.createUser({
            email: profileData.email,
            password,
            displayName: profileData.fullName,
        });
        userId = userRecord.uid;
    }

    if (!userId) {
        throw new Error("User ID is required to create a profile.");
    }

    const email = profileData.email;
    if (!email) {
        throw new Error("Email is required to create a user profile.");
    }

    const insertPayload: UserInsert = {
        id: userId,
        email,
        role: profileData.role ?? "client",
        status: profileData.status ?? "pending",
        full_name: profileData.fullName ?? "",
        cpf: profileData.cpf ?? null,
        rg: profileData.rg ?? null,
        phone: profileData.phone ?? null,
        address: profileData.address ?? null,
        documents: JSON.parse(JSON.stringify(profileData.documents ?? {})) as Json,
        photo_url: profileData.photoUrl ?? null,
    };

    const { error } = await supabaseAdmin.from("users").insert(insertPayload);
    if (error) throw new Error(error.message);

    const agentPayload = buildAgentPayload(userId, profileData.agentProfile);
    if (agentPayload) {
        const { error: agentError } = await supabaseAdmin.from("agents").insert(agentPayload);
        if (agentError) throw new Error(agentError.message);
    }

    return getUserProfile(userId);
};

export const createAgentRegistrationRequest = async (
    userId: string,
    applicantData: AgentRegistrationRequest["applicantData"]
) => {
    const payload: AgentRequestInsert = {
        user_id: userId,
        status: "pending",
        applicant_data: JSON.parse(JSON.stringify(applicantData)) as Json,
    };

    const { error } = await supabaseAdmin
        .from("agent_registration_requests")
        .upsert(payload, { onConflict: "user_id" });

    if (error) throw new Error(error.message);
};

export const getUserProfile = async (userId: string) => {
    const { data, error } = await supabaseAdmin
        .from("users")
        .select(
            `
            *,
            agents(*)
        `
        )
        .eq("id", userId)
        .single();

    if (error) throw new Error(error.message);
    return mapUserRowToUser(data as UserRow & { agents?: AgentRow | AgentRow[] | null });
};

export const updateUser = async (userId: string, data: Partial<User>) => {
    if (!userId) throw new Error("User ID is required.");
    const userPayload = buildUserUpdatePayload(data);

    if (Object.keys(userPayload).length > 0) {
        const { error } = await supabaseAdmin.from("users").update(userPayload).eq("id", userId);
        if (error) throw new Error(error.message);
    }

    const agentPayload = buildAgentPayload(userId, data.agentProfile);
    if (agentPayload) {
        const { error: agentError } = await supabaseAdmin
            .from("agents")
            .upsert(agentPayload, { onConflict: "user_id" });
        if (agentError) throw new Error(agentError.message);
    }

    return getUserProfile(userId);
};

export const updateUserProfileData = async (userId: string, dataToUpdate: Partial<User>) => {
    const sanitized = { ...dataToUpdate };
    delete (sanitized as Partial<User>).id;
    delete (sanitized as Partial<User>).email;
    delete (sanitized as Partial<User>).role;

    return updateUser(userId, sanitized);
};

export const deleteUser = async (userId: string) => {
    if (!userId) throw new Error("User ID is required.");

    let user: User | null = null;
    try {
        user = await getUserProfile(userId);
    } catch (error) {
        console.warn(`User ${userId} not found when attempting to delete.`, error);
    }

    if (user?.id) {
        try {
            await adminAuth.deleteUser(user.id);
        } catch (error) {
            if (
                !(error instanceof Error) ||
                !("code" in error) ||
                (error as { code: string }).code !== "auth/user-not-found"
            ) {
                throw error;
            }
        }
    }

    const bucket = adminStorage.bucket();
    const documentUrls = Object.values(user?.documents ?? {}).flat();
    const agentDocumentUrls = Object.values(user?.agentProfile?.documents ?? {}).flat();
    await Promise.all([...documentUrls, ...agentDocumentUrls].map(url => deleteFileByUrl(bucket, url)));
    await deleteFileByUrl(bucket, user?.photoUrl);

    await supabaseAdmin.from("agent_registration_requests").delete().eq("user_id", userId);

    const { error } = await supabaseAdmin.from("users").delete().eq("id", userId);
    if (error) throw new Error(error.message);
};

export const approveAgentRequest = async (requestId: string) => {
    const { data, error } = await supabaseAdmin
        .from("agent_registration_requests")
        .select("*")
        .eq("user_id", requestId)
        .single();

    if (error || !data) throw new Error("Request not found");

    const applicantData = parseApplicantData(data.applicant_data);

    await supabaseAdmin
        .from("users")
        .update({
            role: "agent",
            status: "approved",
            full_name: applicantData.fullName,
            cpf: applicantData.cpf,
            rg: applicantData.rg,
            address: applicantData.address,
            phone: applicantData.phone,
            updated_at: nowIso(),
        })
        .eq("id", requestId);

    await supabaseAdmin.from("agents").upsert(
        {
            user_id: requestId,
            creci: applicantData.creci,
            city: applicantData.city,
            groups: [],
            agent_documents: {
                creciCardPhoto: applicantData.creciCardPhoto,
                creciCert: applicantData.creciCert,
            } as Json,
        },
        { onConflict: "user_id" }
    );

    await supabaseAdmin
        .from("agent_registration_requests")
        .update({ status: "approved", resolved_at: nowIso() })
        .eq("user_id", requestId);
};

export const denyAgentRequest = async (requestId: string, adminMsg: string) => {
    await supabaseAdmin.from("users").update({ status: "denied", updated_at: nowIso() }).eq("id", requestId);

    await supabaseAdmin
        .from("agent_registration_requests")
        .update({ status: "denied", admin_msg: adminMsg, resolved_at: nowIso() })
        .eq("user_id", requestId);
};

export const uploadUserDocuments = async (
    userId: string,
    filesByField: Record<string, File[]>
): Promise<Record<string, string[]>> => {
    if (!userId) throw new Error("User ID is required.");

    const { data, error } = await supabaseAdmin
        .from("users")
        .select("documents, agents(agent_documents)")
        .eq("id", userId)
        .single();

    if (error) throw new Error(error.message);

    const bucket = adminStorage.bucket();
    const uploadedUrls: Record<string, string[]> = {};
    const usedNamesPerField: Record<string, Set<string>> = {};
    const clientDocuments = { ...((data?.documents as Record<string, string[]>) ?? {}) };
    const currentAgent = getAgentRelation(data?.agents);
    const agentDocuments = { ...((currentAgent?.agent_documents as Record<string, string[]>) ?? {}) };
    let clientDocsChanged = false;
    let agentDocsChanged = false;

    await Promise.all(
        Object.entries(filesByField).map(async ([fieldName, files]) => {
            const isAgentDoc = AGENT_DOCUMENT_KEYS.has(fieldName);
            const baseFolder = isAgentDoc ? "agentFiles" : "clientFiles";
            const folderPath = `${baseFolder}/${userId}/${fieldName}/`;
            const usedNames = (usedNamesPerField[fieldName] = usedNamesPerField[fieldName] || new Set<string>());
            const fieldUrls: string[] = [];

            for (const file of files) {
                if (file.size && file.size > 5 * 1024 * 1024) {
                    console.warn(`Skipping file over 5MB for field ${fieldName}: ${file.name}`);
                    continue;
                }

                const uniqueFileName = await ensureUniqueFileName(
                    bucket,
                    folderPath,
                    file.name || "document",
                    usedNames
                );
                const fileUpload = bucket.file(`${folderPath}${uniqueFileName}`);
                const buffer = Buffer.from(await file.arrayBuffer());
                await fileUpload.save(buffer, { metadata: { contentType: file.type } });
                await fileUpload.makePublic();
                const publicUrl = fileUpload.publicUrl();
                fieldUrls.push(publicUrl);
            }

            uploadedUrls[fieldName] = fieldUrls;

            if (fieldUrls.length) {
                if (isAgentDoc) {
                    agentDocuments[fieldName] = [...(agentDocuments[fieldName] ?? []), ...fieldUrls];
                    agentDocsChanged = true;
                } else {
                    clientDocuments[fieldName] = [...(clientDocuments[fieldName] ?? []), ...fieldUrls];
                    clientDocsChanged = true;
                }
            }
        })
    );

    if (clientDocsChanged) {
        const { error: updateError } = await supabaseAdmin
            .from("users")
            .update({ documents: clientDocuments as Json, updated_at: nowIso() })
            .eq("id", userId);
        if (updateError) throw new Error(updateError.message);
    }

    if (agentDocsChanged) {
        if (!currentAgent?.user_id) {
            console.warn(`Agent profile not found when uploading documents for user ${userId}`);
        } else {
            const { error: agentError } = await supabaseAdmin
                .from("agents")
                .update({ agent_documents: agentDocuments as Json })
                .eq("user_id", userId);
            if (agentError) throw new Error(agentError.message);
        }
    }

    return uploadedUrls;
};

export const deleteUserDocument = async (userId: string, fieldName: string, fileUrl: string): Promise<void> => {
    if (!userId) throw new Error("User ID is required.");
    if (!fileUrl) throw new Error("File URL is required.");

    const isAgentDoc = AGENT_DOCUMENT_KEYS.has(fieldName);

    const { data, error } = await supabaseAdmin
        .from("users")
        .select("documents, agents(agent_documents)")
        .eq("id", userId)
        .single();

    if (error) throw new Error(error.message);

    const clientDocuments = { ...((data?.documents as Record<string, string[]>) ?? {}) };
    const currentAgent = getAgentRelation(data?.agents);
    const agentDocuments = { ...((currentAgent?.agent_documents as Record<string, string[]>) ?? {}) };
    let updated = false;

    if (isAgentDoc) {
        if (agentDocuments[fieldName]) {
            const filtered = agentDocuments[fieldName].filter(url => url !== fileUrl);
            if (filtered.length !== agentDocuments[fieldName].length) {
                if (filtered.length) {
                    agentDocuments[fieldName] = filtered;
                } else {
                    delete agentDocuments[fieldName];
                }
                updated = true;
                if (!currentAgent?.user_id) {
                    console.warn(`Agent profile not found when deleting document for user ${userId}`);
                } else {
                    const { error: agentError } = await supabaseAdmin
                        .from("agents")
                        .update({ agent_documents: agentDocuments as Json })
                        .eq("user_id", userId);
                    if (agentError) throw new Error(agentError.message);
                }
            }
        }
    } else if (clientDocuments[fieldName]) {
        const filtered = clientDocuments[fieldName].filter(url => url !== fileUrl);
        if (filtered.length !== clientDocuments[fieldName].length) {
            if (filtered.length) {
                clientDocuments[fieldName] = filtered;
            } else {
                delete clientDocuments[fieldName];
            }

            updated = true;
            const { error: updateError } = await supabaseAdmin
                .from("users")
                .update({ documents: clientDocuments as Json, updated_at: nowIso() })
                .eq("id", userId);
            if (updateError) throw new Error(updateError.message);
        }
    }

    if (updated) {
        await deleteFileByUrl(adminStorage.bucket(), fileUrl);
    }
};

export const uploadUserProfilePhoto = async (userId: string, file: File): Promise<string> => {
    if (!userId) throw new Error("User ID is required.");
    if (!file) throw new Error("No file provided.");

    const { data, error } = await supabaseAdmin.from("users").select("photo_url").eq("id", userId).single();

    if (error) throw new Error(error.message);

    const bucket = adminStorage.bucket();
    await deleteFileByUrl(bucket, data?.photo_url ?? undefined);

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = (file.name.split(".").pop() || "jpg").toLowerCase();
    const safeExt = ["jpg", "jpeg", "png", "webp"].includes(extension) ? extension : "jpg";
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

    const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({ photo_url: publicUrl, updated_at: nowIso() })
        .eq("id", userId);
    if (updateError) throw new Error(updateError.message);

    return publicUrl;
};

export const deleteUserProfilePhoto = async (userId: string): Promise<void> => {
    if (!userId) throw new Error("User ID is required.");

    const { data, error } = await supabaseAdmin.from("users").select("photo_url").eq("id", userId).single();

    if (error) throw new Error(error.message);

    const bucket = adminStorage.bucket();
    await deleteFileByUrl(bucket, data?.photo_url ?? undefined);

    const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({ photo_url: null, updated_at: nowIso() })
        .eq("id", userId);
    if (updateError) throw new Error(updateError.message);
};
