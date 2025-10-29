import { VisitRequest } from "@/interfaces/visitRequest";
import { db } from "../firebase-config";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";

export const createVisitRequest = async (
    visitData: Partial<VisitRequest>
): Promise<void> => {
    const visitRef = doc(collection(db, "visitRequests"));
    const uploadData = {
        ... visitData,
        id: visitRef.id,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
    } as VisitRequest;

    return setDoc(visitRef, uploadData);
}