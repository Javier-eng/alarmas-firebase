import {
  collection,
  query,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  orderBy,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../firebaseConfig';
import type { Alarm, UserProfile } from '../types';

export const createOrUpdateUser = async (user: User): Promise<UserProfile> => {
  // Usar databaseService para centralizar la lógica de creación/actualización
  const { createOrUpdateUserProfile } = await import('./databaseService');
  return createOrUpdateUserProfile(user);
};

export const subscribeToGroupAlarms = (groupId: string, callback: (alarms: Alarm[]) => void) => {
  const q = query(
    collection(db, 'groups', groupId, 'alarms'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const alarms = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    } as Alarm));
    callback(alarms);
  });
};

export const addAlarmToGroup = async (groupId: string, alarm: Omit<Alarm, 'id'>): Promise<void> => {
  // Usar databaseService para asegurar que se guarde correctamente con el uid del usuario
  const { saveAlarmToGroup } = await import('./databaseService');
  // Asegurar que siempre se use el createdBy del alarm (que debe venir del usuario autenticado)
  const userId = alarm.createdBy;
  if (!userId) {
    throw new Error('El alarm debe incluir createdBy con el uid del usuario');
  }
  await saveAlarmToGroup(groupId, userId, alarm);
};

export const toggleAlarm = async (groupId: string, alarmId: string, active: boolean): Promise<void> => {
  const alarmRef = doc(db, 'groups', groupId, 'alarms', alarmId);
  await updateDoc(alarmRef, { active });
};

export const deleteAlarm = async (groupId: string, alarmId: string): Promise<void> => {
  await deleteDoc(doc(db, 'groups', groupId, 'alarms', alarmId));
};

// Alarmas personales (sin grupo): se guardan en users/{userId}/alarms
export const subscribeToUserAlarms = (userId: string, callback: (alarms: Alarm[]) => void) => {
  const q = query(
    collection(db, 'users', userId, 'alarms'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const alarms = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Alarm));
    callback(alarms);
  });
};

export const addAlarmToUser = async (userId: string, alarm: Omit<Alarm, 'id'>): Promise<void> => {
  // Usar databaseService para asegurar que se guarde correctamente con el uid del usuario
  const { saveAlarmToUser } = await import('./databaseService');
  // Asegurar que el alarm tenga el createdBy correcto (debe coincidir con userId)
  const alarmWithUser = {
    ...alarm,
    createdBy: userId, // Asegurar que siempre use el userId pasado como parámetro
  };
  await saveAlarmToUser(userId, alarmWithUser);
};

export const toggleUserAlarm = async (userId: string, alarmId: string, active: boolean): Promise<void> => {
  await updateDoc(doc(db, 'users', userId, 'alarms', alarmId), { active });
};

export const deleteUserAlarm = async (userId: string, alarmId: string): Promise<void> => {
  await deleteDoc(doc(db, 'users', userId, 'alarms', alarmId));
};

// Re-exportar funciones de grupos (definidas en groupService) por compatibilidad
export {
  createGroup,
  joinGroupRequest,
  deleteGroup,
  subscribeToMyGroups,
  subscribeToGroup,
  subscribeToMyPendingStatus,
  subscribeToPendingRequests,
  acceptMember,
  rejectMember,
  clearMyGroup,
} from './groupService';
export type { GroupInfo, PendingRequest } from './groupService';
