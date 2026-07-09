import React, { useRef, useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, TouchableOpacity, ActivityIndicator, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { moderateScale } from "react-native-size-matters";
import { WebView } from "react-native-webview";
import { API_BASE_URL } from "../../services/api";

// The backend's return_url — reaching it means Stripe finished the session.
const COMPLETE_URL_MARKER = `${API_BASE_URL}/kyc/complete-redirect`;

interface Props {
  navigation: any;
  route: { params: { url: string } };
}

const IdentityWebViewScreen: React.FC<Props> = ({ navigation, route }) => {
  const { url } = route.params;
  const [loading, setLoading] = useState(true);
  const finished = useRef(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0B3963" />
        </View>
      ) : null}

      <WebView
        source={{ uri: url }}
        onLoadEnd={() => setLoading(false)}
        // ponytail: intercept before Stripe's own redirect fires, so we never depend on the OS handling a custom scheme
        onShouldStartLoadWithRequest={(req) => {
          if (req.url.startsWith(COMPLETE_URL_MARKER)) {
            finished.current = true;
            navigation.navigate("AdvancedKYC", { justCompleted: true });
            return false;
          }
          return true;
        }}
      />
    </SafeAreaView>
  );
};

export default IdentityWebViewScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    backgroundColor: "#fff",
  },
});
