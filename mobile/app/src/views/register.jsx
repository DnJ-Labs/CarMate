import { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
    Platform,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import baseUrl from '../../constant/baseUrl';


export function Register() {
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isFormValid = email && fullName && username && phone && password;

    const handleRegister = async () => {
        if (!isFormValid || loading) return;

        setLoading(true);
        setError(null);

        try {
            await axios.post(`${baseUrl}/api/user/register`, {
                email,
                name: fullName,
                username,
                phone,
                password,
            });

            Alert.alert('Berhasil', 'Akun berhasil dibuat, silakan login.');
            navigation.goBack();
        } catch (err) {
            const message =
                err.response?.data?.message || 'Terjadi kesalahan, coba lagi.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={styles.container}>


                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.flex}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Text style={styles.title}>Sign Up</Text>

                        <View style={styles.form}>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="person-outline"
                                    size={18}
                                    color="#0F2C59"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nama lengkap"
                                    placeholderTextColor="#a3aab8"
                                    value={fullName}
                                    onChangeText={setFullName}
                                />
                            </View>

                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="at-outline"
                                    size={18}
                                    color="#0F2C59"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Username"
                                    placeholderTextColor="#a3aab8"
                                    autoCapitalize="none"
                                    value={username}
                                    onChangeText={setUsername}
                                />
                            </View>

                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="call-outline"
                                    size={18}
                                    color="#0F2C59"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nomor telepon"
                                    placeholderTextColor="#a3aab8"
                                    keyboardType="phone-pad"
                                    value={phone}
                                    onChangeText={setPhone}
                                />
                            </View>

                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="mail-outline"
                                    size={18}
                                    color="#0F2C59"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    placeholderTextColor="#a3aab8"
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>

                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={18}
                                    color="#0F2C59"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={[styles.input, styles.inputWithToggle]}
                                    placeholder="Password"
                                    placeholderTextColor="#a3aab8"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword((prev) => !prev)}
                                    style={styles.eyeIcon}
                                >
                                    <Ionicons
                                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={18}
                                        color="#8a93a6"
                                    />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.terms}>
                                By signing up, you agree to our{' '}
                                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                                <Text style={styles.termsLink}>Privacy Policy</Text>.
                            </Text>

                            {/* ERROR */}
                            {error && (
                                <View style={styles.errorContainer}>
                                    <Text style={styles.errorText}>
                                        {error}
                                    </Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.registerButton, { opacity: isFormValid && !loading ? 1 : 0.5 }]}
                                disabled={!isFormValid || loading}
                                onPress={handleRegister}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.registerButtonText}>Sign Up</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-google" size={18} color="#EA4335" />
                                <Text style={styles.socialButtonText}>Sign up with Google</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-apple" size={20} color="#0F2C59" />
                                <Text style={styles.socialButtonText}>Sign up with Apple</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.loginRow}>
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.goBack()}>
                                <Text style={styles.loginLink}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    flex: { flex: 1 },
    closeButton: {
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 4,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        flexGrow: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#0F2C59',
        marginTop: 12,
        marginBottom: 24,
    },
    form: { width: '100%' },

    // Neumorphic soft-inset input field: light off-white surface,
    // soft ambient shadow instead of a hard border, large rounded corners.
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F2F5',
        borderWidth: 1,
        borderColor: '#FFFFFF',
        borderRadius: 18,
        paddingHorizontal: 16,
        marginBottom: 12,

        shadowColor: '#A3B1C6',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
        elevation: 2,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 14,
        color: '#0F2C59',
    },
    inputWithToggle: {
        paddingRight: 8,
    },
    eyeIcon: {
        padding: 4,
    },
    terms: {
        fontSize: 12,
        color: '#8a93a6',
        lineHeight: 18,
        marginTop: 4,
        marginBottom: 20,
    },
    termsLink: {
        color: '#0F2C59',
        fontWeight: '600',
    },
    errorContainer: {
        backgroundColor: '#FBEEEE',
        borderWidth: 1,
        borderColor: '#F3D3D3',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 16,
    },
    errorText: {
        color: '#C0392B',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
    },

    // Neumorphic "raised" primary button: navy fill with soft ambient
    // shadow so it reads as gently embossed rather than flat.
    registerButton: {
        backgroundColor: '#0F2C59',
        borderRadius: 20,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        minHeight: 52,

        shadowColor: '#0F2C59',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 4,
    },
    registerButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
        letterSpacing: 0.3,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#FFFFFF',
        backgroundColor: '#F0F2F5',
        borderRadius: 18,
        paddingVertical: 14,
        marginBottom: 12,

        shadowColor: '#A3B1C6',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 2,
    },
    socialButtonText: {
        marginLeft: 10,
        fontSize: 14,
        fontWeight: '600',
        color: '#0F2C59',
    },
    loginRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 8,
        paddingBottom: 12,
    },
    loginText: { fontSize: 14, color: '#8a93a6' },
    loginLink: { fontSize: 14, color: '#0F2C59', fontWeight: '700' },
});