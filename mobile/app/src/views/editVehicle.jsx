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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import baseUrl from '../../constant/baseUrl';

export function EditVehicle() {
    const navigation = useNavigation();
    const route = useRoute();
    const insets = useSafeAreaInsets();

    const { id } = route.params ?? {};
    const initialVehicle = route.params?.vehicle ?? {};

    const [brand, setBrand] = useState(initialVehicle.brand || '');
    const [model, setModel] = useState(initialVehicle.model || '');
    const [plateNumber, setPlateNumber] = useState(initialVehicle.plate_number || '');
    const [vehiclesImg, setVehiclesImg] = useState(initialVehicle.vehicles_img || '');

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
        const nextErrors = {};

        if (!brand.trim()) nextErrors.brand = 'Merek wajib diisi';
        if (!model.trim()) nextErrors.model = 'Model wajib diisi';
        if (!plateNumber.trim()) nextErrors.plateNumber = 'Nomor plat wajib diisi';

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSave = async () => {
        if (!id) {
            Alert.alert('Error', 'ID kendaraan tidak ditemukan');
            return;
        }

        if (!validate()) return;

        try {
            setSubmitting(true);

            const token = await SecureStore.getItemAsync('access_token');
            if (!token) {
                Alert.alert('Error', 'Sesi habis, silakan login ulang');
                return;
            }

            const payload = {
                brand: brand.trim(),
                model: model.trim(),
                plate_number: plateNumber.trim(),
                vehicles_img: vehiclesImg.trim(),
            };

            const { data } = await axios.put(
                `${baseUrl}/api/vehicles/${id}`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            Alert.alert('Berhasil', 'Data kendaraan telah diperbarui.', [
                {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                },
            ]);
        } catch (err) {
            console.log('UPDATE VEHICLE ERROR:', err.response?.data || err.message);

            Alert.alert(
                'Gagal',
                err.response?.data?.message || 'Gagal memperbarui data kendaraan.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    const renderField = (label, value, onChangeText, options = {}) => (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>

            <View style={[styles.inputWrapper, errors[options.key] && styles.inputWrapperError]}>
                <TextInput
                    value={value}
                    onChangeText={(text) => {
                        onChangeText(text);
                        if (errors[options.key]) {
                            setErrors((prev) => ({ ...prev, [options.key]: null }));
                        }
                    }}
                    placeholder={options.placeholder}
                    placeholderTextColor="#8b8b8b"
                    style={styles.input}
                    autoCapitalize={options.autoCapitalize || 'sentences'}
                />
            </View>

            {errors[options.key] && (
                <Text style={styles.errorText}>{errors[options.key]}</Text>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
                    <Ionicons name="chevron-back" size={24} color="#111" />
                </TouchableOpacity>

                <Text style={styles.title}>Edit Vehicle</Text>

                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    { paddingBottom: 24 + insets.bottom },
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.vehicleIcon}>
                    <Ionicons name="car-sport-outline" size={48} color="#111" />
                </View>

                {renderField('Brand', brand, setBrand, {
                    key: 'brand',
                    placeholder: 'Contoh: Honda',
                })}

                {renderField('Model', model, setModel, {
                    key: 'model',
                    placeholder: 'Contoh: Brio',
                })}

                {renderField('Plate Number', plateNumber, setPlateNumber, {
                    key: 'plateNumber',
                    placeholder: 'Contoh: B 1234 XYZ',
                    autoCapitalize: 'characters',
                })}

                {renderField('Vehicle Image URL', vehiclesImg, setVehiclesImg, {
                    key: 'vehiclesImg',
                    placeholder: 'https://... (opsional)',
                    autoCapitalize: 'none',
                })}

                <TouchableOpacity
                    style={[styles.saveButton, submitting && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={submitting}
                    activeOpacity={0.85}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveText}>Simpan Perubahan</Text>
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
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
    },
    title: { fontSize: 17, fontWeight: '700', color: '#111' },
    content: { paddingHorizontal: 20, paddingTop: 16 },
    vehicleIcon: {
        width: 96,
        height: 96,
        borderRadius: 18,
        backgroundColor: '#f2f2f2',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 24,
    },
    field: { marginBottom: 18 },
    label: { fontSize: 13, fontWeight: '600', color: '#111', marginBottom: 8 },
    inputWrapper: {
        borderWidth: 1,
        borderColor: '#e5e5e5',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    inputWrapperError: { borderColor: '#d13c3c' },
    input: { fontSize: 14, color: '#111', padding: 0 },
    errorText: { fontSize: 12, color: '#d13c3c', marginTop: 6 },
    saveButton: {
        backgroundColor: '#111',
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 8,
    },
    saveButtonDisabled: { opacity: 0.6 },
    saveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});