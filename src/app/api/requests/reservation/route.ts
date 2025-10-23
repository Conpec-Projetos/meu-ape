import { verifySessionCookie } from "@/firebase/firebase-admin-config";
import { db } from "@/firebase/firebase-config";
import { Property } from "@/interfaces/property";
import { ReservationRequest } from "@/interfaces/reservationRequest";
import { Unit } from "@/interfaces/unit";
import { User } from "@/interfaces/user";
import { sendEmailAdmin } from "@/lib/sendEmailAdmin";
import { and, collection, doc, getCountFromServer, getDoc, or, query, runTransaction, serverTimestamp, where } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";


interface RequestData {
    property: Property,
    unit: Unit,
}

export async function POST(req: NextRequest){
    try{
        // 1. Verify user session
        const sessionCookie = req.cookies.get("session")?.value;
        if(!sessionCookie){
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

        const decodedClaims = await verifySessionCookie(sessionCookie);
        if(!decodedClaims){
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }
        const userId = decodedClaims.uid;

        // 2. Get data from request body
        const dataToUpload = await req.json();
        
        const {property, unit} = dataToUpload as RequestData;
        if(!property.id || !unit.id){
            return NextResponse.json({error: "Bad Request"}, {status: 400})
        }

        // 3. Varify if already exist a request
        const userRef = doc(db, "users", userId);
        const propertyRef = doc(db, "properties", property.id);
        const unitRef = doc(db, "properties", property.id, "units", unit.id);

        const q = query(collection(db, "reservationRequests"),
                        and(
                            where("client.ref", "==", userRef),
                            where("unit.ref", "==", unitRef),
                            or(
                                where("status", "==", "pending"),
                                where("status", "==", "approved")
                            ) 
                        )
                        )

        const snapshot = await getCountFromServer(q);

        if(snapshot.data().count > 0){
            return NextResponse.json({error: "Conflict", code: "DUPLICITY"}, {status: 409})
        }

        // 4. Transaction
        try{
            await runTransaction(db, async(transaction) => {
                const unitDoc = await transaction.get(unitRef);
                if(!unitDoc.exists() ){
                    throw new Error("BAD_REQUEST");
                }

                // Verify if the unit is available
                if(!unitDoc.data().isAvailable){
                    throw new Error("CONFLICT");
                }

                // Create Request
                const docRef = doc(collection(db, "reservationRequests"));

                    // Get user data
                const snapshotUser = await transaction.get(userRef);
                const userData = snapshotUser.data() as User | undefined;

                if (!userData) {
                    throw new Error("BAD_REQUEST");
                }

                const uploadData: ReservationRequest = {
                    id: docRef.id,
                    client: {
                        fullName: userData.fullName? userData.fullName: "",
                        address: userData.address? userData.address: "",
                        phone: userData.phone? userData.phone :"",
                        rg: userData.rg? userData.rg :"",
                        cpf: userData.cpf? userData.cpf : "",
                        addressProof: userData.documents? (userData.documents.addressProof? userData.documents?.addressProof:[]) : [],
                        identityDoc: userData.documents? (userData.documents.identityDoc? userData.documents?.identityDoc:[]) : [],
                        incomeProof: userData.documents? (userData.documents.incomeProof? userData.documents?.incomeProof:[]) : [],
                        ref: userRef,
                    },
                    property: {
                        name: property.name,
                        ref: propertyRef,
                    },
                    unit: {
                        block: unit.block? unit.block : "",
                        identifier: unit.identifier,
                        ref: unitRef,
                    },
                    status: "pending",
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                }

                await transaction.set(docRef, uploadData);
                

            });            
        } catch(error){
            if(error instanceof Error){
                if (error.message === "BAD_REQUEST") {
                    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
                }
                if (error.message === "CONFLICT") {
                    return NextResponse.json(
                        { error: "Unit is not available", code: "AVAILABILITY" },
                        { status: 409 }
                    );
                }
                if (error.message === "DUPLICITY") {
                    return NextResponse.json(
                        { error: "Duplicate reservation request", code: "DUPLICITY" },
                        { status: 409 }
                    );
                }      
                return NextResponse.json({error: error.message}, {status: 500});
  
            }

            return NextResponse.json({error: "Internal Server Error"}, {status: 500});
        }

        

        // 5. Send emails to admins
        // Get user name
        const userSnap = await getDoc(userRef);
        let userName: string;
        if (userSnap.exists()) {
            userName = userSnap.data().fullName as string;
        } else {
            console.error("User not found");
            return NextResponse.json({error: "Unauthorized"}, {status: 401});
        }
        
        try{
            await sendEmailAdmin({type: "reservationRequest", clientName: userName, propertyName: property.name, unitIdentifier: unit.identifier, unitBlock: unit.block});
        } catch(error){
            console.error(error);
        }
        

        // 6. Return success response
        return NextResponse.json({ success: true, message: "Visit requested  successfully" });
        
    } catch(error){
        console.error("Error creating reservation request:", error);
        const message = error instanceof Error? error.message : "Internal Server Error";
        return NextResponse.json({error: message}, {status: 500});
    }

}