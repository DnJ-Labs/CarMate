import { useContext, useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
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
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate("DetailVehicle", {
            id: String(item.id ?? item._id),
          })
        }
      >
        {/* Gambar Kendaraan */}
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

          {/* Badge Merk / Brand */}
          {item.brand && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{item.brand}</Text>
            </View>
          )}
        </View>

        {/* Info Kendaraan */}
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

      {/* Button Action */}
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
          <Text style={styles.bookButtonText}>Book Appointment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Carmate</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate("AddVehicle")}
            style={styles.addVehicleButton}
            activeOpacity={0.8}
          >
            <Ionicons name="add-outline" size={16} color="#FFFFFF" />
            <Text style={styles.addVehicleText}>Add Vehicle</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color="#8A94A6" />

        <TextInput
          style={styles.searchInput}
          placeholder="Cari model kendaraan..."
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
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#0F2C59" />
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={44} color="#E53E3E" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : vehicles.length === 0 ? (
        <View style={styles.centerContent}>
          <Ionicons name="car-outline" size={48} color="#A0AEC0" />
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