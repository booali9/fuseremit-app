import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Image, SafeAreaView, StatusBar, ScrollView, Modal, Pressable } from "react-native";

import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";

import { moderateScale, scale } from "react-native-size-matters";
import { Feather, FontAwesome6 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Fonts from "../../../constants/Fonts";
import AppText from "../../../Components/Common/AppText";
import { mayaFeeTip } from "../../../services/mayaApi";
import { cheapestDeliveryFee } from "../../../constants/transfer";

// ponytail: unreachable since FuseSend now routes to FuseRemittance. Mock data throughout —
// safe to delete once your local changes are committed.

const paymentMethods = [
  { id: "ach", label: "Connected bank account (ACH)", icon: "hand-holding-dollar" },
  { id: "card", label: "Debit / Credit Card", icon: "credit-card" },
  { id: "wire", label: "Wire Transfer", icon: "building-columns" },
];

const SendMoneySecond = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [selectedMethod, setSelectedMethod] = useState(paymentMethods[0]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [feeTip, setFeeTip] = useState("MAYA AI : You could save up to 23.66$");

  useEffect(() => {
    void mayaFeeTip({ amount: 2000, feeTotal: 40, cheapestFee: cheapestDeliveryFee })
      .then((data) => {
        if (data.message) setFeeTip(data.message);
      })
      .catch(() => undefined);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7F7" />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.headerWrapper}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Feather name="chevron-left" size={moderateScale(22)} />
          </TouchableOpacity>

          <AppText style={styles.title}>SEND MONEY</AppText>
        </View>

        <AppText style={styles.label}>You Send</AppText>

        <View style={styles.amountCard}>
          <AppText style={styles.amountText}>2,000</AppText>

          <View style={styles.currencyWrapper}>
            <Image
              source={require("../../../../assets/usa.png")}
              style={styles.flag}
            />
            <AppText style={styles.currencyText}>USD</AppText>
            <Feather
              name="chevron-down"
              size={moderateScale(16)}
              style={{ marginTop: scale(2) }}
            />
          </View>
        </View>

        <View style={styles.discountBar}>
          <AppText style={styles.discountText}>
            Send over 30,000 USD or equivalent to be eligible for discount
          </AppText>
        </View>

        <View style={styles.arrowWrapper}>
          <Image
            source={require("../../../../assets/swap.png")}
            style={styles.swapImage}
          />
        </View>

        {/* RECIPIENT */}
        <AppText style={styles.label}>Recipient gets</AppText>

        <View style={styles.amountCard}>
          <AppText style={styles.amountText}>3,160,000.00</AppText>

          <View style={styles.currencyWrapper}>
            <Image
              source={require("../../../../assets/ngn.png")}
              style={styles.flag}
            />
            <AppText style={styles.currencyText}>NGN</AppText>
            <Feather name="chevron-down" size={moderateScale(18)} />
          </View>
        </View>

        <View style={styles.rateRow}>
          <Image
            source={require("../../../../assets/ngn.png")}
            style={[styles.flag, { marginRight: 8 }]}
          />
          <AppText style={styles.rateText}>NGN 1$ = ₦1,540.00</AppText>
        </View>

        {/* PAYMENT */}
        <AppText style={[styles.label, { marginTop: responsiveHeight(3) }]}>
          Choose your payment method
        </AppText>

        <View style={styles.paymentCard}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <FontAwesome6
              name={selectedMethod.icon}
              style={{ marginRight: scale(10) }}
              size={20}
              color="black"
            />
            <AppText style={styles.paymentText}>{selectedMethod.label}</AppText>
          </View>

          <TouchableOpacity
            style={styles.changeBtn}
            onPress={() => setShowPaymentModal(true)}
          >
            <AppText style={styles.changeText}>Change</AppText>
            <Feather
              name="chevron-right"
              size={moderateScale(12)}
              color="#000"
              style={{ marginLeft: scale(2), marginTop: responsiveHeight(0.4) }}
            />
          </TouchableOpacity>
        </View>

        {/* FEE */}
        <View style={styles.feeBox}>
          <View style={styles.feeRow}>
            <AppText style={styles.feeLabel}>
              {selectedMethod.label} fee
            </AppText>
            <AppText style={styles.feeValue}>19.70 USD</AppText>
          </View>

          <View style={styles.feeRow}>
            <AppText style={styles.feeLabel}>Fuseremit Fee</AppText>
            <AppText style={styles.feeValue}>19.28 USD</AppText>
          </View>

          <View style={styles.divider} />

          <View style={styles.feeRow}>
            <AppText style={styles.totalLabel}>Total Included Fees</AppText>
            <AppText style={styles.totalValue}>40 USD</AppText>
          </View>
        </View>

        <AppText style={styles.saveText}>
          {feeTip}
        </AppText>

        {/* BUTTON */}
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('SendMoneyDetail')}>
          <AppText style={styles.buttonText}>Send Money</AppText>
        </TouchableOpacity>
      </ScrollView>

      {/* Payment Method Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowPaymentModal(false)}
        />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <AppText style={styles.modalTitle}>Select Payment Method</AppText>
            <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
              <Feather name="x" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {paymentMethods.map((method) => {
            const isSelected = selectedMethod.id === method.id;
            return (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodOption,
                  isSelected && styles.methodOptionSelected,
                ]}
                onPress={() => {
                  setSelectedMethod(method);
                  setShowPaymentModal(false);
                }}
              >
                <FontAwesome6
                  name={method.icon}
                  size={20}
                  color={isSelected ? "#1F2A50" : "#555"}
                  style={{ marginRight: scale(12) }}
                />
                <AppText
                  style={[
                    styles.methodLabel,
                    isSelected && styles.methodLabelSelected,
                  ]}
                >
                  {method.label}
                </AppText>
                {isSelected && (
                  <Feather name="check" size={20} color="#1F2A50" style={{ marginLeft: "auto" }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SendMoneySecond;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: responsiveWidth(5),
    paddingBottom: responsiveHeight(4),
  },

  headerWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: responsiveHeight(5),
  },

  backBtn: {
    position: "absolute",
    left: responsiveWidth(0),
  },

  title: {
    fontSize: responsiveFontSize(2.1),
    fontFamily: Fonts.bold,
  },

  label: {
    marginTop: responsiveHeight(2.5),
    fontSize: responsiveFontSize(1.5),
    fontFamily: Fonts.semiBold,
  },

  amountCard: {
    marginTop: responsiveHeight(1),
    height: responsiveHeight(7),
    backgroundColor: "#1e1e1e0f",
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  amountText: {
    fontSize: responsiveFontSize(2.1),
    fontFamily: Fonts.bold,
  },

  currencyWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },

  currencyText: {
    marginHorizontal: 6,
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.bold,
  },

  flag: {
    width: responsiveWidth(6),
    height: responsiveWidth(6),
    borderRadius: 100,
    resizeMode: "cover",
  },

  discountBar: {
    marginTop: responsiveHeight(1),
    backgroundColor: "#0b38634b",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: moderateScale(6),
  },

  discountText: {
    fontSize: responsiveFontSize(1.2),
  },

  arrowWrapper: {
    alignItems: "center",
    marginTop: responsiveHeight(2),
  },

  swapImage: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: "contain",
  },

  rateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: responsiveHeight(1),
  },

  rateText: {
    fontSize: responsiveFontSize(1.4),
    fontFamily: Fonts.semiBold,
  },

  paymentCard: {
    marginTop: responsiveHeight(1),
    height: responsiveHeight(7),
    backgroundColor: "#ECECEC",
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  paymentText: {
    fontSize: responsiveFontSize(1.5),
    fontFamily: Fonts.semiBold,
  },

  changeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF0EE",
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(50),
  },

  changeText: {
    fontSize: responsiveFontSize(1.3),
    fontFamily: Fonts.bold,
    color: "#000",
  },

  feeBox: {
    marginTop: responsiveHeight(2),
    borderWidth: 1,
    borderColor: "#1e1e1e82",
    borderRadius: moderateScale(12),
    padding: moderateScale(10),
  },

  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: responsiveHeight(0.7),
  },

  feeLabel: {
    fontSize: responsiveFontSize(1.2),
    fontFamily: Fonts.semiBold,
  },

  feeValue: {
    fontSize: responsiveFontSize(1.2),
    fontFamily: Fonts.semiBold,
  },

  divider: {
    height: 1,
    backgroundColor: "#CFCFCF",
    marginVertical: responsiveHeight(0.5),
  },

  totalLabel: {
    fontSize: responsiveFontSize(1.2),
    fontFamily: Fonts.semiBold,
  },

  totalValue: {
    fontSize: responsiveFontSize(1.5),
    fontFamily: Fonts.bold,
  },

  saveText: {
    marginTop: responsiveHeight(2),
    fontSize: responsiveFontSize(1.3),
    fontFamily: Fonts.bold,
    color: 'black'
  },

  button: {
    marginTop: responsiveHeight(5),
    height: responsiveHeight(6.6),
    backgroundColor: "#1F2A50",
    borderRadius: moderateScale(12),
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    paddingBottom: responsiveHeight(5),
    paddingHorizontal: responsiveWidth(5),
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: responsiveHeight(2.5),
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginBottom: responsiveHeight(1),
  },

  modalTitle: {
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.bold,
    color: "#1F2A50",
  },

  methodOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: responsiveHeight(2),
    paddingHorizontal: responsiveWidth(3),
    borderRadius: moderateScale(10),
    marginBottom: responsiveHeight(0.5),
  },

  methodOptionSelected: {
    backgroundColor: "#1F2A5010",
  },

  methodLabel: {
    fontSize: responsiveFontSize(1.6),
    fontFamily: Fonts.medium,
    color: "#333",
  },

  methodLabelSelected: {
    fontFamily: Fonts.bold,
    color: "#1F2A50",
  },
});