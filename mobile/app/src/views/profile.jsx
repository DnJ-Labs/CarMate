import React, { useContext, useState, useCallback } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import * as SecureStore from 'expo-secure-store';

import baseUrl from "../../constant/baseUrl";
import { AuthContext } from '../context/AuthContext';

export default function Profile() {
  const navigation = useNavigation();
  const authContext = useContext(AuthContext);
  const { setIsLogin } = authContext;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');

      if (!token) {
        setIsLogin(false);
        return;
      }

      const response = await axios.get(`${baseUrl}/api/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(response.data.user);
    } catch (error) {
      if (error.response?.status === 401) {
        await SecureStore.deleteItemAsync('access_token');
        setIsLogin(false);
        return;
      }
      console.log("GET PROFILE ERROR:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('access_token');
    setIsLogin(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    const initials = parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : parts[0].slice(0, 2);
    return initials.toUpperCase();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5b5be0" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>Profile</Text>

        {/* User Information */}
        <View style={styles.userSection}>
          <View style={styles.avatarWrapper}>
            <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
          </View>

          <Text style={styles.name}>{user?.name || "-"}</Text>

          <Text style={styles.username}>
            {user?.username ? `@${user.username}` : "-"}
          </Text>
        </View>

        {/* Contact Information */}
        <View style={styles.infoCard}>
          <TouchableOpacity style={styles.infoItem}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="call-outline" size={18} color="#5b5be0" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.label}>PHONE</Text>
              <Text style={styles.value}>{user?.phone || "-"}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#c4c4c4" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.infoItem}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="mail-outline" size={18} color="#5b5be0" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.label}>EMAIL</Text>
              <Text style={styles.value}>{user?.email || "-"}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#c4c4c4" />
          </TouchableOpacity>
        </View>

        {/* Account */}
        <Text style={styles.sectionTitle}>Account</Text>

        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("EditProfile", { user })}
          >
            <View style={styles.menuIconWrapper}>
              <Ionicons name="person-outline" size={18} color="#111" />
            </View>
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={18} color="#c4c4c4" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconWrapper}>
              <Ionicons name="settings-outline" size={18} color="#111" />
            </View>
            <Text style={styles.menuText}>Settings</Text>
            <Ionicons name="chevron-forward" size={18} color="#c4c4c4" />
          </TouchableOpacity>
        </View>

        {/* Service */}
        <Text style={styles.sectionTitle}>Service</Text>

        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconWrapper}>
              <Ionicons name="construct-outline" size={18} color="#111" />
            </View>
            <Text style={styles.menuText}>Service History</Text>
            <Ionicons name="chevron-forward" size={18} color="#c4c4c4" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconWrapper}>
              <Ionicons name="calendar-outline" size={18} color="#111" />
            </View>
            <Text style={styles.menuText}>Booking History</Text>
            <Ionicons name="chevron-forward" size={18} color="#c4c4c4" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconWrapper}>
              <Ionicons name="notifications-outline" size={18} color="#111" />
            </View>
            <Text style={styles.menuText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={18} color="#c4c4c4" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={[styles.logoutCard, { marginBottom: 24 }]}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#d13c3c" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    marginBottom: 20,
  },
  userSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  avatarWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#5b5be0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: "700",
    color: "#fff",
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 2,
  },
  username: {
    fontSize: 13,
    color: "#8b8b8b",
  },
  infoCard: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 14,
    marginBottom: 24,
    overflow: "hidden",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  infoIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#eef0ff",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: "#8b8b8b",
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: "#111",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8b8b8b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  menuCard: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 14,
    marginBottom: 24,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  menuIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: {
    flex: 1,
    fontSize: 14,
    color: "#111",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e5e5",
    marginLeft: 60,
  },
  arrow: {
    fontSize: 20,
    color: "#c4c4c4",
  },
  logoutCard: {
    borderWidth: 1,
    borderColor: "#f5c2c2",
    borderRadius: 14,
    backgroundColor: "#fdecec",
    overflow: "hidden",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#d13c3c",
  },
});