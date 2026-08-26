import React, { useEffect, useState } from "react";
import { View, StyleSheet, SafeAreaView, ImageBackground, Image, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";

import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";

import { moderateScale } from "react-native-size-matters";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Fonts from "../../../constants/Fonts";
import AppText from "../../../Components/Common/AppText";
import AppTextInput from "../../../Components/Common/AppTextInput";
import { mayaRatePrediction, MayaRatePrediction } from "../../../services/mayaApi";
import { currencyForCountry, deliveryOption } from "../../../constants/transfer";

const DEFAULT_DELIVERY_FEE = deliveryOption("bank_transfer").fee;

const FuseRemittance: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  // Prefilled when the user arrives from the recipient-details form.
  const prefill = (useRoute().params ?? {}) as {
    recipientName?: string;
    recipientCountry?: string;
    recipientBank?: string;
    recipientAccount?: string;
  };

  const [amount, setAmount] = useState("");
  const [recipientName, setRecipientName] = useState(prefill.recipientName ?? "");
  const [recipientCountry, setRecipientCountry] = useState(
    prefill.recipientCountry || "Nigeria",
  );
  const [prediction, setPrediction] = useState<MayaRatePrediction | null>(null);
  const [loadingPrediction, setLoadingPrediction] = useState(true);

  const receivedCurrency = currencyForCountry(recipientCountry);

  useEffect(() => {
    if (!receivedCurrency) {
      setPrediction(null);
      setLoadingPrediction(false);
      return;
    }

    let active = true;
    setLoadingPrediction(true);

    // The live rate is fetched server-side and handed to Maya, so the prediction is
    // anchored to a real number instead of a guess.
    void mayaRatePrediction("USD", receivedCurrency)
      .then((data) => {
        if (active) setPrediction(data);
      })
      .catch(() => {
        if (active) setPrediction(null);
      })
      .finally(() => {
        if (active) setLoadingPrediction(false);
      });

    return () => {
      active = false;
    };
  }, [receivedCurrency]);

  const numericAmount = Number(amount) || 0;
  const exchangeRate = prediction?.currentRate ?? 0;
  const amountReceived = numericAmount * exchangeRate;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <AppText style={styles.headerTitle}>FUSE SMART REMITTANCE</AppText>

        <ImageBackground
          source={require("../../../../assets/mainbg.png")}
          style={styles.predictionContainer}
          imageStyle={{ resizeMode: "contain" }}
        >
          <View style={styles.predictionHeader}>
            <Image
              source={require("../../../../assets/robot.png")}
              style={styles.robot}
            />
            <AppText style={styles.predictionTitle}>
              Maya’s FUSE Rate Prediction
            </AppText>
          </View>

          {loadingPrediction ? (
            <ActivityIndicator color="#FFFFFF" style={{ marginVertical: 16 }} />
          ) : !prediction ? (
            <View style={styles.recommendCard}>
              <AppText style={styles.recommendText}>
                {receivedCurrency
                  ? "Maya couldn’t reach the rate service. Pull back and try again in a moment."
                  : `We don’t support payouts to “${recipientCountry || "that country"}” yet.`}
              </AppText>
            </View>
          ) : (
            <>
          <View style={styles.rateCard}>
            <View style={{ flex: 1 }}>
              <AppText style={styles.smallLabel}>Current USD → {receivedCurrency}</AppText>
              <AppText style={styles.rateText}>
                {prediction.currentRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </AppText>
              <AppText style={prediction.currentChangePct < 0 ? styles.redText : styles.greenText}>
                {prediction.currentChangePct > 0 ? "+" : ""}
                {prediction.currentChangePct.toFixed(1)}% since last check
              </AppText>
            </View>

            <View style={styles.rightRateBlock}>
              <AppText style={styles.smallLabel}>FUSE Predicted (3 days)</AppText>
              <AppText style={styles.rateText}>
                {prediction.predictedRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </AppText>
              <AppText style={prediction.predictedChangePct < 0 ? styles.redText : styles.greenText}>
                {prediction.predictedChangePct > 0 ? "+" : ""}
                {prediction.predictedChangePct.toFixed(1)}% change
              </AppText>
            </View>
          </View>

          <View style={styles.recommendCard}>
            <Image
              source={require("../../../../assets/robot.png")}
              style={styles.smallRobot}
            />
            <AppText style={styles.recommendText}>{prediction.advice}</AppText>
          </View>
            </>
          )}
        </ImageBackground>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: responsiveHeight(2),
            marginHorizontal: responsiveWidth(5),
          }}
        >
          <MaterialCommunityIcons
            name="pencil-outline"
            size={18}
            color="black"
          />
          <AppText style={[styles.sectionTitle, { marginLeft: 8 }]}>
            Smart International Transfer
          </AppText>
        </View>

        <AppText
          style={[
            styles.youSend,
            {
              marginHorizontal: responsiveWidth(5),
              marginTop: responsiveHeight(1.5),
            },
          ]}
        >
          You Send
        </AppText>

        <View style={styles.sendBox}>
          <View style={styles.amountRow}>
            <AppTextInput
              style={styles.amount}
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ""))}
              keyboardType="decimal-pad"
              placeholder="0"
            />

            <View style={styles.currencyBox}>
              <Image
                source={require("../../../../assets/usa.png")}
                style={styles.flag}
              />
              <AppText style={styles.currencyText}>USD</AppText>

              <Feather
                name="chevron-down"
                size={responsiveFontSize(2)}
                color="#1F2A56"
                style={{ marginLeft: 5 }}
              />
            </View>
          </View>
        </View>

        <View style={styles.exchangeCard}>
          <View>
            <AppText style={styles.exchangeLabel}>Exchange Rate:</AppText>
            <AppText style={styles.exchangeRate}>
              {exchangeRate
                ? `1 USD = ${exchangeRate.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${receivedCurrency}`
                : "Rate unavailable"}
            </AppText>
            <AppText style={styles.optimizedFee}>FUSE Optimized Fee:</AppText>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <AppText style={styles.savings}>
              {amountReceived.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </AppText>
            <AppText style={styles.saveLabel}>
              {receivedCurrency ? `${receivedCurrency} they receive` : "—"}
            </AppText>
            <AppText style={styles.fee}>-${DEFAULT_DELIVERY_FEE.toFixed(2)}</AppText>
          </View>
        </View>

        <AppText style={styles.selectionTitle}>Recipient</AppText>

        <View style={styles.recipientCard}>
          <View style={{ flex: 1 }}>
            <AppTextInput
              style={styles.recipientName}
              value={recipientName}
              onChangeText={setRecipientName}
              placeholder="Recipient full name"
              placeholderTextColor="#999"
            />
            <AppTextInput
              style={styles.recipientSub}
              value={recipientCountry}
              onChangeText={setRecipientCountry}
              placeholder="Recipient country"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <View style={styles.featureSection}>
          <AppText style={styles.featureTitle}>FUSE Enhanced Features</AppText>
          <AppText style={styles.featureItem}>
            • FUSE rate protection for 24 hours
          </AppText>
          <AppText style={styles.featureItem}>
            • Automatic retry if rate improves
          </AppText>
          <AppText style={styles.featureItem}>• Fraud detection & prevention</AppText>
          <AppText style={styles.featureItem}>
            • Smart delivery time optimization
          </AppText>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (numericAmount <= 0 || !recipientName.trim() || !exchangeRate) && { opacity: 0.5 },
          ]}
          disabled={numericAmount <= 0 || !recipientName.trim() || !exchangeRate}
          onPress={() =>
          navigation.navigate("DeliveryOptions", {
            amount: numericAmount,
            currency: "USD",
            recipientName: recipientName.trim(),
            recipientCountry: recipientCountry.trim(),
            recipientBank: prefill.recipientBank,
            recipientAccount: prefill.recipientAccount,
            exchangeRate,
            amountReceived,
            receivedCurrency,
          })
        }
>
          <Image
            source={require("../../../../assets/robot.png")}
            style={styles.buttonRobot}
          />
          <AppText style={styles.buttonText}>Send with FUSE Optimization</AppText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FuseRemittance;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  headerTitle: {
    textAlign: "center",
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.semiBold,
    marginTop: responsiveHeight(5),
    color: "#1F2A50",
  },

  predictionContainer: {
    marginHorizontal: responsiveWidth(5),
    padding: moderateScale(15),
    borderRadius: moderateScale(12),
    backgroundColor: "#1F2A56",
    marginTop: responsiveHeight(3),
  },

  predictionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: responsiveHeight(2),
  },

  robot: {
    width: responsiveWidth(8),
    height: responsiveWidth(8),
    marginRight: responsiveWidth(2),
    resizeMode: "contain",
  },

  predictionTitle: {
    color: "#fff",
    fontSize: responsiveFontSize(1.8),
    fontFamily: Fonts.semiBold,
  },

  rateCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: moderateScale(12),
    borderRadius: moderateScale(10),
    marginBottom: responsiveHeight(1.5),
  },

  rightRateBlock: {
    flex: 1,
    alignItems: "flex-end",
  },

  recommendCard: {
    backgroundColor: "#fff",
    padding: moderateScale(12),
    borderRadius: moderateScale(10),
  },

  smallRobot: {
    width: responsiveWidth(6),
    height: responsiveWidth(6),
    marginBottom: responsiveHeight(1),
    resizeMode: "contain",
  },

  smallLabel: {
    fontSize: responsiveFontSize(1.3),
    color: "#666",
    fontFamily: Fonts.medium,
  },

  rateText: {
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.bold,
    color: "#000",
  },

  redText: {
    fontSize: responsiveFontSize(1.3),
    fontFamily: Fonts.medium,
    color: "#D33",
  },

  greenText: {
    fontSize: responsiveFontSize(1.3),
    fontFamily: Fonts.medium,
    color: "#1E8A4C",
  },

  recommendText: {
    fontSize: responsiveFontSize(1.3),
    fontFamily: Fonts.medium,
    color: "#333",
    flex: 1,
  },

  sectionTitle: {
    fontSize: responsiveFontSize(1.6),
    fontFamily: Fonts.medium,
    color: "#1F2A50",
  },

  sendBox: {
    marginHorizontal: responsiveWidth(5),
    marginTop: responsiveHeight(1),
    backgroundColor: "#1e1e1e0f",
    padding: moderateScale(15),
    borderRadius: moderateScale(10),
  },

  youSend: {
    fontSize: responsiveFontSize(1.4),
    color: "#000",
    fontFamily: Fonts.bold,
  },

  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  amount: {
    fontSize: responsiveFontSize(2.3),
    fontFamily: Fonts.bold,
    color: "#000",
  },

  currencyBox: {
    flexDirection: "row",
    alignItems: "center",
  },

  flag: {
    width: responsiveWidth(6),
    height: responsiveWidth(6),
    marginRight: responsiveWidth(1.5),
  },

  currencyText: {
    fontSize: responsiveFontSize(2.2),
    fontFamily: Fonts.bold,
    color: "#1F2A50",
  },

  exchangeCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: responsiveWidth(5),
    marginTop: responsiveHeight(2),
    padding: moderateScale(15),
    borderRadius: moderateScale(10),
    borderColor: "#1E1E1E",
    borderWidth: 1,
  },

  exchangeLabel: {
    fontSize: responsiveFontSize(1),
    color: "#666",
    fontFamily: Fonts.bold,
  },

  exchangeRate: {
    fontSize: responsiveFontSize(1),
    color: "#000",
  },

  optimizedFee: {
    fontSize: responsiveFontSize(1.4),
    paddingTop: responsiveHeight(1.8),
    fontFamily: Fonts.semiBold,
    color: "#1F2A50",
  },

  savings: {
    color: "green",
    fontFamily: Fonts.semiBold,
    fontSize: responsiveFontSize(2.2),
  },

  saveLabel: {
    fontSize: responsiveFontSize(1.2),
    color: "#888",
    fontFamily: Fonts.semiBold,
  },

  fee: {
    color: "red",
    marginTop: responsiveHeight(0.5),
    fontFamily: Fonts.semiBold,
  },

  selectionTitle: {
    marginHorizontal: responsiveWidth(5),
    marginTop: responsiveHeight(3),
    fontSize: responsiveFontSize(1.6),
    fontFamily: Fonts.semiBold,
    color: "#1F2A50",
  },

  recipientCard: {
    flexDirection: "row",
    marginHorizontal: responsiveWidth(5),
    marginTop: responsiveHeight(1.5),
    backgroundColor: "#ffffff51",
    padding: moderateScale(15),
    borderRadius: moderateScale(10),
  },

  recipientName: {
    fontSize: responsiveFontSize(1.6),
    fontFamily: Fonts.semiBold,
    color: "#000",
  },

  recipientSub: {
    fontSize: responsiveFontSize(1.4),
    color: "#666",
  },

  featureSection: {
    marginHorizontal: responsiveWidth(5),
    marginTop: responsiveHeight(3),
  },

  featureTitle: {
    fontSize: responsiveFontSize(1.6),
    fontFamily: Fonts.semiBold,
    marginBottom: responsiveHeight(1),
    color: "#1F2A50",
  },

  featureItem: {
    fontSize: responsiveFontSize(1.4),
    marginBottom: responsiveHeight(0.5),
    color: "#333",
  },

  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: responsiveWidth(5),
    marginVertical: responsiveHeight(4),
    backgroundColor: "#1F2A50",
    padding: moderateScale(15),
    borderRadius: moderateScale(10),
  },

  buttonRobot: {
    width: responsiveWidth(6),
    height: responsiveWidth(6),
    marginRight: responsiveWidth(2),
    resizeMode: "contain",
  },

  buttonText: {
    color: "#fff",
    fontSize: responsiveFontSize(1.8),
    fontFamily: Fonts.semiBold,
  },
});
