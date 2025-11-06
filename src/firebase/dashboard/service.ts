import { db } from "@/firebase/firebase-config";
import { ReservationRequest } from "@/interfaces/reservationRequest";
import { User } from "@/interfaces/user";
import { VisitRequest } from "@/interfaces/visitRequest";
import {
    collection,
    doc,
    DocumentReference,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    QueryConstraint,
    startAfter,
    Timestamp,
    where,
} from "firebase/firestore";

const PAGE_SIZE = 15; // Define o tamanho da página

/**
 * Busca solicitações (visitas ou reservas) paginadas para um usuário específico.
 */
export async function getUserRequests(
    userId: string,
    type: "visits" | "reservations",
    cursor?: string // ID do último documento da página anterior
): Promise<{
    requests: (VisitRequest | ReservationRequest)[];
    nextPageCursor: string | null;
    hasNextPage: boolean;
}> {
    if (!userId) {
        throw new Error("User ID is required.");
    }

    const collectionName = type === "visits" ? "visitRequests" : "reservationRequests";
    const requestsCollectionRef = collection(db, collectionName);
    const userDocRef = doc(db, "users", userId);

    // Constrói a query base
    const constraints: QueryConstraint[] = [
        where("client.ref", "==", userDocRef), // Garante que busca apenas as do usuário logado
        orderBy("createdAt", "desc"), // Ordenação essencial para paginação por cursor
        limit(PAGE_SIZE + 1), // Busca um item a mais para verificar hasNextPage
    ];

    // Adiciona o cursor se ele foi fornecido
    if (cursor) {
        const cursorDocRef = doc(db, collectionName, cursor);
        const cursorDocSnap = await getDoc(cursorDocRef);
        if (cursorDocSnap.exists()) {
            constraints.push(startAfter(cursorDocSnap));
        } else {
            console.warn(
                `Cursor document with ID ${cursor} not found in ${collectionName}. Fetching from the beginning.`
            );
        }
    }

    const q = query(requestsCollectionRef, ...constraints);
    const querySnapshot = await getDocs(q);

    const requestsData: (VisitRequest | ReservationRequest)[] = [];
    const docs = querySnapshot.docs;

    // Processa os documentos (até PAGE_SIZE)
    for (let i = 0; i < Math.min(docs.length, PAGE_SIZE); i++) {
        const docSnap = docs[i];
        const data = docSnap.data() as Omit<VisitRequest | ReservationRequest, "id">;

        // Hidratação de dados do corretor para solicitações aprovadas (visitas e reservas)
        type AgentInfo = NonNullable<VisitRequest["agents"]>[number];
        let hydratedAgents: VisitRequest["agents"] = [];
        const status = (data as { status: string }).status;
        const agentsField = (data as { agents?: VisitRequest["agents"] }).agents;
        if ((status === "approved" || status === "completed") && agentsField?.length) {
            const agentFetchPromises = agentsField.map(async agentRefObj => {
                const ref = (agentRefObj as { ref?: DocumentReference }).ref;
                if (ref) {
                    const agentDoc = await getDoc(ref);
                    if (agentDoc.exists()) {
                        const agentData = agentDoc.data() as User;
                        // Retorna o objeto no formato esperado pela interface
                        return {
                            ref,
                            name: agentData.fullName || "Nome não encontrado",
                            creci: agentData.agentProfile?.creci || "N/A",
                            phone: agentData.phone || "N/A",
                            email: agentData.email || "N/A",
                        } as AgentInfo;
                    }
                }
                return null; // Retorna null se a referência não existir ou o doc não for encontrado
            });
            // Espera todas as buscas e filtra os resultados nulos
            hydratedAgents = (await Promise.all(agentFetchPromises)).filter(
                (agent): agent is AgentInfo => agent !== null
            ) as VisitRequest["agents"];
        }

        // Converte Timestamps do Firestore para objetos Date do JS
        const convertTimestamp = (ts: unknown): Date | undefined => {
            return ts instanceof Timestamp ? ts.toDate() : undefined;
        };

        const convertTimestampArray = (tsArray: unknown): (Date | Timestamp)[] | undefined => {
            if (Array.isArray(tsArray)) {
                return tsArray.map(ts => (ts instanceof Timestamp ? ts.toDate() : ts));
            }
            return undefined;
        };

        // Monta o objeto final
        requestsData.push({
            id: docSnap.id,
            ...data,
            // Sobrescreve agents apenas se foram hidratados
            ...(hydratedAgents && hydratedAgents.length > 0 && { agents: hydratedAgents }),
            // Converte as datas
            createdAt: convertTimestamp(data.createdAt)!, // Assuming createdAt always exists
            updatedAt: convertTimestamp(data.updatedAt)!, // Assuming updatedAt always exists
            // Converte datas específicas de VisitRequest
            ...(type === "visits" && {
                requestedSlots: convertTimestampArray((data as VisitRequest).requestedSlots) || [],
                scheduledSlot: convertTimestamp((data as VisitRequest).scheduledSlot),
            }),
        } as VisitRequest | ReservationRequest);
    }

    // Determina se há mais páginas e qual o próximo cursor
    const hasNextPage = docs.length > PAGE_SIZE;
    const lastVisibleDoc = docs[Math.min(docs.length, PAGE_SIZE) - 1];
    const nextPageCursor = hasNextPage && lastVisibleDoc ? lastVisibleDoc.id : null;

    return {
        requests: requestsData,
        nextPageCursor,
        hasNextPage,
    };
}

// Funções antigas getVisitsRequests e getReservationRequests foram removidas
// pois a lógica agora está centralizada em getUserRequests e será chamada por uma API Route.
