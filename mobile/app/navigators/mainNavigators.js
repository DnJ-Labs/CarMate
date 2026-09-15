import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Home } from "../src/views/home";
import Profile from "../src/views/profile";
import { Workshop } from "../src/views/allWorkshops";
import BookingHistory from "../src/views/bookingHistory";


const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,

        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
        },

        tabBarBackground: () => (
          <BlurView
            intensity={60}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        ),

        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#8E8E8E",
        tabBarShowLabel: true,
      }}
    >
      {/* HOME */}

      <Tab.Screen
        name="HomeScreen"
        component={Home}
        options={{
          tabBarLabel: "Home",

          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />

      {/* WORKSHOP */}

      <Tab.Screen
        name="Workshops"
        component={Workshop}
        options={{
          tabBarLabel: "Workshop",

          tabBarIcon: ({ color, size }) => (
            <Feather name="map-pin" size={size} color={color} />
          ),
        }}
      />

      {/* BOOKING - CENTER BUTTON */}

      <Tab.Screen
    name="Booking"
    component={View} // placeholder, tidak pernah dirender
    options={{
        tabBarLabel: () => null,
        tabBarIcon: () => (
            <View style={styles.bookingButton}>
                <Feather name="plus" size={28} color="#FFFFFF" />
            </View>
        ),
        tabBarButton: (props) => (
            <TouchableOpacity
                {...props}
                style={styles.bookingTabButton}
            />
        ),
    }}
    listeners={({ navigation }) => ({
        tabPress: (e) => {
            e.preventDefault(); // cegah pindah ke tab "Booking"
            navigation.navigate("SelectWorkshop");
        },
    })}
/>

      {/* BOOKING HISTORY */}

      <Tab.Screen
        name="BookingHistory"
        component={BookingHistory}
        options={{
          tabBarLabel: "History",

          tabBarIcon: ({ color, size }) => (
            <Feather name="clock" size={size} color={color} />
          ),
        }}
      />

      {/* PROFILE */}

      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarLabel: "Profile",

          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bookingTabButton: {
    justifyContent: "center",
    alignItems: "center",
  },

  bookingButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#4438F5",
    justifyContent: "center",
    alignItems: "center",

    marginTop: -25,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 8,
  },
});
