import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from "react-native";
import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";
import { moderateScale } from "react-native-size-matters";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import Fonts from "../../../constants/Fonts";

type DeliveryMethod = "bank_transfer" | "cash_pickup" | "mobile_wallet";

interface DeliveryOption {
  key: DeliveryMethod;
  icon: string;
  title: string;
  subtitle: string;
  speed: string;
  fee: number;
  countries?: string[];
}

const DELIVERY_OPTIONS: DeliveryOption[] = [
  {
    key: "bank_transfer",
    icon: "bank-outline",
    title: "Bank Transfer",
    subtitle: "Sent directly to recipient's bank account",
    speed: "1–2 business days",
    fee: 2.99,
  },
  {
    key: "cash_pickup",
    icon: "cash-multiple",
    title: "Cash Pickup",
    subtitle: "Recipient picks up cash at a local agent",
    speed: "Within minutes",
    fee: 4.99,
    countries: ["Nigeria", "Ghana", "Kenya", "India", "Philippines"],
  },
  {
    key: "mobile_wallet",
    icon: "cellphone-nfc",
    title: "Mobile Wallet",
    subtitle: "Sent to recipient's mobile money account",
    speed: "Within minutes",
    fee: 1.99,
    countries: ["Kenya (M-Pesa)", "Ghana (MTN)", "Tanzania (Airtel)", "Uganda (MTN)"],
  },
];

interface Props {
  navigation: any;
  route: {
    params: {
      amount: number;
      currency: string;
      recipientName: string;
      recipientCountry: string;
      exchangeRate: number;
      amountReceived: number;
      receivedCurrency: string;
    };
  };
}

const DeliveryOptionsScreen: React.FC<Props> = ({ navigation, route }) => {
  const params = route?.params ?? {
    amount: 500,
    currency: "USD",
    recipientName: "Recipient",
    recipientCountry: "Nigeria",
    exchangeRate: 1450,
    amountReceived: 725000,
    receivedCurrency: "NGN",
  };

  const [selected, setSelected] = useState<DeliveryMethod>("bank_transfer");

  const selectedOption = DELIVERY_OPTIONS.find((o) => o.key === selected)!;

  const handleContinue = () => {
    navigation.navigate("ReviewSend", {
      ...params,
      deliveryMethod: selected,
      fee: selectedOption.fee,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={moderateScale(22)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Delivery Method</Text>
        <View style={{ width: moderateScale(22) }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: responsiveHeight(2) }}>
        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sending</Text>
            <Text style={styles.summaryValue}>${params.amount.toFixed(2)} {params.currency}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Recipient receives</Text>
            <Text style={[styles.summaryValue, { color: "#34A853" }]}>
              {params.amountReceived.toLocaleString()} {params.receivedCurrency}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Choose how to deliver</Text>

        {DELIVERY_OPTIONS.map((option) => {
          const isSelected = selected === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              style={[styles.optionCard, isSelected && styles.optionCardSelected]}
              onPress={() => setSelected(option.key)}
              activeOpacity={0.8}
            >
              <View style={[styles.optionIconWrap, isSelected && styles.optionIconWrapActive]}>
                <MaterialCommunityIcons
                  name={option.icon as any}
                  size={moderateScale(24)}
                  color={isSelected ? "#fff" : "#0B3963"}
                />
              </View>

              <View style={styles.optionContent}>
                <View style={styles.optionHeader}>
                  <Text style={[styles.optionTitle, isSelected && styles.optionTitleActive]}>{option.title}</Text>
                  <Text style={[styles.optionFee, isSelected && styles.optionFeeActive]}>+${option.fee.toFixed(2)}</Text>
                </View>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                <View style={styles.speedRow}>
                  <Feather name="clock" size={moderateScale(12)} color={isSelected ? "#1568B8" : "#888"} />
                  <Text style={[styles.speedText, isSelected && styles.speedTextActive]}>{option.speed}</Text>
                </View>
                {option.countries ? (
                  <Text style={styles.countriesText}>Available in: {option.countries.join(", ")}</Text>
                ) : null}
              </View>

              <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                {isSelected ? <View style={styles.radioInner} /> : null}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Fee summary */}
        <View style={styles.feeSummaryCard}>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Transfer amount</Text>
            <Text style={styles.feeValue}>${params.amount.toFixed(2)}</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Delivery fee ({selectedOption.title})</Text>
            <Text style={styles.feeValue}>+${selectedOption.fee.toFixed(2)}</Text>
          </View>
          <View style={[styles.feeRow, styles.feeTotalRow]}>
            <Text style={styles.feeTotalLabel}>Total you pay</Text>
            <Text style={styles.feeTotalValue}>${(params.amount + selectedOption.fee).toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
          <Feather name="arrow-right" size={moderateScale(18)} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DeliveryOptionsScreen;

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
  summaryCard: {
    backgroundColor: "#fff",
    marginHorizontal: responsiveWidth(5),
    borderRadius: moderateScale(12),
    padding: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: responsiveHeight(1) },
  summaryLabel: { fontSize: responsiveFontSize(1.5), color: "#666", fontFamily: Fonts.medium },
  summaryValue: { fontSize: responsiveFontSize(1.7), fontFamily: Fonts.bold, color: "#111" },
  divider: { height: 0.5, backgroundColor: "#F0F0F0" },
  sectionLabel: {
    fontSize: responsiveFontSize(1.6),
    fontFamily: Fonts.semiBold,
    color: "#666",
    marginHorizontal: responsiveWidth(5),
    marginBottom: responsiveHeight(1.5),
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    marginHorizontal: responsiveWidth(5),
    borderRadius: moderateScale(12),
    padding: responsiveWidth(4),
    marginBottom: responsiveHeight(1.5),
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  optionCardSelected: { borderColor: "#0B3963", backgroundColor: "#EEF4FF" },
  optionIconWrap: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(10),
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: responsiveWidth(3),
  },
  optionIconWrapActive: { backgroundColor: "#0B3963" },
  optionContent: { flex: 1 },
  optionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  optionTitle: { fontSize: responsiveFontSize(1.8), fontFamily: Fonts.bold, color: "#111" },
  optionTitleActive: { color: "#0B3963" },
  optionFee: { fontSize: responsiveFontSize(1.6), fontFamily: Fonts.semiBold, color: "#666" },
  optionFeeActive: { color: "#0B3963" },
  optionSubtitle: { fontSize: responsiveFontSize(1.4), color: "#666", fontFamily: Fonts.regular, marginBottom: 6 },
  speedRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  speedText: { fontSize: responsiveFontSize(1.3), color: "#888", fontFamily: Fonts.medium },
  speedTextActive: { color: "#1568B8" },
  countriesText: { fontSize: responsiveFontSize(1.2), color: "#AAA", fontFamily: Fonts.regular },
  radioOuter: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    borderWidth: 2,
    borderColor: "#CCCCCC",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: responsiveWidth(2),
  },
  radioOuterActive: { borderColor: "#0B3963" },
  radioInner: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: "#0B3963",
  },
  feeSummaryCard: {
    backgroundColor: "#fff",
    marginHorizontal: responsiveWidth(5),
    borderRadius: moderateScale(12),
    padding: responsiveWidth(4),
    marginTop: responsiveHeight(1),
    marginBottom: responsiveHeight(2),
  },
  feeRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: responsiveHeight(0.8) },
  feeLabel: { fontSize: responsiveFontSize(1.5), color: "#666", fontFamily: Fonts.medium },
  feeValue: { fontSize: responsiveFontSize(1.5), fontFamily: Fonts.semiBold, color: "#111" },
  feeTotalRow: { borderTopWidth: 0.5, borderTopColor: "#E0E0E0", marginTop: 4, paddingTop: responsiveHeight(1) },
  feeTotalLabel: { fontSize: responsiveFontSize(1.7), fontFamily: Fonts.bold, color: "#111" },
  feeTotalValue: { fontSize: responsiveFontSize(1.7), fontFamily: Fonts.bold, color: "#0B3963" },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B3963",
    marginHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(2),
    borderRadius: moderateScale(12),
    marginBottom: responsiveHeight(3),
    gap: 8,
  },
  continueButtonText: { color: "#fff", fontSize: responsiveFontSize(1.8), fontFamily: Fonts.semiBold },
});
