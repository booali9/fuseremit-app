import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";
import { moderateScale } from "react-native-size-matters";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Fonts from "../../constants/Fonts";
import { getAccessTokenAsync } from "../../services/session";
import { API_BASE_URL } from "../../services/api";
import { Paths, File } from "expo-file-system";
import * as Sharing from "expo-sharing";

interface Props {
  navigation: any;
}

const PRESETS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 3 months", days: 90 },
  { label: "Last 6 months", days: 180 },
  { label: "This year", days: 365 },
];

const ReportingScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(30);
  const [downloading, setDownloading] = useState(false);

  const getDates = useCallback(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (selectedPreset ?? 30));
    return {
      from: from.toISOString().split("T")[0],
      to: to.toISOString().split("T")[0],
    };
  }, [selectedPreset]);

  const handleDownloadCSV = useCallback(async () => {
    try {
      setDownloading(true);
      const token = await getAccessTokenAsync();
      if (!token) throw new Error("Not authenticated");

      const { from, to } = getDates();
      const response = await fetch(`${API_BASE_URL}/payments/transactions/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          access_token: token,
          from,
          to,
          format: "csv",
        }),
      });
      if (!response.ok) throw new Error("Failed to download statement");
      const csvText = await response.text();

      // Write to temp file using new expo-file-system API
      const fileName = `fuseremit-statement-${from}-to-${to}.csv`;
      const file = new File(Paths.cache, fileName);
      await file.write(csvText);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "text/csv",
          dialogTitle: "Export Statement",
          UTI: "public.comma-separated-values-text",
        });
      } else {
        Alert.alert("Downloaded", "Statement saved successfully.");
      }
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to export statement");
    } finally {
      setDownloading(false);
    }
  }, [getDates]);

  const { from, to } = getDates();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={moderateScale(22)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Reporting</Text>
        <View style={{ width: moderateScale(22) }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: responsiveHeight(6) }}>
        {/* Header */}
        <View style={styles.heroCard}>
          <MaterialCommunityIcons name="file-chart-outline" size={moderateScale(48)} color="#fff" />
          <Text style={styles.heroTitle}>Download Your Statement</Text>
          <Text style={styles.heroSub}>Export your transaction history as a CSV file for your records or accounting.</Text>
        </View>

        {/* Date range selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Date Range</Text>
          <View style={styles.presetsGrid}>
            {PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.days}
                style={[styles.presetChip, selectedPreset === preset.days && styles.presetChipActive]}
                onPress={() => setSelectedPreset(preset.days)}
              >
                <Text style={[styles.presetText, selectedPreset === preset.days && styles.presetTextActive]}>
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.dateRangeRow}>
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>From</Text>
              <Text style={styles.dateValue}>{from}</Text>
            </View>
            <Feather name="arrow-right" size={moderateScale(16)} color="#AAAAAA" />
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>To</Text>
              <Text style={styles.dateValue}>{to}</Text>
            </View>
          </View>
        </View>

        {/* What's included */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>What's Included</Text>
          {[
            "Date and time of each transaction",
            "Transfer amounts and currencies",
            "Recipient details",
            "Exchange rates and fees",
            "Delivery method",
            "Transaction status",
          ].map((item, i) => (
            <View key={i} style={styles.includeRow}>
              <Feather name="check" size={moderateScale(14)} color="#34A853" />
              <Text style={styles.includeText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Download button */}
        <TouchableOpacity
          style={[styles.downloadButton, downloading && styles.buttonDisabled]}
          onPress={handleDownloadCSV}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="download" size={moderateScale(18)} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.downloadButtonText}>Download CSV Statement</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          Your statement is generated securely and contains only your own transaction data.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReportingScreen;

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
  heroSub: { color: "#A8C4DE", fontSize: responsiveFontSize(1.5), textAlign: "center", marginTop: 8, fontFamily: Fonts.regular, lineHeight: 20 },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: responsiveWidth(5),
    borderRadius: moderateScale(12),
    padding: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
  },
  cardTitle: { fontSize: responsiveFontSize(1.8), fontFamily: Fonts.bold, color: "#111", marginBottom: responsiveHeight(2) },
  presetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: responsiveWidth(2),
    marginBottom: responsiveHeight(2),
  },
  presetChip: {
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.8),
    borderRadius: 20,
    backgroundColor: "#F0F4FF",
    borderWidth: 1,
    borderColor: "#E0E8FF",
  },
  presetChipActive: { backgroundColor: "#0B3963", borderColor: "#0B3963" },
  presetText: { fontSize: responsiveFontSize(1.4), fontFamily: Fonts.medium, color: "#0B3963" },
  presetTextActive: { color: "#fff" },
  dateRangeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F6F7FB",
    borderRadius: moderateScale(10),
    padding: responsiveWidth(3),
  },
  dateBox: { alignItems: "center" },
  dateLabel: { fontSize: responsiveFontSize(1.3), color: "#888", fontFamily: Fonts.medium },
  dateValue: { fontSize: responsiveFontSize(1.6), fontFamily: Fonts.bold, color: "#0B3963", marginTop: 2 },
  includeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: responsiveHeight(1),
    gap: responsiveWidth(2),
  },
  includeText: { fontSize: responsiveFontSize(1.5), color: "#444", fontFamily: Fonts.medium },
  downloadButton: {
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
  downloadButtonText: { color: "#fff", fontSize: responsiveFontSize(1.8), fontFamily: Fonts.semiBold },
  footerNote: {
    textAlign: "center",
    fontSize: responsiveFontSize(1.3),
    color: "#AAAAAA",
    fontFamily: Fonts.regular,
    marginHorizontal: responsiveWidth(8),
    lineHeight: 18,
  },
});
