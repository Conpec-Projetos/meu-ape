import { db } from "@/firebase/firebase-config"
import { collection, doc, onSnapshot, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import { VisitRequest } from "@/interfaces/visitRequest";

// quantidade de docuentos na coleção
const quantityDocs = getDocs(collection(db, "visitRequests"))


export async function getEachVisitRequest() {

}



export async function getVisitsRequests(setVisits: (data: any[]) => void){
    const visitRef = collection(db, "visitRequests");
    const unsubscribe =  onSnapshot(visitRef, (snapshot) => {
        const visitsData: any[] = [];
        
        snapshot.forEach((doc)=> {
            visitsData.push({
                clientName: doc.data().clientName,
                createdAt: doc.data().createdAt,
                propertyName: doc.data().propertyName,
                status: doc.data().status,
                requestedSlots: doc.data().requestedSlots,
                agentsPhone: doc.data().agentsPhone,
                agentsEmail: doc.data().email,
                agentsName: doc.data().agentsName,
                propertyBlock:  doc.data().propertyBlock,
                propertyUnit: doc.data().propertyUnit,
                agentsCreci: doc.data().agentsCreci,
                clientRef: doc.data().clientRef,
                propertyRef: doc.data().propertyRef,
                updatedAt: doc.data().updatedAt,
            });
        });

        setVisits(visitsData);

        console.log("", visitsData);

    });

    return unsubscribe;

}

export async function getReservationRequests(setReservations: (data: any[]) => void){
    const reservationRef = collection(db, "reservationRequests");
    const unsubscribe =  onSnapshot(reservationRef, (snapshot) => {
        const reservationData: any[] = [];
        
        snapshot.forEach((doc)=> {
            reservationData.push({
                clientName: doc.data().clientName,
                createdAt: doc.data().createdAt,
                propertyName: doc.data().propertyName,
                status: doc.data().status,
                requestedSlots: doc.data().requestedSlots,
                agentsPhone: doc.data().agentsPhone,
                agentsEmail: doc.data().email,
                agentsName: doc.data().agentsName,
                propertyBlock:  doc.data().propertyBlock,
                propertyUnit: doc.data().propertyUnit,
                agentsCreci: doc.data().agentsCreci,
                clientRef: doc.data().clientRef,
                propertyRef: doc.data().propertyRef,
                updatedAt: doc.data().updatedAt,
                scheduledSlot: doc.data().scheduledSlot
            });
        });

        setReservations(reservationData);

        console.log("", reservationData);

    });

    return unsubscribe;

}
