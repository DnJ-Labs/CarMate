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
    Image,
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
            <View style={styles.cardImageWrapper}>
                {item.vehicles_img ? (
                    <Image
                        source={{ uri: item.vehicles_img }}
                        style={styles.cardImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.cardImagePlaceholder}>
                        <Ionicons name="car-sport" size={28} color="#0F2C59" />
                    </View>
                )}
            </View>

            <View style={styles.cardInfo}>
                {item.brand && (
                    <Text style={styles.cardBrand} numberOfLines={1}>
                        {item.brand.toUpperCase()}
                    </Text>
                )}

                <Text style={styles.cardModel} numberOfLines={1}>
                    {item.model}
                </Text>

                {item.plate_number && (
                    <View style={styles.plateTag}>
                        <Ionicons name="card" size={12} color="#0F2C59" />
                        <Text style={styles.cardPlate}>{item.plate_number}</Text>
                    </View>
                )}
            </View>

            <View style={styles.actionWrapper}>
                <Ionicons name="chevron-forward" size={18} color="#0F2C59" />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={10}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <Ionicons name="chevron-back-outline" size={22} color="#0F2C59" />
                </TouchableOpacity>

                <Text style={styles.title}>Pilih Kendaraan</Text>

                <View style={styles.headerPlaceholder} />
            </View>

            {/* Search Input */}
            <View style={styles.searchWrapper}>
                <Ionicons name="search-outline" size={18} color="#64748B" />

                <TextInput
                    style={styles.searchInput}
                    placeholder="Cari model kendaraan..."
                    placeholderTextColor="#A0AEC0"
                    value={search}
                    onChangeText={setSearch}
                    autoCapitalize="none"
                    returnKeyType="search"
                />

                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle-outline" size={18} color="#A0AEC0" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Content List & State Handling */}
            {loading && !refreshing ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#0F2C59" />
                </View>
            ) : error ? (
                <View style={styles.centerContent}>
                    <Ionicons name="alert-circle-outline" size={44} color="#E53E3E" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : vehicles.length === 0 ? (
                <View style={styles.centerContent}>
                    <Ionicons name="car-outline" size={48} color="#A0AEC0" />
                    <Text style={styles.emptyText}>
                        {search ? 'Kendaraan tidak ditemukan' : 'Belum ada kendaraan'}
                    </Text>

                    {!search && (
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => navigation.navigate('AddVehicle')}
                            activeOpacity={0.8}
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
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F2F5', // Light Cool Grey
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
        color: '#0F2C59', // Royal Navy Blue
        letterSpacing: -0.3,
    },
    headerPlaceholder: {
        width: 40,
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginHorizontal: 20,
        marginTop: 10,
        marginBottom: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
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
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#1A202C',
        fontWeight: '500',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 12,
        gap: 14,
    },

    /* Card Styles */
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F2C59',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    cardImageWrapper: {
        width: 68,
        height: 68,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#EDF2F7',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    cardImagePlaceholder: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F4F8',
    },
    cardInfo: {
        flex: 1,
        marginLeft: 14,
        justifyContent: 'center',
    },
    cardBrand: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 0.8,
        marginBottom: 2,
    },
    cardModel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A202C',
        letterSpacing: -0.2,
    },
    plateTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 6,
        alignSelf: 'flex-start',
        backgroundColor: '#EBF3FE',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderWidth: 0.5,
        borderColor: '#CBD5E1',
    },
    cardPlate: {
        fontSize: 11,
        fontWeight: '700',
        color: '#0F2C59',
        letterSpacing: 0.5,
    },
    actionWrapper: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F0F4F8',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },

    /* State Content Styles */
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
});