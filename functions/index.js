/**
 * Cloud Functions para MyDays
 *
 * notifyAdminOnJoinRequest: cuando un usuario solicita unirse a un grupo (se crea
 * un doc en groups/{groupId}/pending/{userId}), se envía una notificación push
 * al administrador del grupo usando su FCM token guardado en users/{ownerId}.
 */

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { initializeApp } from "firebase-admin/app";

initializeApp();

const db = getFirestore();

/**
 * Al crear un documento en groups/{groupId}/pending/{userId}, notificar al owner del grupo.
 * El owner recibe un push para poder aprobar la solicitud desde el móvil.
 */
export const notifyAdminOnJoinRequest = onDocumentCreated(
  {
    document: "groups/{groupId}/pending/{userId}",
    region: "europe-west1",
  },
  async (event) => {
    const { groupId, userId } = event.params;
    const snap = event.data;
    if (!snap || !snap.exists) return;

    const pendingData = snap.data();
    const displayName = pendingData.displayName || "Alguien";

    // Obtener el grupo para saber el owner
    const groupRef = db.doc(`groups/${groupId}`);
    const groupSnap = await groupRef.get();
    if (!groupSnap.exists) return;

    const ownerId = groupSnap.data()?.owner;
    const groupName = groupSnap.data()?.name || "Mi Grupo";
    if (!ownerId) return;

    // Obtener el FCM token del administrador
    const userRef = db.doc(`users/${ownerId}`);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return;

    const fcmToken = userSnap.data()?.fcmToken;
    if (!fcmToken) {
      console.log("Admin no tiene FCM token, no se envía push:", ownerId);
      return;
    }

    const message = {
      notification: {
        title: "Nueva solicitud de unión",
        body: `${displayName} quiere unirse a "${groupName}". Abre la app para aprobar o rechazar.`,
      },
      data: {
        type: "join_request",
        groupId,
        groupName,
        userId,
        displayName,
      },
      token: fcmToken,
      android: {
        priority: "high",
        notification: {
          title: "Nueva solicitud de unión",
          body: `${displayName} quiere unirse a "${groupName}".`,
          channelId: "join_requests",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    try {
      const messaging = getMessaging();
      await messaging.send(message);
      console.log("Push enviado al admin:", ownerId, "por solicitud de", userId);
    } catch (err) {
      console.error("Error enviando push al admin:", err.message);
      // Si el token es inválido (ej. usuario desinstaló), podrías limpiar fcmToken del perfil
      if (err.code === "messaging/invalid-registration-token" || err.code === "messaging/registration-token-not-registered") {
        await userRef.update({ fcmToken: null });
      }
    }
  }
);
