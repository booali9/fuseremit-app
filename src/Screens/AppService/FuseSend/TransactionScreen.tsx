import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Share,
} from "react-native";
import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";
import { moderateScale } from "react-native-size-matters";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import Fonts from "../../../constants/Fonts";
import { Transaction } from "../../../services/paymentApi";
import { CommonActions } from "@react-navigation/native";

interface Props {
  navigation: any;
  route: { params?: { transaction?: Transaction } };
}

const DELIVERY_LABELS: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  cash_pickup: "Cash Pickup",
  mobile_wallet: "Mobile Wallet",
};

const TransactionScreen = ({ navigation, route }: Props) => {
  const tx = route?.params?.transaction;

  const handleShareReceipt = async () => {
    const ref = tx?._id?.slice(-8)?.toUpperCase() ?? "N/A";
    const msg = [
      "FuseRemit Transfer Receipt",
      `Reference: ${ref}`,
      tx?.recipientName ? `Recipient: ${tx.recipientName}` : null,
      `Amount: $${tx?.amount?.toFixed(2) ?? "—"} ${tx?.currency ?? "USD"}`,
      tx?.amountReceived ? `Received: ${tx.amountReceived.toLocaleString()} ${tx.receivedCurrency}` : null,
      `Fee: $${(tx?.fee ?? 0).toFixed(2)}`,
      `Date: ${tx ? new Date(tx.createdAt).toLocaleDateString() : "—"}`,
    ]
      .filter(Boolean)
      .join("\n");

    await Share.share({ message: msg, title: "FuseRemit Receipt" });
  };

  const handleDone = () => {
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: "FuseSend" }] }),
    );
  };

  const ref = tx?._id?.slice(-8)?.toUpperCase() ?? "—";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topBar}>
        <View style={{ width: moderateScale(22) }} />
        <Text style={styles.topTitle}>Transfer Sent</Text>
        <View style={{ width: moderateScale(22) }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: responsiveHeight(12) }}>
        {/* Success icon */}
        <View style={styles.successBanner}>
          <View style={styles.checkCircle}>
            <MaterialCommunityIcons name="check-bold" size={moderateScale(36)} color="#fff" />
          </View>
          <Text style={styles.successTitle}>Transfer Initiated!</Text>
          <Text style={styles.successSub}>
            Your transfer is being processed. {tx?.recipientName ? `${tx.recipientName} will` : "The recipient will"} receive the funds shortly.
          </Text>
        </View>

        {/* Details card */}
        <View style={styles.card}>
          {tx?.recipientName ? renderRow("Recipient", tx.recipientName) : null}
          {tx?.recipientBank ? renderRow("Bank", tx.recipientBank) : null}
          {tx?.recipientAccount ? renderRow("Account", `****${tx.recipientAccount.slice(-4)}`) : null}
          {tx?.recipientCountry ? renderRow("Country", tx.recipientCountry) : null}
          {renderRow("Amount Sent", `$${(tx?.amount ?? 0).toFixed(2)} ${tx?.currency ?? "USD"}`)}
          {tx?.amountReceived ? renderRow("Amount Received", `${tx.amountReceived.toLocaleString()} ${tx?.receivedCurrency ?? ""}`) : null}
          {tx?.exchangeRate ? renderRow("Exchange Rate", `1 ${tx.currency} = ${tx.exchangeRate.toLocaleString()} ${tx.receivedCurrency}`) : null}
          {renderRow("Fee", `$${(tx?.fee ?? 0).toFixed(2)}`)}
          {renderRow("Delivery Method", DELIVERY_LABELS[tx?.deliveryMethod ?? "bank_transfer"] ?? "Bank Transfer")}
          {renderRow("Reference", ref)}
          {renderRow("Date", tx ? new Date(tx.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }) : "—")}
          {renderRow("Status", tx?.status ? tx.status.charAt(0).toUpperCase() + tx.status.slice(1) : "Processing")}
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShareReceipt}>
          <FontAwesome5 name="share-alt" size={moderateScale(16)} color="#0B3963" style={{ marginRight: 8 }} />
          <Text style={styles.shareButtonText}>Share Receipt</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const renderRow = (label: string, value: string) => (
  <View style={styles.row} key={label}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

export default TransactionScreen;

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
  successBanner: {
    backgroundColor: "#0B3963",
    marginHorizontal: responsiveWidth(5),
    borderRadius: moderateScale(16),
    padding: responsiveWidth(6),
    alignItems: "center",
    marginBottom: responsiveHeight(2),
  },
  checkCircle: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(36),
    backgroundColor: "#34A853",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: responsiveHeight(2),
  },
  successTitle: { color: "#fff", fontSize: responsiveFontSize(2.4), fontFamily: Fonts.bold, textAlign: "center" },
  successSub: { color: "#A8C4DE", fontSize: responsiveFontSize(1.5), textAlign: "center", marginTop: 8, fontFamily: Fonts.regular, lineHeight: 22 },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: responsiveWidth(5),
    borderRadius: moderateScale(12),
    padding: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: responsiveHeight(1.2),
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0F0F0",
  },
  rowLabel: { fontSize: responsiveFontSize(1.5), color: "#666", fontFamily: Fonts.medium },
  rowValue: { fontSize: responsiveFontSize(1.5), fontFamily: Fonts.semiBold, color: "#111", maxWidth: "55%", textAlign: "right" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#F6F7FB",
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(2),
    flexDirection: "row",
    gap: responsiveWidth(3),
    borderTopWidth: 0.5,
    borderTopColor: "#E0E0E0",
  },
  shareButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#0B3963",
    borderRadius: moderateScale(12),
    paddingVertical: responsiveHeight(1.8),
  },
  shareButtonText: { color: "#0B3963", fontFamily: Fonts.semiBold, fontSize: responsiveFontSize(1.6) },
  doneButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B3963",
    borderRadius: moderateScale(12),
    paddingVertical: responsiveHeight(1.8),
  },
  doneButtonText: { color: "#fff", fontFamily: Fonts.semiBold, fontSize: responsiveFontSize(1.6) },
});
