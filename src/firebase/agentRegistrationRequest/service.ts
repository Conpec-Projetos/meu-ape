import { AgentFormData, agentSchema, agentRegistrationRequest } from "@/interfaces/agentRegistrationRequest";
import { db, storage } from "@/firebase/firebase-config";
import {
  Timestamp,
  updateDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { createAgentUser } from "../user/user";


export async function createAgentRegistrationRequest(request: AgentFormData): Promise<string> {
  // Validação do formulário com Zod
  const validation = agentSchema.safeParse(request);
  if (!validation.success) {
    throw new Error("dados inválidos");
  }

  // criar usuário no auth
  const userId = await createAgentUser(validation.data);

  // Criação da solicitação de registro de agente no banco de dados
  const { email, fullName, cpf, rg, address, city, creci, phone, password, creciCardPhoto, creciCert } = validation.data;

  const docRef = doc(db, "agentRegistrationRequests", userId);
  await setDoc(docRef, {
    status: "pending",
    applicantData: {
      email,
      fullName,
      cpf: cpf.replace(/\./g, "").replace(/-/g, ""),
      rg: rg.replace(/\./g, "").replace(/-/g, ""),
      address,
      city,
      creci,
      phone: "+55" + phone.replace(/\D/g, ''), // Remove todos os caracteres não numéricos
      creciCardPhoto: [],
      creciCert: [],
    },
    submittedAt: Timestamp.now(),
    requesterId: userId,

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

  // Atualização do perfil do agente com as URLs dos documentos
  const userDocRef = doc(db, "users", userId);
  await updateDoc(userDocRef, {
    "agentProfile.documents.creciCard": urlsCard[0] ? urlsCard : [],
    "agentProfile.documents.creciCert": urlsCert[0] ? urlsCert : [],
  });


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