import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { CardField, useConfirmPayment } from "@stripe/stripe-react-native";
import type { Details } from "@stripe/stripe-react-native/lib/typescript/src/types/components/CardFieldInput";
import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";
import { moderateScale } from "react-native-size-matters";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { createPaymentIntent, confirmPaymentIntent } from "../../../services/paymentApi";
import Fonts from "../../../constants/Fonts";

const AddMoneyScreen: React.FC = () => {
  const navigation = useNavigation();
  const { confirmPayment, loading: confirmLoading } = useConfirmPayment();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  const numAmount = parseFloat(amount);
  const isValidAmount = !isNaN(numAmount) && numAmount >= 5;
  const canSubmit = isValidAmount && cardComplete && !loading && !confirmLoading;

  const handleAddMoney = async () => {
    if (!isValidAmount) {
      Alert.alert("Invalid Amount", "Please enter an amount of at least $5.00");
      return;
    }
    if (!cardComplete) {
      Alert.alert("Card Required", "Please enter your card details.");
      return;
    }

    setLoading(true);
    try {
      // 1. Create PaymentIntent on the backend (backend converts dollars to cents)
      const { clientSecret } = await createPaymentIntent({
        amount: numAmount,
        currency: "usd",
      });

      // 2. Confirm the payment with the card details already on screen
      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: "Card",
      });

      if (error) {
        Alert.alert("Payment Failed", error.message);
      } else if (paymentIntent) {
        // 3. Tell the backend to credit the wallet balance for this payment
        await confirmPaymentIntent(paymentIntent.id);
        Alert.alert("Success", "Your account has been funded!");
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCardChange = (details: Details) => {
    setCardComplete(details.complete);
  };

  const formattedAmount =
    isValidAmount ? `$${numAmount.toFixed(2)}` : "$0.00";
  const isProcessing = loading || confirmLoading;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E2A5A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Money</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Amount Section */}
          <Text style={styles.label}>Enter Amount (USD)</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#C0C5D0"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
          </View>
          <Text style={styles.subtext}>Minimum amount: $5.00</Text>

          {/* Card Section */}
          <Text style={[styles.label, { marginTop: responsiveHeight(4) }]}>
            Card Details
          </Text>
          <View style={styles.cardContainer}>
            <CardField
              postalCodeEnabled={false}
              placeholders={{ number: "4242 4242 4242 4242" }}
              cardStyle={{
                backgroundColor: "#FFFFFF",
                textColor: "#1E2A5A",
                placeholderColor: "#C0C5D0",
                borderWidth: 0,
                fontSize: 16,
                fontFamily: Fonts.regular,
              }}
              style={styles.cardField}
              onCardChange={handleCardChange}
            />
          </View>
          <View style={styles.secureRow}>
            <Ionicons name="lock-closed" size={14} color="#9CA3AF" />
            <Text style={styles.secureText}>
              Your payment info is encrypted and secure
            </Text>
          </View>

          {/* Summary */}
          {isValidAmount && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount</Text>
                <Text style={styles.summaryValue}>{formattedAmount}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fee</Text>
                <Text style={[styles.summaryValue, { color: "#22C55E" }]}>
                  Free
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { fontFamily: Fonts.bold }]}>
                  Total
                </Text>
                <Text style={[styles.summaryValue, { fontFamily: Fonts.bold }]}>
                  {formattedAmount}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Pay Button pinned to bottom */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.payButton, !canSubmit && styles.disabledButton]}
            onPress={handleAddMoney}
            disabled={!canSubmit}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.payButtonText}>
                Add {isValidAmount ? formattedAmount : "Money"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddMoneyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F5F7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(2),
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: responsiveFontSize(2.2),
    fontFamily: Fonts.bold,
    color: "#1E2A5A",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: responsiveWidth(6),
    paddingTop: responsiveHeight(2),
    paddingBottom: responsiveHeight(4),
  },
  label: {
    fontSize: responsiveFontSize(1.6),
    fontFamily: Fonts.semiBold,
    color: "#4B5563",
    marginBottom: responsiveHeight(1),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(12),
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(1.5),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  currencySymbol: {
    fontSize: responsiveFontSize(3.5),
    fontFamily: Fonts.bold,
    color: "#1E2A5A",
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: responsiveFontSize(3.5),
    fontFamily: Fonts.bold,
    color: "#1E2A5A",
  },
  subtext: {
    fontSize: responsiveFontSize(1.3),
    color: "#9CA3AF",
    marginTop: responsiveHeight(0.8),
    marginLeft: responsiveWidth(1),
  },
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(12),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardField: {
    width: "100%",
    height: 50,
  },
  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: responsiveHeight(1),
    marginLeft: responsiveWidth(1),
    gap: 6,
  },
  secureText: {
    fontSize: responsiveFontSize(1.2),
    fontFamily: Fonts.regular,
    color: "#9CA3AF",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(12),
    padding: responsiveWidth(5),
    marginTop: responsiveHeight(4),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: responsiveHeight(1),
  },
  summaryLabel: {
    fontSize: responsiveFontSize(1.6),
    fontFamily: Fonts.regular,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: responsiveFontSize(1.6),
    fontFamily: Fonts.semiBold,
    color: "#1E2A5A",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
  },
  bottomBar: {
    paddingHorizontal: responsiveWidth(6),
    paddingBottom: responsiveHeight(4),
    paddingTop: responsiveHeight(1),
  },
  payButton: {
    backgroundColor: "#1E2A5A",
    borderRadius: moderateScale(12),
    paddingVertical: responsiveHeight(2),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.bold,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
