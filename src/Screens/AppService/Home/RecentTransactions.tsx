import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";

import { moderateScale } from "react-native-size-matters";
import { FontAwesome5, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Fonts from "../../../constants/Fonts";
import { listTransactions, Transaction } from "../../../services/paymentApi";

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const RecentTransactions: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecent = useCallback(async () => {
    try {
      const data = await listTransactions({ limit: 10 });
      setTransactions(data.transactions);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRecent();
  }, [fetchRecent]);

  const renderIcon = (tx: Transaction) => {
    if (tx.type === "deposit") {
      return (
        <View style={[styles.iconCircle, { backgroundColor: "#CFF7E2" }]}>
          <Feather name="arrow-down-left" size={moderateScale(16)} color="#34A853" />
        </View>
      );
    }
    if (tx.type === "transfer") {
      return (
        <View style={[styles.iconCircle, { backgroundColor: "#FFE5E5" }]}>
          <Feather name="arrow-up-right" size={moderateScale(16)} color="#FB002E" />
        </View>
      );
    }
    return (
      <View style={[styles.iconCircle, { borderColor: "#DADADA", borderWidth: 1 }]}>
        <FontAwesome5 name="sync" size={moderateScale(14)} color="#000000" />
      </View>
    );
  };

  const amountStyle = (tx: Transaction) => {
    if (tx.type === "transfer") return { color: "#FB002E" };
    if (tx.type === "deposit") return { color: "#34A853" };
    return { color: "#000" };
  };

  const formatAmount = (tx: Transaction) => {
    const sign = tx.type === "deposit" ? "+ " : tx.type === "transfer" ? "- " : "";
    return `${sign}$${tx.amount.toFixed(2)}`;
  };

  const rowBackground = (tx: Transaction) =>
    tx.type === "transfer"
      ? {}
      : {
          backgroundColor: "#F5F5F5",
          borderRadius: moderateScale(12),
          paddingHorizontal: responsiveWidth(2),
          paddingVertical: responsiveHeight(1),
        };

  const now = new Date();
  const todayTxns = transactions.filter((tx) => isSameDay(new Date(tx.createdAt), now));
  const yesterday = new Date(now.getTime() - 86400000);
  const yesterdayTxns = transactions.filter((tx) => isSameDay(new Date(tx.createdAt), yesterday));

  const renderGroup = (title: string, items: Transaction[]) => (
    <>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>
        {items.map((tx) => (
          <View key={tx._id} style={[styles.row, rowBackground(tx)]}>
            <View style={styles.leftRow}>
              {renderIcon(tx)}
              <Text style={styles.name}>
                {tx.recipientName ?? (tx.type === "deposit" ? "Added funds" : "Transfer")}
              </Text>
            </View>
            <Text style={[styles.amount, amountStyle(tx)]}>{formatAmount(tx)}</Text>
          </View>
        ))}
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Recent Transactions</Text>
          <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate("History")}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#0B3963" style={{ marginTop: responsiveHeight(2) }} />
        ) : transactions.length === 0 ? (
          <Text style={styles.emptyText}>No transactions yet</Text>
        ) : (
          <>
            {todayTxns.length > 0 && renderGroup("Today", todayTxns)}
            {yesterdayTxns.length > 0 && renderGroup("Yesterday", yesterdayTxns)}
          </>
        )}

        <View style={{ height: responsiveHeight(3) }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default RecentTransactions;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: responsiveWidth(5),
    paddingTop: responsiveHeight(1),
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: responsiveHeight(2),
  },

  headerTitle: {
    fontSize: responsiveFontSize(2.3),
    fontFamily: Fonts.bold,
    color: "black",
  },

  viewAllBtn: {
    borderWidth: 1,
    borderColor: "#C7CBD6",
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.5),
    borderRadius: moderateScale(6),
    fontFamily: Fonts.semiBold,
  },

  viewAllText: {
    fontSize: responsiveFontSize(1.2),
    color: "#1F2A50",
  },

  sectionTitle: {
    fontSize: responsiveFontSize(1.8),
    color: "#000000",
    marginBottom: responsiveHeight(1.5),
    fontFamily: Fonts.semiBold,
  },

  card: {
    borderRadius: moderateScale(12),
    paddingVertical: responsiveHeight(1.5),
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: responsiveHeight(1.2),
    paddingHorizontal: responsiveWidth(2),
  },

  leftRow: {
    flexDirection: "row",
    alignItems: "center",
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
    color: "#111",
  },

  amount: {
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.semiBold,
  },

  emptyText: {
    fontSize: responsiveFontSize(1.5),
    color: "#AAAAAA",
    fontFamily: Fonts.medium,
    textAlign: "center",
    marginTop: responsiveHeight(2),
  },
});
