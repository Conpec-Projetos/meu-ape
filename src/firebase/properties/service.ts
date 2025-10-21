import { db, storage } from "@/firebase/firebase-config";
import { Property } from "@/interfaces/property"; // Usando a interface mais completa
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    DocumentData,
    getCountFromServer,
    getDoc,
    getDocs,
    limit,
    orderBy,
    Query,
    query,
    QueryConstraint,
    QueryDocumentSnapshot,
    startAfter,
    Timestamp,
    updateDoc,
    where,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";

/**
 * Generates an array of lowercase keywords from a string.
 * This is used to create a searchable index in Firestore.
 * @param text The text to convert into keywords.
 * @returns An array of unique, lowercase keywords.
 */
const generateKeywords = (text: string): string[] => {
    const textLowerCase = text.toLowerCase();
    const words = textLowerCase.split(" ").filter(word => word.length > 0);

    // Create a set of unique keywords to avoid duplicates
    const keywords = new Set<string>();

    // Add substrings of words to allow for partial matching
    words.forEach(word => {
        for (let i = 1; i <= word.length; i++) {
            keywords.add(word.substring(0, i));
        }
    });

    return Array.from(keywords);
};

export async function criarPropriedade(
    property: Omit<Property, "createdAt" | "updatedAt" | "id">,
    imageFiles?: File[]
): Promise<string> {
    try {
        // Generate keywords for searching
        const searchKeywords = generateKeywords(property.name);

        const docRef = await addDoc(collection(db, "properties"), {
            ...property,
            searchKeywords, // Store the keywords for searching
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            deliveryDate: Timestamp.fromDate(property.deliveryDate as Date),
            launchDate: Timestamp.fromDate(property.launchDate as Date),
            propertyImages: [],
        });

        if (imageFiles && imageFiles.length > 0) {
            const imageUrls = await subirImagensEmLotes(imageFiles, docRef.id);
            await updateDoc(docRef, { propertyImages: imageUrls });
        }

        return docRef.id;
    } catch (error) {
        console.error("Erro ao criar propriedade:", error);
        throw error;
    }
}

export async function buscarPropriedades(): Promise<Property[]> {
    try {
        const q = query(collection(db, "properties"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const properties: Property[] = [];

        querySnapshot.forEach(doc => {
            const data = doc.data();
            properties.push({
                id: doc.id,
                ...data,
                deliveryDate: data.deliveryDate.toDate(),
                launchDate: data.launchDate.toDate(),
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate(),
            } as Property);
        });

        return properties;
    } catch (error) {
        console.error("Erro ao buscar propriedades:", error);
        throw error;
    }
}

export async function buscarPropriedadesPaginado(
    pageSize: number = 30,
    lastDoc?: QueryDocumentSnapshot
): Promise<{
    properties: Property[];
    lastDoc: QueryDocumentSnapshot | null;
    hasMore: boolean;
}> {
    try {
        let q = query(collection(db, "properties"), orderBy("createdAt", "desc"), limit(pageSize));

        if (lastDoc) {
            q = query(collection(db, "properties"), orderBy("createdAt", "desc"), startAfter(lastDoc), limit(pageSize));
        }

        const querySnapshot = await getDocs(q);
        const properties: Property[] = [];

        querySnapshot.forEach(doc => {
            const data = doc.data();
            properties.push({
                id: doc.id,
                ...data,
                deliveryDate: data.deliveryDate.toDate(),
                launchDate: data.launchDate.toDate(),
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate(),
            } as Property);
        });

        const lastDocument = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
        const hasMore = querySnapshot.docs.length === pageSize;

        return {
            properties,
            lastDoc: lastDocument,
            hasMore,
        };
    } catch (error) {
        console.error("Erro ao buscar propriedades paginadas:", error);
        throw error;
    }
}

export async function excluirPropriedade(id: string) {
    try {
        await deleteDoc(doc(db, "properties", id));
    } catch (error) {
        console.error("Erro ao excluir propriedade:", error);
        throw error;
    }
}

export async function subirImagensEmLotes(files: File[], propertyId: string): Promise<string[]> {
    const BATCH_SIZE = 3;
    const imageUrls: string[] = [];

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);

        const batchPromises = batch.map(async (file, index) => {
            const actualIndex = i + index;
            const fileName = `image_${actualIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const storageRef = ref(storage, `properties/${propertyId}/${fileName}`);

            try {
                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                return downloadURL;
            } catch (error) {
                console.error(`Error uploading image ${actualIndex}:`, error);
                throw new Error(`Failed to upload image ${actualIndex + 1}`);
            }
        });

        const batchUrls = await Promise.all(batchPromises);
        imageUrls.push(...batchUrls);
    }

    return imageUrls;
}

export async function buscarPropriedadePorId(id: string): Promise<Property | null> {
    try {
        const docRef = doc(db, "properties", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                deliveryDate: data.deliveryDate.toDate(),
                launchDate: data.launchDate.toDate(),
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate(),
            } as Property;
        }

        return null;
    } catch (error) {
        console.error("Erro ao buscar propriedade:", error);
        throw error;
    }
}

export async function atualizarPropriedade(
    id: string,
    property: Partial<Omit<Property, "createdAt" | "id">>,
    imageFiles?: File[],
    imagensParaRemover?: string[]
) {
    try {
        // --- Image Deletion ---
        if (imagensParaRemover && imagensParaRemover.length > 0) {
            await deleteImages(imagensParaRemover);
        }

        // --- Image Upload ---
        let novasImagensUrls: string[] = [];
        if (imageFiles && imageFiles.length > 0) {
            novasImagensUrls = await subirImagensEmLotes(imageFiles, id);
        }

        // --- Data Update ---
        const updateData: Partial<Property> & { updatedAt: Timestamp } = {
            ...property,
            updatedAt: Timestamp.now(),
        };

        // If new images are uploaded or old ones removed, update the array
        if (novasImagensUrls.length > 0 || (imagensParaRemover && imagensParaRemover.length > 0)) {
            const docRef = doc(db, "properties", id);
            const docSnap = await getDoc(docRef);
            const existingImages = docSnap.exists() ? docSnap.data().propertyImages || [] : [];

            const imagensAtualizadas = existingImages
                .filter((img: string) => !imagensParaRemover?.includes(img))
                .concat(novasImagensUrls);
            updateData.propertyImages = imagensAtualizadas;
        }

        // --- Keyword Generation ---
        if (property.name) {
            updateData.searchKeywords = generateKeywords(property.name);
        }

        // --- Timestamp conversion ---
        if (property.deliveryDate) {
            updateData.deliveryDate = Timestamp.fromDate(property.deliveryDate as Date);
        }
        if (property.launchDate) {
            updateData.launchDate = Timestamp.fromDate(property.launchDate as Date);
        }

        // --- Firestore Update ---
        await updateDoc(doc(db, "properties", id), updateData as DocumentData);

        return id;
    } catch (error) {
        console.error("Erro ao atualizar propriedade:", error);
        throw error;
    }
}

export async function deleteImages(imageUrls: string[]): Promise<void> {
    const deletePromises = imageUrls.map(async url => {
        try {
            const storageRef = ref(storage, url);
            await deleteObject(storageRef);
        } catch (error) {
            console.error("Erro ao deletar imagem:", error);
        }
    });

    await Promise.all(deletePromises);
}

export async function countProperties(): Promise<number> {
    try {
        const q = query(collection(db, "properties"));
        const snapshot = await getCountFromServer(q);
        console.log(snapshot);
        console.log("Total de propriedades:", snapshot.data().count);
        return snapshot.data().count;
    } catch (error) {
        console.error("Erro ao contar propriedades:", error);
        throw error;
    }
}

// --- Função getProperties Modificada ---
/**
 * Fetches properties from Firestore with primary filtering (text search OR default sort) and pagination.
 * Secondary filters (price, bedrooms, etc.) should be applied in the backend API route after this fetch.
 *
 * @param params An object containing primary search parameters (q OR sort preference) and pagination (cursor).
 * @param pageSize The number of documents to fetch per page.
 * @returns A promise that resolves to an object with properties, the next page cursor, and a hasNextPage flag based *only* on the primary query.
 */
export async function getProperties(
    params: { [key: string]: string },
    pageSize: number = 30
): Promise<{
    properties: Property[];
    nextPageCursor: string | null;
    hasNextPage: boolean; // Indicates if Firestore *might* have more based on primary query
}> {
    const { q, cursor } = params; // Somente 'q' e 'cursor' são usados para a query primária aqui

    const PROPERTIES_COLLECTION = "properties";
    let propertiesQuery: Query<DocumentData> = collection(db, PROPERTIES_COLLECTION);
    const constraints: QueryConstraint[] = [];

    // --- Primary Filter Logic ---
    if (q) {
        const keywords = q
            .toLowerCase()
            .split(" ")
            .filter(k => k.length > 0);
        // Apply text search constraint - requires appropriate index on 'searchKeywords'
        keywords.forEach(keyword => {
            constraints.push(where("searchKeywords", "array-contains", keyword));
        });
        // Note: Ordering might be inconsistent or require additional indexing when combining array-contains
        // Consider not applying a specific order here or ensure a composite index exists if needed.
        // constraints.push(orderBy("name")); // Example: order by name if searching, requires index
    } else {
        // --- Default Sorting ---
        constraints.push(orderBy("createdAt", "desc")); // Default sort if no text search
    }

    propertiesQuery = query(propertiesQuery, ...constraints);

    // --- Pagination ---
    let startAfterDoc: QueryDocumentSnapshot | undefined = undefined;
    if (cursor) {
        const cursorDocRef = doc(db, PROPERTIES_COLLECTION, cursor);
        const cursorDocSnap = await getDoc(cursorDocRef);
        if (cursorDocSnap.exists()) {
            startAfterDoc = cursorDocSnap;
            propertiesQuery = query(propertiesQuery, startAfter(startAfterDoc));
        } else {
            console.warn(`Cursor document with ID ${cursor} not found. Fetching from the beginning.`);
        }
    }

    // Fetch one extra document to determine if there's a next page easily
    const queryLimit = pageSize + 1;
    const finalQuery = query(propertiesQuery, limit(queryLimit));
    const documentSnapshots = await getDocs(finalQuery);

    const properties = documentSnapshots.docs
        .slice(0, pageSize) // Take only the number needed for the current page
        .map(doc => {
            const data = doc.data();
            // Convert Timestamps back to Dates if necessary for the frontend
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const convertTimestamp = (ts: any): Date | Timestamp => {
                return ts instanceof Timestamp ? ts.toDate() : ts;
            };
            return {
                id: doc.id,
                ...data,
                // Certifique-se de que as datas sejam convertidas, se necessário
                deliveryDate: data.deliveryDate ? convertTimestamp(data.deliveryDate) : undefined,
                launchDate: data.launchDate ? convertTimestamp(data.launchDate) : undefined,
                createdAt: data.createdAt ? convertTimestamp(data.createdAt) : undefined,
                updatedAt: data.updatedAt ? convertTimestamp(data.updatedAt) : undefined,
            } as Property;
        });

    const hasNextPage = documentSnapshots.docs.length > pageSize;
    const lastDocOnPage = documentSnapshots.docs[pageSize - 1]; // Last doc *of the current page*
    const nextPageCursor = hasNextPage && lastDocOnPage ? lastDocOnPage.id : null;

    return {
        properties,
        nextPageCursor,
        hasNextPage, // Indicates if Firestore *might* have more based on primary query + buffer
    };
}
