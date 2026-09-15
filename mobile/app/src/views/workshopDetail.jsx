import { useState, useCallback, useRef, useEffect } from "react";
import {
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Image,
    Animated,
    Linking,
    StyleSheet,
    StatusBar,
} from "react-native";
import {
    SafeAreaProvider,
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import baseUrl from "../../constant/baseUrl";

const DAY_LABELS = {
    sunday: "Minggu",
    monday: "Senin",
    tuesday: "Selasa",
    wednesday: "Rabu",
    thursday: "Kamis",
    friday: "Jumat",
    saturday: "Sabtu",
};

const DAY_ORDER = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
];

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

    return <Animated.View style={[styles.skeletonBox, style, { opacity }]} />;
}

function WorkshopDetailSkeleton() {
    return (
        <View style={styles.container}>
            <SkeletonBox style={styles.skeletonImage} />
            <View style={styles.contentPadding}>
                <SkeletonBox style={{ height: 24, width: "70%", borderRadius: 8 }} />
                <SkeletonBox style={{ height: 14, width: "90%", borderRadius: 6, marginTop: 12 }} />
                <SkeletonBox style={{ height: 50, width: "100%", borderRadius: 12, marginTop: 20 }} />
                <SkeletonBox style={{ height: 160, width: "100%", borderRadius: 12, marginTop: 16 }} />
            </View>
        </View>
    );
}

function WorkshopDetailContent() {
    const navigation = useNavigation();
    const route = useRoute();
    const insets = useSafeAreaInsets();

    const { workshopId, workshop: initialWorkshop } = route.params ?? {};

    const [workshop, setWorkshop] = useState(initialWorkshop ?? null);
    const [loading, setLoading] = useState(!initialWorkshop);
    const [error, setError] = useState(null);

    const fetchWorkshopDetail = useCallback(async () => {
        if (!workshopId) return;

        try {
            setError(null);
            const token = await SecureStore.getItemAsync("access_token");

            if (!token) {
                setError("Sesi habis, silakan login ulang");
                return;
            }

            const { data } = await axios.get(
                `${baseUrl}/api/workshop/${workshopId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            setWorkshop(data.data ?? data);
        } catch (err) {
            if (!initialWorkshop) {
                setError(
                    err.response?.data?.message || "Gagal mengambil detail workshop",
                );
            }
        } finally {
            setLoading(false);
        }
    }, [workshopId, initialWorkshop]);

    useFocusEffect(
        useCallback(() => {
            fetchWorkshopDetail();
        }, [fetchWorkshopDetail]),
    );

    const getTodayKey = () => {
        const days = [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
        ];
        return days[new Date().getDay()];
    };

    const openInMaps = () => {
        const coords = workshop?.location?.coordinates;
        if (!coords || coords.length < 2) return;

        const [lng, lat] = coords;
        const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        Linking.openURL(url);
    };

    const sortedHours = (() => {
        if (!workshop?.operational_hours?.length) return [];

        const map = {};
        workshop.operational_hours.forEach((h) => {
            map[h.day] = h;
        });

        return DAY_ORDER.map((day) => ({
            day,
            schedule: map[day] ?? null,
        }));
    })();

    const todayKey = getTodayKey();

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <View style={styles.headerBar}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Ionicons name="chevron-back" size={20} color="#0F2C59" />
                    </TouchableOpacity>
                </View>
                <WorkshopDetailSkeleton />
            </SafeAreaView>
        );
    }

    if (error || !workshop) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <View style={styles.headerBar}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Ionicons name="chevron-back" size={20} color="#0F2C59" />
                    </TouchableOpacity>
                </View>

                <View style={styles.centerContent}>
                    <Ionicons name="alert-circle-outline" size={44} color="#E53E3E" />
                    <Text style={styles.errorText}>
                        {error || "Workshop tidak ditemukan"}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header Navigation */}
            <View style={styles.headerBar}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <Ionicons name="chevron-back" size={20} color="#0F2C59" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    Detail Workshop
                </Text>
                <View style={{ width: 38 }} />
            </View>

            <ScrollView
                style={styles.contentScrollView}
                contentContainerStyle={{ paddingBottom: 90 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Image Banner dengan Ukuran Lebih Tinggi */}
                {workshop.workshop_img ? (
                    <Image
                        source={{ uri: workshop.workshop_img }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Ionicons name="car-sport" size={56} color="#CBD5E1" />
                    </View>
                )}

                {/* Content */}
                <View style={styles.contentPadding}>
                    <View style={styles.nameRow}>
                        <Text style={styles.name}>{workshop.name}</Text>
                        <View
                            style={[
                                styles.statusBadge,
                                workshop.is_active
                                    ? styles.statusBadgeActive
                                    : styles.statusBadgeInactive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.statusBadgeText,
                                    workshop.is_active
                                        ? styles.statusBadgeTextActive
                                        : styles.statusBadgeTextInactive,
                                ]}
                            >
                                {workshop.is_active ? "Buka" : "Tutup"}
                            </Text>
                        </View>
                    </View>

                    {workshop.address && (
                        <TouchableOpacity
                            style={styles.addressRow}
                            onPress={openInMaps}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="location" size={18} color="#0F2C59" />
                            <Text style={styles.addressText} numberOfLines={2}>
                                {workshop.address}
                            </Text>
                            <Ionicons name="open-outline" size={16} color="#0F2C59" />
                        </TouchableOpacity>
                    )}

                    {typeof workshop.max_slot_per_day === "number" && (
                        <View style={styles.infoCard}>
                            <Ionicons name="people" size={18} color="#0F2C59" />
                            <Text style={styles.infoCardText}>
                                Kapasitas <Text style={{ fontWeight: "700" }}>{workshop.max_slot_per_day} slot</Text> booking per hari
                            </Text>
                        </View>
                    )}

                    {sortedHours.length > 0 && (
                        <View style={styles.hoursCard}>
                            <Text style={styles.sectionTitle}>Jam Operasional</Text>

                            {sortedHours.map(({ day, schedule }) => {
                                const isToday = day === todayKey;
                                return (
                                    <View
                                        key={day}
                                        style={[
                                            styles.hoursItemRow,
                                            isToday && styles.hoursItemRowToday,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.hoursDay,
                                                isToday && styles.hoursDayToday,
                                            ]}
                                        >
                                            {DAY_LABELS[day] ?? day} {isToday ? "(Hari Ini)" : ""}
                                        </Text>

                                        <Text
                                            style={[
                                                styles.hoursValue,
                                                isToday && styles.hoursValueToday,
                                            ]}
                                        >
                                            {schedule
                                                ? `${schedule.open} - ${schedule.close}`
                                                : "Tutup"}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>
            </ScrollView>

            <View
                style={[
                    styles.footer,
                    { paddingBottom: Math.max(insets.bottom + 8, 14) },
                ]}
            >
                <TouchableOpacity
                    style={[
                        styles.bookingButton,
                        !workshop.is_active && styles.bookingButtonDisabled,
                    ]}
                    activeOpacity={0.85}
                    disabled={!workshop.is_active}
                    onPress={() =>
                        navigation.navigate("SelectVehicle", {
                            workshopId: String(workshop._id),
                            workshop,
                        })
                    }
                >
                    <Text style={styles.bookingButtonText}>
                        {workshop.is_active ? "Booking Sekarang" : "Workshop Tutup"}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

export function WorkshopDetail() {
    return (
        <SafeAreaProvider>
            <WorkshopDetailContent />
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    headerBar: {
        height: 52,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0F2C59",
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F8FAFC",
    },

    centerContent: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    errorText: {
        marginTop: 10,
        fontSize: 14,
        color: "#E53E3E",
        textAlign: "center",
        fontWeight: "500",
    },

    contentScrollView: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },

    /* Gambar Dibuat Lebih Tinggi (280) */
    image: {
        width: "100%",
        height: 280,
    },
    imagePlaceholder: {
        width: "100%",
        height: 280,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F1F5F9",
    },

    contentPadding: {
        padding: 18,
    },
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 16,
    },
    name: {
        flex: 1,
        fontSize: 20,
        fontWeight: "800",
        color: "#0F2C59",
    },

    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusBadgeActive: {
        backgroundColor: "#DCFCE7",
    },
    statusBadgeInactive: {
        backgroundColor: "#FEE2E2",
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: "700",
    },
    statusBadgeTextActive: {
        color: "#15803D",
    },
    statusBadgeTextInactive: {
        color: "#B91C1C",
    },

    addressRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 14,
        backgroundColor: "#F8FAFC",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginBottom: 12,
    },
    addressText: {
        flex: 1,
        fontSize: 13,
        color: "#334155",
        fontWeight: "500",
    },

    infoCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 14,
        backgroundColor: "#F8FAFC",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginBottom: 16,
    },
    infoCardText: {
        fontSize: 13,
        color: "#334155",
        fontWeight: "500",
    },

    hoursCard: {
        padding: 16,
        backgroundColor: "#F8FAFC",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0F2C59",
        marginBottom: 12,
    },
    hoursItemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    hoursItemRowToday: {
        backgroundColor: "#EBF3FE",
    },
    hoursDay: {
        fontSize: 13,
        color: "#64748B",
        fontWeight: "500",
    },
    hoursDayToday: {
        color: "#0F2C59",
        fontWeight: "700",
    },
    hoursValue: {
        fontSize: 13,
        color: "#334155",
        fontWeight: "500",
    },
    hoursValueToday: {
        color: "#0F2C59",
        fontWeight: "700",
    },

    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 18,
        paddingTop: 12,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0",
    },
    bookingButton: {
        height: 48,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0F2C59",
    },
    bookingButtonDisabled: {
        backgroundColor: "#CBD5E1",
    },
    bookingButtonText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#FFFFFF",
    },

    skeletonBox: {
        backgroundColor: "#E2E8F0",
    },
    skeletonImage: {
        width: "100%",
        height: 280,
    },
});

export default WorkshopDetail;