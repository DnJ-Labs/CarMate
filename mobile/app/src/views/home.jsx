import { useContext } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { AuthContext } from '../context/AuthContext';


export function Home() {
    const authContext = useContext(AuthContext);
    const { setIsLogin } = authContext;

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync('access_token');
        setIsLogin(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Carmate</Text>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Ionicons name="log-out-outline" size={22} color="#d13c3c" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.greeting}>Selamat datang! 👋</Text>
                <Text style={styles.subtitle}>
                    Kamu berhasil login. Halaman ini masih kosong, siap dikembangkan.
                </Text>
            </View>
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
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111',
    },
    logoutButton: {
        padding: 6,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    greeting: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#8b8b8b',
        textAlign: 'center',
        lineHeight: 20,
    },
});