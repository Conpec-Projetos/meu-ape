import { collection, addDoc, Timestamp, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';

import { Property } from '@/interfaces/property';

export async function criarPropriedade(property: Omit<Property, 'criadoEm'>) {
  try {
    const docRef = await addDoc(collection(db, 'properties'), {
      ...property,
      criadoEm: Timestamp.now(),
      dataLancamento: Timestamp.fromDate(property.dataLancamento),
      prazoEntrega: Timestamp.fromDate(property.prazoEntrega),
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar propriedade:', error);
    throw error;
  }
}

export async function buscarPropriedades() {
  try {
    const q = query(collection(db, 'properties'), orderBy('criadoEm', 'desc'));
    const querySnapshot = await getDocs(q);
    const properties: Property[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      properties.push({
        id: doc.id,
        nomeEmpreendimento: data.nomeEmpreendimento,
        enderecoCompleto: data.enderecoCompleto,
        prazoEntrega: data.prazoEntrega.toDate(),
        dataLancamento: data.dataLancamento.toDate(),
        criadoEm: data.criadoEm.toDate(),
      });
    });
    
    return properties;
  } catch (error) {
    console.error('Erro ao buscar propriedades:', error);
    throw error;
  }
}

export async function excluirPropriedade(id: string) {
  try {
    await deleteDoc(doc(db, 'properties', id));
  } catch (error) {
    console.error('Erro ao excluir propriedade:', error);
    throw error;
  }
}
