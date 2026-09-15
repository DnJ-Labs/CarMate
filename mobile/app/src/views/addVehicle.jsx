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
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import baseUrl from '../../constant/baseUrl';

export function AddVehicle({ navigation }) {
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [plateNumber, setPlateNumber] = useState('');
    const [imageUri, setImageUri] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const pickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            setError('Izin akses galeri dibutuhkan');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const uploadImage = async (token) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', {
                uri: imageUri,
                name: `vehicle-${Date.now()}.jpg`,
                type: 'image/jpeg',
            });

            const { data } = await axios.post(
                `${baseUrl}/api/upload`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            return data.url;
        } finally {
            setUploading(false);
        }
    };

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

            let vehiclesImg = '';
            if (imageUri) {
                vehiclesImg = await uploadImage(token);
            }

            await axios.post(
                `${baseUrl}/api/vehicles`,
                {
                    brand: brand.trim(),
                    model: model.trim(),
                    plate_number: plateNumber.trim(),
                    vehicles_img: vehiclesImg,
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

                <Text style={styles.label}>FOTO KENDARAAN (OPSIONAL)</Text>
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.previewImage} />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="camera-outline" size={28} color="#8b8b8b" />
                            <Text style={styles.imagePlaceholderText}>Pilih Foto</Text>
                        </View>
                    )}
                </TouchableOpacity>

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

                <TouchableOpacity
                    style={[styles.submitButton, (loading || uploading) && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading || uploading}
                >
                    {loading || uploading ? (
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
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
    },
    backButton: { padding: 6, width: 34 },
    title: { fontSize: 18, fontWeight: '700', color: '#111' },
    content: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
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
    errorText: { color: '#d13c3c', fontSize: 13, flex: 1 },
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
    imagePicker: {
        borderWidth: 1,
        borderColor: '#e5e5e5',
        borderRadius: 12,
        overflow: 'hidden',
    },
    imagePlaceholder: {
        height: 140,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#f9f9f9',
    },
    imagePlaceholderText: { fontSize: 13, color: '#8b8b8b' },
    previewImage: { width: '100%', height: 180 },
    submitButton: {
        backgroundColor: '#5b5be0',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 28,
    },
    submitButtonDisabled: { opacity: 0.6 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});