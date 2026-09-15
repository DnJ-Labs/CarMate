import React, { useCallback, useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Platform,
  StyleSheet,
} from "react-native";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { File, Paths } from "expo-file-system";
import * as FileSystemLegacy from "expo-file-system/legacy";
import axios from "axios";
import Barcode from "react-native-barcode-svg";
import socket from "../../socket";
import baseUrl from "../../constant/baseUrl";

// ============================================================================
// KOMPONEN SKELETON LOADER (KOTAK-KOTAK ANIMASI)
// ============================================================================

const Skeleton = ({ width, height, borderRadius = 8, style }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: "#E2E8F0",
          opacity,
        },
        style,
      ]}
    />
  );
};

const BookingDetailSkeleton = () => {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={{ padding: 16 }}>
        {/* Header Skeleton */}
        <View style={styles.header}>
          <View>
            <Skeleton width={140} height={22} borderRadius={6} />
            <Skeleton
              width={90}
              height={14}
              borderRadius={4}
              style={{ marginTop: 6 }}
            />
          </View>
          <Skeleton width={85} height={28} borderRadius={20} />
        </View>

        {/* Barcode Card Skeleton */}
        <View style={styles.card}>
          <Skeleton
            width={120}
            height={16}
            borderRadius={4}
            style={{ alignSelf: "center", marginBottom: 12 }}
          />
          <Skeleton
            width="100%"
            height={70}
            borderRadius={8}
            style={{ alignSelf: "center" }}
          />
          <Skeleton
            width={100}
            height={14}
            borderRadius={4}
            style={{ alignSelf: "center", marginTop: 10 }}
          />
        </View>

        {/* Appointment Card Skeleton */}
        <View style={styles.card}>
          <Skeleton
            width={160}
            height={18}
            borderRadius={4}
            style={{ marginBottom: 14 }}
          />
          <View style={styles.infoRow}>
            <Skeleton width={80} height={14} borderRadius={4} />
            <Skeleton width={120} height={14} borderRadius={4} />
          </View>
          <View style={styles.infoRow}>
            <Skeleton width={60} height={14} borderRadius={4} />
            <Skeleton width={150} height={14} borderRadius={4} />
          </View>
          <View style={styles.infoRow}>
            <Skeleton width={70} height={14} borderRadius={4} />
            <Skeleton width={100} height={14} borderRadius={4} />
          </View>
        </View>

        {/* Vehicle Card Skeleton */}
        <View style={styles.card}>
          <Skeleton
            width={120}
            height={18}
            borderRadius={4}
            style={{ marginBottom: 14 }}
          />
          <View style={styles.infoRow}>
            <Skeleton width={90} height={14} borderRadius={4} />
            <Skeleton width={110} height={14} borderRadius={4} />
          </View>
          <View style={styles.infoRow}>
            <Skeleton width={80} height={14} borderRadius={4} />
            <Skeleton width={90} height={14} borderRadius={4} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

// ============================================================================
// KOMPONEN UTAMA
// ============================================================================

export default function BookingDetail() {
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [midtransRedirectUrl, setMidtransRedirectUrl] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const route = useRoute();
  const navigation = useNavigation();

  const bookingId = route?.params?.bookingId;

  useEffect(() => {
    const handleBookingStatus = (data) => {
      console.log("BOOKING STATUS UPDATE:", data);

      if (String(data.booking_id) !== String(bookingId)) {
        return;
      }

      setBooking((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          status: data.status,
        };
      });
    };

    socket.on("booking:status", handleBookingStatus);

    return () => {
      socket.off("booking:status", handleBookingStatus);
    };
  }, [bookingId]);

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

      const bookingResponse = await axios.get(
        `${baseUrl}/api/bookings/${bookingId}`,
        { headers }
      );

      const bookingData = bookingResponse.data;

      const [vehicleResponse, workshopResponse] = await Promise.all([
        axios.get(`${baseUrl}/api/vehicles/${bookingData.vehicle_id}`, {
          headers,
        }),
        axios.get(`${baseUrl}/api/workshop/${bookingData.bengkel_id}`, {
          headers,
        }),
      ]);

      setBooking({
        ...bookingData,
        vehicle: vehicleResponse.data,
        workshop: workshopResponse.data,
      });

      if (bookingResponse.data.status === "done") {
        try {
          const paymentResponse = await axios.get(
            `${baseUrl}/api/bookings/${bookingId}/payment`,
            { headers }
          );

          const paymentData = paymentResponse.data;
          setPayment(paymentData);

          if (paymentData?.redirect_url) {
            setMidtransRedirectUrl(paymentData.redirect_url);
          }
        } catch (error) {
          setPayment(null);
          console.log(
            "PAYMENT NOT FOUND:",
            error.response?.data || error.message
          );
        }
      } else {
        setPayment(null);
      }
    } catch (error) {
      console.log(
        "GET BOOKING DETAIL ERROR:",
        error.response?.data || error.message
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
    }, [bookingId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookingDetail();
  };

  const formatDate = (date) => {
    if (!date) return "-";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "-";

    return parsedDate.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return "-";
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
    if (method === "midtrans") return "Pay Online";
    if (method === "cash") return "Pay at workshop cashier";
    return "-";
  };

  const openMidtransUrl = (url) => {
    if (!url) {
      Alert.alert("Error", "Payment URL is not available.");
      return;
    }
    navigation.navigate("PaymentWebView", { redirectUrl: url });
  };

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
        { payment_method: selectedPaymentMethod },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (selectedPaymentMethod === "midtrans") {
        const redirectUrl = response.data?.redirect_url;
        if (!redirectUrl) throw new Error("Payment URL not found");

        setMidtransRedirectUrl(redirectUrl);
        setPayment(response.data?.payment || null);
        setSelectedPaymentMethod(null);

        openMidtransUrl(redirectUrl);
        return;
      }

      if (selectedPaymentMethod === "cash") {
        setPayment(response.data?.payment || null);
        setSelectedPaymentMethod(null);

        Alert.alert(
          "Cash Payment",
          "Payment has been created. Please pay at the workshop cashier."
        );
      }
    } catch (error) {
      console.log(
        "CREATE PAYMENT ERROR:",
        error.response?.data || error.message
      );
      Alert.alert(
        "Payment Failed",
        error.response?.data?.message || "Failed to create payment."
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (booking?.status !== "done") {
      Alert.alert(
        "Report Unavailable",
        "Service report is only available after the service is completed."
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
      const tempFile = new File(Paths.cache, fileName);

      const downloadedFile = await File.downloadFileAsync(
        `${baseUrl}/api/bookings/${bookingId}/report`,
        tempFile,
        {
          headers: { Authorization: `Bearer ${token}` },
          idempotent: true,
        }
      );

      if (!downloadedFile.exists) throw new Error("Failed to download report.");

      if (Platform.OS === "android") {
        const { StorageAccessFramework } = FileSystemLegacy;
        const permissions =
          await StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (!permissions.granted) {
          Alert.alert(
            "Download Cancelled",
            "Please select a folder to save the report."
          );
          return;
        }

        const fileUri = await StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileName,
          "application/pdf"
        );

        const fileBytes = await downloadedFile.bytes();
        const destinationFile = new File(fileUri);
        destinationFile.write(fileBytes);

        Alert.alert(
          "Report Downloaded",
          `${fileName} has been saved successfully.`
        );
        return;
      }

      if (Platform.OS === "ios") {
        await downloadedFile.preview();
        return;
      }
    } catch (error) {
      console.log(
        "DOWNLOAD REPORT ERROR:",
        error?.response?.data || error?.message || error
      );
      Alert.alert("Download Failed", "Failed to download service report.");
    } finally {
      setDownloadingReport(false);
    }
  };

  // Tampilan ketika data sedang di-load
  if (loading) {
    return <BookingDetailSkeleton />;
  }

  // Tampilan ketika booking tidak ditemukan
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
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Booking Detail</Text>
            <Text style={styles.bookingCodeHeader}>
              {booking.booking_code || "-"}
            </Text>
          </View>
          <View
            style={[styles.statusBadge, getBookingStatusStyle(booking.status)]}
          >
            <Text style={styles.statusText}>
              {booking.status?.replace("_", " ").toUpperCase() || "-"}
            </Text>
          </View>
        </View>

        {/* BARCODE */}
        {booking.booking_code && (
          <View style={styles.barcodeSection}>
            <Text style={styles.barcodeTitle}>Booking Barcode</Text>
            <View style={styles.barcodeWrapper}>
              <Barcode
                value={String(booking.booking_code)}
                format="CODE128"
                height={70}
                singleBarWidth={2}
                maxWidth={300}
                lineColor="#0f172a"
                backgroundColor="#ffffff"
              />
            </View>
            <Text style={styles.barcodeCode}>{booking.booking_code}</Text>
            <Text style={styles.barcodeDescription}>
              Show this barcode at the workshop when you arrive.
            </Text>
          </View>
        )}

        {/* APPOINTMENT & WORKSHOP */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Appointment Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Workshop</Text>
            <Text style={styles.infoValue}>{booking.workshop?.name || "-"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>
              {booking.workshop?.address || "-"}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>
              {formatDate(booking.booking_date)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Time Slot</Text>
            <Text style={styles.infoValue}>
              {booking.booking_time_slot || "-"}
            </Text>
          </View>
        </View>

        {/* VEHICLE */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Brand / Model</Text>
            <Text style={styles.infoValue}>
              {booking.vehicle?.brand || "-"} {booking.vehicle?.model || ""}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Plate Number</Text>
            <Text style={styles.infoValue}>
              {booking.vehicle?.plate_number || "-"}
            </Text>
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
            <Text style={styles.sectionTitle}>Services & Cost</Text>
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
                  <Text style={styles.totalLabel}>Total Payment</Text>
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

        {/* PAYMENT */}
        {booking.status === "done" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payment Status</Text>

            {(!payment || payment.status === "failed") && (
              <>
                <Text style={styles.paymentDescription}>
                  Choose your preferred payment method.
                </Text>

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
                    Instant payment via Midtrans Gateway
                  </Text>
                </TouchableOpacity>

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
                    Pay at Workshop Cashier
                  </Text>
                  <Text style={styles.paymentOptionDescription}>
                    Pay directly at the cashier desk
                  </Text>
                </TouchableOpacity>

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

            {payment && payment.status !== "failed" && (
              <>
                <View style={styles.paymentHeaderRow}>
                  <Text style={styles.infoLabel}>Status</Text>
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
                      Please proceed to the workshop cashier to finalize payment.
                    </Text>
                  )}

                {payment.status === "pending" &&
                  payment.payment_method === "midtrans" && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={styles.paymentNote}>
                        Online payment is currently pending.
                      </Text>
                      <TouchableOpacity
                        style={[styles.confirmPaymentButton, { marginTop: 12 }]}
                        activeOpacity={0.8}
                        onPress={() =>
                          openMidtransUrl(
                            midtransRedirectUrl || payment.redirect_url
                          )
                        }
                      >
                        <Text style={styles.confirmPaymentButtonText}>
                          Pay Now / Continue Payment
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
              </>
            )}
          </View>
        )}

        {/* SERVICE REPORT */}
        {booking.status === "done" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Service Report</Text>
            <Text style={styles.reportDescription}>
              Your vehicle service is completed. Download the official PDF report
              below.
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
                <Text style={styles.downloadButtonText}>
                  Download Report (PDF)
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLESHEET
// ============================================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748B",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
  },
  bookingCodeHeader: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0F172A",
    maxWidth: "60%",
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusPending: {
    backgroundColor: "#FEF3C7",
    color: "#D97706",
  },
  statusConfirmed: {
    backgroundColor: "#DBEAFE",
    color: "#2563EB",
  },
  statusCheckedIn: {
    backgroundColor: "#E0E7FF",
    color: "#4F46E5",
  },
  statusOnProgress: {
    backgroundColor: "#FCE7F3",
    color: "#DB2777",
  },
  statusDone: {
    backgroundColor: "#D1FAE5",
    color: "#059669",
  },
  statusCancelled: {
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
  },
  barcodeSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  barcodeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 12,
  },
  barcodeWrapper: {
    padding: 8,
    backgroundColor: "#FFFFFF",
  },
  barcodeCode: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: 1,
    marginTop: 8,
  },
  barcodeDescription: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  serviceName: {
    fontSize: 14,
    color: "#334155",
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0F172A",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    marginTop: 10,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  totalValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2563EB",
  },
  notes: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  taskBullet: {
    fontSize: 14,
    color: "#2563EB",
    marginRight: 8,
  },
  taskText: {
    fontSize: 14,
    color: "#334155",
    flex: 1,
  },
  paymentDescription: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 12,
  },
  paymentOption: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  paymentOptionSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  paymentOptionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  paymentOptionDescription: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  confirmPaymentButton: {
    backgroundColor: "#2563EB",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  confirmPaymentButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  paymentHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  paymentStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  paymentPending: {
    backgroundColor: "#FEF3C7",
    color: "#D97706",
  },
  paymentPaid: {
    backgroundColor: "#D1FAE5",
    color: "#059669",
  },
  paymentFailed: {
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
  },
  paymentNote: {
    fontSize: 12,
    color: "#D97706",
    marginTop: 4,
  },
  reportDescription: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 12,
  },
  downloadButton: {
    backgroundColor: "#0F172A",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  downloadButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});