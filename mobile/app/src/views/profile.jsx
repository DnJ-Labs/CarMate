import React, { useContext, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import * as SecureStore from 'expo-secure-store';

import baseUrl from "../../constant/baseUrl";
import { AuthContext } from '../context/AuthContext';

const TAB_BAR_HEIGHT = 40;
const NAVY = "#0F2C59";
const NAVY_TINT = "rgba(15,44,89,0.06)";
const HEADER_HEIGHT = 120;
const AVATAR_SIZE = 104;

export default function Profile() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const authContext = useContext(AuthContext);
  const { setIsLogin } = authContext;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // Extra space so the logout button is never hidden behind the floating tab bar
  const listBottomPadding = TAB_BAR_HEIGHT + insets.bottom + 24;

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
    setLogoutModalVisible(false);
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
          <ActivityIndicator size="large" color={NAVY} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.headerBg, { height: HEADER_HEIGHT + insets.top }]} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* ===== FIXED SECTION (tidak ikut scroll) ===== */}
        <Text style={styles.title}>Profile</Text>

        <View style={styles.fixedTop}>
          <View style={styles.avatarWrapper}>
            <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
          </View>

          <Text style={styles.name}>{user?.name || "[Nama Lengkap]"}</Text>
          <Text style={styles.username}>
            {user?.username ? `@${user.username}` : "@username"}
          </Text>
        </View>

        {/* ===== SCROLLABLE SECTION ===== */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: listBottomPadding },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Contact + Account digabung satu card */}
          <View style={styles.card}>
            <TouchableOpacity style={styles.rowItem} activeOpacity={0.6}>
              <View style={styles.iconWrapper}>
                <Ionicons name="call-outline" size={17} color={NAVY} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.label}>Phone</Text>
                <Text style={styles.value}>{user?.phone || "-"}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#C3CBD6" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.rowItem} activeOpacity={0.6}>
              <View style={styles.iconWrapper}>
                <Ionicons name="mail-outline" size={17} color={NAVY} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{user?.email || "-"}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#C3CBD6" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.rowItem}
              activeOpacity={0.6}
              onPress={() => navigation.navigate("EditProfile", { user })}
            >
              <View style={styles.iconWrapper}>
                <Ionicons name="person-outline" size={17} color={NAVY} />
              </View>
              <Text style={styles.rowText}>Edit Profile</Text>
              <Ionicons name="chevron-forward" size={16} color="#C3CBD6" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.rowItem} activeOpacity={0.6}>
              <View style={styles.iconWrapper}>
                <Ionicons name="settings-outline" size={17} color={NAVY} />
              </View>
              <Text style={styles.rowText}>Settings</Text>
              <Ionicons name="chevron-forward" size={16} color="#C3CBD6" />
            </TouchableOpacity>
          </View>

          {/* Service */}
          <Text style={styles.sectionTitle}>Service</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.rowItem} activeOpacity={0.6}>
              <View style={styles.iconWrapper}>
                <Ionicons name="construct-outline" size={17} color={NAVY} />
              </View>
              <Text style={styles.rowText}>Service History</Text>
              <Ionicons name="chevron-forward" size={16} color="#C3CBD6" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.rowItem} activeOpacity={0.6}>
              <View style={styles.iconWrapper}>
                <Ionicons name="calendar-outline" size={17} color={NAVY} />
              </View>
              <Text style={styles.rowText}>Booking History</Text>
              <Ionicons name="chevron-forward" size={16} color="#C3CBD6" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.rowItem} activeOpacity={0.6}>
              <View style={styles.iconWrapper}>
                <Ionicons name="notifications-outline" size={17} color={NAVY} />
              </View>
              <Text style={styles.rowText}>Notifications</Text>
              <Ionicons name="chevron-forward" size={16} color="#C3CBD6" />
            </TouchableOpacity>
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => setLogoutModalVisible(true)}
            activeOpacity={0.6}
          >
            <Ionicons name="log-out-outline" size={17} color="#E53E3E" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* ===== CUSTOM LOGOUT CONFIRMATION MODAL ===== */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setLogoutModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <View style={styles.modalIconWrapper}>
                  <Ionicons name="log-out-outline" size={26} color="#E53E3E" />
                </View>

                <Text style={styles.modalTitle}>Log out of your account?</Text>
                <Text style={styles.modalDescription}>
                  You'll need to sign in again to access your account after logging out.
                </Text>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalCancelButton]}
                    onPress={() => setLogoutModalVisible(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalConfirmButton]}
                    onPress={handleLogout}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.modalConfirmText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: NAVY,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: -0.3,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  fixedTop: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  avatarWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: HEADER_HEIGHT - AVATAR_SIZE / 2 - 36,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: NAVY,
  },
  name: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1A202C",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  username: {
    fontSize: 16,
    fontWeight: "500",
    color: "#94A3B8",
    marginBottom: 20,
  },
  scrollArea: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  sectionTitle: {
    width: "100%",
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 28,
    overflow: "hidden",
    shadowColor: "#0F2C59",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: NAVY_TINT,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: {
    flex: 1,
  },
  rowText: {
    flex: 1,
    fontSize: 14,
    color: "#1A202C",
    fontWeight: "600",
  },
  label: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600",
    letterSpacing: 0.4,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 14,
    color: "#1A202C",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: 62,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginTop: 4,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E53E3E",
  },

  // ===== Modal styles =====
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFF0F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A202C",
    marginBottom: 6,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  modalActions: {
    flexDirection: "row",
    width: "100%",
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButton: {
    backgroundColor: "#F1F5F9",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  modalConfirmButton: {
    backgroundColor: "#E53E3E",
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});