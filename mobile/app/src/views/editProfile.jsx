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

    const [focusedField, setFocusedField] = useState(null);
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

            await axios.put(
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

    const renderField = (label, value, onChangeText, iconName, options = {}) => {
        const isFocused = focusedField === options.key;
        const hasError = !!errors[options.key];

        return (
            <View style={styles.field}>
                <Text style={styles.label}>{label}</Text>

                <View
                    style={[
                        styles.inputWrapper,
                        isFocused && styles.inputWrapperFocused,
                        hasError && styles.inputWrapperError,
                    ]}
                >
                    <Ionicons
                        name={iconName}
                        size={18}
                        color={hasError ? '#E53E3E' : isFocused ? '#0F2C59' : '#94A3B8'}
                        style={styles.fieldIcon}
                    />

                    <TextInput
                        value={value}
                        onChangeText={(text) => {
                            onChangeText(text);
                            if (errors[options.key]) {
                                setErrors((prev) => ({ ...prev, [options.key]: null }));
                            }
                        }}
                        onFocus={() => setFocusedField(options.key)}
                        onBlur={() => setFocusedField(null)}
                        placeholder={options.placeholder}
                        placeholderTextColor="#A0AEC0"
                        style={styles.input}
                        autoCapitalize={options.autoCapitalize || 'sentences'}
                        keyboardType={options.keyboardType || 'default'}
                    />
                </View>

                {hasError && (
                    <Text style={styles.errorText}>{errors[options.key]}</Text>
                )}
            </View>
        );
    };

    const getInitials = (str) => {
        if (!str) return 'U';
        return str.charAt(0).toUpperCase();
    };

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

                <Text style={styles.title}>Edit Profil</Text>

                <View style={styles.headerPlaceholder} />
            </View>

            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    { paddingBottom: 24 + insets.bottom },
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Profile Header Avatar */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarWrapper}>
                        <Text style={styles.avatarText}>{getInitials(name)}</Text>
                        <View style={styles.avatarBadge}>
                            <Ionicons name="camera" size={14} color="#FFFFFF" />
                        </View>
                    </View>
                    <Text style={styles.avatarSubtext}>Perbarui informasi profil Anda</Text>
                </View>

                {/* Form Card Container */}
                <View style={styles.cardForm}>
                    {renderField('Nama Lengkap', name, setName, 'person-outline', {
                        key: 'name',
                        placeholder: 'Masukkan nama lengkap',
                    })}

                    {renderField('Username', username, setUsername, 'at-outline', {
                        key: 'username',
                        placeholder: 'Masukkan username',
                        autoCapitalize: 'none',
                    })}

                    {renderField('Email', email, setEmail, 'mail-outline', {
                        key: 'email',
                        placeholder: 'nama@email.com',
                        autoCapitalize: 'none',
                        keyboardType: 'email-address',
                    })}

                    {renderField('Nomor Telepon', phone, setPhone, 'call-outline', {
                        key: 'phone',
                        placeholder: '08xxxxxxxxxx',
                        keyboardType: 'phone-pad',
                    })}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.saveButton, submitting && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={submitting}
                    activeOpacity={0.85}
                >
                    {submitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.saveText}>Simpan Perubahan</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
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
    content: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },

    /* Avatar Section */
    avatarSection: {
        alignItems: 'center',
        marginVertical: 16,
    },
    avatarWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#0F2C59',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        shadowColor: '#0F2C59',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    avatarBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#00A3FF',
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    avatarSubtext: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748B',
        marginTop: 10,
    },

    /* Form Styles */
    cardForm: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F2C59',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
        marginBottom: 20,
    },
    field: {
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0F2C59',
        marginBottom: 8,
        letterSpacing: 0.2,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: '#F8FAFC',
    },
    inputWrapperFocused: {
        borderColor: '#0F2C59',
        backgroundColor: '#FFFFFF',
    },
    inputWrapperError: {
        borderColor: '#E53E3E',
        backgroundColor: '#FFF5F5',
    },
    fieldIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#1A202C',
        fontWeight: '500',
        padding: 0,
    },
    errorText: {
        fontSize: 11,
        color: '#E53E3E',
        marginTop: 5,
        fontWeight: '600',
    },

    /* Save Button */
    saveButton: {
        backgroundColor: '#0F2C59',
        borderRadius: 14,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0F2C59',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});