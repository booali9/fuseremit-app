import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Share, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";
import { moderateScale } from "react-native-size-matters";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Fonts from "../../constants/Fonts";
import { getMyReferral, applyReferralCode, ReferralInfo } from "../../services/referralApi";
import AppText from "../../Components/Common/AppText";
import AppTextInput from "../../Components/Common/AppTextInput";

interface Props {
  navigation: any;
}

const ReferralScreen: React.FC<Props> = ({ navigation }) => {
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyCode, setApplyCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getMyReferral();
      setInfo(data);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to load referral info");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleShare = async () => {
    if (!info) return;
    try {
      await Share.share({
        message: `Join FuseRemit — the smartest way to send money internationally! Use my referral code ${info.referralCode} and we both get $${info.discountPerReferral ?? 20} off our next transfer.\n\n${info.referralLink}`,
        title: "FuseRemit Referral",
      });
    } catch {
      // cancelled
    }
  };

  const handleApply = async () => {
    if (!applyCode.trim()) return;
    try {
      setApplying(true);
      const res = await applyReferralCode(applyCode.trim());
      Alert.alert("Applied!", res.message);
      setApplyCode("");
      void load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to apply code");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
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
        <AppText style={styles.topTitle}>Refer & Earn</AppText>
        <View style={{ width: moderateScale(22) }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: responsiveHeight(6) }}>
        {/* Hero */}
        <View style={styles.heroCard}>
          <MaterialCommunityIcons name="gift-outline" size={moderateScale(48)} color="#fff" />
          <AppText style={styles.heroTitle}>Invite Friends, Save Together</AppText>
          <AppText style={styles.heroSub}>
            Share your code and both you and your friend get{" "}
            <AppText style={styles.heroHighlight}>${info?.discountPerReferral ?? 20} off</AppText> your next transfer.
          </AppText>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <AppText style={styles.statValue}>{info?.referralCount ?? 0}</AppText>
            <AppText style={styles.statLabel}>Friends Referred</AppText>
          </View>
          <View style={styles.statCard}>
            <AppText style={[styles.statValue, { color: "#34A853" }]}>${info?.currentDiscount ?? 0}</AppText>
            <AppText style={styles.statLabel}>Discount Available</AppText>
          </View>
        </View>

        {/* Your referral code */}
        <View style={styles.card}>
          <AppText style={styles.cardTitle}>Your Referral Code</AppText>
          <View style={styles.codeRow}>
            <AppText style={styles.codeText}>{info?.referralCode ?? "—"}</AppText>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={async () => {
                if (!info) return;
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              <Feather name={copied ? "check" : "copy"} size={moderateScale(16)} color="#0B3963" />
              <AppText style={styles.copyText}>{copied ? "Copied!" : "Copy"}</AppText>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Feather name="share-2" size={moderateScale(18)} color="#fff" style={{ marginRight: 8 }} />
            <AppText style={styles.shareButtonText}>Share Referral Link</AppText>
          </TouchableOpacity>
        </View>

        {/* Apply a friend's code */}
        <View style={styles.card}>
          <AppText style={styles.cardTitle}>Have a Referral Code?</AppText>
          <AppText style={styles.cardSub}>Enter a friend's code to get your discount</AppText>
          <View style={styles.inputRow}>
            <AppTextInput
              style={styles.codeInput}
              placeholder="Enter code (e.g. JOHN1A2B3C)"
              placeholderTextColor="#AAAAAA"
              value={applyCode}
              onChangeText={setApplyCode}
              autoCapitalize="characters"
              maxLength={12}
            />
            <TouchableOpacity
              style={[styles.applyButton, applying && styles.buttonDisabled]}
              onPress={handleApply}
              disabled={applying}
            >
              {applying ? <ActivityIndicator color="#fff" size="small" /> : <AppText style={styles.applyButtonText}>Apply</AppText>}
            </TouchableOpacity>
          </View>
        </View>

        {/* How it works */}
        <View style={styles.card}>
          <AppText style={styles.cardTitle}>How it Works</AppText>
          {[
            { icon: "share-2", text: "Share your unique code with a friend" },
            { icon: "user-plus", text: "Friend signs up and makes their first transfer" },
            { icon: "dollar-sign", text: `Both of you get $${info?.discountPerReferral ?? 20} off your next transfer` },
          ].map((item, i) => (
            <View key={i} style={styles.howRow}>
              <View style={styles.howIcon}>
                <Feather name={item.icon as any} size={moderateScale(16)} color="#0B3963" />
              </View>
              <AppText style={styles.howText}>{item.text}</AppText>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReferralScreen;

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
  heroCard: {
    backgroundColor: "#0B3963",
    marginHorizontal: responsiveWidth(5),
    borderRadius: moderateScale(16),
    padding: responsiveWidth(6),
    alignItems: "center",
    marginBottom: responsiveHeight(2),
  },
  heroTitle: { color: "#fff", fontSize: responsiveFontSize(2.2), fontFamily: Fonts.bold, textAlign: "center", marginTop: responsiveHeight(1) },
  heroSub: { color: "#A8C4DE", fontSize: responsiveFontSize(1.6), textAlign: "center", marginTop: responsiveHeight(1), fontFamily: Fonts.regular },
  heroHighlight: { color: "#FFD700", fontFamily: Fonts.bold },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: responsiveWidth(5),
    gap: responsiveWidth(3),
    marginBottom: responsiveHeight(2),
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    padding: responsiveWidth(4),
    alignItems: "center",
  },
  statValue: { fontSize: responsiveFontSize(3), fontFamily: Fonts.bold, color: "#0B3963" },
  statLabel: { fontSize: responsiveFontSize(1.4), color: "#888", fontFamily: Fonts.medium, marginTop: 2 },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: responsiveWidth(5),
    borderRadius: moderateScale(12),
    padding: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
  },
  cardTitle: { fontSize: responsiveFontSize(1.8), fontFamily: Fonts.bold, color: "#111", marginBottom: responsiveHeight(0.5) },
  cardSub: { fontSize: responsiveFontSize(1.4), color: "#888", fontFamily: Fonts.regular, marginBottom: responsiveHeight(1.5) },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F0F4FF",
    borderRadius: moderateScale(10),
    padding: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
  },
  codeText: { fontSize: responsiveFontSize(2.5), fontFamily: Fonts.bold, color: "#0B3963", letterSpacing: 2 },
  copyButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  copyText: { fontSize: responsiveFontSize(1.4), fontFamily: Fonts.semiBold, color: "#0B3963" },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B3963",
    borderRadius: moderateScale(12),
    paddingVertical: responsiveHeight(2),
  },
  shareButtonText: { color: "#fff", fontSize: responsiveFontSize(1.8), fontFamily: Fonts.semiBold },
  inputRow: { flexDirection: "row", gap: responsiveWidth(2) },
  codeInput: {
    flex: 1,
    backgroundColor: "#F0F4FF",
    borderRadius: moderateScale(10),
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(1.5),
    fontSize: responsiveFontSize(1.8),
    fontFamily: Fonts.semiBold,
    color: "#111",
  },
  applyButton: {
    backgroundColor: "#0B3963",
    borderRadius: moderateScale(10),
    paddingHorizontal: responsiveWidth(4),
    justifyContent: "center",
  },
  applyButtonText: { color: "#fff", fontFamily: Fonts.semiBold, fontSize: responsiveFontSize(1.6) },
  buttonDisabled: { opacity: 0.6 },
  howRow: { flexDirection: "row", alignItems: "center", marginBottom: responsiveHeight(1.5) },
  howIcon: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(8),
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: responsiveWidth(3),
  },
  howText: { flex: 1, fontSize: responsiveFontSize(1.5), color: "#444", fontFamily: Fonts.medium },
});
