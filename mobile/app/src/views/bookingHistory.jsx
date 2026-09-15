import React, { useCallback, useState, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import styles from "../styles/bookingHistoryStyles";
import baseUrl from "../../constant/baseUrl";
import socket from "../../socket";

export default function BookingHistory() {
  const navigation = useNavigation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    switch (status) {
      case "confirmed":
        return styles.statusConfirmed;

      case "checked_in":
        return styles.statusCheckedIn;

      case "onprogress":
        return styles.statusOnProgress;

      case "done":
        return styles.statusDone;

      case "cancelled":
        return styles.statusCancelled;

      case "pending":
      default:
        return styles.statusPending;
    }
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

  const renderBooking = ({ item }) => {
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

          <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
            <Text style={styles.statusText}>
              {item.status?.replace("_", " ").toUpperCase() || "-"}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date</Text>

          <Text style={styles.infoValue}>{formatDate(item.booking_date)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Time</Text>

          <Text style={styles.infoValue}>{item.booking_time_slot || "-"}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Vehicle</Text>

          <Text style={styles.infoValue}>
            {item.vehicle ? `${item.vehicle.brand} ${item.vehicle.model}` : "-"}
          </Text>
        </View>

        <View style={styles.infoRow}>
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item._id}
        renderItem={renderBooking}
        contentContainerStyle={[
          styles.contentContainer,
          bookings.length === 0 && styles.emptyContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Booking History</Text>

            <Text style={styles.subtitle}>View your service bookings</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No bookings yet</Text>

            <Text style={styles.emptyText}>
              Your booking history will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
}
