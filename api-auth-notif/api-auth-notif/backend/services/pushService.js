import { Expo } from 'expo-server-sdk';

const expo = new Expo();

async function sendPushNotification(pushToken, title, body, data = {}) {
  if (!Expo.isExpoPushToken(pushToken)) {
    throw new Error('Expo Push Token tidak valid');
  }

  const messages = [
    {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data
    }
  ];

  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (const chunk of chunks) {
    const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
    tickets.push(...ticketChunk);
  }

  return tickets;
}

export default sendPushNotification;
