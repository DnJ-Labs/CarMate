import React, { useCallback, useState, useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import baseUrl from "../../constant/baseUrl";
import socket from "../../socket";

/* ---------------------------------------------------------
 * NEUMORPHIC MINIMALIST PALETTE
 * ------------------------------------------------------- */
const COLORS = {
  background: "#F0F2F5", // Light Cool Grey
  surface: "#FFFFFF",
  accent: "#0F2C59", // Royal Navy Blue
  border: "#E2E8F0",
  textMuted: "#64748B",
  textDark: "#1A202C",
};

const STATUS_STYLES = {
  pending: { bg: "#FFF7E6", text: "#B7791F" },
  confirmed: { bg: "#EAF1FF", text: "#0F2C59" },
  checked_in: { bg: "#EEF2FF", text: "#4338CA" },
  onprogress: { bg: "#FFF1E6", text: "#C2410C" },
  done: { bg: "#ECFDF3", text: "#15803D" },
  cancelled: { bg: "#FEECEC", text: "#E53E3E" },
};

// Order & labels used for the summary stat cards + filter chips
const STATUS_FILTERS = [
  { key: "confirmed", label: "Confirmed" },
  { key: "checked_in", label: "Checked In" },
  { key: "onprogress", label: "On Progress" },
  { key: "done", label: "Done" },
  { key: "cancelled", label: "Cancelled" },
];

const TAB_BAR_HEIGHT = 100; // kira-kira tinggi tab bar floating + jarak amannya

export default function BookingHistory() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null); // null = All
  const [filterDropdownVisible, setFilterDropdownVisible] = useState(false);

  const listBottomPadding = TAB_BAR_HEIGHT + insets.bottom;

  // Socket Listener untuk Real-time Status Update
  useEffect(() => {
    const handleBookingStatus = (data) => {
      console.log("BOOKING HISTORY STATUS UPDATE:", data);

      setBookings((prevBookings) =>
        prevBookings.map((booking) => {
          if (String(booking._id) !== String(data.booking_id)) {
            return booking;
          }

          return {
            ...booking,
            status: data.status,
          };
        }),
      );
    };

    socket.on("booking:status", handleBookingStatus);

    return () => {
      socket.off("booking:status", handleBookingStatus);
    };
  }, []);

  const fetchBookings = async () => {
    try {
      const token = await SecureStore.getItemAsync("access_token");

      if (!token) {
        console.log("Access token not found");
        return;
      }

      const response = await axios.get(`${baseUrl}/api/bookings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const bookingsWithDetails = await Promise.all(
        response.data.map(async (booking) => {
          try {
            const [vehicleResponse, workshopResponse] = await Promise.all([
              axios.get(`${baseUrl}/api/vehicles/${booking.vehicle_id}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }),
              axios.get(`${baseUrl}/api/workshop/${booking.bengkel_id}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }),
            ]);

            return {
              ...booking,
              vehicle: vehicleResponse.data,
              workshop: workshopResponse.data,
            };
          } catch (error) {
            console.log(
              "GET BOOKING DETAIL DATA ERROR:",
              error.response?.data || error.message,
            );

            return booking;
          }
        }),
      );

      const sortedBookings = [...bookingsWithDetails].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );

      setBookings(sortedBookings);
    } catch (error) {
      console.log(
        "GET BOOKING HISTORY ERROR:",
        error.response?.data || error.message,
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const getStatusStyle = (status) => {
    return STATUS_STYLES[status] || STATUS_STYLES.pending;
  };

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) {
      return "-";
    }

    return `Rp ${Number(price).toLocaleString("id-ID")}`;
  };

  // Count bookings per status, used by the summary stat cards
  const statusCounts = useMemo(() => {
    const counts = {};
    STATUS_FILTERS.forEach((s) => {
      counts[s.key] = 0;
    });
    bookings.forEach((b) => {
      if (counts[b.status] !== undefined) {
        counts[b.status] += 1;
      }
    });
    return counts;
  }, [bookings]);

  // Apply the selected status filter to the list
  const filteredBookings = useMemo(() => {
    if (!statusFilter) return bookings;
    return bookings.filter((b) => b.status === statusFilter);
  }, [bookings, statusFilter]);

  const renderBooking = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate("BookingDetail", {
            bookingId: item._id,
          })
        }
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.bookingLabel}>BOOKING</Text>
            <Text style={styles.bookingCode}>{item.booking_code || "-"}</Text>
          </View>

          <View
            style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
          >
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status?.replace("_", " ").toUpperCase() || "-"}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.infoIconWrapper}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.accent} />
          </View>
          <Text style={styles.infoLabel}>Date</Text>
          <Text style={styles.infoValue}>{formatDate(item.booking_date)}</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoIconWrapper}>
            <Ionicons name="time-outline" size={16} color={COLORS.accent} />
          </View>
          <Text style={styles.infoLabel}>Time</Text>
          <Text style={styles.infoValue}>
            {item.booking_time_slot || "-"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoIconWrapper}>
            <Ionicons name="car-outline" size={16} color={COLORS.accent} />
          </View>
          <Text style={styles.infoLabel}>Vehicle</Text>
          <Text style={styles.infoValue}>
            {item.vehicle ? `${item.vehicle.brand} ${item.vehicle.model}` : "-"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoIconWrapper}>
            <Ionicons name="business-outline" size={16} color={COLORS.accent} />
          </View>
          <Text style={styles.infoLabel}>Workshop</Text>
          <Text style={styles.infoValue}>{item.workshop?.name || "-"}</Text>
        </View>

        {item.total_price !== null && item.total_price !== undefined && (
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {formatPrice(item.total_price)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top"]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Booking History</Text>
        <Text style={styles.subtitle}>View your service bookings</Text>
      </View>

      {/* ===== SUMMARY STAT CARD (per status count) ===== */}
      <View style={styles.statsCard}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScrollContent}
        >
          {STATUS_FILTERS.map((s, index) => (
            <React.Fragment key={s.key}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{statusCounts[s.key]}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
              {index < STATUS_FILTERS.length - 1 && (
                <View style={styles.statDivider} />
              )}
            </React.Fragment>
          ))}
        </ScrollView>
      </View>

      {/* ===== FILTER BY STATUS (dropdown) ===== */}
      <View style={styles.filterWrapper}>
        <TouchableOpacity
          style={styles.filterDropdownButton}
          onPress={() => setFilterDropdownVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="filter-outline" size={16} color={COLORS.accent} />
          <Text style={styles.filterDropdownText}>
            {statusFilter
              ? STATUS_FILTERS.find((s) => s.key === statusFilter)?.label
              : "All Status"}
          </Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={filterDropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterDropdownVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setFilterDropdownVisible(false)}>
          <View style={styles.dropdownOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdownMenu}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setStatusFilter(null);
                    setFilterDropdownVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      !statusFilter && styles.dropdownItemTextActive,
                    ]}
                  >
                    All Status
                  </Text>
                  {!statusFilter && (
                    <Ionicons name="checkmark" size={18} color={COLORS.accent} />
                  )}
                </TouchableOpacity>

                {STATUS_FILTERS.map((s) => {
                  const isActive = statusFilter === s.key;
                  return (
                    <View key={s.key} style={styles.dropdownDivider}>
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => {
                          setStatusFilter(s.key);
                          setFilterDropdownVisible(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            isActive && styles.dropdownItemTextActive,
                          ]}
                        >
                          {s.label}
                        </Text>
                        {isActive && (
                          <Ionicons
                            name="checkmark"
                            size={18}
                            color={COLORS.accent}
                          />
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item._id}
        renderItem={renderBooking}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: listBottomPadding },
          filteredBookings.length === 0 && styles.emptyContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrapper}>
              <Ionicons
                name="document-text-outline"
                size={36}
                color={COLORS.textMuted}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {statusFilter ? "No bookings found" : "No bookings yet"}
            </Text>
            <Text style={styles.emptyText}>
              {statusFilter
                ? "Try selecting a different status filter."
                : "Your booking history will appear here."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: COLORS.background,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.accent,
  },

  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  /* Summary Stat Card */
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  statsScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
  },

  statItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 84,
  },

  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textMuted,
    textAlign: "center",
  },

  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#E2E8F0",
  },

  /* Filter dropdown */
  filterWrapper: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  filterDropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  filterDropdownText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textDark,
  },

  dropdownOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.35)",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    paddingTop: 170,
    paddingLeft: 20,
  },

  dropdownMenu: {
    width: 200,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },

  dropdownDivider: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },

  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  dropdownItemText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textDark,
  },

  dropdownItemTextActive: {
    fontWeight: "700",
    color: COLORS.accent,
  },

  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 16,
  },

  emptyContent: {
    flexGrow: 1,
  },

  /* Booking Card */
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,

    // soft drop shadow
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  bookingLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },

  bookingCode: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textDark,
    marginTop: 2,
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 14,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  infoIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#F0F4F8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  infoLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    flex: 1,
  },

  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textDark,
  },

  totalContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },

  totalLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
  },

  totalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.accent,
  },

  /* Empty State */
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  emptyIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,

    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});