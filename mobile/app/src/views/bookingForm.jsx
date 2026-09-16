import { useState, useEffect, useCallback } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    ScrollView,
    FlatList,
    ActivityIndicator,
    Modal,
    Pressable,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import baseUrl from "../../constant/baseUrl";

const getId = (item) => String(item?._id ?? item?.id ?? "");

const DAY_NAMES = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
];

export function BookingForm() {
    const navigation = useNavigation();
    const route = useRoute();
    const insets = useSafeAreaInsets();

    const vehicleIdFromRoute = route.params?.vehicleId || null;
    const workshopIdFromRoute = route.params?.workshopId || null;
    const workshopFromRoute = route.params?.workshop || null;

    const isVehicleLocked = Boolean(vehicleIdFromRoute);
    const isWorkshopLocked = Boolean(workshopIdFromRoute);

    const [vehicles, setVehicles] = useState([]);
    const [workshops, setWorkshops] = useState([]);

    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [selectedWorkshop, setSelectedWorkshop] = useState(null);

    const [bookingDate, setBookingDate] = useState(null);
    const [bookingTimeSlot, setBookingTimeSlot] = useState(null);
    const [notes, setNotes] = useState("");

    const [pickerVisible, setPickerVisible] = useState(null); // 'vehicle' | 'workshop' | null
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const getToken = async () => SecureStore.getItemAsync("access_token");

    const loadData = useCallback(async () => {
        try {
            setLoading(true);

            const token = await getToken();
            if (!token) {
                Alert.alert("Error", "Sesi habis, silakan login ulang");
                return;
            }

            const [vehicleRes, workshopRes] = await Promise.all([
                axios.get(`${baseUrl}/api/vehicles`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get(`${baseUrl}/api/workshop`, {
                    params: { page: 1, limit: 100 },
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            const vehicleData = Array.isArray(vehicleRes.data)
                ? vehicleRes.data
                : vehicleRes.data?.data ?? vehicleRes.data?.vehicles ?? [];

            const workshopData = Array.isArray(workshopRes.data)
                ? workshopRes.data
                : workshopRes.data?.data ?? workshopRes.data?.workshops ?? [];

            setVehicles(vehicleData);
            setWorkshops(workshopData);

            // ===== VEHICLE =====
            if (vehicleIdFromRoute) {
                const vehicle = vehicleData.find(
                    (item) => getId(item) === String(vehicleIdFromRoute),
                );
                if (vehicle) setSelectedVehicle(vehicle);
            }

            // ===== WORKSHOP =====
            if (workshopIdFromRoute) {
                let workshop = workshopData.find(
                    (item) => getId(item) === String(workshopIdFromRoute),
                );

                if (!workshop && workshopFromRoute) {
                    workshop = workshopFromRoute;
                }

                if (!workshop) {
                    try {
                        const detail = await axios.get(
                            `${baseUrl}/api/workshop/${workshopIdFromRoute}`,
                            { headers: { Authorization: `Bearer ${token}` } },
                        );
                        workshop = detail.data?.data ?? detail.data;
                    } catch (err) {
                        console.log(
                            "GET WORKSHOP DETAIL ERROR:",
                            err.response?.data || err.message,
                        );
                    }
                }

                if (workshop) {
                    setSelectedWorkshop(workshop);
                    setWorkshops((prev) =>
                        prev.some((item) => getId(item) === getId(workshop))
                            ? prev
                            : [workshop, ...prev],
                    );
                }
            }
        } catch (err) {
            console.log("LOAD BOOKING FORM ERROR:", err.response?.data || err.message);
            Alert.alert("Error", "Gagal memuat data booking");
        } finally {
            setLoading(false);
        }
    }, [vehicleIdFromRoute, workshopIdFromRoute, workshopFromRoute]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ===== DATE =====

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (!selectedDate) return;
        setBookingDate(selectedDate);
        setBookingTimeSlot(null);
    };

    const formatDate = (date) => {
        if (!date) return "Select booking date";
        return date.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    const formatDateForAPI = (date) => {
        if (!date) return null;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    // ===== TIME SLOTS =====

    const getDayName = (date) => (date ? DAY_NAMES[date.getDay()] : null);

    const generateTimeSlots = () => {
        if (!selectedWorkshop || !bookingDate) return [];

        const dayName = getDayName(bookingDate);
        const operationalHours = selectedWorkshop.operational_hours || [];
        const today = operationalHours.find(
            (item) => item.day?.toLowerCase() === dayName,
        );

        if (!today?.open || !today?.close) return [];

        const [openHour, openMinute] = today.open.split(":").map(Number);
        const [closeHour, closeMinute] = today.close.split(":").map(Number);

        let start = openHour * 60 + openMinute;
        const end = closeHour * 60 + closeMinute;
        const slots = [];

        while (start < end) {
            const h = String(Math.floor(start / 60)).padStart(2, "0");
            const m = String(start % 60).padStart(2, "0");
            slots.push(`${h}:${m}`);
            start += 30;
        }

        return slots;
    };

    const timeSlots = generateTimeSlots();

    // ===== SUBMIT =====

    const handleSubmit = async () => {
        if (!selectedVehicle) return Alert.alert("Validation", "Please select a vehicle first.");
        if (!selectedWorkshop) return Alert.alert("Validation", "Please select a workshop first.");
        if (!bookingDate) return Alert.alert("Validation", "Please select a booking date.");
        if (!bookingTimeSlot) return Alert.alert("Validation", "Please select a booking time slot.");

        try {
            setSubmitting(true);

            const token = await getToken();
            if (!token) {
                Alert.alert("Error", "Sesi habis, silakan login ulang");
                return;
            }

            const payload = {
                vehicle_id: getId(selectedVehicle),
                bengkel_id: getId(selectedWorkshop),
                booking_date: formatDateForAPI(bookingDate),
                booking_time_slot: bookingTimeSlot,
                notes: notes.trim() || undefined,
            };

            await axios.post(`${baseUrl}/api/bookings`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            Alert.alert("Booking Berhasil", "Booking kamu telah berhasil dibuat.", [
                { text: "OK", onPress: () => navigation.popToTop() },
            ]);
        } catch (err) {
            console.log("CREATE BOOKING ERROR:", err.response?.data || err.message);
            Alert.alert(
                "Booking Gagal",
                err.response?.data?.message || "Gagal membuat booking.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    const closePicker = () => setPickerVisible(null);

    const renderSelectField = ({
        label,
        icon,
        locked,
        selected,
        placeholder,
        title,
        subtitle,
        onPress,
    }) => (
        <View style={styles.fieldContainer}>
            <Text style={styles.label}>{label}</Text>

            <TouchableOpacity
                style={[styles.neumorphicInput, locked && styles.inputLocked]}
                activeOpacity={locked ? 1 : 0.75}
                onPress={locked ? undefined : onPress}
            >
                <View style={styles.inputLeftIcon}>
                    <Ionicons name={icon} size={20} color={selected ? "#0F2C59" : "#94A3B8"} />
                </View>

                {selected ? (
                    <View style={styles.selectInfo}>
                        <Text style={styles.selectedTitle} numberOfLines={1}>
                            {title}
                        </Text>
                        {subtitle ? (
                            <Text style={styles.selectedSubtitle} numberOfLines={1}>
                                {subtitle}
                            </Text>
                        ) : null}
                    </View>
                ) : (
                    <Text style={styles.placeholder}>{placeholder}</Text>
                )}

                {locked ? (
                    <View style={styles.lockedBadge}>
                        <Ionicons name="lock-closed" size={12} color="#64748B" />
                    </View>
                ) : (
                    <Ionicons name="chevron-down" size={18} color="#94A3B8" />
                )}
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#0F2C59" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={10}
                    style={styles.backButton}
                >
                    <Ionicons name="chevron-back" size={20} color="#0F2C59" />
                </TouchableOpacity>

                <Text style={styles.title}>Book Appointment</Text>

                <View style={{ width: 36 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
                style={styles.flex}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.content,
                        { paddingBottom: 32 + insets.bottom },
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.subtitle}>
                        Select your preferred vehicle, workshop, and service schedule.
                    </Text>

                    {/* Vehicle Field */}
                    {renderSelectField({
                        label: "Vehicle",
                        icon: "car-sport-outline",
                        locked: isVehicleLocked,
                        selected: selectedVehicle,
                        placeholder: "Select Vehicle",
                        title: selectedVehicle
                            ? `${selectedVehicle.brand ?? ""} ${selectedVehicle.model ?? ""}`.trim()
                            : "",
                        subtitle: selectedVehicle?.plate_number,
                        onPress: () => setPickerVisible("vehicle"),
                    })}

                    {/* Workshop Field */}
                    {renderSelectField({
                        label: "Workshop",
                        icon: "construct-outline",
                        locked: isWorkshopLocked,
                        selected: selectedWorkshop,
                        placeholder: "Select vehicle",
                        title: selectedWorkshop?.name,
                        subtitle: selectedWorkshop?.address,
                        onPress: () => setPickerVisible("workshop"),
                    })}

                    {/* Booking Date Field */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Booking Date</Text>

                        <TouchableOpacity
                            style={styles.neumorphicInput}
                            activeOpacity={0.75}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <View style={styles.inputLeftIcon}>
                                <Ionicons
                                    name="calendar-clear-outline"
                                    size={20}
                                    color={bookingDate ? "#0F2C59" : "#94A3B8"}
                                />
                            </View>
                            <Text style={bookingDate ? styles.selectedTitle : styles.placeholder}>
                                {formatDate(bookingDate)}
                            </Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={bookingDate || new Date()}
                                mode="date"
                                display="default"
                                minimumDate={new Date()}
                                onChange={handleDateChange}
                            />
                        )}
                    </View>

                    {/* Time Slot Field */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Operating Hours</Text>

                        {!bookingDate || !selectedWorkshop ? (
                            <View style={[styles.neumorphicInput, styles.inputDisabled]}>
                                <Ionicons name="time-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                                <Text style={styles.placeholder}>
                                    Select workshop &amp; date first
                                </Text>
                            </View>
                        ) : timeSlots.length === 0 ? (
                            <View style={[styles.neumorphicInput, styles.inputDisabled]}>
                                <Ionicons name="alert-circle-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                                <Text style={styles.emptyInlineText}>
                                    Workshop tutup pada tanggal ini
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.timeGrid}>
                                {timeSlots.map((slot) => {
                                    const active = bookingTimeSlot === slot;
                                    return (
                                        <TouchableOpacity
                                            key={slot}
                                            style={[styles.timeChip, active && styles.timeChipActive]}
                                            activeOpacity={0.8}
                                            onPress={() => setBookingTimeSlot(slot)}
                                        >
                                            <Text
                                                style={[
                                                    styles.timeChipText,
                                                    active && styles.timeChipTextActive,
                                                ]}
                                            >
                                                {slot}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </View>

                    {/* Notes Field */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Notes(Opsional)</Text>

                        <View style={styles.notesBox}>
                            <TextInput
                                value={notes}
                                onChangeText={setNotes}
                                placeholder="Describe the issue or specific service required"
                                placeholderTextColor="#94A3B8"
                                multiline
                                style={styles.notesInput}
                            />
                        </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={submitting}
                        activeOpacity={0.85}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <View style={styles.buttonRow}>
                                <Text style={styles.submitText}>Confirm Booking</Text>
                                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                            </View>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ===== VEHICLE PICKER MODAL ===== */}
            <Modal
                visible={pickerVisible === "vehicle"}
                transparent
                animationType="fade"
                onRequestClose={closePicker}
            >
                <Pressable style={styles.modalBackdrop} onPress={closePicker}>
                    <Pressable style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>Select Vehicle</Text>

                        {vehicles.length === 0 ? (
                            <Text style={styles.emptyText}>There are no added vehicles yet</Text>
                        ) : (
                            <FlatList
                                data={vehicles}
                                keyExtractor={(item) => getId(item)}
                                style={{ maxHeight: 320 }}
                                showsVerticalScrollIndicator={false}
                                renderItem={({ item }) => {
                                    const isSelected = getId(item) === getId(selectedVehicle);
                                    return (
                                        <TouchableOpacity
                                            style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                                            onPress={() => {
                                                setSelectedVehicle(item);
                                                closePicker();
                                            }}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.modalOptionTitle}>
                                                    {item.brand} {item.model}
                                                </Text>
                                                <Text style={styles.modalOptionSubtitle}>
                                                    {item.plate_number}
                                                </Text>
                                            </View>
                                            {isSelected && (
                                                <Ionicons name="checkmark-circle" size={20} color="#0F2C59" />
                                            )}
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        )}
                    </Pressable>
                </Pressable>
            </Modal>

            {/* ===== WORKSHOP PICKER MODAL ===== */}
            <Modal
                visible={pickerVisible === "workshop"}
                transparent
                animationType="fade"
                onRequestClose={closePicker}
            >
                <Pressable style={styles.modalBackdrop} onPress={closePicker}>
                    <Pressable style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>Select Workshop</Text>

                        {workshops.length === 0 ? (
                            <Text style={styles.emptyText}>Belum ada workshop tersedia</Text>
                        ) : (
                            <FlatList
                                data={workshops}
                                keyExtractor={(item) => getId(item)}
                                style={{ maxHeight: 320 }}
                                showsVerticalScrollIndicator={false}
                                renderItem={({ item }) => {
                                    const isSelected = getId(item) === getId(selectedWorkshop);
                                    return (
                                        <TouchableOpacity
                                            style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                                            onPress={() => {
                                                setSelectedWorkshop(item);
                                                setBookingTimeSlot(null);
                                                closePicker();
                                            }}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.modalOptionTitle} numberOfLines={1}>
                                                    {item.name}
                                                </Text>
                                                <Text style={styles.modalOptionSubtitle} numberOfLines={1}>
                                                    {item.address}
                                                </Text>
                                            </View>
                                            {isSelected && (
                                                <Ionicons name="checkmark-circle" size={20} color="#0F2C59" />
                                            )}
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F9FA", // Soft Off-White
    },
    flex: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: "#F8F9FA",
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        shadowColor: "#0F2C59",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0F2C59", // Royal Navy Blue
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 12,
    },
    subtitle: {
        fontSize: 13,
        color: "#64748B",
        marginBottom: 20,
        lineHeight: 18,
    },
    fieldContainer: {
        marginBottom: 18,
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
        color: "#334155",
        marginBottom: 8,
    },
    neumorphicInput: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        paddingHorizontal: 14,
        paddingVertical: 12,
        minHeight: 52,
        shadowColor: "#0F2C59",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    inputLocked: {
        backgroundColor: "#F1F5F9",
        borderColor: "#E2E8F0",
    },
    inputDisabled: {
        backgroundColor: "#F1F5F9",
        borderColor: "#E2E8F0",
    },
    inputLeftIcon: {
        marginRight: 10,
    },
    selectInfo: {
        flex: 1,
        marginRight: 8,
    },
    selectedTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#0F2C59",
    },
    selectedSubtitle: {
        fontSize: 11,
        color: "#64748B",
        marginTop: 2,
    },
    placeholder: {
        fontSize: 13,
        color: "#94A3B8",
        flex: 1,
    },
    emptyInlineText: {
        fontSize: 13,
        color: "#EF4444",
        flex: 1,
    },
    lockedBadge: {
        width: 24,
        height: 24,
        borderRadius: 8,
        backgroundColor: "#E2E8F0",
        alignItems: "center",
        justifyContent: "center",
    },
    timeGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    timeChip: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        shadowColor: "#0F2C59",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    timeChipActive: {
        backgroundColor: "#0F2C59",
        borderColor: "#0F2C59",
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
    },
    timeChipText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#334155",
    },
    timeChipTextActive: {
        color: "#FFFFFF",
    },
    notesBox: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 12,
        minHeight: 100,
        shadowColor: "#0F2C59",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    notesInput: {
        fontSize: 13,
        color: "#0F2C59",
        textAlignVertical: "top",
    },
    submitButton: {
        backgroundColor: "#0F2C59",
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 12,
        shadowColor: "#0F2C59",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    buttonRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    submitText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
    },
    centerContent: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.4)",
        justifyContent: "flex-end",
    },
    modalSheet: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 36,
    },
    modalHandle: {
        width: 38,
        height: 4,
        backgroundColor: "#CBD5E1",
        borderRadius: 2,
        alignSelf: "center",
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#64748B",
        marginBottom: 12,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    modalOption: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 6,
    },
    modalOptionSelected: {
        backgroundColor: "#F1F5F9",
    },
    modalOptionTitle: {
        fontSize: 14,
        color: "#0F2C59",
        fontWeight: "600",
    },
    modalOptionSubtitle: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 2,
    },
    emptyText: {
        fontSize: 13,
        color: "#94A3B8",
        textAlign: "center",
        paddingVertical: 24,
    },
});