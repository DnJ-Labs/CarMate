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

export default function EditProfile() {
    const navigation = useNavigation();
    const route = useRoute();
    const insets = useSafeAreaInsets();

    const initialUser = route.params?.user ?? {};

    const [name, setName] = useState(initialUser.name || '');
    const [username, setUsername] = useState(initialUser.username || '');
    const [email, setEmail] = useState(initialUser.email || '');
    const [phone, setPhone] = useState(initialUser.phone || '');

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
        const nextErrors = {};

        if (!name.trim()) nextErrors.name = 'Nama wajib diisi';
        if (!username.trim()) nextErrors.username = 'Username wajib diisi';

        if (!email.trim()) {
            nextErrors.email = 'Email wajib diisi';
        } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
            nextErrors.email = 'Format email tidak valid';
        }

        if (phone && !/^[0-9+\-\s]{6,20}$/.test(phone.trim())) {
            nextErrors.phone = 'Format nomor telepon tidak valid';
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        try {
            setSubmitting(true);

            const token = await SecureStore.getItemAsync('access_token');
            if (!token) {
                Alert.alert('Error', 'Sesi habis, silakan login ulang');
                return;
            }

            const payload = {
                name: name.trim(),
                username: username.trim(),
                email: email.trim(),
                phone: phone.trim(),
            };

            const response = await axios.put(
                `${baseUrl}/api/user/profile`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            Alert.alert('Berhasil', 'Profil kamu telah diperbarui.', [
                {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                },
            ]);
        } catch (err) {
            const message = err.response?.data?.message;

            if (message === 'Username already taken') {
                setErrors((prev) => ({ ...prev, username: 'Username sudah dipakai' }));
            } else if (message === 'Email already taken') {
                setErrors((prev) => ({ ...prev, email: 'Email sudah dipakai' }));
            } else {
                Alert.alert('Gagal', message || 'Gagal memperbarui profil.');
            }
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
                    keyboardType={options.keyboardType || 'default'}
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

                <Text style={styles.title}>Edit Profile</Text>

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
                {renderField('Nama Lengkap', name, setName, {
                    key: 'name',
                    placeholder: 'Masukkan nama lengkap',
                })}

                {renderField('Username', username, setUsername, {
                    key: 'username',
                    placeholder: 'Masukkan username',
                    autoCapitalize: 'none',
                })}

                {renderField('Email', email, setEmail, {
                    key: 'email',
                    placeholder: 'nama@email.com',
                    autoCapitalize: 'none',
                    keyboardType: 'email-address',
                })}

                {renderField('Nomor Telepon', phone, setPhone, {
                    key: 'phone',
                    placeholder: '08xxxxxxxxxx',
                    keyboardType: 'phone-pad',
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
    content: { paddingHorizontal: 20, paddingTop: 20 },
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