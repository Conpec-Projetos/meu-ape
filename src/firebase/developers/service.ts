import { storage } from "@/firebase/firebase-config";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";

export async function uploadDeveloperLogo(file: File): Promise<string> {
    const fileName = `developer_logo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const storageRef = ref(storage, `developers/${fileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return url;
}

export async function deleteDeveloperLogo(url: string): Promise<void> {
    try {
        const storageRef = ref(storage, url);
        await deleteObject(storageRef);
    } catch (e) {
        console.warn("Falha ao deletar logo do storage:", e);
    }
}
