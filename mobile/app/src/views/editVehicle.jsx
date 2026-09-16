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
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import baseUrl from '../../constant/baseUrl';

export function EditVehicle() {
    const navigation = useNavigation();
    const route = useRoute();

    const { id } = route.params ?? {};
    const initialVehicle = route.params?.vehicle ?? {};

    const [brand, setBrand] = useState(initialVehicle.brand || '');
    const [model, setModel] = useState(initialVehicle.model || '');
    const [plateNumber, setPlateNumber] = useState(initialVehicle.plate_number || '');
    const [imageUri, setImageUri] = useState(initialVehicle.vehicles_img || null);
    const [imageChanged, setImageChanged] = useState(false);

    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [errors, setErrors] = useState({});

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
            setImageChanged(true);
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

        setError(null);
        if (!validate()) return;

        try {
            setSubmitting(true);

            const token = await SecureStore.getItemAsync('access_token');
            if (!token) {
                setError('Sesi habis, silakan login ulang');
                return;
            }

            let vehiclesImg = initialVehicle.vehicles_img || '';
            if (imageChanged && imageUri) {
                vehiclesImg = await uploadImage(token);
            }

            const payload = {
                brand: brand.trim(),
                model: model.trim(),
                plate_number: plateNumber.trim(),
                vehicles_img: vehiclesImg,
            };

            await axios.put(
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

            if (err.response?.status === 401) {
                setError('Sesi habis, silakan login ulang');
                return;
            }

            setError(
                err.response?.data?.message || 'Gagal memperbarui data kendaraan.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    const renderField = (label, icon, value, onChangeText, options = {}) => (
        <>
            <Text style={styles.label}>{label}</Text>
            <View style={[styles.inputWrapper, errors[options.key] && styles.inputWrapperError]}>
                <Ionicons name={icon} size={17} color="#0F2C59" />
                <TextInput
                    style={styles.input}
                    placeholder={options.placeholder}
                    placeholderTextColor="#A0AEC0"
                    value={value}
                    onChangeText={(text) => {
                        onChangeText(text);
                        if (errors[options.key]) {
                            setErrors((prev) => ({ ...prev, [options.key]: null }));
                        }
                    }}
                    autoCapitalize={options.autoCapitalize || 'sentences'}
                />
            </View>
            {errors[options.key] && (
                <Text style={styles.fieldErrorText}>{errors[options.key]}</Text>
            )}
        </>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back-outline" size={20} color="#0F2C59" />
                </TouchableOpacity>

                <Text style={styles.title}>Edit Kendaraan</Text>

                <View style={styles.headerPlaceholder} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
                style={styles.flex}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {error && (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle-outline" size={18} color="#E53E3E" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    {/* Foto Kendaraan */}
                    <Text style={styles.label}>FOTO KENDARAAN (OPSIONAL)</Text>
                    <TouchableOpacity
                        style={styles.imagePicker}
                        onPress={pickImage}
                        activeOpacity={0.85}
                    >
                        {imageUri ? (
                            <>
                                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                                <View style={styles.imageEditBadge}>
                                    <Ionicons name="camera-outline" size={14} color="#FFFFFF" />
                                    <Text style={styles.imageEditBadgeText}>Ganti</Text>
                                </View>
                            </>
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <View style={styles.imagePlaceholderIcon}>
                                    <Ionicons name="camera-outline" size={26} color="#0F2C59" />
                                </View>
                                <Text style={styles.imagePlaceholderText}>Pilih Foto</Text>
                                <Text style={styles.imagePlaceholderSubtext}>
                                    JPG atau PNG, maks 5MB
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Form Card */}
                    <View style={styles.formCard}>
                        {renderField('BRAND', 'pricetag-outline', brand, setBrand, {
                            key: 'brand',
                            placeholder: 'Contoh: Honda',
                        })}

                        {renderField('MODEL', 'car-sport-outline', model, setModel, {
                            key: 'model',
                            placeholder: 'Contoh: Brio',
                        })}

                        {renderField('PLAT NOMOR', 'card-outline', plateNumber, setPlateNumber, {
                            key: 'plateNumber',
                            placeholder: 'Contoh: B 1234 XYZ',
                            autoCapitalize: 'characters',
                        })}
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            (submitting || uploading) && styles.submitButtonDisabled,
                        ]}
                        onPress={handleSave}
                        disabled={submitting || uploading}
                        activeOpacity={0.85}
                    >
                        {submitting || uploading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                                <Text style={styles.submitText}>Simpan Perubahan</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F2F5', // Light Cool Grey
    },

    flex: {
        flex: 1,
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

    headerPlaceholder: {
        width: 40,
    },

    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F2C59', // Royal Navy Blue
    },

    content: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 40,
    },

    /* Error Box */
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FEECEC',
        borderWidth: 1,
        borderColor: '#FED7D7',
        borderRadius: 16,
        padding: 14,
        marginBottom: 16,
    },

    errorText: {
        color: '#E53E3E',
        fontSize: 13,
        flex: 1,
        fontWeight: '500',
    },

    /* Labels */
    label: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '700',
        letterSpacing: 0.6,
        marginBottom: 8,
        marginTop: 18,
    },

    /* Image Picker */
    imagePicker: {
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',

        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
    },

    imagePlaceholder: {
        height: 160,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        backgroundColor: '#FFFFFF',
    },

    imagePlaceholderIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#F0F4F8',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },

    imagePlaceholderText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F2C59',
    },

    imagePlaceholderSubtext: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 2,
    },

    previewImage: {
        width: '100%',
        height: 190,
    },

    imageEditBadge: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(15, 44, 89, 0.85)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },

    imageEditBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
    },

    /* Form Card */
    formCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 18,
        paddingBottom: 18,
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',

        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
    },

    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#F8F9FA',
        borderRadius: 14,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#EDF2F7',
    },

    inputWrapperError: {
        borderColor: '#E53E3E',
    },

    input: {
        flex: 1,
        paddingVertical: 13,
        fontSize: 14,
        color: '#1A202C',
        fontWeight: '500',
    },

    fieldErrorText: {
        fontSize: 12,
        color: '#E53E3E',
        marginTop: 6,
    },

    /* Submit Button */
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#0F2C59',
        borderRadius: 14,
        paddingVertical: 15,
        marginTop: 28,

        shadowColor: '#0F2C59',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },

    submitButtonDisabled: {
        opacity: 0.6,
        shadowOpacity: 0,
        elevation: 0,
    },

    submitText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});