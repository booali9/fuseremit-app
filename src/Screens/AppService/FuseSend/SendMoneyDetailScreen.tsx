import React from "react";
import { View, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from "react-native";

import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";

import { moderateScale } from "react-native-size-matters";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Fonts from "../../../constants/Fonts";
import AppText from "../../../Components/Common/AppText";

const SendMoneyDetailScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const RowItem = ({
    label,
    value,
    bold,
  }: {
    label: string;
    value: string;
    bold?: boolean;
  }) => (
    <View style={styles.row}>
      <AppText style={styles.leftText}>{label}</AppText>
      <AppText style={styles.rightText}>{value}</AppText>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7F7" />

      {/* HEADER */}
      <View style={styles.headerWrapper}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Feather name="chevron-left" size={moderateScale(20)} />
        </TouchableOpacity>

        <AppText style={styles.title}>SEND MONEY</AppText>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <RowItem label="You" value="Alex Johnson" />
        <RowItem label="Recipient" value="Abeni Adeyemi" />
        <RowItem label="Bank Name" value="GTB" />
        <RowItem label="Bank Number" value="0405271456" />
        <RowItem label="Sending" value="$2,000.00" />
        <RowItem label="Receiving" value="N2,410,000.00" />
        <RowItem label="Transaction Type" value="Transfer" />
        <RowItem label="Fees" value="$40" />
        <RowItem label="Total" value="$2,090.00" />
        <RowItem label="Transaction Type" value="Transfer" />
        <RowItem label="ETA" value="01 - 02 Days" />
      </ScrollView>

      {/* BOTTOM BUTTON */}
      <View style={styles.buttonWrapper}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("OTP")}
        >
          <AppText style={styles.buttonText}>Send Now</AppText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default SendMoneyDetailScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },

  headerWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: responsiveHeight(5),
    paddingHorizontal: responsiveWidth(5),
  },

  backBtn: {
    position: "absolute",
    left: responsiveWidth(5),
  },

  title: {
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.bold,
  },

  container: {
    paddingHorizontal: responsiveWidth(7),
    paddingTop: responsiveHeight(5),
    paddingBottom: responsiveHeight(15),
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: responsiveHeight(2),
  },

  leftText: {
    fontSize: responsiveFontSize(1.4),
    fontFamily: Fonts.semiBold,
    color: "#000",
  },

  rightText: {
    fontSize: responsiveFontSize(1.4),
    fontFamily: Fonts.semiBold,
    color: "#000",
    textAlign: "right",
    maxWidth: responsiveWidth(50),
  },

  buttonWrapper: {
    position: "absolute",
    bottom: responsiveHeight(3),
    width: "100%",
    paddingHorizontal: responsiveWidth(7),
  },

  button: {
    height: responsiveHeight(6.6),
    backgroundColor: "#1F2A50",
    borderRadius: moderateScale(12),
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(1.9),
    fontFamily: Fonts.bold,
  },
});
