import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import axios from "axios";

import baseUrl from "../../constant/baseUrl";
import styles from "../styles/bookingDetailStyles";

export default function BookingDetail() {
  const route = useRoute();

  const bookingId = route?.params?.bookingId;

  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);

  const fetchBookingDetail = async () => {
    try {
      const token = await SecureStore.getItemAsync("access_token");

      if (!token) {
        console.log("Access token not found");
        return;
      }

      if (!bookingId) {
        console.log("Booking ID not found");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Get booking detail
      const bookingResponse = await axios.get(
        `${baseUrl}/api/bookings/${bookingId}`,
        {
          headers,
        },
      );

      setBooking(bookingResponse.data);

      // Payment hanya tersedia setelah booking DONE
      if (bookingResponse.data.status === "done") {
        try {
          const paymentResponse = await axios.get(
            `${baseUrl}/api/bookings/${bookingId}/payment`,
            {
              headers,
            },
          );

          setPayment(paymentResponse.data);
        } catch (error) {
          // Belum ada payment bukan error untuk UI
          setPayment(null);

          console.log(
            "PAYMENT NOT FOUND:",
            error.response?.data || error.message,
          );
        }
      } else {
        setPayment(null);
      }
    } catch (error) {
      console.log(
        "GET BOOKING DETAIL ERROR:",
        error.response?.data || error.message,
      );

      Alert.alert("Error", "Failed to load booking detail.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBookingDetail();
    }, [bookingId]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookingDetail();
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

  const formatPrice = (price) => {
    if (price === null || price === undefined) {
      return "-";
    }

    return `Rp ${Number(price).toLocaleString("id-ID")}`;
  };

  const getBookingStatusStyle = (status) => {
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

  const getPaymentStatusStyle = (status) => {
    switch (status) {
      case "paid":
        return styles.paymentPaid;

      case "failed":
        return styles.paymentFailed;

      case "pending":
      default:
        return styles.paymentPending;
    }
  };

  const getPaymentMethodLabel = (method) => {
    if (method === "midtrans") {
      return "Pay Online";
    }

    if (method === "cash") {
      return "Pay at workshop cashier";
    }

    return "-";
  };

  const handlePaymentOption = (method) => {
    if (method === "midtrans") {
      Alert.alert("Pay Online", "Midtrans payment will be opened here.");

      // WebView Midtrans kita sambungkan di step berikutnya.
      return;
    }

    if (method === "cash") {
      Alert.alert(
        "Pay at workshop cashier",
        "Cash payment will be created and you can pay directly at the workshop cashier.",
      );

      // API payment cash kita sambungkan setelah
      // halaman Booking Detail selesai ditest.
    }
  };

  const handleDownloadReport = async () => {
    try {
      setDownloadingReport(true);

      const token = await SecureStore.getItemAsync("access_token");

      if (!token) {
        Alert.alert("Error", "You are not logged in.");
        return;
      }

      if (booking.status !== "done") {
        Alert.alert(
          "Report Unavailable",
          "Service report is only available after the service is completed.",
        );
        return;
      }

      const fileName = `CarMate-${booking.booking_code}.pdf`;

      const fileUri = FileSystem.documentDirectory + fileName;

      const downloadResult = await FileSystem.downloadAsync(
        `${baseUrl}/api/bookings/${bookingId}/report`,
        fileUri,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (downloadResult.status !== 200) {
        throw new Error("Failed to download report");
      }

      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: "application/pdf",
          dialogTitle: "CarMate Service Report",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Report Downloaded", `Report saved as ${fileName}`);
      }
    } catch (error) {
      console.log(
        "DOWNLOAD REPORT ERROR:",
        error.response?.data || error.message,
      );

      Alert.alert("Error", "Failed to download service report.");
    } finally {
      setDownloadingReport(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Booking not found</Text>

          <Text style={styles.emptyText}>We couldn't find this booking.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        refreshControl={undefined}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Booking Detail</Text>

          <Text style={styles.bookingCode}>{booking.booking_code || "-"}</Text>
        </View>

        {/* BOOKING STATUS */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Booking Status</Text>

          <View
            style={[styles.statusBadge, getBookingStatusStyle(booking.status)]}
          >
            <Text style={styles.statusText}>
              {booking.status?.replace("_", " ").toUpperCase() || "-"}
            </Text>
          </View>
        </View>

        {/* PAYMENT */}
        {booking.status === "done" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payment</Text>

            {!payment ? (
              <>
                <Text style={styles.paymentDescription}>
                  Choose your preferred payment method.
                </Text>

                <TouchableOpacity
                  style={styles.paymentOption}
                  activeOpacity={0.8}
                  onPress={() => handlePaymentOption("midtrans")}
                >
                  <Text style={styles.paymentOptionTitle}>Pay Online</Text>

                  <Text style={styles.paymentOptionDescription}>
                    Pay securely with Midtrans
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.paymentOption}
                  activeOpacity={0.8}
                  onPress={() => handlePaymentOption("cash")}
                >
                  <Text style={styles.paymentOptionTitle}>
                    Pay at workshop cashier
                  </Text>

                  <Text style={styles.paymentOptionDescription}>
                    Pay directly at the workshop cashier
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View
                  style={[
                    styles.paymentStatusBadge,
                    getPaymentStatusStyle(payment.status),
                  ]}
                >
                  <Text style={styles.paymentStatusText}>
                    {payment.status?.toUpperCase() || "-"}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Method</Text>

                  <Text style={styles.infoValue}>
                    {getPaymentMethodLabel(payment.payment_method)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Amount</Text>

                  <Text style={styles.infoValue}>
                    {formatPrice(payment.amount)}
                  </Text>
                </View>

                {payment.paid_at && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Paid At</Text>

                    <Text style={styles.infoValue}>
                      {formatDate(payment.paid_at)}
                    </Text>
                  </View>
                )}

                {payment.status === "pending" &&
                  payment.payment_method === "cash" && (
                    <Text style={styles.paymentNote}>
                      Please pay at the workshop cashier.
                    </Text>
                  )}
              </>
            )}
          </View>
        )}

        {/* APPOINTMENT */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Appointment</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>

            <Text style={styles.infoValue}>
              {formatDate(booking.booking_date)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Time</Text>

            <Text style={styles.infoValue}>
              {booking.booking_time_slot || "-"}
            </Text>
          </View>
        </View>

        {/* VEHICLE */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Vehicle</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vehicle ID</Text>

            <Text style={styles.infoValue}>{booking.vehicle_id || "-"}</Text>
          </View>
        </View>

        {/* WORKSHOP */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Workshop</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Workshop ID</Text>

            <Text style={styles.infoValue}>{booking.bengkel_id || "-"}</Text>
          </View>
        </View>

        {/* NOTES */}
        {booking.notes && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Notes</Text>

            <Text style={styles.notes}>{booking.notes}</Text>
          </View>
        )}

        {/* SERVICES */}
        {booking.services?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Services</Text>

            {booking.services.map((service, index) => (
              <View key={`${service.name}-${index}`} style={styles.serviceRow}>
                <Text style={styles.serviceName}>{service.name}</Text>

                <Text style={styles.servicePrice}>
                  {formatPrice(service.price)}
                </Text>
              </View>
            ))}

            {booking.total_price !== null &&
              booking.total_price !== undefined && (
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total</Text>

                  <Text style={styles.totalValue}>
                    {formatPrice(booking.total_price)}
                  </Text>
                </View>
              )}
          </View>
        )}

        {/* PENDING TASKS */}
        {booking.pending_tasks?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Pending Tasks</Text>

            {booking.pending_tasks.map((task, index) => (
              <View key={index} style={styles.taskRow}>
                <Text style={styles.taskBullet}>•</Text>

                <Text style={styles.taskText}>{task}</Text>
              </View>
            ))}
          </View>
        )}

        {/* SERVICE REPORT */}
        {booking.status === "done" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Service Report</Text>

            <Text style={styles.reportDescription}>
              Your service is complete. You can download the service report for
              this booking.
            </Text>

            <TouchableOpacity
              style={styles.downloadButton}
              activeOpacity={0.8}
              onPress={handleDownloadReport}
              disabled={downloadingReport}
            >
              {downloadingReport ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.downloadButtonText}>Download Report</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
