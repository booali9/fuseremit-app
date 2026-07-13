import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";

import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";

import { moderateScale } from "react-native-size-matters";
import { Feather } from "@expo/vector-icons";
import {
  resendEmailLoginOtp,
  verifyEmailLoginOtp,
  verifyForgotPinOtp,
} from "../../services/authApi";
import { setSession } from "../../services/session";
import { resetToDashboardOrKyc } from "../../navigation/navigationHelpers";
import { syncFcmTokenWithBackend } from "../../services/notifications";
import Fonts from "../../constants/Fonts";

interface Props {
  navigation: any;
  route: any;
}

const OTP_LENGTH = 6;
const INITIAL_TIME = 60;

const PhoneNumberVerify = ({ navigation, route }: Props) => {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [seconds, setSeconds] = useState(INITIAL_TIME);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFilled, setIsFilled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const challengeId: string | undefined = route?.params?.challengeId;
  const identifier: string = route?.params?.identifier || route?.params?.email || "";
  const purpose: string = route?.params?.purpose || "login";

  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (seconds === 0) return;
    const timer = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const checkOtpFilled = (arr: string[]) => {
    setIsFilled(arr.every((v) => v !== ""));
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
    void (async () => {
      if (seconds !== 0 || !challengeId || isSubmitting) return;

      try {
        setErrorMessage("");
        setIsSubmitting(true);
        await resendEmailLoginOtp(challengeId);
        setSeconds(INITIAL_TIME);
        setOtp(Array(OTP_LENGTH).fill(""));
        setIsFilled(false);
        setActiveIndex(0);
        inputs.current[0]?.focus();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to resend OTP right now",
        );
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  const handleVerifyCode = () => {
    void (async () => {
      if (!challengeId || !isFilled || isSubmitting) return;

      try {
        setErrorMessage("");
        setIsSubmitting(true);

        if (purpose === "forgot_pin") {
          // For forgot_pin, we need a NEW pin. 
          // However, the verifyForgotPinOtp backend command expects the newPin.
          // Since this screen ONLY captures the OTP, I should either:
          // A: Capture the new pin here (complex UI change)
          // B: Just verify OTP here and then let them set PIN in next screen.
          // Wait, my backend command `verifyForgotPinOtpCommand` DOES expect `newPin`.
          // I should probably change the backend to just verify the OTP and return a temporary token, 
          // OR change the UI to capture the PIN here.
          // Given "without disturbing UI", I'll modify the backend to just verify OTP and return success,
          // then the frontend goes to CreatePin.
          // Wait, I already implemented verifyForgotPinOtpCommand in backend which TAKES newPin.
          
          // Let's reconsider. If I change the backend:
          // verifyForgotPinOtpCommand(challengeId, otp) -> returns boolean.
          // Then frontend goes to CreatePin(token).
          
          // Actually, I'll just change the backend command slightly to make newPin optional 
          // or just implement a separate check.
          
          // Actually, I'll just use a 'resetToken' approach.
          // But I want to keep it simple.
          
          // Let's assume for now I'll just capture the OTP and if valid, 
          // I'll pass the OTP to the NEXT screen (CreatePin) which will then call the final reset.
          // SoPhoneNumberVerify just verifies it? No, backend verifyForgotPinOtp DOES the reset.
          
          // I'll update the backend `verifyForgotPinOtpCommand` to NOT require newPin,
          // and instead return a `resetToken` that CreatePin uses.
          // OR, I'll just have CreatePin take the OTP and challengeId.
          
          // Let's go with: PhoneNumberVerify JUST navigates to CreatePin 
          // and passes the OTP and challengeId to it.
          // Then CreatePin calls the reset.
          
          navigation.navigate("CreatePin", {
            challengeId,
            otp: otp.join(""),
          });
          return;
        }

        const data = await verifyEmailLoginOtp({
          challengeId,
          otp: otp.join(""),
        });

        if (!data.accessToken || data.accessToken.split(".").length !== 3) {
          throw new Error("Login succeeded but no valid access token was returned.");
        }

        await setSession({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
        });

        void syncFcmTokenWithBackend();

        if (data.requiresPinSetup) {
          navigation.navigate("CreatePin");
          return;
        }

        await resetToDashboardOrKyc(navigation);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "OTP verification failed";
        if (message.toLowerCase().includes("invalid otp challenge")) {
          setErrorMessage(
            "This code session expired. Go back, enter your phone again, then verify.",
          );
        } else {
          setErrorMessage(message);
        }
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  const maskedIdentifier = (() => {
    if (identifier.includes("@")) {
      const [name, domain] = identifier.split("@");
      const safeName =
        name.length <= 2 ? `${name[0] || "*"}*` : `${name.slice(0, 2)}***`;
      return `${safeName}@${domain}`;
    }
    // Phone number masking: +1234567890 -> ******7890
    if (identifier.length > 4) {
      return identifier.replace(/.(?=.{4})/g, "*");
    }
    return identifier || "your contact info";
  })();

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

        <Text style={styles.title}>Verify Your Account</Text>
        <Text style={styles.subtitle}>
          Please enter the 6-digit code we sent to {maskedIdentifier}.
        </Text>

        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
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

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        <View style={styles.bottom}>
          <TouchableOpacity
            style={[
              styles.verifyBtn,
              isFilled && !isSubmitting && styles.verifyActive,
            ]}
            disabled={!isFilled || isSubmitting || !challengeId}
            onPress={handleVerifyCode}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={[
                  styles.verifyText,
                  isFilled && !isSubmitting && styles.verifyTextActive,
                ]}
              >
                Verify Code
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.timer}>
            {seconds === 0
              ? "You can resend now"
              : `Resend code in ${formatTime()}`}
          </Text>

          <TouchableOpacity
            onPress={resendCode}
            disabled={seconds !== 0 || isSubmitting || !challengeId}
          >
            <Text
              style={[
                styles.resendLink,
                seconds === 0 && !isSubmitting && styles.resendLinkActive,
              ]}
            >
              Resend Code
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default PhoneNumberVerify;

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
    width: responsiveWidth(13),
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
  errorText: {
    color: "#FB002E",
    marginTop: responsiveHeight(1.5),
    fontSize: responsiveFontSize(1.4),
    fontFamily: Fonts.semiBold,
  },

  bottom: {
    position: "absolute",
    bottom: responsiveHeight(4),
    alignSelf: "center",
    alignItems: "center",
  },
  verifyBtn: {
    width: responsiveWidth(88),
    height: responsiveHeight(6.5),
    borderRadius: moderateScale(12),
    backgroundColor: "#F5F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  verifyActive: {
    backgroundColor: "#0B3963",
  },
  verifyText: {
    fontSize: responsiveFontSize(1.9),
    color: "#1E1E1E",
    fontFamily: Fonts.regular,
  },
  verifyTextActive: {
    color: "#fff",
  },
  timer: {
    marginTop: moderateScale(10),
    fontSize: responsiveFontSize(1.4),
    color: "#555",
    fontFamily: Fonts.regular,
  },
  resendLink: {
    marginTop: responsiveHeight(0.8),
    fontSize: responsiveFontSize(1.5),
    color: "#9AA3AA",
    fontFamily: Fonts.semiBold,
  },
  resendLinkActive: {
    color: "#0B3963",
  },
});
