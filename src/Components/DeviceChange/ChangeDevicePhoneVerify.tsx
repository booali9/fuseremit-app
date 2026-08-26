import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Keyboard } from "react-native";

import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";

import { moderateScale } from "react-native-size-matters";
import { Feather } from "@expo/vector-icons";

import ChangeDevicePhoneVerifyModal from "./ChangeDevicePhoneVerifyModal";
import Fonts from "../../constants/Fonts";
import AppText from "../Common/AppText";
import AppTextInput from "../Common/AppTextInput";

interface Props {
  navigation: any;
}

const OTP_LENGTH = 4;
const INITIAL_TIME = 60;

const ChangeDevicePhoneVerify = ({ navigation }: Props) => {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [seconds, setSeconds] = useState(INITIAL_TIME);
  const [activeIndex, setActiveIndex] = useState(0);

  const [modalVisible, setModalVisible] = useState(false);

  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (seconds === 0) return;
    const timer = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const checkOtpFilled = (arr: string[]) => {
    const filled = arr.every((v) => v !== "");
    if (filled) {
      Keyboard.dismiss();
      setTimeout(() => setModalVisible(true), 150);
    }
  };

  const handleChange = (text: string, index: number) => {
    if (!/^\d*$/.test(text)) return;

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < OTP_LENGTH - 1) {
      setActiveIndex(index + 1);
      inputs.current[index + 1]?.focus();
    }

    if (text && index === OTP_LENGTH - 1) {
      setActiveIndex(-1);
    }

    checkOtpFilled(newOtp);
  };

  const handleFocus = (index: number) => {
    setActiveIndex(index);
  };

  const handleBackspace = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      setActiveIndex(index - 1);
      inputs.current[index - 1]?.focus();
    }
  };

  const resendCode = () => {
    if (seconds === 0) {
      setSeconds(INITIAL_TIME);
      setOtp(Array(OTP_LENGTH).fill(""));
      setActiveIndex(0);
      inputs.current[0]?.focus();
    }
  };

  const formatTime = () => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={moderateScale(22)} />
          </TouchableOpacity>

          <Image
            source={require("../../../assets/login.png")}
            resizeMode="contain"
            style={styles.logo}
          />

          <View style={{ width: moderateScale(26) }} />
        </View>

        <AppText style={styles.title}>Verify Your Phone Number</AppText>
        <AppText style={styles.subtitle}>
          Please enter the 4-digit code we sent to 080 **** **78.
        </AppText>

        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <AppTextInput
              key={index}
              ref={(ref) => {
                inputs.current[index] = ref;
              }}
              style={[styles.otpBox, activeIndex === index && styles.otpActive]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onFocus={() => handleFocus(index)}
              onChangeText={(t) => handleChange(t, index)}
              onKeyPress={({ nativeEvent }) =>
                handleBackspace(nativeEvent.key, index)
              }
            />
          ))}
        </View>

        <View style={styles.bottom}>
          <TouchableOpacity
            style={[styles.resendBtn, seconds === 0 && styles.resendActive]}
            disabled={seconds !== 0}
            onPress={resendCode}
          >
            <AppText
              style={[
                styles.resendText,
                seconds === 0 && styles.resendTextActive,
              ]}
            >
              Resend Code
            </AppText>
          </TouchableOpacity>

          <AppText style={styles.timer}>
            {seconds === 0
              ? "You can resend now"
              : `Resend code in ${formatTime()}`}
          </AppText>
        </View>

        {/* Modal */}
        <ChangeDevicePhoneVerifyModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          navigation={navigation}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChangeDevicePhoneVerify;

/* 🔴 styles SAME — untouched */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: responsiveWidth(6),
    paddingTop: responsiveHeight(6),
    backgroundColor: "#fff",
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    width: responsiveWidth(50),
    height: responsiveHeight(5),
  },
  title: {
    fontSize: responsiveFontSize(2.3),
    fontFamily: Fonts.semiBold,
    marginTop: responsiveHeight(2),
  },
  subtitle: {
    fontSize: responsiveFontSize(1.5),
    color: "#777",
    marginTop: moderateScale(6),
    fontFamily: Fonts.regular,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: responsiveHeight(2),
  },
  otpBox: {
    width: responsiveWidth(19),
    height: responsiveWidth(19),
    borderRadius: moderateScale(10),
    textAlign: "center",
    fontSize: responsiveFontSize(2.2),
    backgroundColor: "#e5e5e569",
  },
  otpActive: {
    borderColor: "#FB002E",
    borderWidth: 1.5,
  },
  bottom: {
    position: "absolute",
    bottom: responsiveHeight(4),
    alignSelf: "center",
    alignItems: "center",
  },
  resendBtn: {
    width: responsiveWidth(88),
    height: responsiveHeight(6.5),
    borderRadius: moderateScale(12),
    backgroundColor: "#F5F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  resendActive: {
    backgroundColor: "#0B3963",
  },
  resendText: {
    fontSize: responsiveFontSize(1.8),
    color: "#1E1E1E",
    fontFamily: Fonts.regular,
  },
  resendTextActive: {
    color: "#fff",
  },
  timer: {
    marginTop: moderateScale(10),
    fontSize: responsiveFontSize(1.4),
    color: "#555",
    fontFamily: Fonts.regular,
  },
});
