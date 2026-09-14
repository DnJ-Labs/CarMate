import { useState, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import baseUrl from '../../constant/baseUrl';

const LIMIT = 10;
const TAB_BAR_HEIGHT = 40; // samakan dengan height di MainNavigator (40 + insets.bottom)

export function Workshop() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const [workshops, setWorkshops] = useState([]);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchWorkshops = useCallback(async (pageToFetch = 1, isRefresh = false) => {
        try {
            setError(null);
            const token = await SecureStore.getItemAsync('access_token');

            if (!token) {
                setError('Sesi habis, silakan login ulang');
                return;
            }

            const { data } = await axios.get(`${baseUrl}/api/workshop`, {
                params: { page: pageToFetch, limit: LIMIT },
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setWorkshops(data.data ?? []);
            setLastPage(data.meta?.lastPage ?? 1);
            setPage(pageToFetch);
        } catch (err) {
            setError(
                err.response?.data?.message || 'Gagal mengambil data workshop'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchWorkshops(1);
        }, [fetchWorkshops])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchWorkshops(page, true);
    };

    const goToPrevPage = () => {
        if (page <= 1 || loading) return;
        setLoading(true);
        fetchWorkshops(page - 1);
    };

    const goToNextPage = () => {
        if (page >= lastPage || loading) return;
        setLoading(true);
        fetchWorkshops(page + 1);
    };

    const getTodayHours = (operationalHours) => {
        if (!operationalHours?.length) return null;
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = days[new Date().getDay()];
        const todaySchedule = operationalHours.find((h) => h.day === today);
        if (!todaySchedule) return 'Tutup hari ini';
        return `${todaySchedule.open} - ${todaySchedule.close}`;
    };

    const renderWorkshopCard = ({ item }) => (
        <TouchableOpacity style={styles.card} activeOpacity={0.7}>
            <View style={styles.cardIconWrapper}>
                <Ionicons name="construct-outline" size={28} color="#111" />
            </View>
            <View style={styles.cardInfo}>
                <View style={styles.cardNameRow}>
                    <Text style={styles.cardName}>{item.name}</Text>
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
                {getTodayHours(item.operational_hours) && (
                    <Text style={styles.cardHours}>
                        {getTodayHours(item.operational_hours)}
                    </Text>
                )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#c4c4c4" />
        </TouchableOpacity>
    );

    const renderPagination = () => {
        if (workshops.length === 0) return null;
        return (
            <View
                style={[
                    styles.pagination,
                    { paddingBottom: 12 + TAB_BAR_HEIGHT + insets.bottom },
                ]}
            >
                <TouchableOpacity
                    style={[
                        styles.pageButton,
                        (page <= 1 || loading) && styles.pageButtonDisabled,
                    ]}
                    onPress={goToPrevPage}
                    disabled={page <= 1 || loading}
                >
                    <Ionicons
                        name="chevron-back"
                        size={16}
                        color={page <= 1 || loading ? '#c4c4c4' : '#111'}
                    />
                    <Text
                        style={[
                            styles.pageButtonText,
                            (page <= 1 || loading) && styles.pageButtonTextDisabled,
                        ]}
                    >
                        Prev
                    </Text>
                </TouchableOpacity>

                <Text style={styles.pageIndicator}>
                    Halaman {page} dari {lastPage}
                </Text>

                <TouchableOpacity
                    style={[
                        styles.pageButton,
                        (page >= lastPage || loading) && styles.pageButtonDisabled,
                    ]}
                    onPress={goToNextPage}
                    disabled={page >= lastPage || loading}
                >
                    <Text
                        style={[
                            styles.pageButtonText,
                            (page >= lastPage || loading) && styles.pageButtonTextDisabled,
                        ]}
                    >
                        Next
                    </Text>
                    <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={page >= lastPage || loading ? '#c4c4c4' : '#111'}
                    />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Workshop</Text>
                <TouchableOpacity
                    style={styles.nearestButton}
                    onPress={() => navigation.navigate('NearestWorkshop')}
                >
                    <Ionicons name="navigate-outline" size={16} color="#5b5be0" />
                    <Text style={styles.nearestButtonText}>Terdekat</Text>
                </TouchableOpacity>
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
            ) : workshops.length === 0 ? (
                <View style={styles.centerContent}>
                    <Ionicons name="construct-outline" size={40} color="#c4c4c4" />
                    <Text style={styles.emptyText}>Belum ada workshop</Text>
                </View>
            ) : (
                <>
                    <FlatList
                        data={workshops}
                        keyExtractor={(item) => String(item._id)}
                        renderItem={renderWorkshopCard}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                    />
                    {renderPagination()}
                </>
            )}
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
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111',
    },
    nearestButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: '#eef0ff',
    },
    nearestButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#5b5be0',
    },
    listContent: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 12,
        gap: 12,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e5e5e5',
        gap: 12,
    },
    cardIconWrapper: {
        width: 48,
        height: 48,
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
    cardHours: {
        fontSize: 12,
        color: '#5b5be0',
        marginTop: 2,
        fontWeight: '500',
    },
    centerContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        gap: 8,
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
    pagination: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e5e5',
        backgroundColor: '#fff',
    },
    pageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e5e5',
    },
    pageButtonDisabled: {
        backgroundColor: '#f7f7f7',
    },
    pageButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111',
    },
    pageButtonTextDisabled: {
        color: '#c4c4c4',
    },
    pageIndicator: {
        fontSize: 13,
        color: '#8b8b8b',
    },
});