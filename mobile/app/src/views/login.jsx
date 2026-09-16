import { useContext, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import baseUrl from '../../constant/baseUrl';
import { AuthContext } from '../context/AuthContext';


export function Login() {
    const authContext = useContext(AuthContext);
    const { setIsLogin } = authContext;

    const navigation = useNavigation();
    const [input, setInput] = useState({
        email: '',
        password: ''
    })

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (name, value) => {
        const newInput = {
            ...input,
            [name]: value
        }

        setInput(newInput)
    }

    const handleLogin = async () => {
        setLoading(true);
        setError(null);

        try {
            const { data } = await axios.post(`${baseUrl}/api/user/login`, {
                email: input.email,
                password: input.password,
            });

            await SecureStore.setItemAsync('access_token', data.data.token);
            setIsLogin(true);
        } catch (err) {
            const message =
                err.response?.data?.message || 'Terjadi kesalahan, coba lagi.';
            setError(message);
        } finally {
            setLoading(false);
        }
    }

    const { email, password } = input;

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.flex}
                >
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Sign in to CarMate</Text>
                            <Text style={styles.subtitle}>
                                Welcome back! Please enter your details.
                            </Text>
                        </View>

                        <View style={styles.form}>
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
                                    onChangeText={(text) => handleChange("email", text)}
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
                                    onChangeText={(text) => handleChange("password", text)}
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

                            <View style={styles.forgotRow}>
                                <Text style={styles.forgotText}>Forgot password? </Text>
                                <TouchableOpacity>
                                    <Text style={styles.forgotLink}>Reset it</Text>
                                </TouchableOpacity>
                            </View>

                            {/* ERROR */}
                            {error && (
                                <View style={styles.errorContainer}>
                                    <Text style={styles.errorText}>
                                        {error}
                                    </Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[
                                    styles.loginButton,
                                    { opacity: email && password && !loading ? 1 : 0.5 },
                                ]}
                                disabled={!email || !password || loading}
                                onPress={handleLogin}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.loginButtonText}>Sign In</Text>
                                )}
                            </TouchableOpacity>

                            <View style={styles.dividerRow}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>or continue with</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-google" size={18} color="#EA4335" />
                                <Text style={styles.socialButtonText}>Sign in with Google</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-apple" size={20} color="#0F2C59" />
                                <Text style={styles.socialButtonText}>Sign in with Apple</Text>
                            </TouchableOpacity>

                        </View>
                    </View>

                    <View style={styles.signupContainer}>
                        <View style={styles.signupRow}>
                            <Text style={styles.signupText}>
                                Don't have an account?{' '}
                            </Text>

                            <TouchableOpacity
                                onPress={() =>
                                    navigation.navigate('Register')
                                }
                            >
                                <Text style={styles.signupLink}>
                                    Sign Up
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA'
    },

    flex: {
        flex: 1,
        justifyContent: 'space-between'
    },

    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },

    header: {
        marginBottom: 28,
    },

    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#0F2C59',
        marginBottom: 6,
    },

    subtitle: {
        fontSize: 14,
        color: '#8a93a6',
    },

    form: {
        width: '100%',
    },

    // Neumorphic soft-inset input field:
    // light off-white surface, very soft shadow instead of a hard border,
    // large rounded corners for an elegant, "pressed-in" look.
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F2F5',
        borderWidth: 1,
        borderColor: '#FFFFFF',
        borderRadius: 18,
        paddingHorizontal: 16,
        marginBottom: 14,

        // soft drop shadow (iOS)
        shadowColor: '#A3B1C6',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
        // soft elevation (Android)
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

    forgotRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: 20,
    },

    forgotText: {
        fontSize: 13,
        color: '#8a93a6',
    },

    forgotLink: {
        fontSize: 13,
        color: '#0F2C59',
        fontWeight: '600',
    },

    // Neumorphic "raised" primary button: navy fill with a soft
    // ambient shadow so it reads as gently embossed, not flat/hard-edged.
    loginButton: {
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

    loginButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
        letterSpacing: 0.3,
    },

    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },

    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e2e6ec',
    },

    dividerText: {
        fontSize: 12,
        color: '#8a93a6',
        marginHorizontal: 10,
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

    signupContainer: {
        paddingBottom: 30,
        paddingHorizontal: 24,
    },

    signupRow: {
        flexDirection: 'row',
        justifyContent: 'center',
    },

    signupText: {
        fontSize: 14,
        color: '#8a93a6'
    },

    signupLink: {
        fontSize: 14,
        color: '#0F2C59',
        fontWeight: '700'
    },
});