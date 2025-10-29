
import { auth, db, storage } from "@/firebase/firebase-config";
import { AgentRegistrationRequest } from "@/interfaces/agentRegistrationRequest";
import { User } from "@/interfaces/user";
import { sendEmailAdmin } from "@/lib/sendEmailAdmin";
import { agentSchema } from "@/schemas/agentRegistrationRequestSchema";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { NextResponse, type NextRequest } from "next/server";

export async function POST (req: NextRequest){
    try{
        // 1. Get data from request body
        const form = await req.formData();

        // Extract files
        const filesCreciCardPhoto = form.getAll("creciCardPhoto") as File[];
        const filesCreciCert = form.getAll("creciCert") as File[];

        const fieldEmail = form.get("email") as string;
        const fieldFullName = form.get("fullName") as string;
        const fieldCpf = form.get("cpf") as string;
        const fieldRg = form.get("rg") as string;
        const fieldAddress = form.get("address") as string;
        const fieldCity = form.get("city") as string;
        const fieldCreci = form.get("creci") as string;
        const fieldPassword = form.get("password") as string;
        const fieldConfirmPassword = form.get("confirmPassword") as string;
        const fieldPhone = form.get("phone") as string;

        const parsedData = {
            email: fieldEmail,
            fullName: fieldFullName,
            cpf: fieldCpf,
            rg: fieldRg,
            address: fieldAddress,
            city: fieldCity,
            creci: fieldCreci,
            password: fieldPassword,
            confirmPassword: fieldConfirmPassword,
            phone: fieldPhone,
            creciCardPhoto: filesCreciCardPhoto,
            creciCert: filesCreciCert,
        };


        // Validade zod form
        const validation = agentSchema.safeParse(parsedData);
        if (!validation.success) {
            return NextResponse.json({error: "Invalid data"}, {status: 400})
        }
            
        const { email, fullName, cpf, rg, address, city, creci, phone, creciCardPhoto, creciCert, password } = validation.data;

        // 2. Create Account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;

        // 3. Upload files
        const urlsCard = await uploadFiles(Array.from(creciCardPhoto) as File[], userId);
        const urlsCert = await uploadFiles(Array.from(creciCert) as File[], userId);


        // 4. Create User doc
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
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            agentProfile: {
                creci,
                city,
                documents: {
                    creciCardPhoto: urlsCard[0] ? urlsCard : [],
                    creciCert: urlsCert[0] ? urlsCert : [],
                },
            },
        };

        const userDocRef = doc(db, "users", userId);
        await setDoc(userDocRef, newUser);

        // 5. Create registration request
        const resgDocRef = doc(db, "agentRegistrationRequests", userId);
    
        await setDoc(resgDocRef, {
            status: "pending",
            applicantData: {
                email,
                fullName,
                cpf: cpf.replace(/\./g, "").replace(/-/g, ""),
                rg: rg.replace(/\./g, "").replace(/-/g, ""),
                address,
                city,
                creci,
                phone: "+55" + phone.replace(/\D/g, ""), // Remove todos os caracteres não numéricos
                creciCardPhoto: urlsCard[0] ? urlsCard : [],
                creciCert: urlsCert[0] ? urlsCert : [],
            },
            submittedAt: serverTimestamp(),
            requesterId: userDocRef,
        } as AgentRegistrationRequest);

        // 6. Enviar email de notificação para admins
        try{
            await sendEmailAdmin({type: "agentRequest", agentName: fullName});
        } catch(error){
            console.error(error);
        }

        // 7. Return success response
        return NextResponse.json({ success: true, message: "Registration requested successfully" });


    } catch(error){
        console.error("Error creating visit request:", error);
        if (error instanceof Error && "code" in error) {
            // Creating account error
            switch(error.code){
                case "auth/email-already-in-use":
                    return NextResponse.json(
                        { error: "Email já cadastrado", path: "email" },
                        { status: 400 }
                    );

                case "auth/invalid-email":
                    return NextResponse.json(
                        { error: "Email inválido", path: "email" },
                        { status: 400 }
                    );

                case "auth/weak-password":
                    return NextResponse.json(
                        { error: "Senha muito fraca. Deve ter no mínimo 6 caracteres.", path: "password" },
                        { status: 400 }
                    );

                default:
                    return NextResponse.json(
                        { error: "Não foi possível criar o usuário." },
                        { status: 500 }
                    );
            }
        } else {
            const message = error instanceof Error? error.message : "Internal Server Error";
            return NextResponse.json({error: message}, {status: 500});
        }
    }

}


async function uploadFiles(files: File[], agentId: string): Promise<string[]> {
    const urls: string[] = [];
    for (const file of files) {
        const storageRef = ref(storage, `agentFiles/${agentId}/${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        urls.push(url);
    }
    return urls;
}