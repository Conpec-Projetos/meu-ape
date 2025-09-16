import { AgentFormData, agentSchema, agentRegistrationRequest } from "@/interfaces/agentRegistrationRequest";
import { db, storage } from "@/firebase/firebase-config";
import {
  collection,
  addDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";


export async function createAgentRegistrationRequest(request: AgentFormData): Promise<string> {
  // Validação do formulário com Zod
  const validation = agentSchema.safeParse(request);
  if (!validation.success) {
    throw new Error("Invalid request data");
  }

  // Criação da solicitação de registro de agente no banco de dados
  const { email, fullName, cpf, rg, address, city, creci, phone, password, creciCardPhoto, creciCert } = validation.data;
  const parsedPhone = phone.replace(/\D/g, ''); // Remove todos os caracteres não numéricos


  const docRef = await addDoc( collection(db, "agentRegistrationRequests"), {
    status: "pending",
    applicantData: {
      email,
      fullName,
      cpf: cpf.replace(/\./g, "").replace(/-/g, ""),
      rg: rg.replace(/\./g, "").replace(/-/g, ""),
      address,
      city,
      creci,
      phone: "+55" + parsedPhone,
      creciCardPhoto: [],
      creciCert: [],
    },
    submittedAt: Timestamp.now(),
    requesterId: "to-be-defined", // ID temporário

  } as agentRegistrationRequest);

  await updateDoc(docRef, { requesterId: docRef.id });

  // Upload dos arquivos para o Firebase Storage
  const urlsCard = await uploadFiles(Array.from(creciCardPhoto) as File[], docRef.id);
  const urlsCert = await uploadFiles(Array.from(creciCert) as File[], docRef.id);
  
  // Atualização do documento com as URLs dos arquivos
  await updateDoc(docRef, {
    "applicantData.creciCardPhoto": urlsCard[0] ? urlsCard : [],
    "applicantData.creciCert": urlsCert[0] ? urlsCert : [],
  });

  // Criação do usuário no Firebase Authentication (simulado aqui, ajuste conforme necessário)
  // const userCredential = await auth.createUserWithEmailAndPassword(auth, email, password);
  // const userId = userCredential.user.uid;

  // Retornar o ID da solicitação criada
  return docRef.id;
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