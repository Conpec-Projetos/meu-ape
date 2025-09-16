import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase/firebase-config";
import { user } from "@/interfaces/users";
import { db } from "@/firebase/firebase-config";
import { collection, addDoc, Timestamp, doc, setDoc } from "firebase/firestore";
import { AgentFormData } from "@/interfaces/agentRegistrationRequest";

async function createUser(email: string, password: string): Promise<string> {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential.user.uid;
    } catch (error) {
        console.error("Erro ao criar usuário:", error);
        throw new Error("Não foi possível criar o usuário.");
    }
}

export async function createAgentUser(agentData: AgentFormData): Promise<string> {
    const { email, password, fullName, rg, cpf, address, phone, creci, city } = agentData;

    // Criação do usuário no Firebase Authentication
    const userId = await createUser(email, password);

    // Criação do perfil do agente no Firestore
    const newUser: user = {
        userId,
        email,
        role: "agent",
        fullName,
        rg: rg.replace(/\./g, "").replace(/-/g, ""),
        cpf: cpf.replace(/\./g, "").replace(/-/g, ""),
        address,
        phone: "+55" + phone.replace(/\D/g, ''),
        documents: {},
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        agentProfile: {
            creci,
            city,
            documents: {
                creciCard: [],
                creciCert: [],
            }
        }
    };

    try {
        const docRef = doc(db, "users", userId);
        await setDoc(docRef, newUser);
        return userId;
    } catch (error) {
        console.error("Erro ao criar perfil do agente:", error);
        throw new Error("Não foi possível criar o perfil do agente.");
    }
}