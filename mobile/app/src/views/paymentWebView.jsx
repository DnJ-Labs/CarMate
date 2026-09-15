import React from "react";
import { ActivityIndicator, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useNavigation, useRoute } from "@react-navigation/native";

import styles from "../styles/paymentWebViewStyles";

export default function PaymentWebView() {
  const navigation = useNavigation();
  const route = useRoute();

  const redirectUrl = route?.params?.redirectUrl;

  if (!redirectUrl) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Payment URL not found</Text>

          <Text style={styles.errorText}>
            We couldn't open the payment page.
          </Text>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Payment</Text>

          <View style={styles.headerSpacer} />
        </View>

        <WebView
          source={{ uri: redirectUrl }}
          style={styles.webview}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text style={styles.loadingText}>Loading payment page...</Text>
            </View>
          )}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;

            console.log("MIDTRANS WEBVIEW ERROR:", nativeEvent.description);
          }}
        />
      </View>
    </SafeAreaView>
  );
}
