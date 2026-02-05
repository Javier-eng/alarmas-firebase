import {
  collection,
  query,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
  getDocFromServer,
  where,
  arrayUnion,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';


export type GroupInfo = { id: string; name: string; owner: string; createdAt: number };

export const createGroup = async (
  userId: string,
  groupName?: string
): Promise<{ groupId: string; groupName: string }> => {
  // Usar databaseService para centralizar la creación de grupos
  const { createGroup: createGroupInDb } = await import('./databaseService');
  const name = (groupName ?? 'Mi Grupo').trim() || 'Mi Grupo';
  return createGroupInDb(userId, name);
};

/** Solicitar unirse a un grupo. El usuario queda en estado 'pending' hasta que el admin acepte. */
export const joinGroupRequest = async (
  userId: string,
  groupId: string,
  displayName: string | null,
  photoURL: string | null
): Promise<{ groupName: string }> => {
  const id = groupId.trim().toUpperCase();
  const groupRef = doc(db, 'groups', id);
  let groupSnap;
  try {
    groupSnap = await getDocFromServer(groupRef);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Solo considerar offline si realmente es un error de red (no permisos u otros)
    const isOffline = /offline|unavailable|network|connection|failed to fetch|networkerror/i.test(msg)
      && !/permission|denied|unauthorized/i.test(msg);
    if (isOffline) {
      throw new Error('Sin conexión. Comprueba tu internet e inténtalo de nuevo.');
    }
    throw e;
  }
  if (!groupSnap.exists()) {
    throw new Error('No existe ningún grupo con ese ID. Comprueba el código e inténtalo de nuevo.');
  }
  const data = groupSnap.data();
  const members = (data?.members as string[] | undefined) ?? [];
  if (members.includes(userId)) {
    throw new Error('Ya eres miembro de este grupo.');
  }
  const groupName = (data?.name as string) ?? 'Mi Grupo';
  const pendingRef = doc(db, 'groups', id, 'pending', userId);
  await setDoc(pendingRef, {
    displayName: displayName ?? 'Usuario',
    photoURL: photoURL ?? null,
    requestedAt: Date.now(),
  });
  await updateDoc(doc(db, 'users', userId), { groupId: id, groupName });
  return { groupName };
};

export type PendingRequest = {
  userId: string;
  displayName: string;
  photoURL: string | null;
  requestedAt: number;
};

export const subscribeToPendingRequests = (
  groupId: string,
  callback: (requests: PendingRequest[]) => void
) => {
  const q = query(
    collection(db, 'groups', groupId, 'pending'),
    orderBy('requestedAt', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map((d) => ({
      userId: d.id,
      displayName: (d.data().displayName as string) ?? 'Usuario',
      photoURL: (d.data().photoURL as string) ?? null,
      requestedAt: (d.data().requestedAt as number) ?? 0,
    }));
    callback(requests);
  });
};

/** Aceptar a un usuario en el grupo. Solo el owner puede. */
export const acceptMember = async (
  adminUserId: string,
  groupId: string,
  userId: string
): Promise<void> => {
  const id = groupId.trim().toUpperCase();
  const groupRef = doc(db, 'groups', id);
  // Usar getDocFromServer para asegurar que leemos del servidor (no caché local)
  const groupSnap = await getDocFromServer(groupRef);
  if (!groupSnap.exists()) throw new Error('El grupo no existe.');
  const data = groupSnap.data();
  if ((data?.owner as string) !== adminUserId) {
    throw new Error('Solo el administrador del grupo puede aceptar solicitudes.');
  }
  await updateDoc(groupRef, { members: arrayUnion(userId) });
  const pendingRef = doc(db, 'groups', id, 'pending', userId);
  await deleteDoc(pendingRef);
};

/** Rechazar una solicitud. Solo el owner puede. Borra pending; el usuario debe limpiar su grupo al detectarlo. */
export const rejectMember = async (
  adminUserId: string,
  groupId: string,
  userId: string
): Promise<void> => {
  const id = groupId.trim().toUpperCase();
  const groupRef = doc(db, 'groups', id);
  // Usar getDocFromServer para asegurar que leemos del servidor (no caché local)
  const groupSnap = await getDocFromServer(groupRef);
  if (!groupSnap.exists()) throw new Error('El grupo no existe.');
  const data = groupSnap.data();
  if ((data?.owner as string) !== adminUserId) {
    throw new Error('Solo el administrador del grupo puede rechazar solicitudes.');
  }
  const pendingRef = doc(db, 'groups', id, 'pending', userId);
  await deleteDoc(pendingRef);
  // El usuario detectará en su cliente que ya no está en pending y limpiará su grupo con clearMyGroup.
}

/** Limpiar el grupo del usuario (ej. tras ser rechazado). Solo actualiza su propio documento. */
export const clearMyGroup = async (userId: string): Promise<void> => {
  await updateDoc(doc(db, 'users', userId), { groupId: null, groupName: null });
};

export type GroupData = {
  name: string;
  owner: string;
  members: string[];
};

export const subscribeToGroup = (
  groupId: string,
  callback: (data: GroupData | null) => void
) => {
  const groupRef = doc(db, 'groups', groupId.trim().toUpperCase());
  return onSnapshot(
    groupRef,
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      const d = snap.data();
      callback({
        name: (d?.name as string) ?? 'Mi Grupo',
        owner: (d?.owner as string) ?? '',
        members: (d?.members as string[]) ?? [],
      });
    },
    (err) => {
      console.error('subscribeToGroup error:', err);
      callback(null);
    }
  );
};

/** Suscripción al estado de solicitud del usuario en un grupo (si tiene doc en pending). */
export const subscribeToMyPendingStatus = (
  groupId: string,
  userId: string,
  callback: (isPending: boolean) => void
) => {
  const pendingRef = doc(db, 'groups', groupId.trim().toUpperCase(), 'pending', userId);
  return onSnapshot(
    pendingRef,
    (snap) => callback(snap.exists()),
    (err) => {
      console.error('subscribeToMyPendingStatus error:', err);
      callback(false);
    }
  );
};

export const subscribeToMyGroups = (userId: string, callback: (groups: GroupInfo[]) => void) => {
  const q = query(collection(db, 'groups'), where('owner', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const groups = snapshot.docs.map((d) => ({
      id: d.id,
      name: (d.data().name as string) ?? 'Mi Grupo',
      owner: d.data().owner as string,
      createdAt: (d.data().createdAt as number) ?? 0,
    }));
    groups.sort((a, b) => b.createdAt - a.createdAt);
    callback(groups);
  });
};

export const deleteGroup = async (userId: string, groupId: string): Promise<void> => {
  const id = groupId.trim().toUpperCase();
  const groupRef = doc(db, 'groups', id);
  // Usar getDocFromServer para asegurar que leemos del servidor (no caché local)
  const groupSnap = await getDocFromServer(groupRef);
  if (!groupSnap.exists()) throw new Error('El grupo ya no existe.');
  const data = groupSnap.data();
  if ((data?.owner as string) !== userId) {
    throw new Error('Solo el creador del grupo puede eliminarlo.');
  }
  await deleteDoc(groupRef);
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDocFromServer(userRef);
  if (userSnap.exists() && (userSnap.data()?.groupId === id)) {
    await updateDoc(userRef, { groupId: null, groupName: null });
  }
};
