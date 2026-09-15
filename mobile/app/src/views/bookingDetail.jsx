import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import * as FileSystemLegacy from "expo-file-system/legacy";
import axios from "axios";
import Barcode from "react-native-barcode-svg";

import baseUrl from "../../constant/baseUrl";
import styles from "../styles/bookingDetailStyles";

export default function BookingDetail() {
  const route = useRoute();
  const navigation = useNavigation();

  const bookingId = route?.params?.bookingId;

  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

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

      // =========================
      // GET BOOKING DETAIL
      // =========================
      const bookingResponse = await axios.get(
        `${baseUrl}/api/bookings/${bookingId}`,
        {
          headers,
        },
      );

      const bookingData = bookingResponse.data;

      const [vehicleResponse, workshopResponse] = await Promise.all([
        axios.get(`${baseUrl}/api/vehicles/${bookingData.vehicle_id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        axios.get(`${baseUrl}/api/workshop/${bookingData.bengkel_id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      setBooking({
        ...bookingData,
        vehicle: vehicleResponse.data,
        workshop: workshopResponse.data,
      });

      // =========================
      // GET PAYMENT
      // =========================
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
          // Belum ada payment
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

  // =========================
  // FORMAT DATE
  // =========================

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

  // =========================
  // FORMAT PRICE
  // =========================

  const formatPrice = (price) => {
    if (price === null || price === undefined) {
      return "-";
    }

    return `Rp ${Number(price).toLocaleString("id-ID")}`;
  };

  // =========================
  // BOOKING STATUS STYLE
  // =========================

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

  // =========================
  // PAYMENT STATUS STYLE
  // =========================

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

  // =========================
  // PAYMENT METHOD LABEL
  // =========================

  const getPaymentMethodLabel = (method) => {
    if (method === "midtrans") {
      return "Pay Online";
    }

    if (method === "cash") {
      return "Pay at workshop cashier";
    }

    return "-";
  };

  // =========================
  // CREATE PAYMENT
  // =========================

  const handlePaymentOption = (method) => {
    setSelectedPaymentMethod(method);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPaymentMethod) {
      Alert.alert("Payment Method", "Please select a payment method first.");
      return;
    }

    try {
      const token = await SecureStore.getItemAsync("access_token");

      if (!token) {
        Alert.alert("Error", "You are not logged in.");
        return;
      }

      setPaymentLoading(true);

      const response = await axios.post(
        `${baseUrl}/api/bookings/${bookingId}/payment`,
        {
          payment_method: selectedPaymentMethod,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // =========================
      // PAY ONLINE
      // =========================

      if (selectedPaymentMethod === "midtrans") {
        const redirectUrl = response.data?.redirect_url;

        if (!redirectUrl) {
          throw new Error("Payment URL not found");
        }

        navigation.navigate("PaymentWebView", {
          redirectUrl,
        });

        return;
      }

      // =========================
      // CASHIER
      // =========================

      if (selectedPaymentMethod === "cash") {
        setPayment(response.data?.payment || null);
        setSelectedPaymentMethod(null);

        Alert.alert(
          "Cash Payment",
          "Payment has been created. Please pay at the workshop cashier.",
        );
      }
    } catch (error) {
      console.log(
        "CREATE PAYMENT ERROR:",
        error.response?.data || error.message,
      );

      Alert.alert(
        "Payment Failed",
        error.response?.data?.message || "Failed to create payment.",
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  // =========================
  // DOWNLOAD REPORT
  // =========================

  const handleDownloadReport = async () => {
    if (booking?.status !== "done") {
      Alert.alert(
        "Report Unavailable",
        "Service report is only available after the service is completed.",
      );
      return;
    }

    try {
      const token = await SecureStore.getItemAsync("access_token");

      if (!token) {
        Alert.alert("Error", "You are not logged in.");
        return;
      }

      setDownloadingReport(true);

      const fileName = `CarMate-${booking.booking_code}.pdf`;

      // Download PDF dari backend ke temporary/cache storage
      const tempFile = new File(Paths.cache, fileName);

      const downloadedFile = await File.downloadFileAsync(
        `${baseUrl}/api/bookings/${bookingId}/report`,
        tempFile,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          idempotent: true,
        },
      );

      if (!downloadedFile.exists) {
        throw new Error("Failed to download report.");
      }

      // =========================
      // ANDROID
      // =========================
      if (Platform.OS === "android") {
        const { StorageAccessFramework } = FileSystemLegacy;

        const permissions =
          await StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (!permissions.granted) {
          Alert.alert(
            "Download Cancelled",
            "Please select a folder to save the report.",
          );
          return;
        }

        const fileUri = await StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileName,
          "application/pdf",
        );

        const fileBytes = await downloadedFile.bytes();

        const destinationFile = new File(fileUri);

        destinationFile.write(fileBytes);

        Alert.alert(
          "Report Downloaded",
          `${fileName} has been saved successfully.`,
        );

        return;
      }

      // =========================
      // IOS
      // =========================
      if (Platform.OS === "ios") {
        await downloadedFile.preview();

        return;
      }
    } catch (error) {
      console.log(
        "DOWNLOAD REPORT ERROR:",
        error?.response?.data || error?.message || error,
      );

      Alert.alert("Download Failed", "Failed to download service report.");
    } finally {
      setDownloadingReport(false);
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // =========================
  // BOOKING NOT FOUND
  // =========================

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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* =========================
            HEADER
        ========================= */}

        <View style={styles.header}>
          <Text style={styles.title}>Booking Detail</Text>

          <Text style={styles.bookingCode}>{booking.booking_code || "-"}</Text>
        </View>

        {/* =========================
            BOOKING STATUS
        ========================= */}

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

        {/* =========================
            BARCODE
        ========================= */}

        {booking.booking_code && (
          <View style={styles.barcodeCard}>
            <Text style={styles.sectionTitle}>Booking Barcode</Text>

            <Barcode
              value={booking.booking_code}
              format="CODE128"
              height={80}
              width={2}
              lineColor="#111827"
            />

            <Text style={styles.bookingCode}>{booking.booking_code}</Text>

            <Text style={styles.barcodeDescription}>
              Show this barcode at the workshop when you arrive.
            </Text>
          </View>
        )}

        {/* =========================
            PAYMENT
        ========================= */}

        {booking.status === "done" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payment</Text>

            {/* BELUM ADA PAYMENT */}
            {(!payment || payment.status === "failed") && (
              <>
                <Text style={styles.paymentDescription}>
                  Choose your preferred payment method.
                </Text>

                {/* PAY ONLINE */}

                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    selectedPaymentMethod === "midtrans" &&
                      styles.paymentOptionSelected,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handlePaymentOption("midtrans")}
                  disabled={paymentLoading}
                >
                  <Text style={styles.paymentOptionTitle}>Pay Online</Text>

                  <Text style={styles.paymentOptionDescription}>
                    Continue to payment
                  </Text>
                </TouchableOpacity>

                {/* CASHIER */}

                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    selectedPaymentMethod === "cash" &&
                      styles.paymentOptionSelected,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handlePaymentOption("cash")}
                  disabled={paymentLoading}
                >
                  <Text style={styles.paymentOptionTitle}>
                    Pay at workshop cashier
                  </Text>

                  <Text style={styles.paymentOptionDescription}>
                    Pay directly at the workshop
                  </Text>
                </TouchableOpacity>

                {/* CONFIRM */}

                {selectedPaymentMethod && (
                  <TouchableOpacity
                    style={styles.confirmPaymentButton}
                    activeOpacity={0.8}
                    onPress={handleConfirmPayment}
                    disabled={paymentLoading}
                  >
                    {paymentLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.confirmPaymentButtonText}>
                        Confirm Payment
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* PAYMENT SUDAH ADA */}

            {payment && payment.status !== "failed" && (
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

                {payment.status === "pending" &&
                  payment.payment_method === "midtrans" && (
                    <Text style={styles.paymentNote}>
                      Please complete your online payment.
                    </Text>
                  )}
              </>
            )}
          </View>
        )}

        {/* =========================
            APPOINTMENT
        ========================= */}

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

        {/* =========================
            VEHICLE
        ========================= */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Vehicle</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Brand</Text>
            <Text style={styles.infoValue}>
              {booking.vehicle?.brand || "-"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Model</Text>
            <Text style={styles.infoValue}>
              {booking.vehicle?.model || "-"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Plate Number</Text>
            <Text style={styles.infoValue}>
              {booking.vehicle?.plate_number || "-"}
            </Text>
          </View>
        </View>

        {/* =========================
            WORKSHOP
        ========================= */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Workshop</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>
              {booking.workshop?.name || "-"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>
              {booking.workshop?.address || "-"}
            </Text>
          </View>
        </View>

        {/* =========================
            NOTES
        ========================= */}

        {booking.notes && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Notes</Text>

            <Text style={styles.notes}>{booking.notes}</Text>
          </View>
        )}

        {/* =========================
            SERVICES
        ========================= */}

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

        {/* =========================
            PENDING TASKS
        ========================= */}

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

        {/* =========================
            SERVICE REPORT
        ========================= */}

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
