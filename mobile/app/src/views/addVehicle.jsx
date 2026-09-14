import { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import baseUrl from '../../constant/baseUrl';

export function AddVehicle({ navigation }) {
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [plateNumber, setPlateNumber] = useState('');
    const [vehiclesImg, setVehiclesImg] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async () => {
        if (!brand.trim() || !model.trim() || !plateNumber.trim()) {
            setError('Brand, model, dan plat nomor wajib diisi');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = await SecureStore.getItemAsync('access_token');

            if (!token) {
                setError('Sesi habis, silakan login ulang');
                return;
            }

            await axios.post(
                `${baseUrl}/api/vehicles`,
                {
                    brand: brand.trim(),
                    model: model.trim(),
                    plate_number: plateNumber.trim(),
                    vehicles_img: vehiclesImg.trim() || undefined,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            Alert.alert('Berhasil', 'Kendaraan berhasil ditambahkan');
            navigation.goBack();
        } catch (err) {
            if (err.response?.status === 401) {
                setError('Sesi habis, silakan login ulang');
                return;
            }
            setError(
                err.response?.data?.message || 'Gagal menambahkan kendaraan'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={22} color="#111" />
                </TouchableOpacity>
                <Text style={styles.title}>Tambah Kendaraan</Text>
                <View style={{ width: 34 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {error && (
                    <View style={styles.errorBox}>
                        <Ionicons name="alert-circle-outline" size={18} color="#d13c3c" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <Text style={styles.label}>BRAND</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Contoh: Toyota"
                    placeholderTextColor="#8b8b8b"
                    value={brand}
                    onChangeText={setBrand}
                />

                <Text style={styles.label}>MODEL</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Contoh: Avanza"
                    placeholderTextColor="#8b8b8b"
                    value={model}
                    onChangeText={setModel}
                />

                <Text style={styles.label}>PLAT NOMOR</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Contoh: B 1234 ABC"
                    placeholderTextColor="#8b8b8b"
                    value={plateNumber}
                    onChangeText={setPlateNumber}
                    autoCapitalize="characters"
                />

                <Text style={styles.label}>URL FOTO (OPSIONAL)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="https://..."
                    placeholderTextColor="#8b8b8b"
                    value={vehiclesImg}
                    onChangeText={setVehiclesImg}
                    autoCapitalize="none"
                />

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.submitText}>Simpan Kendaraan</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
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
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
    },
    backButton: {
        padding: 6,
        width: 34,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fdecec',
        borderWidth: 1,
        borderColor: '#f5c2c2',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    errorText: {
        color: '#d13c3c',
        fontSize: 13,
        flex: 1,
    },
    label: {
        fontSize: 11,
        color: '#8b8b8b',
        fontWeight: '600',
        letterSpacing: 0.5,
        marginBottom: 6,
        marginTop: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e5e5e5',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: '#111',
    },
    submitButton: {
        backgroundColor: '#5b5be0',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 28,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
});