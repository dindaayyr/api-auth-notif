import db from '../db.js';

export async function sendPushNotification(userId, title, body, data = {}) {
  try {
    const [tokens] = await db.execute(
      'SELECT expo_push_token FROM push_tokens WHERE user_id = ?',
      [userId]
    );

    if (tokens.length === 0) {
      console.log(`Tidak ada push token untuk user ${userId}`);
      return false;
    }

    const messages = tokens.map((item) => ({
      to: item.expo_push_token,
      sound: 'default',
      title,
      body,
      data,
    }));

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Expo Push API error:', result);
      return false;
    }

    const tickets = Array.isArray(result.data) ? result.data : [];
    const success = tickets.length > 0 &&
      tickets.every((ticket) => ticket.status === 'ok');

    if (!success) {
      console.error('Push notification gagal:', result);
    }

    return success;
  } catch (error) {
    console.error('Gagal mengirim push notification:', error.message);
    return false;
  }
}