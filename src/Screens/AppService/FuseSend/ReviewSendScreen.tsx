import React, { useState } from "react";
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from "react-native";
import { CardField, useConfirmPayment } from "@stripe/stripe-react-native";
import type { Details } from "@stripe/stripe-react-native/lib/typescript/src/types/components/CardFieldInput";
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
import { createTransferPaymentIntent } from "../../../services/paymentApi";
import { deliveryOption } from "../../../constants/transfer";
import AppText from "../../../Components/Common/AppText";

const ReviewSendScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute() as any;
  const { confirmPayment, loading: confirmLoading } = useConfirmPayment();
  const [cardComplete, setCardComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const params = route.params;

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
  const isProcessing = isSubmitting || confirmLoading;

  const handleConfirm = async () => {
    if (!cardComplete || isProcessing) return;

    try {
      setIsSubmitting(true);

      // 1. Charge the sender for amount + delivery fee via Stripe
      const { clientSecret, paymentIntentId } = await createTransferPaymentIntent({
        amount: total,
        currency: (currency ?? "USD").toLowerCase(),
      });

      const { error } = await confirmPayment(clientSecret, { paymentMethodType: "Card" });
      if (error) {
        Alert.alert("Payment Failed", error.message);
        return;
      }

      // 2. Navigate to OTP screen, passing transfer data + the confirmed payment
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
          paymentIntentId,
        },
      });
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Payment failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCardChange = (details: Details) => {
    setCardComplete(details.complete);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={moderateScale(22)} color="#000" />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Review Transfer</AppText>
        <View style={{ width: moderateScale(22) }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: responsiveHeight(12) }}>
        {/* Amount card */}
        <View style={styles.amountCard}>
          <AppText style={styles.amountLabel}>You send</AppText>
          <AppText style={styles.amountValue}>${Number(amount).toFixed(2)} {currency}</AppText>
          <View style={styles.divider} />
          <AppText style={styles.receiveLabel}>Recipient receives</AppText>
          <AppText style={styles.receiveValue}>{Number(amountReceived).toLocaleString()} {receivedCurrency}</AppText>
          <View style={styles.rateRow}>
            <Feather name="trending-up" size={moderateScale(12)} color="#34A853" />
            <AppText style={styles.rateText}>1 {currency} = {Number(exchangeRate).toLocaleString()} {receivedCurrency}</AppText>
          </View>
        </View>

        {/* Recipient details */}
        <View style={styles.card}>
          <AppText style={styles.cardTitle}>Recipient Details</AppText>
          {row("Name", recipientName)}
          {recipientBank ? row("Bank", recipientBank) : null}
          {recipientAccount ? row("Account", `****${String(recipientAccount).slice(-4)}`) : null}
          {row("Country", recipientCountry)}
        </View>

        {/* Transfer details */}
        <View style={styles.card}>
          <AppText style={styles.cardTitle}>Transfer Details</AppText>
          {row("Delivery Method", deliveryOption(deliveryMethod).title)}
          {row("Speed", deliveryOption(deliveryMethod).speed)}
          {row("Transfer Amount", `$${Number(amount).toFixed(2)}`)}
          {row("Fee", `$${Number(fee).toFixed(2)}`)}
          <View style={[styles.rowWrap, styles.totalRow]}>
            <AppText style={styles.totalLabel}>Total You Pay</AppText>
            <AppText style={styles.totalValue}>${total.toFixed(2)}</AppText>
          </View>
        </View>

        {/* Card details */}
        <View style={styles.card}>
          <AppText style={styles.cardTitle}>Pay With Card</AppText>
          <CardField
            postalCodeEnabled={false}
            placeholders={{ number: "4242 4242 4242 4242" }}
            cardStyle={{ backgroundColor: "#F6F7FB", textColor: "#111111" }}
            style={{ width: "100%", height: 50 }}
            onCardChange={handleCardChange}
          />
        </View>
      </ScrollView>

      {/* Confirm button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmButton, (!cardComplete || isProcessing) && { opacity: 0.5 }]}
          onPress={handleConfirm}
          disabled={!cardComplete || isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Image source={require("../../../../assets/robot.png")} style={styles.buttonRobot} />
              <AppText style={styles.confirmText}>Confirm and Send</AppText>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const row = (label: string, value: string) => (
  <View style={styles.rowWrap} key={label}>
    <AppText style={styles.rowLabel}>{label}</AppText>
    <AppText style={styles.rowValue}>{value}</AppText>
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
