import { useState, useCallback, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Modal,
    Pressable,
    Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import axios from 'axios';
import MapView, { Marker, Circle } from 'react-native-maps';
import baseUrl from '../../constant/baseUrl';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_HEIGHT = 260;

const DISTANCE_OPTIONS = [
    { label: '5 km', value: 5000 },
    { label: '10 km', value: 10000 },
    { label: '20 km', value: 20000 },
];

function getDeltaForDistance(distanceMeters) {
    return Math.max((distanceMeters / 111000) * 2.4, 0.02);
}

export function NearestWorkshop() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const mapRef = useRef(null);

    const [userLocation, setUserLocation] = useState(null);
    const [workshops, setWorkshops] = useState([]);
    const [distance, setDistance] = useState(5000);
    const [showDistancePicker, setShowDistancePicker] = useState(false);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingLocation, setUpdatingLocation] = useState(false);
    const [error, setError] = useState(null);
    const [locationNotSet, setLocationNotSet] = useState(false);

    const getDeviceLocation = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setError('Izin akses lokasi ditolak. Aktifkan lokasi di pengaturan.');
            return null;
        }
        const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });
        return {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
        };
    };

    const fetchNearestWorkshops = useCallback(async (dist = distance) => {
        try {
            setError(null);
            const token = await SecureStore.getItemAsync('access_token');

            if (!token) {
                setError('Sesi habis, silakan login ulang');
                return;
            }

            const { data } = await axios.get(`${baseUrl}/api/workshop/nearest`, {
                params: { distance: dist },
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setLocationNotSet(false);
            setWorkshops(Array.isArray(data) ? data : []);
        } catch (err) {
            const message = err.response?.data?.message;
            if (message === 'User location is not set yet') {
                setLocationNotSet(true);
                setWorkshops([]);
            } else {
                setError(message || 'Gagal mengambil workshop terdekat');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
            setUpdatingLocation(false);
        }
    }, [distance]);

    const loadDeviceLocationForMap = useCallback(async () => {
        const coords = await getDeviceLocation();
        if (coords) setUserLocation(coords);
    }, []);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            loadDeviceLocationForMap();
            fetchNearestWorkshops(distance);
        }, [fetchNearestWorkshops, loadDeviceLocationForMap, distance])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadDeviceLocationForMap();
        fetchNearestWorkshops(distance);
    };

    const handleUpdateLocation = async () => {
        setUpdatingLocation(true);
        setError(null);
        try {
            const coords = await getDeviceLocation();
            if (!coords) {
                setUpdatingLocation(false);
                return;
            }

            const token = await SecureStore.getItemAsync('access_token');
            if (!token) {
                setError('Sesi habis, silakan login ulang');
                setUpdatingLocation(false);
                return;
            }

            await axios.patch(
                `${baseUrl}/api/user/location`,
                {
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setUserLocation(coords);
            mapRef.current?.animateToRegion(
                {
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    latitudeDelta: getDeltaForDistance(distance),
                    longitudeDelta: getDeltaForDistance(distance),
                },
                500
            );

            await fetchNearestWorkshops(distance);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal memperbarui lokasi');
            setUpdatingLocation(false);
        }
    };

    const handleSelectDistance = (value) => {
        setShowDistancePicker(false);
        if (value === distance) return;
        setDistance(value);
        setLoading(true);
        fetchNearestWorkshops(value);
        if (userLocation) {
            mapRef.current?.animateToRegion(
                {
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    latitudeDelta: getDeltaForDistance(value),
                    longitudeDelta: getDeltaForDistance(value),
                },
                500
            );
        }
    };

    const focusOnWorkshop = (item) => {
        const coords = item.location?.coordinates;
        if (!coords || !mapRef.current) return;
        mapRef.current.animateToRegion(
            {
                latitude: coords[1],
                longitude: coords[0],
                latitudeDelta: getDeltaForDistance(Math.max(distance / 4, 1000)),
                longitudeDelta: getDeltaForDistance(Math.max(distance / 4, 1000)),
            },
            500
        );
    };

    const formatDistance = (meters) => {
        if (meters == null) return null;
        if (meters < 1000) return `${Math.round(meters)} m`;
        return `${(meters / 1000).toFixed(1)} km`;
    };

    const renderWorkshopItem = ({ item }) => {
        const dist = formatDistance(item.dist?.calculated);
        return (
            <View style={styles.card}>
                <TouchableOpacity
                    style={styles.workshopRow}
                    activeOpacity={0.7}
                    onPress={() => focusOnWorkshop(item)}
                >
                    <View style={styles.cardIconWrapper}>
                        <Ionicons name="construct-outline" size={22} color="#0F2C59" />
                    </View>
                    <View style={styles.cardInfo}>
                        <View style={styles.cardNameRow}>
                            <Text style={styles.cardName} numberOfLines={1}>
                                {item.name}
                            </Text>
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
                    </View>
                    {dist && (
                        <View style={styles.distanceBadge}>
                            <Ionicons name="navigate-outline" size={12} color="#0F2C59" />
                            <Text style={styles.distanceBadgeText}>{dist}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Booking Button */}
                <TouchableOpacity
                    style={[
                        styles.bookingButton,
                        !item.is_active && styles.bookingButtonDisabled,
                    ]}
                    activeOpacity={0.8}
                    disabled={!item.is_active}
                    onPress={() =>
                        navigation.navigate('SelectVehicle', {
                            workshopId: String(item._id),
                            workshop: item,
                        })
                    }
                >
                    <Text style={styles.bookingButtonText}>
                        {item.is_active ? 'Booking' : 'Workshop Tutup'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    const initialRegion = userLocation
        ? {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: getDeltaForDistance(distance),
            longitudeDelta: getDeltaForDistance(distance),
        }
        : undefined;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} activeOpacity={0.7}>
                    <Ionicons name="chevron-back-outline" size={24} color="#0F2C59" />
                </TouchableOpacity>
                <Text style={styles.title}>Workshop Terdekat</Text>
                <TouchableOpacity
                    style={styles.updateButton}
                    onPress={handleUpdateLocation}
                    disabled={updatingLocation}
                    activeOpacity={0.8}
                >
                    {updatingLocation ? (
                        <ActivityIndicator size="small" color="#0F2C59" />
                    ) : (
                        <Ionicons name="locate-outline" size={18} color="#0F2C59" />
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.distanceRow}>
                <TouchableOpacity
                    style={styles.distanceSelector}
                    onPress={() => setShowDistancePicker(true)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="options-outline" size={14} color="#0F2C59" />
                    <Text style={styles.distanceSelectorText}>
                        Radius {DISTANCE_OPTIONS.find((o) => o.value === distance)?.label}
                    </Text>
                    <Ionicons name="chevron-down-outline" size={14} color="#64748B" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.updateLocationTextButton}
                    onPress={handleUpdateLocation}
                    disabled={updatingLocation}
                    activeOpacity={0.7}
                >
                    <Text style={styles.updateLocationTextButtonText}>
                        {updatingLocation ? 'Memperbarui...' : 'Perbarui lokasi saya'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.mapWrapper}>
                {userLocation ? (
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        initialRegion={initialRegion}
                        showsUserLocation
                        showsMyLocationButton={false}
                    >
                        <Circle
                            center={userLocation}
                            radius={distance}
                            strokeColor="rgba(15, 44, 89, 0.4)"
                            fillColor="rgba(15, 44, 89, 0.08)"
                        />
                        <Marker
                            coordinate={userLocation}
                            title="Lokasi Anda"
                            pinColor="#0F2C59"
                        />
                        {workshops.map((item) =>
                            item.location?.coordinates ? (
                                <Marker
                                    key={String(item._id)}
                                    coordinate={{
                                        latitude: item.location.coordinates[1],
                                        longitude: item.location.coordinates[0],
                                    }}
                                    title={item.name}
                                    description={formatDistance(item.dist?.calculated) || ''}
                                />
                            ) : null
                        )}
                    </MapView>
                ) : (
                    <View style={styles.mapPlaceholder}>
                        <ActivityIndicator size="small" color="#0F2C59" />
                        <Text style={styles.mapPlaceholderText}>Mengambil lokasi...</Text>
                    </View>
                )}
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#0F2C59" />
                </View>
            ) : locationNotSet ? (
                <View style={styles.centerContent}>
                    <Ionicons name="location-outline" size={44} color="#A0AEC0" />
                    <Text style={styles.emptyText}>
                        Lokasi Anda belum diatur. Perbarui lokasi untuk melihat workshop
                        terdekat.
                    </Text>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleUpdateLocation}
                        disabled={updatingLocation}
                        activeOpacity={0.8}
                    >
                        {updatingLocation ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text style={styles.primaryButtonText}>Atur Lokasi Saya</Text>
                        )}
                    </TouchableOpacity>
                </View>
            ) : error ? (
                <View style={styles.centerContent}>
                    <Ionicons name="alert-circle-outline" size={44} color="#E53E3E" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : workshops.length === 0 ? (
                <View style={styles.centerContent}>
                    <Ionicons name="construct-outline" size={48} color="#A0AEC0" />
                    <Text style={styles.emptyText}>
                        Tidak ada workshop dalam radius{' '}
                        {DISTANCE_OPTIONS.find((o) => o.value === distance)?.label}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={workshops}
                    keyExtractor={(item) => String(item._id)}
                    renderItem={renderWorkshopItem}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingBottom: 16 + insets.bottom },
                    ]}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            )}

            <Modal
                visible={showDistancePicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDistancePicker(false)}
            >
                <Pressable
                    style={styles.modalBackdrop}
                    onPress={() => setShowDistancePicker(false)}
                >
                    <View style={styles.modalSheet}>
                        <Text style={styles.modalTitle}>Pilih Radius</Text>
                        {DISTANCE_OPTIONS.map((opt) => (
                            <TouchableOpacity
                                key={opt.value}
                                style={styles.modalOption}
                                onPress={() => handleSelectDistance(opt.value)}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.modalOptionText,
                                        opt.value === distance && styles.modalOptionTextActive,
                                    ]}
                                >
                                    {opt.label}
                                </Text>
                                {opt.value === distance && (
                                    <Ionicons name="checkmark-outline" size={18} color="#0F2C59" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F2F5', // Soft Light Cool Grey
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F2C59', // Royal Navy Blue
        letterSpacing: -0.3,
    },
    updateButton: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    distanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 12,
    },
    distanceSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    distanceSelectorText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1A202C',
    },
    updateLocationTextButton: {
        paddingVertical: 6,
    },
    updateLocationTextButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0F2C59',
    },
    mapWrapper: {
        width: SCREEN_WIDTH,
        height: MAP_HEIGHT,
        backgroundColor: '#E2E8F0',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E2E8F0',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    mapPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    mapPlaceholderText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748B',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        gap: 16,
    },
    card: {
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 16,
        gap: 14,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
    },
    workshopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    cardIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#F0F4F8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardInfo: {
        flex: 1,
    },
    cardNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cardName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A202C',
        flexShrink: 1,
    },
    inactiveBadge: {
        backgroundColor: '#FFF5F5',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FED7D7',
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    inactiveBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#E53E3E',
    },
    cardAddress: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748B',
        marginTop: 3,
    },
    distanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F0F4F8',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    distanceBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0F2C59',
    },
    bookingButton: {
        backgroundColor: '#0F2C59',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0F2C59',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    bookingButtonDisabled: {
        backgroundColor: '#E2E8F0',
        shadowOpacity: 0,
        elevation: 0,
    },
    bookingButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    centerContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        gap: 12,
    },
    errorText: {
        fontSize: 14,
        color: '#E53E3E',
        textAlign: 'center',
        fontWeight: '500',
    },
    emptyText: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        fontWeight: '500',
    },
    primaryButton: {
        backgroundColor: '#0F2C59',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginTop: 4,
        shadowColor: '#0F2C59',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 36,
    },
    modalTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 12,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalOptionText: {
        fontSize: 15,
        color: '#1A202C',
        fontWeight: '500',
    },
    modalOptionTextActive: {
        color: '#0F2C59',
        fontWeight: '700',
    },
});