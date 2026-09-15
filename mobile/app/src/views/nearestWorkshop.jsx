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

// kira-kira 1 derajat latitude ~ 111km, dipakai buat nentuin zoom map sesuai radius
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

    // ambil lokasi device buat nge-center map, tanpa nyentuh data di server
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
                        <Ionicons name="construct-outline" size={24} color="#111" />
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
                            <Ionicons name="navigate" size={12} color="#5b5be0" />
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
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
                    <Ionicons name="chevron-back" size={24} color="#111" />
                </TouchableOpacity>
                <Text style={styles.title}>Workshop Terdekat</Text>
                <TouchableOpacity
                    style={styles.updateButton}
                    onPress={handleUpdateLocation}
                    disabled={updatingLocation}
                >
                    {updatingLocation ? (
                        <ActivityIndicator size="small" color="#5b5be0" />
                    ) : (
                        <Ionicons name="locate-outline" size={18} color="#5b5be0" />
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.distanceRow}>
                <TouchableOpacity
                    style={styles.distanceSelector}
                    onPress={() => setShowDistancePicker(true)}
                >
                    <Ionicons name="options-outline" size={14} color="#111" />
                    <Text style={styles.distanceSelectorText}>
                        Radius {DISTANCE_OPTIONS.find((o) => o.value === distance)?.label}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color="#8b8b8b" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.updateLocationTextButton}
                    onPress={handleUpdateLocation}
                    disabled={updatingLocation}
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
                            strokeColor="rgba(91,91,224,0.5)"
                            fillColor="rgba(91,91,224,0.1)"
                        />
                        <Marker
                            coordinate={userLocation}
                            title="Lokasi Anda"
                            pinColor="#5b5be0"
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
                        <ActivityIndicator size="small" color="#111" />
                        <Text style={styles.mapPlaceholderText}>Mengambil lokasi...</Text>
                    </View>
                )}
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#111" />
                </View>
            ) : locationNotSet ? (
                <View style={styles.centerContent}>
                    <Ionicons name="location-outline" size={40} color="#c4c4c4" />
                    <Text style={styles.emptyText}>
                        Lokasi Anda belum diatur. Perbarui lokasi untuk melihat workshop
                        terdekat.
                    </Text>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleUpdateLocation}
                        disabled={updatingLocation}
                    >
                        {updatingLocation ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.primaryButtonText}>Atur Lokasi Saya</Text>
                        )}
                    </TouchableOpacity>
                </View>
            ) : error ? (
                <View style={styles.centerContent}>
                    <Ionicons name="alert-circle-outline" size={40} color="#d13c3c" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : workshops.length === 0 ? (
                <View style={styles.centerContent}>
                    <Ionicons name="construct-outline" size={40} color="#c4c4c4" />
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
                                    <Ionicons name="checkmark" size={18} color="#5b5be0" />
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
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111',
    },
    updateButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eef0ff',
    },
    distanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    distanceSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e5e5',
    },
    distanceSelectorText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#111',
    },
    updateLocationTextButton: {
        paddingVertical: 6,
    },
    updateLocationTextButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#5b5be0',
    },
    mapWrapper: {
        width: SCREEN_WIDTH,
        height: MAP_HEIGHT,
        backgroundColor: '#f2f2f2',
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
        color: '#8b8b8b',
    },
    listContent: {
        paddingHorizontal: 24,
        paddingTop: 12,
        gap: 12,
    },
    card: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e5e5e5',
        padding: 14,
        gap: 12,
    },
    workshopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    cardIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#f2f2f2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardInfo: {
        flex: 1,
    },
    cardNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cardName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111',
        flexShrink: 1,
    },
    inactiveBadge: {
        backgroundColor: '#fdecec',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    inactiveBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#d13c3c',
    },
    cardAddress: {
        fontSize: 13,
        color: '#8b8b8b',
        marginTop: 2,
    },
    distanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#eef0ff',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    distanceBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#5b5be0',
    },
    bookingButton: {
        backgroundColor: '#111',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    bookingButtonDisabled: {
        backgroundColor: '#e5e5e5',
    },
    bookingButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    centerContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        gap: 10,
    },
    errorText: {
        fontSize: 14,
        color: '#d13c3c',
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#8b8b8b',
        textAlign: 'center',
    },
    primaryButton: {
        backgroundColor: '#111',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginTop: 4,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
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
    modalTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#8b8b8b',
        marginBottom: 8,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f2f2f2',
    },
    modalOptionText: {
        fontSize: 15,
        color: '#111',
    },
    modalOptionTextActive: {
        color: '#5b5be0',
        fontWeight: '700',
    },
});