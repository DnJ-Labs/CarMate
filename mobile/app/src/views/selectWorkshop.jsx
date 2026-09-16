import { useState, useCallback, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    Image,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Modal,
    Pressable,
    Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import axios from 'axios';
import MapView, { Marker, Circle } from 'react-native-maps';
import baseUrl from '../../constant/baseUrl';

const LIMIT = 10;
const TAB_BAR_HEIGHT = 40;
const SKELETON_COUNT = 5;
const SEARCH_DEBOUNCE_MS = 400;

const DISTANCE_OPTIONS = [
    { label: '5 km', value: 5000 },
    { label: '10 km', value: 10000 },
    { label: '20 km', value: 20000 },
];

function getDeltaForDistance(distanceMeters) {
    return Math.max((distanceMeters / 111000) * 2.4, 0.02);
}

/* ---------------------------------------------------------
 * SKELETON LOADING (pulse box)
 * ------------------------------------------------------- */
function SkeletonBox({ style }) {
    const opacity = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [opacity]);

    return <Animated.View style={[styles.skeletonBox, style, { opacity }]} />;
}

function WorkshopCardSkeleton() {
    return (
        <View style={styles.card}>
            <SkeletonBox style={styles.cardImage} />
            <View style={styles.cardInfo}>
                <SkeletonBox style={styles.skeletonLineTitle} />
                <SkeletonBox style={styles.skeletonLineAddress} />
                <SkeletonBox style={styles.skeletonLineHours} />
            </View>
        </View>
    );
}

function WorkshopListSkeleton() {
    return (
        <View style={styles.listContent}>
            {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                <WorkshopCardSkeleton key={index} />
            ))}
        </View>
    );
}

export function SelectWorkshop() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const mapRef = useRef(null);

    const [mode, setMode] = useState('all'); // 'all' | 'nearest'

    /* ---------------- MODE: ALL ---------------- */
    const [workshops, setWorkshops] = useState([]);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const isFetchingRef = useRef(false);
    const isFirstSearchRunRef = useRef(true);
    const searchTimeoutRef = useRef(null);

    /* ---------------- MODE: NEAREST ---------------- */
    const [userLocation, setUserLocation] = useState(null);
    const [nearestWorkshops, setNearestWorkshops] = useState([]);
    const [distance, setDistance] = useState(5000);
    const [showDistancePicker, setShowDistancePicker] = useState(false);
    const [updatingLocation, setUpdatingLocation] = useState(false);
    const [nearestError, setNearestError] = useState(null);

    const getToken = async () => {
        const token = await SecureStore.getItemAsync('access_token');
        if (!token) {
            setError('Session expired, please log in again');
            return null;
        }
        return token;
    };

    const getDeviceLocation = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setNearestError('Location permission denied. Please enable it in settings.');
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

    /* ---------- fetch: all workshops ---------- */
    const fetchWorkshops = useCallback(
        async (pageToFetch = 1, { append = false, searchTerm = '' } = {}) => {
            if (isFetchingRef.current) return;
            isFetchingRef.current = true;

            try {
                setError(null);
                const token = await getToken();
                if (!token) return;

                const { data } = await axios.get(`${baseUrl}/api/workshop`, {
                    params: {
                        page: pageToFetch,
                        limit: LIMIT,
                        ...(searchTerm ? { search: searchTerm } : {}),
                    },
                    headers: { Authorization: `Bearer ${token}` },
                });

                const newWorkshops = data.data ?? [];
                setWorkshops((prev) => (append ? [...prev, ...newWorkshops] : newWorkshops));
                setLastPage(data.meta?.lastPage ?? 1);
                setPage(pageToFetch);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch workshop data');
            } finally {
                setLoading(false);
                setLoadingMore(false);
                setRefreshing(false);
                isFetchingRef.current = false;
            }
        },
        []
    );

    /* ---------- fetch: nearest workshops ---------- */
    const fetchNearestWorkshops = useCallback(async (dist) => {
        try {
            setNearestError(null);
            const token = await SecureStore.getItemAsync('access_token');
            if (!token) {
                setNearestError('Session expired, please log in again');
                return;
            }

            const { data } = await axios.get(`${baseUrl}/api/workshop/nearest`, {
                params: { distance: dist },
                headers: { Authorization: `Bearer ${token}` },
            });

            setNearestWorkshops(Array.isArray(data) ? data : []);
        } catch (err) {
            const message = err.response?.data?.message;
            if (message === 'User location is not set yet') {
                setNearestWorkshops([]);
            } else {
                setNearestError(message || 'Failed to fetch nearest workshops');
            }
        } finally {
            setUpdatingLocation(false);
        }
    }, []);

    const loadDeviceLocationForMap = useCallback(async () => {
        const coords = await getDeviceLocation();
        if (coords) setUserLocation(coords);
    }, []);

    /* ---------------- focus effect ---------------- */
    useFocusEffect(
        useCallback(() => {
            if (mode === 'all') {
                setLoading(true);
                fetchWorkshops(1, { searchTerm: search });
            } else {
                loadDeviceLocationForMap();
                fetchNearestWorkshops(distance);
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [mode])
    );

    /* ---------------- debounce search ---------------- */
    useEffect(() => {
        if (mode !== 'all') return;
        if (isFirstSearchRunRef.current) {
            isFirstSearchRunRef.current = false;
            return;
        }
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            setLoading(true);
            fetchWorkshops(1, { searchTerm: search });
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(searchTimeoutRef.current);
    }, [search, mode, fetchWorkshops]);

    const switchMode = (next) => {
        if (next === mode) return;
        setMode(next);
        setError(null);
        setNearestError(null);
        if (next === 'all') {
            setLoading(true);
            fetchWorkshops(1, { searchTerm: search });
        } else {
            loadDeviceLocationForMap();
            fetchNearestWorkshops(distance);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchWorkshops(1, { searchTerm: search });
    };

    const loadMore = () => {
        if (loading || loadingMore || refreshing) return;
        if (page >= lastPage) return;
        setLoadingMore(true);
        fetchWorkshops(page + 1, { append: true, searchTerm: search });
    };

    const clearSearch = () => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        setSearch('');
        setLoading(true);
        fetchWorkshops(1, { searchTerm: '' });
    };

    /* ---------------- actions: nearest mode ---------------- */
    const handleUpdateLocation = async () => {
        setUpdatingLocation(true);
        setNearestError(null);
        try {
            const coords = await getDeviceLocation();
            if (!coords) {
                setUpdatingLocation(false);
                return;
            }

            const token = await SecureStore.getItemAsync('access_token');
            if (!token) {
                setNearestError('Session expired, please log in again');
                setUpdatingLocation(false);
                return;
            }

            await axios.patch(
                `${baseUrl}/api/user/location`,
                { latitude: coords.latitude, longitude: coords.longitude },
                { headers: { Authorization: `Bearer ${token}` } }
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
            setNearestError(err.response?.data?.message || 'Failed to update location');
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

    /* ---------------- helpers ---------------- */
    const formatDistance = (meters) => {
        if (meters == null) return null;
        if (meters < 1000) return `${Math.round(meters)} m`;
        return `${(meters / 1000).toFixed(1)} km`;
    };

    const getTodayHours = (operationalHours) => {
        if (!operationalHours?.length) return null;
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = days[new Date().getDay()];
        const todaySchedule = operationalHours.find((h) => h.day === today);
        if (!todaySchedule) return 'Closed today';
        return `${todaySchedule.open} - ${todaySchedule.close}`;
    };

    const goToDetail = (workshop) => {
        if (!workshop.is_active) return;
        navigation.navigate('WorkshopDetail', {
            workshopId: String(workshop._id),
            workshop,
        });
    };

    /* ---------------- render card ---------------- */
    const renderWorkshopCard = ({ item }) => (
        <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => goToDetail(item)}>
            {item.workshop_img ? (
                <Image source={{ uri: item.workshop_img }} style={styles.cardImage} resizeMode="cover" />
            ) : (
                <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                    <Ionicons name="construct-outline" size={28} color="#8CA3C7" />
                </View>
            )}

            {!item.is_active && (
                <View style={styles.cardImageOverlay}>
                    <Text style={styles.cardImageOverlayText}>Closed</Text>
                </View>
            )}

            <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>

                {item.address && (
                    <View style={styles.cardMetaRow}>
                        <Ionicons name="location-outline" size={13} color="#94A3B8" />
                        <Text style={styles.cardAddress} numberOfLines={2}>{item.address}</Text>
                    </View>
                )}

                {getTodayHours(item.operational_hours) && (
                    <View style={styles.hoursRow}>
                        <Ionicons name="time-outline" size={13} color="#94A3B8" />
                        <Text style={styles.cardHours}>{getTodayHours(item.operational_hours)}</Text>
                    </View>
                )}
            </View>

            <Ionicons name="chevron-forward-outline" size={18} color="#CBD5E1" style={styles.cardChevron} />
        </TouchableOpacity>
    );

    const renderFooter = () => {
        if (!loadingMore) {
            return <View style={{ height: TAB_BAR_HEIGHT + insets.bottom + 12 }} />;
        }
        return (
            <View style={styles.skeletonFooterLoader}>
                <ActivityIndicator size="small" color="#0F2C59" />
            </View>
        );
    };

    const isSearching = search.trim().length > 0;

    /* ---------------- tab: All ---------------- */
    const renderAllTab = () => (
        <>
            <View style={[styles.searchWrapper, isSearchFocused && styles.searchWrapperFocused]}>
                <Ionicons name="search-outline" size={18} color={isSearchFocused ? '#0F2C59' : '#94A3B8'} />
                <TextInput
                    value={search}
                    onChangeText={setSearch}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    placeholder="Search workshop name..."
                    placeholderTextColor="#94A3B8"
                    style={styles.searchInput}
                    returnKeyType="search"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                {isSearching && (
                    <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="close-circle" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                )}
            </View>

            {loading && !refreshing ? (
                <WorkshopListSkeleton />
            ) : error && workshops.length === 0 ? (
                <View style={styles.centerContent}>
                    <View style={styles.stateIconWrapper}>
                        <Ionicons name="alert-circle-outline" size={32} color="#E53E3E" />
                    </View>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : workshops.length === 0 ? (
                <View style={styles.centerContent}>
                    <View style={styles.stateIconWrapper}>
                        <Ionicons name={isSearching ? 'search-outline' : 'construct-outline'} size={32} color="#A0AEC0" />
                    </View>
                    <Text style={styles.emptyText}>
                        {isSearching ? `No workshops found for "${search}"` : 'No workshops available'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={workshops}
                    keyExtractor={(item) => String(item._id)}
                    renderItem={renderWorkshopCard}
                    contentContainerStyle={[styles.listContent, { paddingBottom: 16 + insets.bottom }]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.4}
                    ListFooterComponent={renderFooter}
                />
            )}
        </>
    );

    /* ---------------- tab: Nearest ---------------- */
    const initialRegion = userLocation
        ? {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: getDeltaForDistance(distance),
            longitudeDelta: getDeltaForDistance(distance),
        }
        : undefined;

    const renderNearestTab = () => (
        <>
            <View style={styles.distanceRow}>
                <TouchableOpacity style={styles.distanceSelector} onPress={() => setShowDistancePicker(true)} activeOpacity={0.7}>
                    <Ionicons name="options-outline" size={14} color="#0F2C59" />
                    <Text style={styles.distanceSelectorText}>
                        Radius {DISTANCE_OPTIONS.find((o) => o.value === distance)?.label}
                    </Text>
                    <Ionicons name="chevron-down-outline" size={14} color="#64748B" />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleUpdateLocation} disabled={updatingLocation} style={styles.updateLocationTextButton} activeOpacity={0.7}>
                    <Text style={styles.updateLocationTextButtonText}>
                        {updatingLocation ? 'Updating...' : 'Update my location'}
                    </Text>
                </TouchableOpacity>
            </View>

            {nearestError && (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{nearestError}</Text>
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
                        <Marker coordinate={userLocation} title="Your Location" pinColor="#0F2C59" />
                        {nearestWorkshops.map((item) =>
                            item.location?.coordinates ? (
                                <Marker
                                    key={String(item._id)}
                                    coordinate={{
                                        latitude: item.location.coordinates[1],
                                        longitude: item.location.coordinates[0],
                                    }}
                                    title={item.name}
                                    description={`${formatDistance(item.dist?.calculated) || ''}${!item.is_active ? ' (Closed)' : ''}`}
                                    pinColor={item.is_active ? 'green' : 'red'}
                                    onCalloutPress={() => goToDetail(item)}
                                />
                            ) : null
                        )}
                    </MapView>
                ) : (
                    <SkeletonBox style={styles.mapSkeleton} />
                )}
            </View>
        </>
    );

    return (
        <SafeAreaView style={styles.container} edges={mode === 'all' ? ['top'] : ['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} style={styles.backButton} activeOpacity={0.7}>
                    <Ionicons name="chevron-back-outline" size={22} color="#0F2C59" />
                </TouchableOpacity>

                <Text style={styles.title}>Workshops</Text>

                {mode === 'nearest' ? (
                    <TouchableOpacity style={styles.updateButton} onPress={handleUpdateLocation} disabled={updatingLocation} activeOpacity={0.8}>
                        {updatingLocation ? (
                            <ActivityIndicator size="small" color="#0F2C59" />
                        ) : (
                            <Ionicons name="locate-outline" size={18} color="#0F2C59" />
                        )}
                    </TouchableOpacity>
                ) : (
                    <View style={styles.headerPlaceholder} />
                )}
            </View>

            {/* Toggle All / Nearest */}
            <View style={styles.modeSwitch}>
                <TouchableOpacity style={[styles.modeButton, mode === 'all' && styles.modeButtonActive]} onPress={() => switchMode('all')} activeOpacity={0.8}>
                    <Ionicons name="list-outline" size={14} color={mode === 'all' ? '#FFFFFF' : '#64748B'} />
                    <Text style={[styles.modeText, mode === 'all' && styles.modeTextActive]}>All</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.modeButton, mode === 'nearest' && styles.modeButtonActive]} onPress={() => switchMode('nearest')} activeOpacity={0.8}>
                    <Ionicons name="navigate-outline" size={14} color={mode === 'nearest' ? '#FFFFFF' : '#64748B'} />
                    <Text style={[styles.modeText, mode === 'nearest' && styles.modeTextActive]}>Nearest</Text>
                </TouchableOpacity>
            </View>

            {mode === 'all' ? renderAllTab() : renderNearestTab()}

            <Modal visible={showDistancePicker} transparent animationType="fade" onRequestClose={() => setShowDistancePicker(false)}>
                <Pressable style={styles.modalBackdrop} onPress={() => setShowDistancePicker(false)}>
                    <View style={styles.modalSheet}>
                        <Text style={styles.modalTitle}>Select Radius</Text>
                        {DISTANCE_OPTIONS.map((opt) => (
                            <TouchableOpacity key={opt.value} style={styles.modalOption} onPress={() => handleSelectDistance(opt.value)} activeOpacity={0.7}>
                                <Text style={[styles.modalOptionText, opt.value === distance && styles.modalOptionTextActive]}>{opt.label}</Text>
                                {opt.value === distance && <Ionicons name="checkmark-outline" size={18} color="#0F2C59" />}
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
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F2C59',
        letterSpacing: -0.3,
    },
    headerPlaceholder: { width: 40 },
    updateButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
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
    modeSwitch: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 12,
    },
    modeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    modeButtonActive: {
        backgroundColor: '#0F2C59',
        borderColor: '#0F2C59',
        shadowColor: '#0F2C59',
        shadowOpacity: 0.2,
    },
    modeText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    modeTextActive: { color: '#FFFFFF' },

    /* ---------- search styles ---------- */
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginHorizontal: 20,
        marginBottom: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    searchWrapperFocused: {
        borderColor: '#0F2C59',
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#1A202C',
        padding: 0,
    },
    listContent: {
        paddingHorizontal: 20,
        gap: 14,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    cardImage: {
        width: 64,
        height: 64,
        borderRadius: 14,
        backgroundColor: '#EEF2F7',
    },
    cardImagePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardImageOverlay: {
        position: 'absolute',
        top: 12,
        left: 12,
        width: 64,
        height: 64,
        borderRadius: 14,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardImageOverlayText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    cardInfo: { flex: 1, gap: 4 },
    cardName: { fontSize: 15, fontWeight: '700', color: '#1A202C' },
    cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    cardAddress: { fontSize: 12, fontWeight: '500', color: '#64748B', flexShrink: 1 },
    hoursRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    cardHours: { fontSize: 12, fontWeight: '600', color: '#0F2C59' },
    cardChevron: { marginLeft: 4 },
    skeletonFooterLoader: {
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    skeletonBox: { backgroundColor: '#E2E8F0', borderRadius: 8 },
    skeletonLineTitle: { height: 14, width: '60%', borderRadius: 6, marginBottom: 8 },
    skeletonLineAddress: { height: 11, width: '85%', borderRadius: 6, marginBottom: 6 },
    skeletonLineHours: { height: 11, width: '40%', borderRadius: 6 },
    centerContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        gap: 12,
        paddingTop: 60,
    },
    stateIconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: { fontSize: 14, color: '#E53E3E', textAlign: 'center', fontWeight: '500' },
    emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center', fontWeight: '500' },

    /* ---------- nearest tab styles ---------- */
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
    distanceSelectorText: { fontSize: 12, fontWeight: '600', color: '#1A202C' },
    updateLocationTextButton: { paddingVertical: 6 },
    updateLocationTextButtonText: { fontSize: 12, fontWeight: '600', color: '#0F2C59' },
    errorBanner: {
        backgroundColor: '#FED7D7',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 20,
        marginBottom: 8,
        borderRadius: 8,
    },
    errorBannerText: { fontSize: 12, color: '#E53E3E', textAlign: 'center', fontWeight: '500' },
    mapWrapper: {
        flex: 1,
        width: '100%',
        backgroundColor: '#E2E8F0',
    },
    map: { width: '100%', height: '100%' },
    mapSkeleton: { width: '100%', height: '100%', borderRadius: 0 },

    /* ---------- modal styles ---------- */
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
    modalOptionText: { fontSize: 15, color: '#1A202C', fontWeight: '500' },
    modalOptionTextActive: { color: '#0F2C59', fontWeight: '700' },
});