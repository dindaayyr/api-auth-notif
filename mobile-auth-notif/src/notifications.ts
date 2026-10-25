
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { registerPushToken } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function setupPushNotifications(jwt: string) {
  // Push notification hanya didaftarkan pada perangkat fisik.
  if (Platform.OS === 'web' || !Device.isDevice) {
    console.log('Push notification membutuhkan perangkat fisik.');
    return;
  }

  const projectId =
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId;

  if (!projectId) {
    console.warn(
      'EAS projectId belum dikonfigurasi.'
    );
    return;
  }

  try {
    const permission = await Notifications.getPermissionsAsync();
    let finalStatus = permission.status;

    if (finalStatus !== 'granted') {
      const requested =
        await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
    }

    if (finalStatus !== 'granted') {
      console.log('Izin notifikasi tidak diberikan.');
      return;
    }

    const tokenResponse =
      await Notifications.getExpoPushTokenAsync({
        projectId,
      });

    const expoPushToken = tokenResponse.data;

console.log('Expo Push Token:', expoPushToken);
console.log('JWT tersedia:', !!jwt);

const result = await registerPushToken(expoPushToken, jwt);

console.log('Respons backend:', result);
console.log('Expo Push Token berhasil didaftarkan.');
  } catch (error) {
  console.warn(
    'Registrasi push notification gagal:',
    error
  );
}
}
