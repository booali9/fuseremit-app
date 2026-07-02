import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";

import { moderateScale } from "react-native-size-matters";
import { FontAwesome5, Feather } from "@expo/vector-icons";
import Fonts from "../../constants/Fonts";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useLanguage } from "../../context/LanguageContext";
import { listTransactions, Transaction } from "../../services/paymentApi";

const groupByDate = (txns: Transaction[]): Record<string, Transaction[]> => {
  return txns.reduce<Record<string, Transaction[]>>((acc, tx) => {
    const date = new Date(tx.createdAt).toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(tx);
    return acc;
  }, {});
};

const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { t, isRTL } = useLanguage();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchTransactions = useCallback(async () => {
    try {
      setError("");
      const data = await listTransactions({ limit: 50 });
      setTransactions(data.transactions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load transactions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  const renderIcon = (tx: Transaction) => {
    if (tx.type === "deposit") {
      return (
        <View style={[styles.iconCircle, { backgroundColor: "#CFF7E2", marginRight: isRTL ? 0 : responsiveWidth(3), marginLeft: isRTL ? responsiveWidth(3) : 0 }]}>
          <Feather name="arrow-down-left" size={moderateScale(16)} color="#34A853" />
        </View>
      );
    }
    if (tx.type === "transfer") {
      return (
        <View style={[styles.iconCircle, { backgroundColor: "#FFE5E5", marginRight: isRTL ? 0 : responsiveWidth(3), marginLeft: isRTL ? responsiveWidth(3) : 0 }]}>
          <Feather name="arrow-up-right" size={moderateScale(16)} color="#FB002E" />
        </View>
      );
    }
    return (
      <View style={[styles.iconCircle, { borderColor: "#DADADA", borderWidth: 1, marginRight: isRTL ? 0 : responsiveWidth(3), marginLeft: isRTL ? responsiveWidth(3) : 0 }]}>
        <FontAwesome5 name="sync" size={moderateScale(14)} color="#000000" />
      </View>
    );
  };

  const amountColor = (tx: Transaction) => {
    if (tx.type === "deposit") return { color: "#34A853" };
    if (tx.type === "transfer") return { color: "#FB002E" };
    return { color: "#000000" };
  };

  const formatAmount = (tx: Transaction) => {
    const sign = tx.type === "deposit" ? "+" : tx.type === "transfer" ? "-" : "";
    return `${sign}$${tx.amount.toFixed(2)}`;
  };

  const grouped = groupByDate(transactions);
  const dateKeys = Object.keys(grouped);

  const today = new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });

  const displayDate = (key: string) => {
    if (key === today) return t("history.today");
    if (key === yesterday) return t("history.yesterday");
    return key;
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void fetchTransactions(); }} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("history.title")}</Text>
        </View>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={moderateScale(40)} color="#DADADA" />
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        ) : (
          dateKeys.map((dateKey) => (
            <View key={dateKey}>
              <Text style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>
                {displayDate(dateKey)}
              </Text>
              {grouped[dateKey].map((tx) => (
                <TouchableOpacity
                  key={tx._id}
                  style={[styles.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate("HistoryDetail", { transaction: tx })}
                >
                  <View style={[styles.leftRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                    {renderIcon(tx)}
                    <View>
                      <Text style={styles.name}>{tx.recipientName ?? (tx.type === "deposit" ? "Added funds" : "Transfer")}</Text>
                      <Text style={styles.subText}>{tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}</Text>
                    </View>
                  </View>
                  <Text style={[styles.amount, amountColor(tx)]}>{formatAmount(tx)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}

        <View style={{ height: responsiveHeight(4) }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default HistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: responsiveWidth(5),
  },
  header: {
    alignItems: "center",
    marginBottom: responsiveHeight(3),
    marginTop: responsiveHeight(5),
  },
  headerTitle: {
    fontSize: responsiveFontSize(2.2),
    fontFamily: Fonts.bold,
    color: "#000",
  },
  sectionTitle: {
    fontSize: responsiveFontSize(1.7),
    color: "#7A7A7A",
    marginBottom: responsiveHeight(1.5),
    marginTop: responsiveHeight(2),
    fontFamily: Fonts.semiBold,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: responsiveHeight(2),
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconCircle: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    borderRadius: responsiveWidth(10),
    justifyContent: "center",
    alignItems: "center",
    marginRight: responsiveWidth(3),
  },
  name: {
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.bold,
    color: "#111111",
  },
  subText: {
    fontSize: responsiveFontSize(1.4),
    color: "#888",
    fontFamily: Fonts.medium,
    marginTop: 2,
  },
  amount: {
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.semiBold,
  },
  errorText: {
    textAlign: "center",
    color: "#FB002E",
    fontFamily: Fonts.medium,
    marginTop: responsiveHeight(4),
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: responsiveHeight(15),
    gap: responsiveHeight(2),
  },
  emptyText: {
    fontSize: responsiveFontSize(1.8),
    color: "#AAAAAA",
    fontFamily: Fonts.medium,
  },
});
