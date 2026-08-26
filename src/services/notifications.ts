import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { getAccessTokenAsync } from "./session";
import { putJson } from "./api";

// Must match android.notification.channelId in backend push.service.ts
const ANDROID_CHANNEL_ID = "fuseremit-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Requests notification permission and returns the device's FCM token.
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token: string | undefined;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: "FuseRemit Notifications",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (!Device.isDevice) {
    if (__DEV__) {
      console.log("[notifications] Skipped: not a physical device (emulator)");
    }
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      if (__DEV__) {
        console.log("[notifications] Permission not granted");
      }
      return undefined;
    }
    try {
      // Native FCM/APNs token — backend sends via Firebase Admin, not Expo Push.
      token = (await Notifications.getDevicePushTokenAsync()).data;
      if (__DEV__) {
        console.log("[notifications] FCM Device Token:", token);
      }
    } catch (error) {
      if (__DEV__) {
        console.log("[notifications] Failed to get FCM token:", error);
      }
      return undefined;
    }
  }

  return token;
}

// Fetches the FCM token and syncs it to the backend against the logged-in user.
export async function syncFcmTokenWithBackend(): Promise<void> {
  try {
    const [accessToken, fcmToken] = await Promise.all([
      getAccessTokenAsync(),
      registerForPushNotificationsAsync(),
    ]);

    if (accessToken && fcmToken) {
      await putJson("/users/me/settings", { preferences: { pushToken: fcmToken } }, accessToken);
      if (__DEV__) {
        console.log("[notifications] FCM token synced with backend");
      }
    }
  } catch (error) {
    if (__DEV__) {
      console.log("[notifications] Failed to sync FCM token:", error);
    }
  }
}
