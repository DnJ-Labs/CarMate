import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";

import { useEffect, useState } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
import axios from "axios";

import { AuthContext } from "./src/context/AuthContext";
import { AuthStack } from "./navigators/authNavigators";
import RootNavigator from "./navigators/rootNavigators";
import baseUrl from "./constant/baseUrl";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const [isLogin, setIsLogin] = useState(false);

  useEffect(() => {
    cekToken();
  }, []);

  useEffect(() => {
    if (isLogin) {
      registerForPushNotifications();
    }
  }, [isLogin]);

  const cekToken = async () => {
    try {
      const token = await SecureStore.getItemAsync("access_token");

      if (token) {
        setIsLogin(true);
      }
    } catch (error) {
      console.error("Error retrieving token:", error);
    }
  };

  const registerForPushNotifications = async () => {
    try {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
        });
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();

        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Notification permission denied");
        return;
      }

      const tokenData = await Notifications.getDevicePushTokenAsync();

      const fcmToken = tokenData.data;

      console.log("FCM TOKEN:", fcmToken);

      const accessToken = await SecureStore.getItemAsync("access_token");

      if (!accessToken) {
        console.log("Access token tidak ditemukan");
        return;
      }

      await axios.patch(
        `${baseUrl}/api/user/fcm-token`,
        {
          fcm_token: fcmToken,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      console.log("FCM TOKEN SENT TO BACKEND");
    } catch (error) {
      console.log(
        "PUSH NOTIFICATION ERROR:",
        error.response?.data || error.message,
      );
    }
  };

  return (
    <AuthContext.Provider value={{ isLogin, setIsLogin }}>
      <SafeAreaProvider>
        <NavigationContainer>
          {isLogin ? <RootNavigator /> : <AuthStack />}
        </NavigationContainer>
      </SafeAreaProvider>
    </AuthContext.Provider>
  );
}
