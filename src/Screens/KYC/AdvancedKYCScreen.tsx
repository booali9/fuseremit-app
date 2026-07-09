import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";
import { moderateScale } from "react-native-size-matters";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import Fonts from "../../constants/Fonts";
import { createIdentitySession, getAdvancedKycStatus, AdvancedKycStatus } from "../../services/kycApi";

interface Props {
  navigation: any;
  route?: { params?: { justCompleted?: boolean } };
}

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "verified") return <MaterialCommunityIcons name="check-circle" size={moderateScale(56)} color="#34A853" />;
  if (status === "failed") return <MaterialCommunityIcons name="close-circle" size={moderateScale(56)} color="#FB002E" />;
  if (status === "pending") return <MaterialCommunityIcons name="clock-outline" size={moderateScale(56)} color="#F5A623" />;
  return <MaterialCommunityIcons name="shield-account-outline" size={moderateScale(56)} color="#0B3963" />;
};

const AdvancedKYCScreen: React.FC<Props> = ({ navigation, route }) => {
  const [kycStatus, setKycStatus] = useState<AdvancedKycStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [starting, setStarting] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const data = await getAdvancedKycStatus();
      setKycStatus(data);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to load KYC status");
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => { void loadStatus(); }, [loadStatus]);

  useEffect(() => {
    if (!route?.params?.justCompleted) return;
    navigation.setParams({ justCompleted: undefined });
    Alert.alert(
      "Submitted",
      "Your documents have been submitted for review. We'll notify you once verified.",
      [{ text: "OK", onPress: () => void loadStatus() }],
    );
  }, [route?.params?.justCompleted, navigation, loadStatus]);

  const handleStart = useCallback(async () => {
    try {
      setStarting(true);
      const session = await createIdentitySession();
      if (!session.url) throw new Error("Verification link unavailable. Please try again later.");

      // In-app WebView wrapper — avoids the OS's unreliable custom-scheme deep-link handling
      navigation.navigate("IdentityWebView", { url: session.url });
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to start verification");
    } finally {
      setStarting(false);
    }
  }, [loadStatus]);

  const status = kycStatus?.advancedKycStatus ?? "not_started";

  if (loadingStatus) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#0B3963" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={moderateScale(22)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Advanced Verification</Text>
        <View style={{ width: moderateScale(22) }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: responsiveHeight(6) }}>
        {/* Status card */}
        <View style={styles.statusCard}>
          <StatusIcon status={status} />
          <Text style={styles.statusTitle}>
            {status === "verified" ? "Identity Verified" :
              status === "pending" ? "Under Review" :
              status === "failed" ? "Verification Failed" :
              "Verify Your Identity"}
          </Text>
          <Text style={styles.statusSub}>
            {status === "verified"
              ? `Your sending limit is now $${(kycStatus?.sendingLimit ?? 10000).toLocaleString()} per transfer`
              : status === "pending"
              ? "We're reviewing your documents. This usually takes a few minutes."
              : status === "failed"
              ? "Your verification was unsuccessful. Please try again with a clear, valid document."
              : "Complete advanced verification to unlock higher sending limits"}
          </Text>
        </View>

        {/* Limits comparison */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sending Limits</Text>
          <View style={styles.limitsRow}>
            <View style={styles.limitBox}>
              <Text style={styles.limitAmount}>
                ${(status === "verified" ? 1000 : kycStatus?.sendingLimit ?? 1000).toLocaleString()}
              </Text>
              <Text style={styles.limitLabel}>Basic KYC</Text>
              <Text style={styles.limitSub}>per transfer</Text>
            </View>
            <Feather name="arrow-right" size={moderateScale(24)} color="#AAAAAA" />
            <View style={[styles.limitBox, status === "verified" && styles.limitBoxActive]}>
              <Text style={[styles.limitAmount, status === "verified" && styles.limitAmountActive]}>
                ${(status === "verified" ? kycStatus?.sendingLimit ?? 10000 : 10000).toLocaleString()}
              </Text>
              <Text style={[styles.limitLabel, status === "verified" && styles.limitLabelActive]}>Advanced KYC</Text>
              <Text style={[styles.limitSub, status === "verified" && { color: "#A8C4DE" }]}>per transfer</Text>
            </View>
          </View>
        </View>

        {/* What you need */}
        {status !== "verified" ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>What You'll Need</Text>
            {[
              { icon: "card-account-details-outline" as const, text: "Government-issued ID (passport, driver's license, or national ID)" },
              { icon: "camera-outline" as const, text: "A selfie for facial matching" },
              { icon: "wifi" as const, text: "Stable internet connection" },
            ].map((item, i) => (
              <View key={i} style={styles.requirementRow}>
                <MaterialCommunityIcons name={item.icon} size={moderateScale(22)} color="#0B3963" />
                <Text style={styles.requirementText}>{item.text}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* CTA */}
        {status !== "verified" ? (
          <TouchableOpacity
            style={[styles.startButton, (starting || status === "pending") && styles.buttonDisabled]}
            onPress={handleStart}
            disabled={starting || status === "pending"}
          >
            {starting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="shield-check-outline" size={moderateScale(20)} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.startButtonText}>
                  {status === "pending" ? "Verification in Progress..." :
                   status === "failed" ? "Try Again" : "Start Verification"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        ) : null}

        <Text style={styles.footerNote}>
          Powered by Stripe Identity. Your documents are encrypted and processed securely.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdvancedKYCScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F7FB" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: responsiveWidth(5),
    marginTop: responsiveHeight(2),
    marginBottom: responsiveHeight(2),
  },
  topTitle: { fontSize: responsiveFontSize(2), fontFamily: Fonts.bold, color: "#000" },
  statusCard: {
    backgroundColor: "#fff",
    marginHorizontal: responsiveWidth(5),
    borderRadius: moderateScale(16),
    padding: responsiveWidth(6),
    alignItems: "center",
    marginBottom: responsiveHeight(2),
  },
  statusTitle: { fontSize: responsiveFontSize(2.2), fontFamily: Fonts.bold, color: "#111", marginTop: responsiveHeight(1.5), textAlign: "center" },
  statusSub: { fontSize: responsiveFontSize(1.5), color: "#666", fontFamily: Fonts.regular, textAlign: "center", marginTop: 8, lineHeight: 22 },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: responsiveWidth(5),
    borderRadius: moderateScale(12),
    padding: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
  },
  cardTitle: { fontSize: responsiveFontSize(1.8), fontFamily: Fonts.bold, color: "#111", marginBottom: responsiveHeight(2) },
  limitsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  limitBox: {
    flex: 1,
    backgroundColor: "#F6F7FB",
    borderRadius: moderateScale(10),
    padding: responsiveWidth(3),
    alignItems: "center",
  },
  limitBoxActive: { backgroundColor: "#0B3963" },
  limitAmount: { fontSize: responsiveFontSize(2.2), fontFamily: Fonts.bold, color: "#0B3963" },
  limitAmountActive: { color: "#fff" },
  limitLabel: { fontSize: responsiveFontSize(1.3), fontFamily: Fonts.semiBold, color: "#555", marginTop: 4 },
  limitLabelActive: { color: "#A8C4DE" },
  limitSub: { fontSize: responsiveFontSize(1.2), color: "#888", fontFamily: Fonts.regular },
  requirementRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: responsiveHeight(1.5), gap: responsiveWidth(3) },
  requirementText: { flex: 1, fontSize: responsiveFontSize(1.5), color: "#444", fontFamily: Fonts.medium, lineHeight: 20 },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B3963",
    marginHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(2),
    borderRadius: moderateScale(12),
    marginBottom: responsiveHeight(2),
  },
  buttonDisabled: { opacity: 0.6 },
  startButtonText: { color: "#fff", fontSize: responsiveFontSize(1.8), fontFamily: Fonts.semiBold },
  footerNote: {
    textAlign: "center",
    fontSize: responsiveFontSize(1.3),
    color: "#AAAAAA",
    fontFamily: Fonts.regular,
    marginHorizontal: responsiveWidth(8),
    lineHeight: 18,
  },
});
