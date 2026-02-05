import React from 'react';
import type { GroupInfo } from '../services/groupService';

export type GroupSectionProps = {
  myGroups: GroupInfo[];
  currentGroupId: string | null;
  hasCurrentGroup: boolean;
  newGroupName: string;
  setNewGroupName: (v: string) => void;
  newGroupInput: string;
  setNewGroupInput: (v: string) => void;
  creatingGroup: boolean;
  joinError: string | null;
  confirmDeleteGroupId: string | null;
  setConfirmDeleteGroupId: (id: string | null) => void;
  deletingGroupId: string | null;
  onCreateGroup: () => Promise<void>;
  onJoinGroup: () => Promise<void>;
  onDeleteGroup: (groupId: string) => Promise<void>;
  onSelectGroup: (g: { id: string; name: string }) => void;
};

const GroupSection: React.FC<GroupSectionProps> = ({
  myGroups,
  currentGroupId,
  hasCurrentGroup,
  newGroupName,
  setNewGroupName,
  newGroupInput,
  setNewGroupInput,
  creatingGroup,
  joinError,
  confirmDeleteGroupId,
  setConfirmDeleteGroupId,
  deletingGroupId,
  onCreateGroup,
  onJoinGroup,
  onDeleteGroup,
  onSelectGroup,
}) => {
  return (
    <>
      {/* 1) Casilla azul: Tu grupo (crear / unirse) */}
      {!hasCurrentGroup && (
        <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-lg">
          <h3 className="text-2xl font-bold mb-2">Tu grupo</h3>
          <p className="opacity-90 mb-4">Dale un nombre al grupo (ej. Familia García) y créalo. Luego comparte el ID de 6 letras para que otros se unan.</p>
          <div className="mb-4">
            <label className="block text-sm font-semibold opacity-90 mb-2">Nombre del grupo</label>
            <input
              type="text"
              placeholder="Ej. Familia García"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl text-gray-800 placeholder:text-gray-500"
            />
          </div>
          <button
            type="button"
            onClick={onCreateGroup}
            disabled={creatingGroup}
            className="w-full bg-white text-blue-600 py-3 px-6 rounded-2xl font-bold hover:bg-blue-50 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed mb-6"
          >
            {creatingGroup ? 'Creando grupo...' : 'Crear Nuevo Grupo'}
          </button>
          <div className="border-t border-white/30 pt-6">
            <p className="text-sm font-semibold mb-3 opacity-90">¿Tienes un ID de grupo?</p>
            <p className="opacity-90 mb-3 text-sm">Introduce el <strong>ID de 6 letras</strong> (código tipo ABC123), no el nombre del grupo.</p>
            {joinError && (
              <div className="mb-3 p-3 rounded-xl bg-red-500/30 text-white text-sm">{joinError}</div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="ID de 6 letras, ej: ABC123"
                value={newGroupInput}
                onChange={(e) => setNewGroupInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onJoinGroup()}
                className="flex-1 px-5 py-3 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-white/50 uppercase"
              />
              <button
                type="button"
                onClick={onJoinGroup}
                disabled={!newGroupInput.trim()}
                className="bg-white text-blue-600 px-8 py-3 rounded-2xl font-bold hover:bg-blue-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Unirse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2) Listado de grupos que he creado — clic en un grupo para ver sus alarmas arriba */}
      {myGroups.length > 0 && (
        <section className="bg-white rounded-3xl p-6 shadow-md border border-gray-100" aria-label="Grupos que he creado">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Grupos que he creado</h3>
          <p className="text-sm text-gray-600 mb-4">Pulsa en un grupo para ver sus alarmas en el listado de arriba.</p>
          <ul className="space-y-4">
            {/* Opción para volver a alarmas personales */}
            <li
              className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl border-2 transition-colors ${
                currentGroupId === null ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 bg-gray-50/50'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectGroup({ id: '', name: 'Mis alarmas personales' })}
                className="min-w-0 flex-1 text-left hover:opacity-90"
              >
                <p className="font-semibold text-gray-800">👤 Mis alarmas personales</p>
                <p className="text-sm text-gray-600 mt-1">Ver solo mis alarmas (sin grupo)</p>
                <span className="text-xs text-blue-600 font-medium mt-1 inline-block">Ver mis alarmas →</span>
              </button>
            </li>
            {myGroups.map((g) => (
              <li
                key={g.id}
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl border-2 transition-colors ${currentGroupId === g.id ? 'border-blue-500 bg-blue-50/50' : 'border-amber-200 bg-amber-50/50'}`}
              >
                <button
                  type="button"
                  onClick={() => onSelectGroup({ id: g.id, name: g.name })}
                  className="min-w-0 flex-1 text-left hover:opacity-90"
                >
                  <p className="font-semibold text-gray-800">{g.name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    ID: <span className="font-mono font-bold text-amber-700 text-base">{g.id}</span>
                  </p>
                  <span className="text-xs text-blue-600 font-medium mt-1 inline-block">Ver alarmas de este grupo →</span>
                </button>
                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {confirmDeleteGroupId === g.id ? (
                    <>
                      <span className="text-sm font-medium text-gray-600">¿Eliminar?</span>
                      <button
                        type="button"
                        onClick={() => onDeleteGroup(g.id)}
                        disabled={deletingGroupId === g.id}
                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold text-sm hover:bg-red-700 disabled:opacity-60"
                      >
                        {deletingGroupId === g.id ? 'Eliminando...' : 'Sí, eliminar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteGroupId(null)}
                        disabled={deletingGroupId === g.id}
                        className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-300 disabled:opacity-60"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(g.id)}
                        className="px-4 py-2 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-colors"
                      >
                        Copiar ID
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteGroupId(g.id)}
                        className="px-4 py-2 rounded-xl bg-red-100 text-red-700 font-semibold text-sm hover:bg-red-200 transition-colors border border-red-200"
                        aria-label={`Borrar grupo ${g.name}`}
                      >
                        Borrar
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
};

export default GroupSection;
