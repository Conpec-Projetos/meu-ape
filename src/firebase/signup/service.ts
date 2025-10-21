import { auth, db } from "@/firebase/firebase-config";
import { User } from "@/interfaces/user";
import { AgentFormData } from "@/schemas/agentRegistrationRequestSchema";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Timestamp, doc, setDoc } from "firebase/firestore";

async function createUser(email: string, password: string): Promise<string> {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential.user.uid;
    } catch (error) {
        console.error("Erro ao criar usuário:", error);
        if (error instanceof Error && "code" in error) {
            if (error.code === "auth/email-already-in-use") {
                throw { message: "Email já cadastrado", path: "email" };
            } else if (error.code === "auth/invalid-email") {
                throw { message: "Email inválido", path: "email" };
            } else if (error.code === "auth/weak-password") {
                throw { message: "Senha muito fraca. Deve ter no mínimo 6 caracteres.", path: "password" };
            } else {
                throw { message: "Não foi possível criar o usuário.", path: "unknown" };
            }
        } else {
            throw new Error("Não foi possível criar o usuário.");
        }
    }
}

export async function createAgentUser(agentData: AgentFormData): Promise<string> {
    const { email, password, fullName, rg, cpf, address, phone, creci, city } = agentData;

    // Criação do usuário no Firebase Authentication
    const userId = await createUser(email, password);

    // Criação do perfil do agente no Firestore
    const newUser: User = {
        id: userId,
        email,
        role: "agent",
        status: "pending",
        fullName,
        rg: rg.replace(/\./g, "").replace(/-/g, ""),
        cpf: cpf.replace(/\./g, "").replace(/-/g, ""),
        address,
        phone: "+55" + phone.replace(/\D/g, ""),
        documents: {},
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        agentProfile: {
            creci,
            city,
            documents: {
                creciCardPhoto: [],
                creciCert: [],
            },
        },
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
