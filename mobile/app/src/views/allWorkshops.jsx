import { useState, useCallback } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import baseUrl from "../../constant/baseUrl";
import styles from "../styles/allWorkshopsStyles";

const LIMIT = 10;
const TAB_BAR_HEIGHT = 40;

export function Workshop() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [workshops, setWorkshops] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchWorkshops = useCallback(
    async (pageToFetch = 1, isRefresh = false) => {
      try {
        setError(null);

        const token = await SecureStore.getItemAsync("access_token");

        if (!token) {
          setError("Sesi habis, silakan login ulang");
          return;
        }

        const { data } = await axios.get(`${baseUrl}/api/workshop`, {
          params: {
            page: pageToFetch,
            limit: LIMIT,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setWorkshops(data.data ?? []);
        setLastPage(data.meta?.lastPage ?? 1);
        setPage(pageToFetch);
      } catch (err) {
        setError(
          err.response?.data?.message || "Gagal mengambil data workshop",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchWorkshops(1);
    }, [fetchWorkshops]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchWorkshops(page, true);
  };

  const goToPrevPage = () => {
    if (page <= 1 || loading) return;

    setLoading(true);
    fetchWorkshops(page - 1);
  };

  const goToNextPage = () => {
    if (page >= lastPage || loading) return;

    setLoading(true);
    fetchWorkshops(page + 1);
  };

  const getTodayHours = (operationalHours) => {
    if (!operationalHours?.length) {
      return null;
    }

    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    const today = days[new Date().getDay()];

    const todaySchedule = operationalHours.find((h) => h.day === today);

    if (!todaySchedule) {
      return "Tutup hari ini";
    }

    return `${todaySchedule.open} - ${todaySchedule.close}`;
  };

  const renderWorkshopCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.workshopRow}>
        <View style={styles.cardIconWrapper}>
          <Ionicons name="construct-outline" size={22} color="#0F2C59" />
        </View>

        <View style={styles.cardInfo}>
          <View style={styles.cardNameRow}>
            <Text style={styles.cardName}>{item.name}</Text>

            {!item.is_active && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>Tutup</Text>
              </View>
            )}
          </View>

          {item.address && (
            <Text style={styles.cardAddress} numberOfLines={1}>
              {item.address}
            </Text>
          )}

          {getTodayHours(item.operational_hours) && (
            <View style={styles.hoursRow}>
              <Ionicons name="time-outline" size={13} color="#64748B" />
              <Text style={styles.cardHours}>
                {getTodayHours(item.operational_hours)}
              </Text>
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward-outline" size={18} color="#A0AEC0" />
      </View>

      {/* Booking Button */}
      <TouchableOpacity
        style={[
          styles.bookingButton,
          !item.is_active && styles.bookingButtonDisabled,
        ]}
        activeOpacity={0.8}
        disabled={!item.is_active}
        onPress={() =>
          navigation.navigate("SelectVehicle", {
            workshopId: String(item._id),
            workshop: item,
          })
        }
      >
        <Text style={styles.bookingButtonText}>
          {item.is_active ? "Booking" : "Workshop Tutup"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPagination = () => {
    if (workshops.length === 0) {
      return null;
    }

    return (
      <View
        style={[
          styles.pagination,
          {
            paddingBottom: 12 + TAB_BAR_HEIGHT + insets.bottom,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.pageButton,
            (page <= 1 || loading) && styles.pageButtonDisabled,
          ]}
          onPress={goToPrevPage}
          disabled={page <= 1 || loading}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-back-outline"
            size={16}
            color={page <= 1 || loading ? "#A0AEC0" : "#0F2C59"}
          />

          <Text
            style={[
              styles.pageButtonText,
              (page <= 1 || loading) && styles.pageButtonTextDisabled,
            ]}
          >
            Prev
          </Text>
        </TouchableOpacity>

        <Text style={styles.pageIndicator}>
          Halaman {page} dari {lastPage}
        </Text>

        <TouchableOpacity
          style={[
            styles.pageButton,
            (page >= lastPage || loading) && styles.pageButtonDisabled,
          ]}
          onPress={goToNextPage}
          disabled={page >= lastPage || loading}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.pageButtonText,
              (page >= lastPage || loading) && styles.pageButtonTextDisabled,
            ]}
          >
            Next
          </Text>

          <Ionicons
            name="chevron-forward-outline"
            size={16}
            color={page >= lastPage || loading ? "#A0AEC0" : "#0F2C59"}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workshop</Text>

        <TouchableOpacity
          style={styles.nearestButton}
          onPress={() => navigation.navigate("NearestWorkshop")}
          activeOpacity={0.8}
        >
          <Ionicons name="navigate-outline" size={15} color="#FFFFFF" />

          <Text style={styles.nearestButtonText}>Terdekat</Text>
        </TouchableOpacity>
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
      ) : workshops.length === 0 ? (
        <View style={styles.centerContent}>
          <Ionicons name="construct-outline" size={48} color="#A0AEC0" />

          <Text style={styles.emptyText}>Belum ada workshop</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={workshops}
            keyExtractor={(item) => String(item._id)}
            renderItem={renderWorkshopCard}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />

          {renderPagination()}
        </>
      )}
    </SafeAreaView>
  );
}