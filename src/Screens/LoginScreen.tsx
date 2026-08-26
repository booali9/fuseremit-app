import { useState } from "react";
import { View, StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";
import { moderateScale, scale } from "react-native-size-matters";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { biometricLogin, requestEmailLoginOtp } from "../services/authApi";
import { getBiometricToken, hasBiometricEnabled, setSession } from "../services/session";
import { resetToDashboardOrKyc } from "../navigation/navigationHelpers";
import { syncFcmTokenWithBackend } from "../services/notifications";
import * as LocalAuthentication from "expo-local-authentication";
import React, { useEffect } from "react";
import Fonts from "../constants/Fonts";
import PhoneNumberInput from "../Components/Common/PhoneNumberInput";
import AppText from "../Components/Common/AppText";
import AppTextInput from "../Components/Common/AppTextInput";

interface Props {
  navigation: any;
}

const LoginScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [secureEntry, setSecureEntry] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  useEffect(() => {
    const checkBiometric = async () => {
      const enabled = await hasBiometricEnabled();
      setIsBiometricAvailable(enabled);
    };
    checkBiometric();
  }, []);

  const isValidPhone = /^\+?\d{10,20}$/.test(phoneNumber.trim());
  const isValidPassword = password.length >= 8;
  const isFormValid = isValidPhone && isValidPassword;

  const handleContinue = async () => {
    if (!isFormValid || isSubmitting) return;

    try {
      setErrorMessage("");
      setIsSubmitting(true);

      const identifier = phoneNumber.trim();
      const data = await requestEmailLoginOtp({ phoneNumber: identifier, password });

      if (data.accessToken && data.user) {
        // Direct login if 2FA is disabled
        await setSession({
          accessToken: data.accessToken,
          user: {
            id: data.user.id,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            email: data.user.email,
            // mapping other fields if necessary
          } as any,
        });
        void syncFcmTokenWithBackend();
        await resetToDashboardOrKyc(navigation);
      } else {
        // 2FA flow
        navigation.navigate("PhoneNumberVerify", {
          challengeId: data.challengeId,
          identifier: identifier.trim(),
        });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to continue. Please try again.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBiometricLogin = async () => {
    const token = await getBiometricToken();
    if (!token) return;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Sign in with Biometrics",
    });

    if (result.success) {
      try {
        setIsSubmitting(true);
        setErrorMessage("");
        
        const data = await biometricLogin({ biometricToken: token });
        
        await setSession({
          accessToken: data.accessToken,
          user: data.user,
        });

        void syncFcmTokenWithBackend();
        await resetToDashboardOrKyc(navigation);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Biometric login failed");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <Image
          source={require("../../assets/login.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <AppText style={styles.title}>Log In</AppText>

        <View style={styles.subtitleRow}>
          <AppText style={styles.subtitle}>Don’t have an account?</AppText>

          <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
            <AppText style={styles.link}> Sign Up</AppText>
          </TouchableOpacity>
        </View>

        <AppText style={styles.label}>Phone Number</AppText>
        <View
          style={[
            styles.inputContainer,
            !isValidPhone && phoneNumber.length > 0 && styles.inputError,
            isValidPhone && styles.inputSuccess,
          ]}
        >
          <PhoneNumberInput
            value={phoneNumber}
            onChangeValue={setPhoneNumber}
            placeholder="e.g. 1234567890"
          />
          {isValidPhone && (
            <Feather name="check" size={20} color="#1DB954" style={styles.validationIcon} />
          )}
        </View>

        <AppText style={styles.label}>Password</AppText>
        <View
          style={[
            styles.inputContainer,
            !isValidPassword && password.length > 0 && styles.inputError,
            isValidPassword && styles.inputSuccess,
          ]}
        >
          <AppTextInput
            style={styles.input}
            placeholder="Enter your password"
            secureTextEntry={secureEntry}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setSecureEntry(!secureEntry)}>
            <Feather
              name={secureEntry ? "eye-off" : "eye"}
              size={20}
              color="#777"
              style={styles.eyeIcon}
            />
          </TouchableOpacity>
        </View>

        {errorMessage ? (
          <AppText style={styles.errorText}>{errorMessage}</AppText>
        ) : null}

        <TouchableOpacity
          style={[
            styles.button,
            { bottom: insets.bottom + responsiveHeight(2) },
            isFormValid && !isSubmitting && styles.buttonActive,
          ]}
          disabled={!isFormValid || isSubmitting}
          onPress={handleContinue}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <AppText
              style={[
                styles.buttonText,
                isFormValid && !isSubmitting && styles.buttonTextActive,
              ]}
            >
              Continue
            </AppText>
          )}
        </TouchableOpacity>

        {isBiometricAvailable && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricLogin}
            disabled={isSubmitting}
          >
            <Ionicons name="finger-print" size={moderateScale(32)} color="#0B3963" />
            <AppText style={styles.biometricText}>Login with Biometrics</AppText>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: responsiveWidth(6),
    paddingTop: responsiveHeight(6),
    backgroundColor: "#fff",
  },

  logo: {
    width: responsiveWidth(55),
    height: responsiveHeight(10),
    alignSelf: "center",
    marginBottom: responsiveHeight(5),
  },

  title: {
    fontSize: responsiveFontSize(2.4),
    fontFamily: Fonts.semiBold,
  },

  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: moderateScale(6),
  },

  subtitle: {
    fontSize: responsiveFontSize(1.4),
    color: "#777",
    fontFamily: Fonts.regular,
  },

  link: {
    color: "#000",
    fontFamily: Fonts.semiBold,
    fontSize: scale(10),
  },

  label: {
    marginTop: responsiveHeight(2),
    marginBottom: moderateScale(3),
    fontSize: responsiveFontSize(1.4),
    color: "#000",
    fontFamily: Fonts.semiBold,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.4,
    borderColor: "#E5476E",
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    height: responsiveHeight(6.2),
    backgroundColor: "#1e1e1e0c",
  },

  inputError: {
    borderColor: "#FB002E",
    backgroundColor: "#1e1e1e0c",
  },

  inputSuccess: {
    borderWidth: 1.2,
    borderColor: "#1DB954",
    backgroundColor: "#1e1e1e0c",
  },

  input: {
    flex: 1,
    fontSize: responsiveFontSize(1.6),
    fontFamily: Fonts.regular,
    color: "#000",
  },

  validationIcon: {
    marginLeft: moderateScale(8),
  },

  eyeIcon: {
    marginHorizontal: moderateScale(5),
  },

  errorText: {
    color: "#FB002E",
    marginTop: responsiveHeight(1),
    fontSize: responsiveFontSize(1.4),
    fontFamily: Fonts.semiBold,
  },

  button: {
    position: "absolute",
    alignSelf: "center",
    width: responsiveWidth(88),
    height: responsiveHeight(6.5),
    borderRadius: moderateScale(12),
    backgroundColor: "#D6DEE4",
    justifyContent: "center",
    alignItems: "center",
  },

  buttonActive: {
    backgroundColor: "#0B3963",
  },

  buttonText: {
    color: "#9AA3AA",
    fontSize: responsiveFontSize(1.8),
    fontFamily: Fonts.regular,
  },

  buttonTextActive: {
    color: "#fff",
  },

  biometricButton: {
    marginTop: responsiveHeight(4),
    alignSelf: "center",
    alignItems: "center",
  },

  biometricText: {
    marginTop: moderateScale(5),
    fontSize: responsiveFontSize(1.4),
    color: "#0B3963",
    fontFamily: Fonts.semiBold,
  },
});
