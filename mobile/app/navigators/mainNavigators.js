import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home } from "../src/views/home";





const Tab = createBottomTabNavigator()

export default function MainNavigator() {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    position: 'absolute',
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                    elevation: 0,
                    height: 40 + insets.bottom,
                    paddingBottom: insets.bottom,
                    paddingTop: 8,
                },
                tabBarBackground: () => (
                    <BlurView
                        intensity={60}
                        tint="dark"
                        style={StyleSheet.absoluteFill}
                    />
                ),
                tabBarActiveTintColor: '#fff',
                tabBarInactiveTintColor: '#8e8e8e',
            }}
        >
            <Tab.Screen
                name="HomeScreen"
                component={Home}
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => (
                        <Feather name="home" size={size} color={color} />
                    ),
                }}
            />
       
            
        </Tab.Navigator>
    )
}