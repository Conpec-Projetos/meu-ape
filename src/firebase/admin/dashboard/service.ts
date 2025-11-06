import { adminDb as db } from "@/firebase/firebase-admin-config";
import {
    collection,
    getCountFromServer,
    query,
    where,
    getDocs,

} from "firebase/firestore";


export const pendingVisitRequestsCounts = async () => {
    const usersCollection = db.collection("visitRequest");
    const pendingVisitRequestCountsntPromise = usersCollection.where("status", "==", "pending").count().get();

    const [clientSnapshot] = await Promise.all([
        pendingVisitRequestCountsntPromise
    ]);

    return {
        pendingVisitRequest: clientSnapshot.data().count,
    };
};