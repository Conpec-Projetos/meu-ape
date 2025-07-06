import { collection, addDoc, Timestamp, getDocs, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/firebase/firebase-config';

import { Property } from '@/interfaces/property';

export async function criarPropriedade(property: Omit<Property, 'criadoEm'>, imageFiles?: File[]) : Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'properties'), {
      ...property,
      criadoEm: Timestamp.now(),
      dataLancamento: Timestamp.fromDate(property.dataLancamento),
      prazoEntrega: Timestamp.fromDate(property.prazoEntrega),
      imagens: [],
    });

    if (imageFiles && imageFiles.length > 0) {
      const imageUrls = await subirImagensEmLotes(imageFiles, docRef.id);
      await updateDoc(docRef, { imagens: imageUrls });
    }

    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar propriedade:', error);
    throw error;
  }
}

export async function buscarPropriedades() : Promise<Property[]> {
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
        imagens: data.imagens || [],
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

export async function subirImagensEmLotes(files: File[], propertyId: string): Promise<string[]> {
  const BATCH_SIZE = 3;
  const imageUrls: string[] = [];
  
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    
    const batchPromises = batch.map(async (file, index) => {
      const actualIndex = i + index;
      const fileName = `image_${actualIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const storageRef = ref(storage, `properties/${propertyId}/${fileName}`);
      
      try {
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
      } catch (error) {
        console.error(`Error uploading image ${actualIndex}:`, error);
        throw new Error(`Failed to upload image ${actualIndex + 1}`);
      }
    });

    const batchUrls = await Promise.all(batchPromises);
    imageUrls.push(...batchUrls);
  }

  return imageUrls;
}

export async function deleteImages(imageUrls: string[]) : Promise<void> {
  const deletePromises = imageUrls.map(async (url) => {
    try {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
    }
  });

  await Promise.all(deletePromises);
}
