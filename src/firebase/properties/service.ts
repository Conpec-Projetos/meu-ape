import { db, storage } from "@/firebase/firebase-config";
import { collection, getCountFromServer, query } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";

export async function uploadImagesInBatch(files: File[], propertyId: string): Promise<string[]> {
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
        return snapshot.data().count;
    } catch (error) {
        console.error("Erro ao contar propriedades:", error);
        throw error;
    }
}
