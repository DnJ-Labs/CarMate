import { useCallback, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    Alert,
    Image,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
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

    useFocusEffect(
        useCallback(() => {
            fetchVehicle();
        }, [fetchVehicle])
    );

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
                        color="#0F2C59"
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
                        style={styles.backButton}
                    >
                        <Ionicons
                            name="arrow-back-outline"
                            size={20}
                            color="#0F2C59"
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
                        size={48}
                        color="#E53E3E"
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
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name="arrow-back-outline"
                        size={20}
                        color="#0F2C59"
                    />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    Detail Vehicle
                </Text>

                <View style={styles.headerPlaceholder} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Visual Image / Placeholder Container */}
                <View style={styles.imageCard}>
                    {vehicle?.vehicles_img ? (
                        <Image
                            source={{ uri: vehicle.vehicles_img }}
                            style={styles.vehicleImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.placeholderImage}>
                            <Ionicons
                                name="car-outline"
                                size={64}
                                color="#A0AEC0"
                            />
                        </View>
                    )}
                </View>

                {/* Detail Information Card */}
                <View style={styles.infoCard}>
                    <Text style={styles.cardHeaderTitle}>Spesifikasi Kendaraan</Text>

                    <View style={styles.infoRow}>
                        <View style={styles.infoIconWrapper}>
                            <Ionicons name="pricetag-outline" size={18} color="#0F2C59" />
                        </View>
                        <View style={styles.infoTextWrapper}>
                            <Text style={styles.label}>Brand</Text>
                            <Text style={styles.value}>{vehicle?.brand || '-'}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <View style={styles.infoIconWrapper}>
                            <Ionicons name="car-sport-outline" size={18} color="#0F2C59" />
                        </View>
                        <View style={styles.infoTextWrapper}>
                            <Text style={styles.label}>Model</Text>
                            <Text style={styles.value}>{vehicle?.model || '-'}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <View style={styles.infoIconWrapper}>
                            <Ionicons name="card-outline" size={18} color="#0F2C59" />
                        </View>
                        <View style={styles.infoTextWrapper}>
                            <Text style={styles.label}>Plate Number</Text>
                            <Text style={styles.value}>{vehicle?.plate_number || '-'}</Text>
                        </View>
                    </View>
                </View>

                {/* Edit & Delete Actions */}
                <View style={styles.editDeleteRow}>
                    <TouchableOpacity
                        onPress={handleEdit}
                        style={styles.editButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="create-outline"
                            size={18}
                            color="#0F2C59"
                        />
                        <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setDeleteModalVisible(true)}
                        style={styles.deleteOutlineButton}
                        disabled={deleting}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="trash-outline"
                            size={18}
                            color="#E53E3E"
                        />
                        <Text style={styles.deleteOutlineButtonText}>Delete</Text>
                    </TouchableOpacity>
                </View>

                {/* Book Action Button */}
                <TouchableOpacity
                    style={styles.bookButton}
                    activeOpacity={0.8}
                    onPress={() =>
                        navigation.navigate("SelectWorkshop", {
                            vehicleId: String(vehicle.id ?? vehicle._id),
                        })
                    }
                >
                    <Text style={styles.bookButtonText}>Book Appointment</Text>
                    <Ionicons name="chevron-forward-outline" size={18} color="#FFFFFF" />
                </TouchableOpacity>
            </ScrollView>

            {/* Delete Modal */}
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
                                color="#E53E3E"
                            />
                        </View>

                        <Text style={styles.modalTitle}>
                            Delete Vehicle?
                        </Text>

                        <Text style={styles.modalMessage}>
                            Are you sure you want to delete this vehicle? This action cannot be undone.
                        </Text>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setDeleteModalVisible(false)}
                                disabled={deleting}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelButtonText}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={deleteVehicle}
                                disabled={deleting}
                                activeOpacity={0.8}
                            >
                                {deleting ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#FFFFFF"
                                    />
                                ) : (
                                    <Text style={styles.deleteButtonText}>
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
        backgroundColor: '#F0F2F5', // Soft Light Cool Grey
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
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#A3B1C6',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },

    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F2C59', // Royal Navy Blue
    },

    headerPlaceholder: {
        width: 40,
    },

    content: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 28,
        gap: 20,
    },

    /* Image Box */
    imageCard: {
        width: '100%',
        height: 200,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
    },

    vehicleImage: {
        width: '100%',
        height: '100%',
    },

    placeholderImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#EDF2F7',
    },

    /* Card Details */
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
    },

    cardHeaderTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F2C59',
        marginBottom: 16,
    },

    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 4,
    },

    infoIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#F0F4F8',
        alignItems: 'center',
        justifyContent: 'center',
    },

    infoTextWrapper: {
        flex: 1,
    },

    label: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748B',
    },

    value: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1A202C',
        marginTop: 2,
    },

    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 10,
    },

    /* Edit & Delete Row (below info card) */
    editDeleteRow: {
        flexDirection: 'row',
        gap: 12,
    },

    editButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#0F2C59',
    },

    editButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F2C59',
    },

    deleteOutlineButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#E53E3E',
    },

    deleteOutlineButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#E53E3E',
    },

    /* Book Button */
    bookButton: {
        backgroundColor: '#0F2C59',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        shadowColor: '#0F2C59',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },

    bookButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
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

    /* Modal Styling */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },

    modalContainer: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },

    deleteIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FFF5F5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A202C',
        marginBottom: 8,
    },

    modalMessage: {
        fontSize: 13,
        lineHeight: 20,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
    },

    modalActions: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },

    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#EDF2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },

    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A5568',
    },

    deleteButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#E53E3E',
        alignItems: 'center',
        justifyContent: 'center',
    },

    deleteButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});