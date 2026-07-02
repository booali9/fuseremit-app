import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
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
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Fonts from "../../../constants/Fonts";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

const DELIVERY_METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  cash_pickup: "Cash Pickup",
  mobile_wallet: "Mobile Wallet",
};

const DELIVERY_SPEEDS: Record<string, string> = {
  bank_transfer: "1–2 business days",
  cash_pickup: "Within minutes",
  mobile_wallet: "Within minutes",
};

const ReviewSendScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute() as any;

  const params = route.params ?? {
    amount: 2000,
    currency: "USD",
    recipientName: "Abayomi",
    recipientCountry: "Nigeria",
    exchangeRate: 1450,
    amountReceived: 2900000,
    receivedCurrency: "NGN",
    deliveryMethod: "bank_transfer",
    fee: 2.99,
    recipientBank: "GTB",
    recipientAccount: "0405271456",
  };

  const {
    amount,
    currency,
    recipientName,
    recipientCountry,
    exchangeRate,
    amountReceived,
    receivedCurrency,
    deliveryMethod = "bank_transfer",
    fee = 2.99,
    recipientBank,
    recipientAccount,
  } = params;

  const total = Number(amount) + Number(fee);

  const handleConfirm = () => {
    // Navigate to OTP screen, passing all transfer data
    navigation.navigate("OTP", {
      transferData: {
        amount: Number(amount),
        currency,
        deliveryMethod,
        recipientName,
        recipientBank,
        recipientAccount,
        recipientCountry,
        exchangeRate: Number(exchangeRate),
        fee: Number(fee),
        amountReceived: Number(amountReceived),
        receivedCurrency,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={moderateScale(22)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Transfer</Text>
        <View style={{ width: moderateScale(22) }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: responsiveHeight(12) }}>
        {/* Amount card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>You send</Text>
          <Text style={styles.amountValue}>${Number(amount).toFixed(2)} {currency}</Text>
          <View style={styles.divider} />
          <Text style={styles.receiveLabel}>Recipient receives</Text>
          <Text style={styles.receiveValue}>{Number(amountReceived).toLocaleString()} {receivedCurrency}</Text>
          <View style={styles.rateRow}>
            <Feather name="trending-up" size={moderateScale(12)} color="#34A853" />
            <Text style={styles.rateText}>1 {currency} = {Number(exchangeRate).toLocaleString()} {receivedCurrency}</Text>
          </View>
        </View>

        {/* Recipient details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recipient Details</Text>
          {row("Name", recipientName)}
          {recipientBank ? row("Bank", recipientBank) : null}
          {recipientAccount ? row("Account", `****${String(recipientAccount).slice(-4)}`) : null}
          {row("Country", recipientCountry)}
        </View>

        {/* Transfer details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Transfer Details</Text>
          {row("Delivery Method", DELIVERY_METHOD_LABELS[deliveryMethod] ?? deliveryMethod)}
          {row("Speed", DELIVERY_SPEEDS[deliveryMethod] ?? "1–2 business days")}
          {row("Transfer Amount", `$${Number(amount).toFixed(2)}`)}
          {row("Fee", `$${Number(fee).toFixed(2)}`)}
          <View style={[styles.rowWrap, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total You Pay</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Confirm button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Image source={require("../../../../assets/robot.png")} style={styles.buttonRobot} />
          <Text style={styles.confirmText}>Confirm and Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const row = (label: string, value: string) => (
  <View style={styles.rowWrap} key={label}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

export default ReviewSendScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F6F7FB" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: responsiveWidth(5),
    marginTop: responsiveHeight(2),
    marginBottom: responsiveHeight(2),
  },
  headerTitle: { fontSize: responsiveFontSize(2), fontFamily: Fonts.bold, color: "#000" },
  amountCard: {
    backgroundColor: "#0B3963",
    marginHorizontal: responsiveWidth(5),
    borderRadius: moderateScale(16),
    padding: responsiveWidth(5),
    marginBottom: responsiveHeight(2),
  },
  amountLabel: { color: "#A8C4DE", fontSize: responsiveFontSize(1.4), fontFamily: Fonts.medium },
  amountValue: { color: "#fff", fontSize: responsiveFontSize(3.5), fontFamily: Fonts.bold, marginTop: 4 },
  divider: { height: 0.5, backgroundColor: "#1E5E9E", marginVertical: responsiveHeight(1.5) },
  receiveLabel: { color: "#A8C4DE", fontSize: responsiveFontSize(1.4), fontFamily: Fonts.medium },
  receiveValue: { color: "#4ADE80", fontSize: responsiveFontSize(2.5), fontFamily: Fonts.bold, marginTop: 4 },
  rateRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  rateText: { color: "#A8C4DE", fontSize: responsiveFontSize(1.3), fontFamily: Fonts.regular },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: responsiveWidth(5),
    borderRadius: moderateScale(12),
    padding: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
  },
  cardTitle: { fontSize: responsiveFontSize(1.8), fontFamily: Fonts.bold, color: "#111", marginBottom: responsiveHeight(1.5) },
  rowWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: responsiveHeight(1),
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0F0F0",
  },
  rowLabel: { fontSize: responsiveFontSize(1.5), color: "#666", fontFamily: Fonts.medium },
  rowValue: { fontSize: responsiveFontSize(1.5), fontFamily: Fonts.semiBold, color: "#111" },
  totalRow: { borderBottomWidth: 0, paddingTop: responsiveHeight(1.5), borderTopWidth: 0.5, borderTopColor: "#E0E0E0" },
  totalLabel: { fontSize: responsiveFontSize(1.7), fontFamily: Fonts.bold, color: "#111" },
  totalValue: { fontSize: responsiveFontSize(1.7), fontFamily: Fonts.bold, color: "#0B3963" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#F6F7FB",
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(2),
    borderTopWidth: 0.5,
    borderTopColor: "#E0E0E0",
  },
  confirmButton: {
    height: responsiveHeight(7),
    backgroundColor: "#0B3963",
    borderRadius: moderateScale(14),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: responsiveWidth(2),
  },
  confirmText: { color: "#fff", fontSize: responsiveFontSize(1.9), fontFamily: Fonts.semiBold },
  buttonRobot: { width: responsiveWidth(5), height: responsiveWidth(5), resizeMode: "contain" },
});
