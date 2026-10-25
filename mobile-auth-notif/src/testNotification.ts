
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function testLocalNotification() {
  if (Platform.OS === 'web') {
    console.log('Uji ini khusus perangkat iOS atau Android.');
    return;
  }

  const { status: currentStatus } =
    await Notifications.getPermissionsAsync();

  let status = currentStatus;

  if (status !== 'granted') {
    const permission =
      await Notifications.requestPermissionsAsync();

    status = permission.status;
  }

  if (status !== 'granted') {
    console.log('Izin notifikasi belum diberikan.');
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'TaskMe 💗',
      body: 'Jangan lupa menyelesaikan tugasmu hari ini!',
    },
    trigger: null,
  });
}
