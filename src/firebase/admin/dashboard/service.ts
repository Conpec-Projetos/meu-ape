import { adminDb as db } from "@/firebase/firebase-admin-config";

export const pendingVisitRequestsCounts = async () => {
    const usersCollection = db.collection("visitRequests");
    const countQuery = usersCollection.where("status", "==", "pending").count();

    const snapshot = await countQuery.get();

    return {
        pendingVisitRequest: snapshot.data().count,
    };
};

export const pendingReservationRequestCounts = async () => {
    const usersCollection = db.collection("reservationRequests");
    const countQuery = usersCollection.where("status", "==", "pending").count();

    const snapshot = await countQuery.get();

    return {
        pendingReservationRequest: snapshot.data().count,
    };
};

export const pendingAgentRegistrationRequestCounts = async () => {
    const usersCollection = db.collection("agentRegistrationRequests");
    const countQuery = usersCollection.where("status", "==", "pending").count();

    const snapshot = await countQuery.get();

    return {
        pendingAgentRegistrationRequest: snapshot.data().count,
    };
};