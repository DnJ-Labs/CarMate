import { useState, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    FlatList,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import baseUrl from '../../constant/baseUrl';

const getId = (item) => String(item?._id ?? item?.id ?? '');

export function SelectVehicle() {
    const navigation = useNavigation();
    const route = useRoute();
    const insets = useSafeAreaInsets();

    const { workshopId, workshop } = route.params ?? {};

    const [vehicles, setVehicles] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchVehicles = useCallback(async (searchTerm = '') => {
        try {
            setError(null);

            const token = await SecureStore.getItemAsync('access_token');
            if (!token) {
                setError('Sesi habis, silakan login ulang');
                return;
            }

            const { data } = await axios.get(`${baseUrl}/api/vehicles`, {
                params: searchTerm ? { model: searchTerm } : {},
                headers: { Authorization: `Bearer ${token}` },
            });

            setVehicles(Array.isArray(data) ? data : data?.data ?? []);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mengambil data kendaraan');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchVehicles(search);
        }, [fetchVehicles, search])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchVehicles(search);
    };

    const handleSelect = (vehicle) => {
        navigation.navigate('Booking', {
            vehicleId: getId(vehicle),
            workshopId,
            workshop,
        });
    };

    const renderVehicleCard = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => handleSelect(item)}
        >
            <View style={styles.cardIconWrapper}>
                <Ionicons name="car-sport-outline" size={28} color="#111" />
            </View>

            <View style={styles.cardInfo}>
                <Text style={styles.cardModel}>{item.model}</Text>

                {item.brand && <Text style={styles.cardBrand}>{item.brand}</Text>}

                {item.plate_number && (
                    <Text style={styles.cardPlate}>{item.plate_number}</Text>
                )}
            </View>

            <Ionicons name="chevron-forward" size={20} color="#c4c4c4" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
                    <Ionicons name="chevron-back" size={24} color="#111" />
                </TouchableOpacity>

                <Text style={styles.title}>Pilih Kendaraan</Text>

                <View style={{ width: 24 }} />
            </View>

            <View style={styles.searchWrapper}>
                <Ionicons name="search-outline" size={18} color="#8b8b8b" />

                <TextInput
                    style={styles.searchInput}
                    placeholder="Cari model kendaraan..."
                    placeholderTextColor="#8b8b8b"
                    value={search}
                    onChangeText={setSearch}
                    autoCapitalize="none"
                    returnKeyType="search"
                />

                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={18} color="#c4c4c4" />
                    </TouchableOpacity>
                )}
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#111" />
                </View>
            ) : error ? (
                <View style={styles.centerContent}>
                    <Ionicons name="alert-circle-outline" size={40} color="#d13c3c" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : vehicles.length === 0 ? (
                <View style={styles.centerContent}>
                    <Ionicons name="car-outline" size={40} color="#c4c4c4" />
                    <Text style={styles.emptyText}>
                        {search ? 'Kendaraan tidak ditemukan' : 'Belum ada kendaraan'}
                    </Text>

                    {!search && (
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => navigation.navigate('AddVehicle')}
                        >
                            <Text style={styles.primaryButtonText}>Tambah Kendaraan</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <FlatList
                    data={vehicles}
                    keyExtractor={(item) => getId(item)}
                    renderItem={renderVehicleCard}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingBottom: 16 + insets.bottom },
                    ]}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            )}
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
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginHorizontal: 20,
        marginTop: 14,
        marginBottom: 4,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e5e5',
    },
    searchInput: { flex: 1, fontSize: 14, color: '#111' },
    listContent: { paddingHorizontal: 20, paddingTop: 12, gap: 12 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e5e5e5',
    },
    cardIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#f2f2f2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardInfo: { flex: 1 },
    cardModel: { fontSize: 15, fontWeight: '600', color: '#111' },
    cardBrand: { fontSize: 13, color: '#8b8b8b', marginTop: 2 },
    cardPlate: { fontSize: 12, color: '#5b5be0', marginTop: 2, fontWeight: '600' },
    centerContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        gap: 10,
    },
    errorText: { fontSize: 14, color: '#d13c3c', textAlign: 'center' },
    emptyText: { fontSize: 14, color: '#8b8b8b', textAlign: 'center' },
    primaryButton: {
        backgroundColor: '#111',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginTop: 4,
    },
    primaryButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});