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
import * as LocalAuthentication from "expo-local-authentication";
import React, { useEffect } from "react";
import Fonts from "../constants/Fonts";

interface Props {
  navigation: any;
}

const LoginScreen = ({ navigation }: Props) => {
  const [identifier, setIdentifier] = useState("");
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

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim());
  const isValidPhone = /^\+?\d{10,20}$/.test(identifier.trim());
  const isIdentifierValid = isValidEmail || isValidPhone;
  const isPasswordFilled = password.length >= 8;
  const isFormValid = isIdentifierValid && isPasswordFilled;

  const handleContinue = async () => {
    if (!isFormValid || isSubmitting) return;

    try {
      setErrorMessage("");
      setIsSubmitting(true);

      const payload = isValidEmail 
        ? { email: identifier.trim().toLowerCase(), password } 
        : { phoneNumber: identifier.trim(), password };

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
        navigation.navigate("AppServiceBottomNavigation");
      } else {
        // 2FA flow
        navigation.navigate("PhoneNumberVerify", {
          challengeId: data.challengeId,
          identifier: identifier.trim(),
          otp: data.otp,
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

        navigation.navigate("AppServiceBottomNavigation");
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

        <Text style={styles.label}>Email or Phone Number</Text>

        <View
          style={[
            styles.inputContainer,
            !isIdentifierValid && identifier.length > 0 && styles.inputError,
            isIdentifierValid && styles.inputSuccess,
          ]}
        >
          <Feather name={isValidPhone ? "phone" : "mail"} size={20} color="#777" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter email or phone number"
            keyboardType="default"
            autoCapitalize="none"
            value={identifier}
            onChangeText={setIdentifier}
          />

          {isIdentifierValid && <Feather name="check" size={20} color="#1DB954" />}
        </View>

        <Text style={styles.label}>Password</Text>

        <View
          style={[
            styles.inputContainer,
            isPasswordFilled && styles.inputSuccess,
          ]}
        >
          <Feather name="lock" size={20} color="#777" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your password (min 8 chars)"
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

          {isPasswordFilled && (
            <Feather name="check" size={20} color="#1DB954" style={{ marginLeft: moderateScale(5) }} />
          )}
        </View>

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
    borderWidth: 1.2,
    borderColor: "#FB002E",
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(10),
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
