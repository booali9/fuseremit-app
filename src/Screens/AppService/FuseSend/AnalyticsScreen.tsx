import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from "react-native";

import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";

import { moderateScale } from "react-native-size-matters";
import { Feather } from "@expo/vector-icons";
import Fonts from "../../../constants/Fonts";
import { listTransactions } from "../../../services/paymentApi";
import { mayaScore } from "../../../services/mayaApi";
import AppText from "../../../Components/Common/AppText";

const TABS = ["1D", "1W", "1M", "3M", "6M", "1Y", "ALL"];

const AnalyticsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState("1W");
  const [totalSpend, setTotalSpend] = useState(0);
  const [loadingSpend, setLoadingSpend] = useState(true);
  const [smartScore, setSmartScore] = useState<number | null>(null);

  const fetchSpend = useCallback(async () => {
    try {
      const data = await listTransactions({ limit: 500, type: "transfer" });
      setTotalSpend(data.transactions.reduce((sum, tx) => sum + tx.amount, 0));
    } catch {
      setTotalSpend(0);
    } finally {
      setLoadingSpend(false);
    }

    // Scored server-side from the same transfer history — no placeholder if Gemini is down.
    try {
      const scored = await mayaScore();
      setSmartScore(scored.score);
    } catch {
      setSmartScore(null);
    }
  }, []);

  useEffect(() => {
    void fetchSpend();
  }, [fetchSpend]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity>
          <Feather name="chevron-left" size={22} />
        </TouchableOpacity>
        <AppText style={styles.title}>ANALYTICS</AppText>
        <View style={{ width: 20 }} />
      </View>

      <AppText style={styles.subTitle}>Total Spend</AppText>

      <View style={styles.amountRow}>
        {loadingSpend ? (
          <ActivityIndicator size="small" color="#1F2A50" />
        ) : (
          <AppText style={styles.amount}>${totalSpend.toFixed(2)}</AppText>
        )}
      </View>

      <View style={styles.tabContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <AppText
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.scoreHeader}>
        <AppText style={styles.scoreTitle}>FUSE SMART SCORE</AppText>
        <AppText style={styles.scoreValue}>
          {smartScore === null ? "—" : `${smartScore}/100`}
        </AppText>
      </View>

      <View style={styles.progressContainer}>
        {[1, 2, 3, 4, 5, 6, 7].map((item, index) => (
          <View
            key={index}
            style={[
              styles.progressItem,
              smartScore !== null &&
                index < Math.round(smartScore / (100 / 7)) &&
                styles.progressActive,
            ]}
          />
        ))}
      </View>
    </SafeAreaView>
  );
};

export default AnalyticsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: responsiveWidth(5),
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: responsiveHeight(5),
    marginBottom: responsiveHeight(3),
  },

  title: {
    textAlign: "center",
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.semiBold,
    color: "#000",
  },

  subTitle: {
    fontSize: responsiveFontSize(1.7),
    color: "#000000",
    marginBottom: moderateScale(6),
    fontFamily: Fonts.semiBold,
  },

  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
    marginBottom: responsiveHeight(3),
  },

  amount: {
    fontSize: responsiveFontSize(3.2),
    fontFamily: Fonts.bold,
    color: "#1F2A50",
  },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#1E2A5A",
    borderRadius: moderateScale(8),
    padding: moderateScale(4),
    justifyContent: "space-between",
    marginBottom: responsiveHeight(4),
  },

  tab: {
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(6),
  },

  activeTab: {
    borderColor: "#fff",
    borderWidth: 1,
  },

  tabText: {
    color: "#fff",
    fontSize: responsiveFontSize(1.4),
    fontFamily: Fonts.semiBold,
  },

  activeTabText: {
    color: "#fff",
    fontWeight: "600",
    fontFamily: Fonts.semiBold,
  },

  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: responsiveHeight(1.5),
  },

  scoreTitle: {
    fontSize: responsiveFontSize(1.8),
    fontFamily: Fonts.bold,
    color: "#000",
  },

  scoreValue: {
    fontSize: responsiveFontSize(1.8),
    fontFamily: Fonts.bold,
    color: "#000",
  },

  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#1f2a509d",
    borderRadius: moderateScale(8),
    padding: moderateScale(10),
    marginTop: moderateScale(8),
  },

  progressItem: {
    width: responsiveWidth(11),
    height: moderateScale(14),
    borderRadius: moderateScale(10),
    backgroundColor: "#E5E7EB",
  },

  progressActive: {
    backgroundColor: "#1E2A5A",
  },
});
