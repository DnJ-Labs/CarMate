import { useState, useCallback, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    Pressable,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import axios from 'axios';
import MapView, { Marker, Circle } from 'react-native-maps';
import baseUrl from '../../constant/baseUrl';

const DISTANCE_OPTIONS = [
    { label: '5 km', value: 5000 },
    { label: '10 km', value: 10000 },
    { label: '20 km', value: 20000 },
];

function getDeltaForDistance(distanceMeters) {
    return Math.max((distanceMeters / 111000) * 2.4, 0.02);
}

/* ---------------------------------------------------------
 * SKELETON LOADING (pulse box for map loading)
 * ------------------------------------------------------- */
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
            ])
        );

        animation.start();

        return () => animation.stop();
    }, [opacity]);

    return <Animated.View style={[styles.skeletonBox, style, { opacity }]} />;
}

export function NearestWorkshop() {
    const navigation = useNavigation();
    const mapRef = useRef(null);

    const [userLocation, setUserLocation] = useState(null);
    const [workshops, setWorkshops] = useState([]);
    const [distance, setDistance] = useState(5000);
    const [showDistancePicker, setShowDistancePicker] = useState(false);

    const [updatingLocation, setUpdatingLocation] = useState(false);
    const [error, setError] = useState(null);

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

            setWorkshops(Array.isArray(data) ? data : []);
        } catch (err) {
            const message = err.response?.data?.message;
            if (message === 'User location is not set yet') {
                setWorkshops([]);
            } else {
                setError(message || 'Gagal mengambil workshop terdekat');
            }
        } finally {
            setUpdatingLocation(false);
        }
    }, [distance]);

    const loadDeviceLocationForMap = useCallback(async () => {
        const coords = await getDeviceLocation();
        if (coords) setUserLocation(coords);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadDeviceLocationForMap();
            fetchNearestWorkshops(distance);
        }, [fetchNearestWorkshops, loadDeviceLocationForMap, distance])
    );

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

    const formatDistance = (meters) => {
        if (meters == null) return null;
        if (meters < 1000) return `${Math.round(meters)} m`;
        return `${(meters / 1000).toFixed(1)} km`;
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
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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

            {error && (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

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
                            pinColor="#0F2C59" // Warna lokasi user tetap Navy
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
                                    description={`${formatDistance(item.dist?.calculated) || ''}${!item.is_active ? ' (Tutup)' : ''}`}
                                    // PERUBAHAN DISINI: Buka (is_active: true) -> biru, Tutup -> merah
                                    pinColor={item.is_active ? 'green' : 'red'}
                                    onCalloutPress={() => {
                                        if (item.is_active) {
                                            navigation.navigate('WorkshopDetail', {
                                                workshopId: String(item._id),
                                                workshop: item,
                                            });
                                        }
                                    }}
                                />
                            ) : null
                        )}
                    </MapView>
                ) : (
                    <SkeletonBox style={styles.mapSkeleton} />
                )}
            </View>

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
        backgroundColor: '#F0F2F5',
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
        color: '#0F2C59',
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
    errorBanner: {
        backgroundColor: '#FED7D7',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 20,
        marginBottom: 8,
        borderRadius: 8,
    },
    errorText: {
        fontSize: 12,
        color: '#E53E3E',
        textAlign: 'center',
        fontWeight: '500',
    },
    mapWrapper: {
        flex: 1,
        width: '100%',
        backgroundColor: '#E2E8F0',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    mapSkeleton: {
        width: '100%',
        height: '100%',
        borderRadius: 0,
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
    skeletonBox: {
        backgroundColor: '#E2E8F0',
    },
});