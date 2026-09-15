import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { Home } from "../src/views/home";
import Profile from "../src/views/profile";
import { Workshop } from "../src/views/allWorkshops";
import BookingHistory from "../src/views/bookingHistory";

const Tab = createBottomTabNavigator();
const { width: SCREEN_WIDTH } = Dimensions.get("window");

/* ---------------------------------------------------------
 * NEUMORPHIC MINIMALIST PALETTE
 * ------------------------------------------------------- */
const COLORS = {
  background: "#F8F9FA", // soft off-white
  surface: "#FFFFFF",
  accent: "#0F2C59", // royal navy blue
  inactive: "#9AA3AF",
  shadowDark: "#D6DBE3",
};

const BAR_HEIGHT = 66;
const BAR_RADIUS = 24; // 16-24px rounded corners
const BUMP_RADIUS = 33; // how tall the bump rises above the bar
const CENTER_SIZE = 70;
const H_MARGIN = 14; // floating margin from screen edges

const CONTAINER_HEIGHT = BAR_HEIGHT + BUMP_RADIUS;

/**
 * Builds an SVG path for a rounded, floating bar with a soft
 * upward "bump" in the middle. All coordinates stay positive
 * (0 = top of bump, CONTAINER_HEIGHT = bottom of bar) so nothing
 * gets clipped by the SVG viewBox.
 */
function buildBarPath(w, bumpX) {
  const barTop = BUMP_RADIUS; // where the flat part of the bar begins
  const bumpHalf = BUMP_RADIUS + 16;

  return `
    M0,${barTop + BAR_RADIUS}
    Q0,${barTop} ${BAR_RADIUS},${barTop}
    L${bumpX - bumpHalf},${barTop}
    C${bumpX - bumpHalf + 24},${barTop} ${bumpX - BUMP_RADIUS},0 ${bumpX},0
    C${bumpX + BUMP_RADIUS},0 ${bumpX + bumpHalf - 24},${barTop} ${bumpX + bumpHalf},${barTop}
    L${w - BAR_RADIUS},${barTop}
    Q${w},${barTop} ${w},${barTop + BAR_RADIUS}
    L${w},${CONTAINER_HEIGHT - BAR_RADIUS}
    Q${w},${CONTAINER_HEIGHT} ${w - BAR_RADIUS},${CONTAINER_HEIGHT}
    L${BAR_RADIUS},${CONTAINER_HEIGHT}
    Q0,${CONTAINER_HEIGHT} 0,${CONTAINER_HEIGHT - BAR_RADIUS}
    Z
  `;
}

/**
 * Custom neumorphic tab bar: soft off-white surface, thin line-art
 * icons, navy accent for the active state, and a raised circular
 * button for the primary "Booking" action pinned to the bump.
 */
function NeumorphicTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const barWidth = SCREEN_WIDTH - H_MARGIN * 2;
  const bumpIndex = 2; // center tab index (Booking)
  const tabWidth = barWidth / state.routes.length;
  const bumpX = tabWidth * bumpIndex + tabWidth / 2;

  const path = buildBarPath(barWidth, bumpX);
  const centerRoute = state.routes[bumpIndex];
  const centerOptions = descriptors[centerRoute.key].options;

  const onCenterPress = () => {
    const event = navigation.emit({
      type: "tabPress",
      target: centerRoute.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate(centerRoute.name);
    }
  };

  return (
    <View
      style={[
        styles.wrapper,
        { paddingBottom: insets.bottom > 0 ? insets.bottom - 8 : 8 },
      ]}
    >
      <View style={[styles.barContainer, { width: barWidth }]}>
        <Svg width={barWidth} height={CONTAINER_HEIGHT} style={styles.svg}>
          <Path d={path} fill={COLORS.surface} />
        </Svg>

        <View style={styles.itemsRow}>
          {state.routes.map((route, index) => {
            if (index === bumpIndex) {
              // reserve empty space so the other icons stay evenly spaced
              return <View key={route.key} style={styles.item} />;
            }

            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const color = isFocused ? COLORS.accent : COLORS.inactive;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                activeOpacity={0.7}
                onPress={onPress}
                style={styles.item}
              >
                {options.tabBarIcon
                  ? options.tabBarIcon({ color, size: 22 })
                  : null}
                <Text style={[styles.label, { color }]}>
                  {options.tabBarLabel ?? route.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* center booking button, pinned exactly to the bump's peak */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onCenterPress}
          style={[
            styles.centerButton,
            { left: bumpX - CENTER_SIZE / 2 },
          ]}
        >
          {centerOptions.tabBarIcon
            ? centerOptions.tabBarIcon({ color: "#FFFFFF", size: 24 })
            : null}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <NeumorphicTabBar {...props} />}
    >
      <Tab.Screen
        name="HomeScreen"
        component={Home}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} strokeWidth={1.6} />
          ),
        }}
      />

      <Tab.Screen
        name="Workshops"
        component={Workshop}
        options={{
          tabBarLabel: "Workshop",
          tabBarIcon: ({ color, size }) => (
            <Feather name="map-pin" size={size} color={color} strokeWidth={1.6} />
          ),
        }}
      />

      {/* BOOKING - CENTER BUTTON */}
      <Tab.Screen
        name="Booking"
        component={View} // placeholder, never actually rendered
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ({ color, size }) => (
            <Feather name="plus" size={size + 4} color={color} strokeWidth={2} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("SelectWorkshop");
          },
        })}
      />

      <Tab.Screen
        name="BookingHistory"
        component={BookingHistory}
        options={{
          tabBarLabel: "History",
          tabBarIcon: ({ color, size }) => (
            <Feather name="clock" size={size} color={color} strokeWidth={1.6} />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} strokeWidth={1.6} />
          ),
          tabBarStyle: {
            display: "none"
          }
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  barContainer: {
    height: CONTAINER_HEIGHT,
    position: "relative",

    // soft neumorphic drop shadow (outer)
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },

  svg: {
    position: "absolute",
    top: 0,
    left: 0,
  },

  itemsRow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: BAR_HEIGHT,
    flexDirection: "row",
  },

  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: "500",
  },

  centerButton: {
    position: "absolute",
    top: 0,
    width: CENTER_SIZE,
    height: CENTER_SIZE,
    borderRadius: CENTER_SIZE / 2,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",

    // soft raised shadow, navy-tinted
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,

    borderWidth: 4,
    borderColor: COLORS.background,
  },
});