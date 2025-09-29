import { adminDb as db, adminAuth } from '@/firebase/firebase-admin-config';
import { User } from '@/interfaces/user';
import { AgentRegistrationRequest } from '@/interfaces/agentRegistrationRequest';
import { CollectionReference, DocumentData, Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import { Timestamp as ClientTimestamp, DocumentReference as ClientDocumentReference } from 'firebase/firestore';

const listPaginated = async (col: CollectionReference<DocumentData>, page: number, limitSize: number, conditions: [string, FirebaseFirestore.WhereFilterOp, string | number | boolean][]) => {
  let q: FirebaseFirestore.Query<DocumentData> = col;
  
  conditions.forEach(([field, op, value]) => {
    q = q.where(field, op, value);
  });

  const totalSnapshot = await q.count().get();
  const total = totalSnapshot.data().count;
  const totalPages = Math.ceil(total / limitSize);

  const paginatedQuery = q.limit(limitSize).offset((page - 1) * limitSize);
  const snapshot = await paginatedQuery.get();

  const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return { items, totalPages, total };
}

export const getUserCounts = async () => {
  const usersCollection = db.collection('users');
  const clientCountPromise = usersCollection.where('role', '==', 'client').count().get();
  const agentCountPromise = usersCollection.where('role', '==', 'agent').count().get();
  const adminCountPromise = usersCollection.where('role', '==', 'admin').count().get();

  const [clientSnapshot, agentSnapshot, adminSnapshot] = await Promise.all([clientCountPromise, agentCountPromise, adminCountPromise]);

  return {
    client: clientSnapshot.data().count,
    agent: agentSnapshot.data().count,
    admin: adminSnapshot.data().count,
  };
};

export const listUsers = async (role: string, page: number, limitSize: number, status?: string) => {
  const usersCollection = db.collection('users');
  const conditions: [string, FirebaseFirestore.WhereFilterOp, string | number | boolean][] = [['role', '==', role]];
  if (status) {
    conditions.push(['status', '==', status]);
  }
  const { items, totalPages, total } = await listPaginated(usersCollection, page, limitSize, conditions);
  return { users: items as User[], totalPages, total };
};

export const listAgentRequests = async (status: string, page: number, limitSize: number) => {
  const requestsCollection = db.collection('agentRegistrationRequests');
  const conditions: [string, FirebaseFirestore.WhereFilterOp, string | number | boolean][] = [['status', '==', status]];
  const { items, totalPages, total } = await listPaginated(requestsCollection, page, limitSize, conditions);
  return { requests: items as AgentRegistrationRequest[], totalPages, total };
};

export const createUser = async (userData: Partial<User> & {password?: string}) => {
  const { email, password, ...profileData } = userData;
  if (!email || !password) {
      throw new Error("Email and password are required to create a user.");
  }
  const userRecord = await adminAuth.createUser({ email, password, displayName: profileData.fullName });
  
  const user: Omit<User, 'id'> = {
    id: userRecord.uid,
    email,
    role: profileData.role || 'client',
    fullName: profileData.fullName || '',
    createdAt: AdminTimestamp.now() as unknown as ClientTimestamp,
    updatedAt: AdminTimestamp.now() as unknown as ClientTimestamp,
    ...profileData,
  };

  await db.collection('users').doc(userRecord.uid).set(user);
  return { id: userRecord.uid, ...user };
};

export const updateUser = async (userId: string, userData: Partial<User>) => {
  const userRef = db.collection('users').doc(userId);
  await userRef.update({ ...userData, updatedAt: AdminTimestamp.now() });
  const updatedDoc = await userRef.get();
  return { id: updatedDoc.id, ...updatedDoc.data() } as User;
};

export const deleteUser = async (userId: string) => {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data() as User | undefined;

    if (userData && userData.id) {
        try {
            await adminAuth.deleteUser(userData.id);
        } catch (error: unknown) {
            // It's possible the auth user was already deleted.
            if (error instanceof Error && 'code' in error && (error as {code: string}).code !== 'auth/user-not-found') {
                throw error;
            }
        }
    }
    await userRef.delete();
};

export const approveAgentRequest = async (requestId: string) => {
  const requestRef = db.collection('agentRegistrationRequests').doc(requestId);
  const requestDoc = await requestRef.get();

  if (!requestDoc.exists) {
    throw new Error('Request not found');
  }

  const requestData = requestDoc.data() as AgentRegistrationRequest;
  const { applicantData, requesterId } = requestData;

  if (!requesterId) {
    throw new Error('Requester ID not found in the request');
  }

  // The requesterId field can be a string (UID) or a DocumentReference object.
  // We need to get the user's document ID (which is the UID) from it.
  const userId = typeof requesterId === 'string' ? requesterId : (requesterId as ClientDocumentReference).id;

  if (!userId) {
      throw new Error("Could not determine User ID from requesterId.");
  }
  
  const userRef = db.collection('users').doc(userId);

  const agentProfileData = {
    creci: applicantData.creci,
    city: applicantData.city,
    documents: {
        creciCardPhoto: applicantData.creciCardPhoto,
        creciCert: applicantData.creciCert,
    },
    groups: []
  };

  await userRef.update({
    role: 'agent',
    status: 'approved',
    agentProfile: agentProfileData,
    fullName: applicantData.fullName,
    cpf: applicantData.cpf,
    rg: applicantData.rg,
    address: applicantData.address,
    updatedAt: AdminTimestamp.now()
  });

  await requestRef.update({
    status: 'approved',
    resolvedAt: AdminTimestamp.now(),
  });
};

export const denyAgentRequest = async (requestId: string, adminMsg: string) => {
  const requestRef = db.collection('agentRegistrationRequests').doc(requestId);
  const requestDoc = await requestRef.get();

  if (!requestDoc.exists) {
    throw new Error('Request not found');
  }

  const requestData = requestDoc.data() as AgentRegistrationRequest;
  const { requesterId } = requestData;

  if (requesterId) {
    // The requesterId field can be a string (UID) or a DocumentReference object.
    const userId = typeof requesterId === 'string' ? requesterId : (requesterId as ClientDocumentReference).id;
    
    if (userId) {
        const userRef = db.collection('users').doc(userId);
        await userRef.update({
            status: 'denied',
            updatedAt: AdminTimestamp.now()
        });
    }
  }
  
  await requestRef.update({
    status: 'denied',
    adminMsg,
    resolvedAt: AdminTimestamp.now(),
  });
};