import { db } from '@/firebase/firebase-config'
import { collection, getDocs, query, orderBy, limit, startAfter } from "firebase/firestore";
import { addDoc, deleteDoc, doc } from 'firebase/firestore'
import { Property } from './property'

const PROPERTIES_COLLECTION = 'properties'
const PAGE_SIZE = 20;

/**
 * Busca todos os imóveis do Firestore.
 */
export async function getProperties(): Promise<Property[]> {
  const propertiesCol = collection(db, PROPERTIES_COLLECTION)
  const q = query(propertiesCol, orderBy('nomeEmpreendimento', 'asc')) // Opcional: ordenar por título
  const propertiesSnapshot = await getDocs(q)
  const propertyList = propertiesSnapshot.docs.map((doc) => {
    const data = doc.data()
    // Mapeando os campos REAIS do seu Firestore para o objeto que a aplicação usa.
    // Note que estamos "forçando" a tipagem para 'Property' com 'as Property'.
    // O ideal seria ajustar o tipo 'Property' para refletir a realidade.
    return {
      id: doc.id, // O ID é crucial para editar e deletar
      title: data.nomeEmpreendimento,
      address: data.enderecoCompleto,
      imageUrl: data.propertyImages,
      
      status: data.status ?? 'UNAVAILABLE', // Adicionando um valor padrão
    } as Property
  })
  return propertyList
}

/**
 * Adiciona um novo imóvel ao Firestore.
 * O tipo Omit<Property, 'id'> significa que estamos recebendo todos os campos de Property, exceto o 'id'.
 */
export async function addProperty(property: Omit<Property, 'id'>): Promise<string> {
  const propertiesCol = collection(db, PROPERTIES_COLLECTION)
  const docRef = await addDoc(propertiesCol, property)
  return docRef.id
}

/**
 * Deleta um imóvel do Firestore usando seu ID.
 */
export async function deleteProperty(propertyId: string): Promise<void> {
  const propertyDoc = doc(db, PROPERTIES_COLLECTION, propertyId)
  await deleteDoc(propertyDoc)
}

// paginacao

export async function getPropertiesPage(lastDoc: any = null) {
  let q = query(collection(db, "properties"), orderBy("createdAt", "desc"), limit(PAGE_SIZE));

  if (lastDoc) {
    q = query(collection(db, "properties"), orderBy("createdAt", "desc"), startAfter(lastDoc), limit(PAGE_SIZE));
  }

  const snap = await getDocs(q);
  const properties = snap.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      title: data.nomeEmpreendimento,
      address: data.enderecoCompleto,
      status: data.status ?? 'UNAVAILABLE',
      imageUrl: data.propertyImages,
      // Adicione outros campos que você precisa exibir na tabela
    } as Property
  });
  const newLastDoc = snap.docs[snap.docs.length - 1] || null;
  const hasMore = snap.docs.length === PAGE_SIZE;

  return { properties, lastDoc: newLastDoc, hasMore };
}
