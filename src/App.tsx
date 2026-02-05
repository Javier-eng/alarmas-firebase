import React, { useState, useEffect } from 'react';
import type { Alarm } from './types';
import { useAuth } from './contexts/AuthContext';
import {
  subscribeToGroupAlarms,
  subscribeToUserAlarms,
  addAlarmToGroup,
  addAlarmToUser,
  toggleAlarm,
  toggleUserAlarm,
  deleteAlarm,
  deleteUserAlarm,
} from './services/alarmService';
import {
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
} from './services/groupService';
import type { GroupInfo, PendingRequest } from './services/groupService';
import GroupSection from './components/GroupSection';
import AlarmForm from './components/AlarmForm';
import AlarmList from './components/AlarmList';
import PendingRequests from './components/PendingRequests';

const App: React.FC = () => {
  const { user, profile, loading, loginError, login, logout, setProfile, clearLoginError } = useAuth();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [newGroupInput, setNewGroupInput] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [savingAlarm, setSavingAlarm] = useState(false);
  const [alarmError, setAlarmError] = useState<string | null>(null);
  const [justCreatedGroupId, setJustCreatedGroupId] = useState<string | null>(null);
  const [ventanaGroup, setVentanaGroup] = useState<{ id: string; name: string } | null>(null);
  const [myGroups, setMyGroups] = useState<GroupInfo[]>([]);
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [groupData, setGroupData] = useState<{ members: string[]; owner: string } | null>(null);
  const [isPendingInGroup, setIsPendingInGroup] = useState<boolean | null>(null);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [acceptingUserId, setAcceptingUserId] = useState<string | null>(null);
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.uid) {
      const unsub = subscribeToMyGroups(user.uid, setMyGroups);
      return () => unsub();
    }
    setMyGroups([]);
  }, [user?.uid]);

  // Grupo actual: el que usamos para ver alarmas y para guardar/toggle/borrar. Prioridad: ventanita > perfil (así al crear se usa el nuevo).
  const currentGroupId = ventanaGroup?.id ?? profile?.groupId ?? null;
  const currentGroupName = ventanaGroup?.name ?? profile?.groupName ?? (currentGroupId ? `Grupo ${currentGroupId}` : null);

  // ¿El usuario está aprobado en el grupo actual? (está en group.members). Solo entonces se muestran las alarmas.
  const isApprovedInCurrentGroup =
    Boolean(currentGroupId && user?.uid && groupData?.members.includes(user.uid));

  // Si tiene grupo, no es miembro y ya sabemos que no está pendiente -> fue rechazado, limpiar su grupo.
  useEffect(() => {
    if (!currentGroupId || !user?.uid || !groupData || isPendingInGroup !== false) return;
    const isMember = groupData.members.includes(user.uid);
    if (!isMember) {
      clearMyGroup(user.uid).then(() => {
        setProfile((prev) => (prev ? { ...prev, groupId: null, groupName: null } : prev));
        setVentanaGroup(null);
      });
    }
  }, [currentGroupId, user?.uid, groupData, isPendingInGroup, setProfile]);

  // Sincronizar ventanita desde perfil solo al cargar (ventanaGroup null). No sobrescribir si el usuario ya eligió un grupo (crear o clic en lista).
  useEffect(() => {
    const gid = profile?.groupId ?? null;
    if (!gid) return;
    setVentanaGroup((prev) => (prev ? prev : { id: gid, name: profile?.groupName ?? 'Mi Grupo' }));
  }, [profile?.groupId, profile?.groupName]);

  // Suscribirse al grupo actual (para saber members y si somos owner).
  useEffect(() => {
    if (!currentGroupId) {
      setGroupData(null);
      return;
    }
    const unsub = subscribeToGroup(currentGroupId, (data) => {
      setGroupData(data ? { members: data.members, owner: data.owner } : null);
    });
    return () => unsub();
  }, [currentGroupId]);

  // Suscribirse a "¿estoy en pending?" en el grupo actual. null = aún no sabemos.
  useEffect(() => {
    if (!currentGroupId || !user?.uid) {
      setIsPendingInGroup(null);
      return;
    }
    const unsub = subscribeToMyPendingStatus(currentGroupId, user.uid, (pending) => setIsPendingInGroup(pending));
    return () => unsub();
  }, [currentGroupId, user?.uid]);

  const isOwnerOfCurrentGroup = Boolean(currentGroupId && user?.uid && groupData?.owner === user.uid);
  useEffect(() => {
    if (!currentGroupId || !isOwnerOfCurrentGroup) {
      setPendingRequests([]);
      return;
    }
    const unsub = subscribeToPendingRequests(currentGroupId, setPendingRequests);
    return () => unsub();
  }, [currentGroupId, isOwnerOfCurrentGroup]);

  // Cargar datos iniciales al iniciar la app usando getDocs (una sola vez al iniciar)
  useEffect(() => {
    if (!user?.uid) {
      setAlarms([]);
      return;
    }

    const loadInitialAlarms = async () => {
      try {
        const { loadPersonalAlarms } = await import('./services/databaseService');
        // Cargar alarmas personales iniciales (las de grupo se cargan cuando se selecciona un grupo)
        const personalAlarms = await loadPersonalAlarms(user.uid);
        if (!currentGroupId) {
          setAlarms(personalAlarms);
        }
      } catch (error) {
        console.error('Error al cargar alarmas iniciales:', error);
        // Continuar con suscripciones en tiempo real aunque falle la carga inicial
      }
    };

    // Solo cargar alarmas personales al inicio si no hay grupo seleccionado
    if (!currentGroupId) {
      loadInitialAlarms();
    }
  }, [user?.uid, currentGroupId]); // Ejecutar cuando cambia el usuario o el grupo

  // Alarmas: suscripción en tiempo real (además de la carga inicial)
  useEffect(() => {
    if (currentGroupId && isApprovedInCurrentGroup) {
      const unsub = subscribeToGroupAlarms(currentGroupId, setAlarms);
      return () => unsub();
    }
    if (!currentGroupId && user?.uid) {
      const unsub = subscribeToUserAlarms(user.uid, setAlarms);
      return () => unsub();
    }
    setAlarms([]);
  }, [currentGroupId, isApprovedInCurrentGroup, user?.uid]);

  useEffect(() => {
    if (myGroups.length === 0) return;
    setVentanaGroup((prev) => {
      if (prev) return prev;
      const match = profile?.groupId ? myGroups.find((g) => g.id === profile.groupId) : undefined;
      const chosen = match ?? myGroups[0];
      if (!chosen) return null;
      return { id: chosen.id, name: chosen.name };
    });
  }, [myGroups, profile?.groupId]);

  useEffect(() => {
    if (!alarms.length || Notification?.permission !== 'granted') return;
    const timeouts: number[] = [];
    const now = Date.now();
    for (const alarm of alarms) {
      if (!alarm.active) continue;
      const alarmAt = new Date(`${alarm.date}T${alarm.time}`).getTime();
      if (alarmAt <= now) continue;
      const delay = alarmAt - now;
      const id = window.setTimeout(() => {
        new Notification(alarm.label || 'Alarma', {
          body: `${alarm.date} a las ${alarm.time}`,
          icon: '/vite.svg',
        });
      }, delay);
      timeouts.push(id);
    }
    return () => timeouts.forEach(clearTimeout);
  }, [alarms]);

  const handleLogin = async () => {
    setLoginInProgress(true);
    clearLoginError();
    try {
      await login();
    } finally {
      setLoginInProgress(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!user) return;
    setCreatingGroup(true);
    setJoinError(null);
    const timeoutId = window.setTimeout(() => setCreatingGroup(false), 15000);
    try {
      const { groupId, groupName } = await createGroup(user.uid, newGroupName.trim() || undefined);
      setJustCreatedGroupId(groupId);
      setVentanaGroup({ id: groupId, name: groupName });
      setProfile((prev) =>
        prev
          ? { ...prev, groupId, groupName }
          : {
              uid: user.uid,
              email: user.email ?? null,
              displayName: user.displayName ?? null,
              photoURL: user.photoURL ?? null,
              groupId,
              groupName,
            }
      );
      setNewGroupName('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      // Solo considerar offline si realmente es un error de red (no permisos u otros)
      const isOffline = /offline|unavailable|network|connection|failed to fetch|networkerror/i.test(msg)
        && !/permission|denied|unauthorized/i.test(msg);
      const isPermissionDenied = /permission|denied|insufficient/i.test(msg);
      setJoinError(
        isOffline
          ? 'Sin conexión. Comprueba tu internet e inténtalo de nuevo.'
          : isPermissionDenied
            ? 'Error de permisos en Firestore. Abre Firebase Console → Firestore → Reglas y pega las reglas del archivo firestore.rules.'
            : msg
      );
      console.error('Error al crear grupo:', e);
    } finally {
      window.clearTimeout(timeoutId);
      setCreatingGroup(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!user || !newGroupInput.trim()) return;
    setJoinError(null);
    try {
      const { groupName } = await joinGroupRequest(
        user.uid,
        newGroupInput.trim(),
        user.displayName ?? null,
        user.photoURL ?? null
      );
      const id = newGroupInput.trim().toUpperCase();
      setVentanaGroup({ id, name: groupName });
      setProfile((prev) => (prev ? { ...prev, groupId: id, groupName } : null));
      setNewGroupInput('');
    } catch (e) {
      setJoinError((e as Error).message ?? 'No se pudo solicitar acceso al grupo');
    }
  };

  const handleSelectGroup = (g: { id: string; name: string }) => {
    setVentanaGroup({ id: g.id, name: g.name });
  };

  const handleAcceptMember = async (userId: string) => {
    if (!user || !currentGroupId) return;
    setAcceptingUserId(userId);
    try {
      await acceptMember(user.uid, currentGroupId, userId);
    } catch (e) {
      setJoinError((e as Error).message ?? 'Error al aceptar');
    } finally {
      setAcceptingUserId(null);
    }
  };

  const handleRejectMember = async (userId: string) => {
    if (!user || !currentGroupId) return;
    setRejectingUserId(userId);
    try {
      await rejectMember(user.uid, currentGroupId, userId);
    } catch (e) {
      setJoinError((e as Error).message ?? 'Error al rechazar');
    } finally {
      setRejectingUserId(null);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!user) return;
    setDeletingGroupId(groupId);
    setConfirmDeleteGroupId(null);
    try {
      await deleteGroup(user.uid, groupId);
      if (ventanaGroup?.id === groupId) setVentanaGroup(null);
      if (justCreatedGroupId === groupId) setJustCreatedGroupId(null);
      setProfile((prev) => (prev?.groupId === groupId ? { ...prev, groupId: null, groupName: null } : prev));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setJoinError(msg);
      console.error('Error al eliminar grupo:', e);
    } finally {
      setDeletingGroupId(null);
    }
  };

  const handleAddAlarm = async (data: { time: string; date: string; label: string }) => {
    if (!user || !data.time || !data.date) return;
    setSavingAlarm(true);
    setAlarmError(null);
    const timeoutId = window.setTimeout(() => setSavingAlarm(false), 12000);
    try {
      // Asegurar que siempre incluya el uid del usuario
      const alarmData: Omit<Alarm, 'id'> = {
        time: data.time,
        date: data.date,
        label: data.label.trim() || 'Nueva Alarma',
        active: true,
        createdBy: user.uid, // Siempre incluir el uid del usuario autenticado
        createdAt: Date.now(),
      };
      if (currentGroupId) {
        await addAlarmToGroup(currentGroupId, alarmData);
      } else {
        await addAlarmToUser(user.uid, alarmData);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setAlarmError(msg);
      console.error('Error al guardar alarma:', err);
      throw err;
    } finally {
      window.clearTimeout(timeoutId);
      setSavingAlarm(false);
    }
  };

  const handleToggleAlarm = (alarmId: string, active: boolean) => {
    if (currentGroupId) toggleAlarm(currentGroupId, alarmId, active);
    else if (user) toggleUserAlarm(user.uid, alarmId, active);
  };

  const handleDeleteAlarm = (alarmId: string) => {
    if (currentGroupId) deleteAlarm(currentGroupId, alarmId);
    else if (user) deleteUserAlarm(user.uid, alarmId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
        <div className="text-white text-center">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
          <h1 className="text-3xl font-extrabold text-gray-800 mb-2">MyDays Test</h1>
          <p className="text-gray-500 mb-6">Alarmas familiares compartidas</p>
          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm text-left">{loginError}</div>
          )}
          <button
            type="button"
            onClick={handleLogin}
            disabled={loginInProgress}
            className="w-full bg-white border-2 border-gray-100 py-3 px-6 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loginInProgress ? (
              <span className="font-semibold text-gray-700">Abriendo Google...</span>
            ) : (
              <>
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  className="w-6 h-6"
                  alt="Google"
                />
                <span className="font-semibold text-gray-700">Entrar con Google</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Bloque 1: Nombre de usuario + opción Salir */}
      <header className="bg-white border-b sticky top-0 z-10 px-4 py-4 sm:px-8 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <img
            src={user.photoURL || 'https://picsum.photos/40/40'}
            className="w-10 h-10 rounded-full border"
            alt="Profile"
          />
          <div>
            <h2 className="text-lg font-bold leading-none">{profile?.displayName || 'Cargando...'}</h2>
            <p className="text-sm text-gray-500 mt-0.5">Mi cuenta</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          className="text-sm text-red-500 font-medium px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
        >
          Salir
        </button>
      </header>

      {/* Bloque 2: Nombre del grupo en el que se comparte el listado (solo si hay grupo) */}
      {currentGroupId && currentGroupName && (
        <div className="bg-indigo-600 text-white px-4 py-3 sm:px-8">
          <p className="text-sm font-medium opacity-90">Compartiendo en</p>
          <p className="text-lg font-bold">{currentGroupName}</p>
          <p className="text-xs font-mono mt-0.5 opacity-80">ID: {currentGroupId}</p>
        </div>
      )}

      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Mensaje si el usuario solicitó entrar y está pendiente de aprobación */}
        {currentGroupId && !isApprovedInCurrentGroup && isPendingInGroup && (
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-center">
            <p className="text-lg font-bold text-amber-800">Esperando aprobación del administrador</p>
            <p className="text-sm text-amber-700 mt-2">
              Tu solicitud para unirte a <strong>{currentGroupName}</strong> está pendiente. Cuando el creador del grupo la acepte, podrás ver y crear alarmas.
            </p>
          </div>
        )}

        {/* 1) Crear nueva alarma (solo si no hay grupo o estamos aprobados en el grupo) */}
        {(!currentGroupId || isApprovedInCurrentGroup) && (
          <AlarmForm
            onAddAlarm={handleAddAlarm}
            savingAlarm={savingAlarm}
            alarmError={alarmError}
          />
        )}
        {/* 2) Listado de alarmas (solo si no hay grupo o estamos aprobados) */}
        {(!currentGroupId || isApprovedInCurrentGroup) && (
          <AlarmList
            alarms={alarms}
            title={currentGroupId ? `Alarmas de ${currentGroupName ?? currentGroupId}` : 'Mis alarmas'}
            onToggle={handleToggleAlarm}
            onDelete={handleDeleteAlarm}
          />
        )}

        {/* Solicitudes de acceso: solo el administrador del grupo actual */}
        {isOwnerOfCurrentGroup && (
          <PendingRequests
            requests={pendingRequests}
            onAccept={handleAcceptMember}
            onReject={handleRejectMember}
            acceptingUserId={acceptingUserId}
            rejectingUserId={rejectingUserId}
          />
        )}

        {/* 3) Casilla azul Tu grupo y listado de grupos (el ID se copia desde el listado) */}
        <GroupSection
          myGroups={myGroups}
          currentGroupId={currentGroupId}
          hasCurrentGroup={Boolean(profile?.groupId)}
          newGroupName={newGroupName}
          setNewGroupName={setNewGroupName}
          newGroupInput={newGroupInput}
          setNewGroupInput={setNewGroupInput}
          creatingGroup={creatingGroup}
          joinError={joinError}
          confirmDeleteGroupId={confirmDeleteGroupId}
          setConfirmDeleteGroupId={setConfirmDeleteGroupId}
          deletingGroupId={deletingGroupId}
          onCreateGroup={handleCreateGroup}
          onJoinGroup={handleJoinGroup}
          onDeleteGroup={handleDeleteGroup}
          onSelectGroup={handleSelectGroup}
        />
      </main>
    </div>
  );
};

export default App;
