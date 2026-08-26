import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StatusBar, SafeAreaView } from "react-native";

import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";

import { moderateScale } from "react-native-size-matters";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Fonts from "../../constants/Fonts";

import { useLanguage } from "../../context/LanguageContext";
import AppText from "../../Components/Common/AppText";
import AppTextInput from "../../Components/Common/AppTextInput";

const FuseSendScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { t, isRTL } = useLanguage();
  
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");

  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [country, setCountry] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const [showDropdown, setShowDropdown] = useState(false);

  const countryOptions = ["Pakistan", "USA", "UK", "Canada"];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={[styles.headerWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity
              style={[styles.backBtn, { [isRTL ? 'right' : 'left']: responsiveWidth(-1), position: 'absolute' }]}
              onPress={() => navigation.goBack()}
            >
              <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={moderateScale(20)} />
            </TouchableOpacity>

            <AppText style={styles.title}>{t("sendMoney.title")}</AppText>
          </View>
          
          <AppText style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t("sendMoney.senderInfo")}
          </AppText>

          <Input
            label={t("sendMoney.fullName")}
            placeholder={t("sendMoney.enterName")}
            value={senderName}
            setValue={setSenderName}
            isRTL={isRTL}
          />

          <Input
            label={t("sendMoney.emailAddress")}
            placeholder={t("sendMoney.enterEmail")}
            value={senderEmail}
            setValue={setSenderEmail}
            isRTL={isRTL}
          />

          <AppText style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t("sendMoney.recipientDetails")}
          </AppText>

          <Input
            label={t("sendMoney.fullName")}
            placeholder={t("sendMoney.enterName")}
            value={recipientName}
            setValue={setRecipientName}
            isRTL={isRTL}
          />

          <Input
            label={t("sendMoney.emailAddress")}
            placeholder={t("sendMoney.enterEmail")}
            value={recipientEmail}
            setValue={setRecipientEmail}
            isRTL={isRTL}
          />

          <View style={{ zIndex: 10 }}>
            <AppText style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t("sendMoney.recipientCountry")}
            </AppText>

            <TouchableOpacity
              style={[styles.inputContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={() => setShowDropdown(!showDropdown)}
            >
              <AppText style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                {country || t("sendMoney.chooseCountry")}
              </AppText>
              <Feather name="chevron-down" size={20} />
            </TouchableOpacity>

            {showDropdown && (
              <View style={styles.dropdownAbsolute}>
                {countryOptions.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setCountry(item);
                      setShowDropdown(false);
                    }}
                  >
                    <AppText style={{ textAlign: isRTL ? 'right' : 'left' }}>{item}</AppText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <Input
            label={t("sendMoney.bankName")}
            placeholder={t("sendMoney.enterBank")}
            value={bankName}
            setValue={setBankName}
            isRTL={isRTL}
          />

          <Input
            label={t("sendMoney.accountNumber")}
            placeholder={t("sendMoney.enterAccount")}
            value={accountNumber}
            setValue={setAccountNumber}
            keyboardType="numeric"
            isRTL={isRTL}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              navigation.navigate("FuseRemittance", {
                recipientName,
                recipientCountry: country,
                recipientBank: bankName,
                recipientAccount: accountNumber,
              })
            }
          >
            <AppText style={styles.buttonText}>{t("sendMoney.continue")}</AppText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default FuseSendScreen;

interface InputProps {
  label: string;
  placeholder: string;
  value: string;
  setValue: (text: string) => void;
  keyboardType?: any;
  isRTL: boolean;
}

const Input = ({
  label,
  placeholder,
  value,
  setValue,
  keyboardType,
  isRTL,
}: InputProps) => (
  <>
    <AppText style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{label}</AppText>
    <View style={[styles.inputContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <AppTextInput
        style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
        placeholder={placeholder}
        placeholderTextColor="#777"
        value={value}
        onChangeText={setValue}
        keyboardType={keyboardType}
      />
    </View>
  </>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  headerWrapper: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(2),
    marginTop: responsiveHeight(5),
  },

  backBtn: {
    position: "absolute",
    left: responsiveWidth(-1),
  },

  title: {
    fontSize: responsiveFontSize(2.1),
    fontFamily: Fonts.bold,
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: responsiveWidth(5),
    paddingBottom: responsiveHeight(1),
  },

  sectionTitle: {
    marginTop: responsiveHeight(2),
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.bold,
  },

  label: {
    marginTop: responsiveHeight(2),
    marginBottom: 3,
    fontSize: responsiveFontSize(1.4),
    fontFamily: Fonts.semiBold,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(8),
    height: responsiveHeight(6.3),
    backgroundColor: "#1e1e1e0f",
  },

  input: {
    flex: 1,
    fontSize: responsiveFontSize(1.6),
    fontFamily: Fonts.semiBold,
  },

  dropdownAbsolute: {
    position: "absolute",
    top: responsiveHeight(10.5),
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 6,
    paddingVertical: 5,
  },

  dropdownItem: {
    padding: moderateScale(12),
  },

  button: {
    marginTop: responsiveHeight(3),
    width: responsiveWidth(91),
    height: responsiveHeight(6.6),
    borderRadius: moderateScale(12),
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#1F2A50",
    marginBottom: responsiveHeight(6),
  },

  buttonText: {
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
  },
});
