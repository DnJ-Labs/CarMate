import { useContext, useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import baseUrl from "../../constant/baseUrl";
import { AuthContext } from "../context/AuthContext";
import styles from "../styles/homeStyles";

export function Home() {
  const navigation = useNavigation();

  const authContext = useContext(AuthContext);
  const { setIsLogin } = authContext;

  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("access_token");
    setIsLogin(false);
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

        const { data } = await axios.get(`${baseUrl}/api/vehicles`, {
          params: searchTerm ? { model: searchTerm } : {},
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setVehicles(data);
      } catch (err) {
        if (err.response?.status === 401) {
          await SecureStore.deleteItemAsync("access_token");

          setIsLogin(false);
          return;
        }

        setError(
          err.response?.data?.message || "Gagal mengambil data kendaraan",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [setIsLogin],
  );

  useEffect(() => {
    setLoading(true);

    const timeout = setTimeout(() => {
      fetchVehicles(search);
    }, 500);

    return () => clearTimeout(timeout);
  }, [search, fetchVehicles]);

  useFocusEffect(
    useCallback(() => {
      fetchVehicles(search);
    }, [fetchVehicles, search]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchVehicles(search);
  };

  const renderVehicleCard = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.vehicleRow}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate("DetailVehicle", {
            id: String(item.id ?? item._id),
          })
        }
      >
        <View style={styles.cardIconWrapper}>
          <Ionicons name="car-sport-outline" size={28} color="#111" />
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardModel}>{item.model}</Text>

          {item.brand && <Text style={styles.cardBrand}>{item.brand}</Text>}

          {item.plate_number && (
            <Text style={styles.cardPlate}>{item.plate_number}</Text>
          )}
        </View>

        <Ionicons name="chevron-forward" size={20} color="#c4c4c4" />
      </TouchableOpacity>

      {/* Book Appointment */}
      <TouchableOpacity
        style={styles.bookButton}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate("Booking", {
            vehicleId: String(item.id ?? item._id),
          })
        }
      >
        <Text style={styles.bookButtonText}>Book Appointment</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Carmate</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate("AddVehicle")}
            style={styles.addButton}
          >
            <Ionicons name="add" size={22} color="#5b5be0" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={22} color="#d13c3c" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color="#8b8b8b" />

        <TextInput
          style={styles.searchInput}
          placeholder="Cari model kendaraan..."
          placeholderTextColor="#8b8b8b"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          returnKeyType="search"
        />

        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color="#c4c4c4" />
          </TouchableOpacity>
        )}
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#111" />
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={40} color="#d13c3c" />

          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : vehicles.length === 0 ? (
        <View style={styles.centerContent}>
          <Ionicons name="car-outline" size={40} color="#c4c4c4" />

          <Text style={styles.emptyText}>
            {search ? "Kendaraan tidak ditemukan" : "Belum ada kendaraan"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => String(item.id ?? item._id)}
          renderItem={renderVehicleCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}
