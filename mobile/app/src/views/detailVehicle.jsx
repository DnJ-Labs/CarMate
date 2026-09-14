import { useCallback, useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import baseUrl from '../../constant/baseUrl';

export function DetailVehicle() {
    const navigation = useNavigation();
    const route = useRoute();

    const { id } = route.params;

    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

    const fetchVehicle = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const token = await SecureStore.getItemAsync('access_token');

            if (!token) {
                navigation.navigate('Login');
                return;
            }

            const { data } = await axios.get(
                `${baseUrl}/api/vehicles/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setVehicle(data);
        } catch (err) {
            if (err.response?.status === 401) {
                await SecureStore.deleteItemAsync('access_token');
                navigation.navigate('Login');
                return;
            }

            setError(
                err.response?.data?.message ||
                'Gagal mengambil detail kendaraan'
            );
        } finally {
            setLoading(false);
        }
    }, [id, navigation]);

    useEffect(() => {
        fetchVehicle();
    }, [fetchVehicle]);

    const deleteVehicle = async () => {
        try {
            setDeleting(true);

            const token = await SecureStore.getItemAsync('access_token');

            if (!token) {
                navigation.navigate('Login');
                return;
            }

            await axios.delete(
                `${baseUrl}/api/vehicles/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setDeleteModalVisible(false);

            navigation.goBack();
        } catch (err) {
            if (err.response?.status === 401) {
                await SecureStore.deleteItemAsync('access_token');
                setDeleteModalVisible(false);
                navigation.navigate('Login');
                return;
            }

            setDeleteModalVisible(false);

            Alert.alert(
                'Error',
                err.response?.data?.message ||
                'Failed to delete vehicle'
            );
        } finally {
            setDeleting(false);
        }
    };

    const handleEdit = () => {
        navigation.navigate('EditVehicle', {
            id,
            vehicle,
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContent}>
                    <ActivityIndicator
                        size="large"
                        color="#111"
                    />
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={24}
                            color="#111"
                        />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>
                        Detail Vehicle
                    </Text>

                    <View style={styles.headerPlaceholder} />
                </View>

                <View style={styles.centerContent}>
                    <Ionicons
                        name="alert-circle-outline"
                        size={42}
                        color="#d13c3c"
                    />

                    <Text style={styles.errorText}>
                        {error}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons
                        name="arrow-back"
                        size={24}
                        color="#111"
                    />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    Detail Vehicle
                </Text>

                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={handleEdit}
                        style={styles.headerButton}
                    >
                        <Ionicons
                            name="create-outline"
                            size={23}
                            color="#111"
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() =>
                            setDeleteModalVisible(true)
                        }
                        style={styles.headerButton}
                        disabled={deleting}
                    >
                        <Ionicons
                            name="trash-outline"
                            size={23}
                            color="#d13c3c"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.vehicleIcon}>
                    <Ionicons
                        name="car-sport-outline"
                        size={60}
                        color="#111"
                    />
                </View>

                <View style={styles.detailContainer}>
                    <Text style={styles.label}>
                        Brand
                    </Text>

                    <Text style={styles.value}>
                        {vehicle?.brand || '-'}
                    </Text>

                    <Text style={styles.label}>
                        Model
                    </Text>

                    <Text style={styles.value}>
                        {vehicle?.model || '-'}
                    </Text>

                    <Text style={styles.label}>
                        Plate Number
                    </Text>

                    <Text style={styles.value}>
                        {vehicle?.plate_number || '-'}
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.bookingButton}
                    onPress={() => { }}
                >
                    <Ionicons
                        name="calendar-outline"
                        size={20}
                        color="#fff"
                    />

                    <Text style={styles.bookingButtonText}>
                        Add Booking
                    </Text>
                </TouchableOpacity>
            </View>

            <Modal
                visible={deleteModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    if (!deleting) {
                        setDeleteModalVisible(false);
                    }
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.deleteIcon}>
                            <Ionicons
                                name="trash-outline"
                                size={28}
                                color="#d13c3c"
                            />
                        </View>

                        <Text style={styles.modalTitle}>
                            Delete Vehicle?
                        </Text>

                        <Text style={styles.modalMessage}>
                            Are you sure you want to delete this
                            vehicle? This action cannot be undone.
                        </Text>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() =>
                                    setDeleteModalVisible(false)
                                }
                                disabled={deleting}
                            >
                                <Text style={styles.cancelButtonText}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={deleteVehicle}
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#fff"
                                    />
                                ) : (
                                    <Text
                                        style={styles.deleteButtonText}
                                    >
                                        Delete
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
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
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
    },

    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
    },

    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },

    headerButton: {
        padding: 2,
    },

    headerPlaceholder: {
        width: 24,
    },

    content: {
        padding: 24,
    },

    vehicleIcon: {
        width: 120,
        height: 120,
        borderRadius: 20,
        backgroundColor: '#f2f2f2',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 32,
    },

    detailContainer: {
        gap: 4,
    },

    label: {
        fontSize: 12,
        color: '#8b8b8b',
        marginTop: 16,
    },

    value: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111',
    },

    bookingButton: {
        marginTop: 32,
        backgroundColor: '#111',
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },

    bookingButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
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

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },

    modalContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
    },

    deleteIcon: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#fff0f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },

    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111',
        marginBottom: 8,
    },

    modalMessage: {
        fontSize: 14,
        lineHeight: 21,
        color: '#777',
        textAlign: 'center',
        marginBottom: 24,
    },

    modalActions: {
        flexDirection: 'row',
        width: '100%',
        gap: 10,
    },

    cancelButton: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: '#f2f2f2',
        alignItems: 'center',
        justifyContent: 'center',
    },

    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111',
    },

    deleteButton: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: '#d13c3c',
        alignItems: 'center',
        justifyContent: 'center',
    },

    deleteButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
});