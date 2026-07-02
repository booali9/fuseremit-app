import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";

import { moderateScale } from "react-native-size-matters";
import { Feather, Ionicons } from "@expo/vector-icons";
import Fonts from "../../constants/Fonts";
import { listTransactions, Transaction } from "../../services/paymentApi";

import { useLanguage } from "../../context/LanguageContext";

const SUCCESS_STATUSES = ["completed", "delivered", "sent"];

const timeAgo = (isoDate: string) => {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

const AlertsScreen: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await listTransactions({ limit: 20, type: "transfer" });
      setTransactions(data.transactions);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAlerts();
  }, [fetchAlerts]);

  const renderIcon = (isSuccess: boolean) => {
    if (isSuccess) {
      return (
        <View style={[styles.iconCircle, { backgroundColor: "#CFF7E2", marginRight: isRTL ? 0 : responsiveWidth(3), marginLeft: isRTL ? responsiveWidth(3) : 0 }]}>
          <Feather name="arrow-up-right" size={moderateScale(18)} color="#34A853" />
        </View>
      );
    }

    return (
      <View style={[styles.iconCircle, { backgroundColor: "#FAD4D8", marginRight: isRTL ? 0 : responsiveWidth(3), marginLeft: isRTL ? responsiveWidth(3) : 0 }]}>
        <Ionicons name="close" size={moderateScale(18)} color="#E53935" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("alerts.title")}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#0B3963" style={{ marginTop: responsiveHeight(3) }} />
        ) : transactions.length === 0 ? (
          <Text style={styles.emptyText}>No alerts yet</Text>
        ) : (
          transactions.map((tx) => {
            const isSuccess = SUCCESS_STATUSES.includes(tx.status);
            const title = isSuccess
              ? `Transfer of $${tx.amount.toFixed(2)} to ${tx.recipientName ?? "recipient"} has been completed`
              : `Transfer of $${tx.amount.toFixed(2)} to ${tx.recipientName ?? "recipient"} ${tx.status === "failed" ? "failed" : "is " + tx.status}`;

            return (
              <TouchableOpacity key={tx._id} style={styles.card} activeOpacity={0.8}>
                <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  {renderIcon(isSuccess)}

                  <View style={[styles.contentWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Text style={[styles.alertText, { textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>

                    <View style={[styles.rightMeta, { alignItems: isRTL ? 'flex-start' : 'flex-end' }]}>
                      <Text style={styles.timeText}>{timeAgo(tx.createdAt)}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: responsiveHeight(4) }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default AlertsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: responsiveWidth(5),
  },

  header: {
    alignItems: "center",
    marginTop: responsiveHeight(5),
    marginBottom: responsiveHeight(3),
  },

  headerTitle: {
    fontSize: responsiveFontSize(2.3),
    fontFamily: Fonts.bold,
    color: "#000",
  },

  emptyText: {
    textAlign: "center",
    fontSize: responsiveFontSize(1.6),
    color: "#AAAAAA",
    fontFamily: Fonts.medium,
    marginTop: responsiveHeight(4),
  },

  card: {
    backgroundColor: "#ffffff43",
    borderRadius: moderateScale(14),
    paddingVertical: responsiveHeight(2),
    paddingHorizontal: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  iconCircle: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    borderRadius: responsiveWidth(12),
    justifyContent: "center",
    alignItems: "center",
    marginRight: responsiveWidth(3),
    backgroundColor: "#E9EDF5",
  },

  contentWrapper: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  alertText: {
    flex: 1,
    fontSize: responsiveFontSize(1.6),
    fontFamily: Fonts.semiBold,
    color: "#111",
    paddingRight: responsiveWidth(2),
  },

  rightMeta: {
    alignItems: "flex-end",
  },

  timeText: {
    fontSize: responsiveFontSize(1.3),
    color: "#000000",
    fontFamily: Fonts.regular,
  },
});
