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
            const { data } = await axios.post(`${baseUrl}api/user/login`, {
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
                                    color="#8b8b8b"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    placeholderTextColor="#a3a3a3"
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
                                    color="#8b8b8b"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={[styles.input, styles.inputWithToggle]}
                                    placeholder="Password"
                                    placeholderTextColor="#a3a3a3"
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
                                        color="#8b8b8b"
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
        backgroundColor: '#fff'
    },

    flex: {
        flex: 1,
        justifyContent: 'space-between'
    },

    content: {
        paddingHorizontal: 24,
        paddingTop: 24,
    },

    header: {
        marginBottom: 28,
    },

    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#111',
        marginBottom: 6,
    },

    subtitle: {
        fontSize: 14,
        color: '#8b8b8b',
    },

    form: {
        width: '100%',
    },

    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e5e5',
        borderRadius: 12,
        paddingHorizontal: 14,
        marginBottom: 14,
    },

    inputIcon: {
        marginRight: 8,
    },

    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 14,
        color: '#111',
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
        color: '#6b6b6b',
    },

    forgotLink: {
        fontSize: 13,
        color: '#5b5be0',
        fontWeight: '600',
    },

    loginButton: {
        backgroundColor: '#5b5be0',
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        minHeight: 50,
    },

    loginButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15
    },

    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e5e5e5',
        borderRadius: 12,
        paddingVertical: 14,
        marginBottom: 12,
        backgroundColor: '#fff',
    },

    socialButtonText: {
        marginLeft: 10,
        fontSize: 14,
        fontWeight: '600',
        color: '#111',
    },

    errorContainer: {
        backgroundColor: '#fdecec',
        borderWidth: 1,
        borderColor: '#f5c2c2',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 16,
    },

    errorText: {
        color: '#d13c3c',
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
        color: '#6b6b6b'
    },

    signupLink: {
        fontSize: 14,
        color: '#5b5be0',
        fontWeight: '700'
    },
});