import {
  collection,
  getDocs,
  query,
  orderBy,
  startAfter,
  limit,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../firebase-config";
import { Property } from "@/interfaces/property";

const propertiesCollection = collection(db, "properties");

export async function getPropertiesPaginated(
  page: number,
  pageSize: number,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
) {
  let propertiesQuery = query(
    propertiesCollection,
    orderBy("title"),
    limit(pageSize)
  );

  if (lastDoc) {
    propertiesQuery = query(propertiesQuery, startAfter(lastDoc));
  }

  const snapshot = await getDocs(propertiesQuery);
  const properties = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Property[];

  return { properties, lastVisible: snapshot.docs[snapshot.docs.length - 1] };
}