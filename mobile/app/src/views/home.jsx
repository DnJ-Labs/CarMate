import { useContext, useState, useEffect, useCallback, useRef } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  Image,
  Animated,
  StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import baseUrl from "../../constant/baseUrl";
import { AuthContext } from "../context/AuthContext";
import styles from "../styles/homeStyles";

const SKELETON_COUNT = 4;
const TAB_BAR_HEIGHT = 60;

function SkeletonBox({ style }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={[skeletonStyles.box, style, { opacity }]} />;
}

function VehicleCardSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonBox style={skeletonStyles.imageBlock} />
      <View style={styles.cardBody}>
        <SkeletonBox style={skeletonStyles.lineModel} />
        <SkeletonBox style={skeletonStyles.linePlate} />
      </View>
      <View style={styles.cardFooter}>
        <SkeletonBox style={skeletonStyles.buttonBlock} />
      </View>
    </View>
  );
}

function VehicleListSkeleton({ bottomPadding }) {
  return (
    <View style={[styles.listContent, { paddingBottom: bottomPadding }]}>
      {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
        <VehicleCardSkeleton key={index} />
      ))}
    </View>
  );
}

export function Home() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const authContext = useContext(AuthContext);
  const { setIsLogin } = authContext;

  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const listBottomPadding = TAB_BAR_HEIGHT + insets.bottom;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return "Good Morning ☀️";
    if (hour < 15) return "Good Afternoon ☀️";
    if (hour < 18) return "Good Evening 🌤️";
    return "Good Night 🌙";
  };

  const fetchVehicles = useCallback(
    async (searchTerm = "") => {
      try {
        setError(null);
        const token = await SecureStore.getItemAsync("access_token");

        if (!token) {
          setIsLogin(false);
          return;
        }

        // Lowercase query & hapus spasi berlebih
        const cleanedSearch = searchTerm.trim().toLowerCase();

        const { data } = await axios.get(`${baseUrl}/api/vehicles`, {
          params: cleanedSearch ? { model: cleanedSearch } : {},
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // PERBAIKAN: Jika Backend tidak melakukan case-insensitive filter, kita filter ulang secara lokal sebagai fallback
        if (cleanedSearch && Array.isArray(data)) {
          const filtered = data.filter((v) =>
            v.model?.toLowerCase().includes(cleanedSearch)
          );
          setVehicles(filtered);
        } else {
          setVehicles(data);
        }
      } catch (err) {
        if (err.response?.status === 401) {
          await SecureStore.deleteItemAsync("access_token");
          setIsLogin(false);
          return;
        }

        setError(
          err.response?.data?.message || "Failed to fetch vehicle data",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [setIsLogin],
  );

  // Debounce search input
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchVehicles(search);
    }, 400);

    return () => clearTimeout(timeout);
  }, [search, fetchVehicles]);

  // Refetch saat screen kembali fokus
  useFocusEffect(
    useCallback(() => {
      fetchVehicles(search);
    }, [fetchVehicles, search]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchVehicles(search);
  };

  const ListHeaderComponent = () => (
    <View style={gimmickStyles.headerSection}>
      <TouchableOpacity
        style={gimmickStyles.emergencyBanner}
        activeOpacity={0.85}
        onPress={() => navigation.navigate("NearestWorkshop")}
      >
        <View style={gimmickStyles.emergencyIconContainer}>
          <Ionicons name="construct-outline" size={22} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={gimmickStyles.emergencyTitle}>Need Emergency Workshop?</Text>
          <Text style={gimmickStyles.emergencySubtitle}>
            Find the nearest workshop location around you
          </Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={18} color="#0F2C59" />
      </TouchableOpacity>

      <View style={gimmickStyles.summaryRow}>
        <Text style={gimmickStyles.summaryTitle}>My Garage</Text>
        <View style={gimmickStyles.countBadge}>
          <Text style={gimmickStyles.countText}>
            {vehicles.length} {vehicles.length === 1 ? "Car" : "Cars"}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderVehicleCard = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate("DetailVehicle", {
            id: String(item.id ?? item._id),
          })
        }
      >
        <View style={styles.imageWrapper}>
          {item.vehicles_img ? (
            <Image
              source={{ uri: item.vehicles_img }}
              style={styles.vehicleImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="car-outline" size={48} color="#A0AEC0" />
            </View>
          )}

          {item.brand && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{item.brand}</Text>
            </View>
          )}

          <View style={gimmickStyles.statusChip}>
            <View style={gimmickStyles.statusDot} />
            <Text style={gimmickStyles.statusText}>Good Condition</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardModel}>{item.model}</Text>

          {item.plate_number && (
            <View style={styles.plateTag}>
              <Ionicons name="card-outline" size={14} color="#5A6A85" />
              <Text style={styles.cardPlate}>{item.plate_number}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.bookButton}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate("SelectWorkshop", {
              vehicleId: String(item.id ?? item._id),
            })
          }
        >
          <Ionicons name="calendar-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.bookButtonText}>Book Appointment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={gimmickStyles.greetingText}>{getGreeting()}</Text>
          <Text style={styles.title}>Carmate</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate("AddVehicle")}
            style={styles.addVehicleButton}
            activeOpacity={0.8}
          >
            <Text style={styles.addVehicleText}>Add Vehicle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Notifications")}
            style={styles.notificationButton}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={20} color="#0F2C59" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color="#8A94A6" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search vehicle model..."
          placeholderTextColor="#8A94A6"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          returnKeyType="search"
        />

        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle-outline" size={18} color="#8A94A6" />
          </TouchableOpacity>
        )}
      </View>

      {loading && !refreshing ? (
        <VehicleListSkeleton bottomPadding={listBottomPadding} />
      ) : error ? (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={44} color="#E53E3E" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => String(item.id ?? item._id)}
          ListHeaderComponent={ListHeaderComponent}
          renderItem={renderVehicleCard}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: listBottomPadding },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.centerContent}>
              <Ionicons name="car-outline" size={48} color="#A0AEC0" />
              <Text style={styles.emptyText}>
                {search ? "No vehicles found" : "No registered vehicles yet"}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const gimmickStyles = StyleSheet.create({
  greetingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  headerSection: {
    marginBottom: 1,
  },
  emergencyBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  emergencyIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#0F2C59",
    alignItems: "center",
    justifyContent: "center",
  },
  emergencyTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F2C59",
  },
  emergencySubtitle: {
    fontSize: 11,
    color: "#64748B",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F2C59",
  },
  countBadge: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#3730A3",
  },
  statusChip: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
});

const skeletonStyles = StyleSheet.create({
  box: {
    backgroundColor: "#E2E8F0",
    borderRadius: 8,
  },
  imageBlock: {
    width: "100%",
    height: 140,
    borderRadius: 16,
  },
  lineModel: {
    height: 15,
    width: "55%",
    borderRadius: 6,
    marginTop: 12,
  },
  linePlate: {
    height: 11,
    width: "35%",
    borderRadius: 6,
    marginTop: 8,
  },
  buttonBlock: {
    height: 40,
    width: "100%",
    borderRadius: 12,
    marginTop: 10,
  },
});