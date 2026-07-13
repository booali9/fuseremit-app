import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";
import { moderateScale, scale } from "react-native-size-matters";
import { Feather, Ionicons } from "@expo/vector-icons";
import { biometricLogin, requestEmailLoginOtp } from "../services/authApi";
import { getBiometricToken, hasBiometricEnabled, setSession } from "../services/session";
import { resetToDashboardOrKyc } from "../navigation/navigationHelpers";
import { syncFcmTokenWithBackend } from "../services/notifications";
import * as LocalAuthentication from "expo-local-authentication";
import React, { useEffect } from "react";
import Fonts from "../constants/Fonts";
import PhoneNumberInput from "../Components/Common/PhoneNumberInput";

interface Props {
  navigation: any;
}

type LoginMode = "phone" | "email";

const LoginScreen = ({ navigation }: Props) => {
  const [mode, setMode] = useState<LoginMode>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
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

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValidPhone = /^\+?\d{10,20}$/.test(phoneNumber.trim());
  const isValidPassword = password.length >= 8;
  const isFormValid = mode === "phone" ? isValidPhone : isValidEmail && isValidPassword;

  const handleContinue = async () => {
    if (!isFormValid || isSubmitting) return;

    try {
      setErrorMessage("");
      setIsSubmitting(true);

      const identifier = mode === "phone" ? phoneNumber.trim() : email.trim().toLowerCase();
      const payload = mode === "phone"
        ? { phoneNumber: identifier }
        : { email: identifier, password };

      const data = await requestEmailLoginOtp(payload);

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

        <Text style={styles.title}>Log In</Text>

        <View style={styles.subtitleRow}>
          <Text style={styles.subtitle}>Don’t have an account?</Text>

          <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
            <Text style={styles.link}> Sign Up</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, mode === "phone" && styles.tabActive]}
            onPress={() => {
              setMode("phone");
              setPassword("");
              setErrorMessage("");
            }}
          >
            <Text style={[styles.tabText, mode === "phone" && styles.tabTextActive]}>
              Login with Phone
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, mode === "email" && styles.tabActive]}
            onPress={() => {
              setMode("email");
              setErrorMessage("");
            }}
          >
            <Text style={[styles.tabText, mode === "email" && styles.tabTextActive]}>
              Login with Email
            </Text>
          </TouchableOpacity>
        </View>

        {mode === "phone" ? (
          <>
            <Text style={styles.label}>Phone Number</Text>
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
          </>
        ) : (
          <>
            <Text style={styles.label}>Email Address</Text>
            <View
              style={[
                styles.inputContainer,
                !isValidEmail && email.length > 0 && styles.inputError,
                isValidEmail && styles.inputSuccess,
              ]}
            >
              <Feather name="mail" size={20} color="#777" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              {isValidEmail && (
                <Feather name="check" size={20} color="#1DB954" style={styles.validationIcon} />
              )}
            </View>

            <Text style={styles.label}>Password</Text>
            <View
              style={[
                styles.inputContainer,
                !isValidPassword && password.length > 0 && styles.inputError,
                isValidPassword && styles.inputSuccess,
              ]}
            >
              <Feather name="lock" size={20} color="#777" style={styles.inputIcon} />
              <TextInput
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
          </>
        )}

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        <TouchableOpacity
          style={[
            styles.button,
            isFormValid && !isSubmitting && styles.buttonActive,
          ]}
          disabled={!isFormValid || isSubmitting}
          onPress={handleContinue}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              style={[
                styles.buttonText,
                isFormValid && !isSubmitting && styles.buttonTextActive,
              ]}
            >
              Continue
            </Text>
          )}
        </TouchableOpacity>

        {isBiometricAvailable && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricLogin}
            disabled={isSubmitting}
          >
            <Ionicons name="finger-print" size={moderateScale(32)} color="#0B3963" />
            <Text style={styles.biometricText}>Login with Biometrics</Text>
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

  tabRow: {
    flexDirection: "row",
    marginTop: responsiveHeight(3),
    backgroundColor: "#1e1e1e0c",
    borderRadius: moderateScale(10),
    padding: moderateScale(4),
  },

  tab: {
    flex: 1,
    paddingVertical: responsiveHeight(1.2),
    borderRadius: moderateScale(8),
    alignItems: "center",
  },

  tabActive: {
    backgroundColor: "#0B3963",
  },

  tabText: {
    fontSize: responsiveFontSize(1.4),
    fontFamily: Fonts.semiBold,
    color: "#777",
  },

  tabTextActive: {
    color: "#fff",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.2,
    borderColor: "#ccc",
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

  inputIcon: {
    marginRight: moderateScale(10),
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
    bottom: responsiveHeight(5),
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
