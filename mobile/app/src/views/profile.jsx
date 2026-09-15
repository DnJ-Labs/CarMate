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
          <ActivityIndicator size="large" color="#0F2C59" />
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
          <TouchableOpacity style={styles.infoItem} activeOpacity={0.7}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="call-outline" size={18} color="#0F2C59" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.label}>PHONE</Text>
              <Text style={styles.value}>{user?.phone || "-"}</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={18} color="#A0AEC0" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.infoItem} activeOpacity={0.7}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="mail-outline" size={18} color="#0F2C59" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.label}>EMAIL</Text>
              <Text style={styles.value}>{user?.email || "-"}</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={18} color="#A0AEC0" />
          </TouchableOpacity>
        </View>

        {/* Account */}
        <Text style={styles.sectionTitle}>Account</Text>

        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("EditProfile", { user })}
          >
            <View style={styles.menuIconWrapper}>
              <Ionicons name="person-outline" size={18} color="#0F2C59" />
            </View>
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward-outline" size={18} color="#A0AEC0" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <View style={styles.menuIconWrapper}>
              <Ionicons name="settings-outline" size={18} color="#0F2C59" />
            </View>
            <Text style={styles.menuText}>Settings</Text>
            <Ionicons name="chevron-forward-outline" size={18} color="#A0AEC0" />
          </TouchableOpacity>
        </View>

        {/* Service */}
        <Text style={styles.sectionTitle}>Service</Text>

        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <View style={styles.menuIconWrapper}>
              <Ionicons name="construct-outline" size={18} color="#0F2C59" />
            </View>
            <Text style={styles.menuText}>Service History</Text>
            <Ionicons name="chevron-forward-outline" size={18} color="#A0AEC0" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <View style={styles.menuIconWrapper}>
              <Ionicons name="calendar-outline" size={18} color="#0F2C59" />
            </View>
            <Text style={styles.menuText}>Booking History</Text>
            <Ionicons name="chevron-forward-outline" size={18} color="#A0AEC0" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <View style={styles.menuIconWrapper}>
              <Ionicons name="notifications-outline" size={18} color="#0F2C59" />
            </View>
            <Text style={styles.menuText}>Notifications</Text>
            <Ionicons name="chevron-forward-outline" size={18} color="#A0AEC0" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.logoutCard}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={18} color="#E53E3E" />
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
    backgroundColor: "#F0F2F5", // Soft Light Cool Grey
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F2C59", // Royal Navy Blue
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  userSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#0F2C59",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#0F2C59",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A202C",
    marginBottom: 2,
  },
  username: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 24,
    overflow: "hidden",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  infoIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F0F4F8",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: "#1A202C",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 24,
    overflow: "hidden",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F0F4F8",
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: {
    flex: 1,
    fontSize: 14,
    color: "#1A202C",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: 64,
  },
  logoutCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FED7D7",
    marginBottom: 24,
    overflow: "hidden",
    shadowColor: "#E53E3E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    backgroundColor: "#FFF5F5",
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E53E3E",
  },
});