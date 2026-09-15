import { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import baseUrl from '../../constant/baseUrl';

const getId = (item) => String(item?._id ?? item?.id ?? '');

const DAY_NAMES = [
    'sunday', 'monday', 'tuesday', 'wednesday',
    'thursday', 'friday', 'saturday',
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
    const [notes, setNotes] = useState('');

    const [pickerVisible, setPickerVisible] = useState(null); // 'vehicle' | 'workshop' | null
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const getToken = async () => SecureStore.getItemAsync('access_token');

    const loadData = useCallback(async () => {
        try {
            setLoading(true);

            const token = await getToken();
            if (!token) {
                Alert.alert('Error', 'Sesi habis, silakan login ulang');
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

                // workshop dari mode "terdekat" bisa jadi tidak ada di 100 data pertama
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
                            'GET WORKSHOP DETAIL ERROR:',
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
            console.log('LOAD BOOKING FORM ERROR:', err.response?.data || err.message);
            Alert.alert('Error', 'Gagal memuat data booking');
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
        if (!date) return 'Pilih tanggal';
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatDateForAPI = (date) => {
        if (!date) return null;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
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

        const [openHour, openMinute] = today.open.split(':').map(Number);
        const [closeHour, closeMinute] = today.close.split(':').map(Number);

        let start = openHour * 60 + openMinute;
        const end = closeHour * 60 + closeMinute;
        const slots = [];

        while (start < end) {
            const h = String(Math.floor(start / 60)).padStart(2, '0');
            const m = String(start % 60).padStart(2, '0');
            slots.push(`${h}:${m}`);
            start += 30;
        }

        return slots;
    };

    const timeSlots = generateTimeSlots();

    // ===== SUBMIT =====

    const handleSubmit = async () => {
        if (!selectedVehicle) return Alert.alert('Validasi', 'Pilih kendaraan terlebih dahulu.');
        if (!selectedWorkshop) return Alert.alert('Validasi', 'Pilih workshop terlebih dahulu.');
        if (!bookingDate) return Alert.alert('Validasi', 'Pilih tanggal booking.');
        if (!bookingTimeSlot) return Alert.alert('Validasi', 'Pilih jam booking.');

        try {
            setSubmitting(true);

            const token = await getToken();
            if (!token) {
                Alert.alert('Error', 'Sesi habis, silakan login ulang');
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
                    'Content-Type': 'application/json',
                },
            });

            Alert.alert('Booking Berhasil', 'Booking kamu telah dibuat.', [
                { text: 'OK', onPress: () => navigation.popToTop() },
            ]);
        } catch (err) {
            console.log('CREATE BOOKING ERROR:', err.response?.data || err.message);
            Alert.alert(
                'Booking Gagal',
                err.response?.data?.message || 'Gagal membuat booking.',
            );
        } finally {
            setSubmitting(false);
        }
    };

    // ===== RENDER HELPERS =====

    const renderSelectField = ({
        label,
        locked,
        selected,
        placeholder,
        title,
        subtitle,
        onPress,
    }) => (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>

            <TouchableOpacity
                style={[styles.selectBox, locked && styles.selectBoxLocked]}
                activeOpacity={locked ? 1 : 0.7}
                onPress={locked ? undefined : onPress}
            >
                {selected ? (
                    <View style={styles.selectBoxInfo}>
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
                        <Ionicons name="lock-closed" size={12} color="#5b5be0" />
                    </View>
                ) : (
                    <Ionicons name="chevron-down" size={18} color="#c4c4c4" />
                )}
            </TouchableOpacity>
        </View>
    );

    const closePicker = () => setPickerVisible(null);

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#111" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
                    <Ionicons name="chevron-back" size={24} color="#111" />
                </TouchableOpacity>

                <Text style={styles.title}>Book Appointment</Text>

                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    { paddingBottom: 24 + insets.bottom },
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.subtitle}>
                    Pilih kendaraan, workshop, dan jadwal servismu
                </Text>

                {renderSelectField({
                    label: 'Kendaraan',
                    locked: isVehicleLocked,
                    selected: selectedVehicle,
                    placeholder: 'Pilih kendaraan',
                    title: selectedVehicle
                        ? `${selectedVehicle.brand ?? ''} ${selectedVehicle.model ?? ''}`.trim()
                        : '',
                    subtitle: selectedVehicle?.plate_number,
                    onPress: () => setPickerVisible('vehicle'),
                })}

                {renderSelectField({
                    label: 'Workshop',
                    locked: isWorkshopLocked,
                    selected: selectedWorkshop,
                    placeholder: 'Pilih workshop',
                    title: selectedWorkshop?.name,
                    subtitle: selectedWorkshop?.address,
                    onPress: () => setPickerVisible('workshop'),
                })}

                <View style={styles.field}>
                    <Text style={styles.label}>Tanggal Booking</Text>

                    <TouchableOpacity
                        style={styles.selectBox}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={bookingDate ? styles.selectedTitle : styles.placeholder}>
                            {formatDate(bookingDate)}
                        </Text>
                        <Ionicons name="calendar-outline" size={18} color="#c4c4c4" />
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

                <View style={styles.field}>
                    <Text style={styles.label}>Jam</Text>

                    {!bookingDate || !selectedWorkshop ? (
                        <View style={[styles.selectBox, styles.selectBoxDisabled]}>
                            <Text style={styles.placeholder}>
                                Pilih workshop &amp; tanggal dulu
                            </Text>
                        </View>
                    ) : timeSlots.length === 0 ? (
                        <View style={styles.selectBox}>
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

                <View style={styles.field}>
                    <Text style={styles.label}>Catatan</Text>

                    <View style={styles.notesBox}>
                        <TextInput
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Jelaskan keluhan kendaraanmu"
                            placeholderTextColor="#8b8b8b"
                            multiline
                            style={styles.notesInput}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                    activeOpacity={0.85}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitText}>Confirm Booking</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>

            {/* ===== VEHICLE PICKER ===== */}
            <Modal
                visible={pickerVisible === 'vehicle'}
                transparent
                animationType="fade"
                onRequestClose={closePicker}
            >
                <Pressable style={styles.modalBackdrop} onPress={closePicker}>
                    <Pressable style={styles.modalSheet}>
                        <Text style={styles.modalTitle}>Pilih Kendaraan</Text>

                        {vehicles.length === 0 ? (
                            <Text style={styles.emptyText}>Belum ada kendaraan</Text>
                        ) : (
                            <FlatList
                                data={vehicles}
                                keyExtractor={(item) => getId(item)}
                                style={{ maxHeight: 360 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.modalOption}
                                        onPress={() => {
                                            setSelectedVehicle(item);
                                            closePicker();
                                        }}
                                    >
                                        <View>
                                            <Text style={styles.modalOptionTitle}>
                                                {item.brand} {item.model}
                                            </Text>
                                            <Text style={styles.modalOptionSubtitle}>
                                                {item.plate_number}
                                            </Text>
                                        </View>
                                        {getId(item) === getId(selectedVehicle) && (
                                            <Ionicons name="checkmark" size={18} color="#5b5be0" />
                                        )}
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                    </Pressable>
                </Pressable>
            </Modal>

            {/* ===== WORKSHOP PICKER ===== */}
            <Modal
                visible={pickerVisible === 'workshop'}
                transparent
                animationType="fade"
                onRequestClose={closePicker}
            >
                <Pressable style={styles.modalBackdrop} onPress={closePicker}>
                    <Pressable style={styles.modalSheet}>
                        <Text style={styles.modalTitle}>Pilih Workshop</Text>

                        {workshops.length === 0 ? (
                            <Text style={styles.emptyText}>Belum ada workshop</Text>
                        ) : (
                            <FlatList
                                data={workshops}
                                keyExtractor={(item) => getId(item)}
                                style={{ maxHeight: 360 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.modalOption}
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
                                        {getId(item) === getId(selectedWorkshop) && (
                                            <Ionicons name="checkmark" size={18} color="#5b5be0" />
                                        )}
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
    },
    title: { fontSize: 17, fontWeight: '700', color: '#111' },
    content: { paddingHorizontal: 20, paddingTop: 16, gap: 4 },
    subtitle: { fontSize: 13, color: '#8b8b8b', marginBottom: 16 },
    field: { marginBottom: 18 },
    label: { fontSize: 13, fontWeight: '600', color: '#111', marginBottom: 8 },
    selectBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#e5e5e5',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    selectBoxLocked: { backgroundColor: '#f7f7fb' },
    selectBoxDisabled: { backgroundColor: '#f2f2f2' },
    selectBoxInfo: { flex: 1, paddingRight: 8 },
    selectedTitle: { fontSize: 14, fontWeight: '600', color: '#111' },
    selectedSubtitle: { fontSize: 12, color: '#8b8b8b', marginTop: 2 },
    placeholder: { fontSize: 14, color: '#8b8b8b' },
    emptyInlineText: { fontSize: 13, color: '#d13c3c' },
    lockedBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#eef0ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    timeChip: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e5e5',
    },
    timeChipActive: { backgroundColor: '#111', borderColor: '#111' },
    timeChipText: { fontSize: 13, fontWeight: '600', color: '#111' },
    timeChipTextActive: { color: '#fff' },
    notesBox: {
        borderWidth: 1,
        borderColor: '#e5e5e5',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        minHeight: 90,
    },
    notesInput: { fontSize: 14, color: '#111', textAlignVertical: 'top' },
    submitButton: {
        backgroundColor: '#111',
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 8,
    },
    submitButtonDisabled: { opacity: 0.6 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 32,
    },
    modalTitle: { fontSize: 14, fontWeight: '700', color: '#8b8b8b', marginBottom: 8 },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f2f2f2',
    },
    modalOptionTitle: { fontSize: 15, color: '#111', fontWeight: '600' },
    modalOptionSubtitle: { fontSize: 12, color: '#8b8b8b', marginTop: 2 },
    emptyText: { fontSize: 14, color: '#8b8b8b', textAlign: 'center', paddingVertical: 20 },
});