import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

import baseUrl from "../../constant/baseUrl";
import styles from "../styles/notificationsStyles";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const token = await SecureStore.getItemAsync("access_token");

      if (!token) {
        console.log("Access token not found");
        return;
      }

      const response = await axios.get(`${baseUrl}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = Array.isArray(response.data) ? response.data : [];

      // Terbaru di atas
      const sortedNotifications = [...data].sort(
        (a, b) =>
          new Date(b.sent_at || b.createdAt || 0) -
          new Date(a.sent_at || a.createdAt || 0),
      );

      setNotifications(sortedNotifications);
    } catch (error) {
      console.log(
        "GET NOTIFICATIONS ERROR:",
        error.response?.data || error.message,
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
  };

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Notifications</Text>

          <Text style={styles.subtitle}>Stay updated with your booking</Text>
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No notifications</Text>

            <Text style={styles.emptyText}>
              You don't have any notifications yet.
            </Text>
          </View>
        ) : (
          notifications.map((item, index) => (
            <View
              key={item._id || item.id || index}
              style={styles.notificationCard}
            >
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>
                  {item.channel === "push"
                    ? "CarMate Notification"
                    : "CarMate Update"}
                </Text>

                <Text style={styles.notificationMessage}>
                  {item.message || "-"}
                </Text>

                <Text style={styles.notificationDate}>
                  {formatDate(item.sent_at || item.createdAt)}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
