import React, { useCallback, useState } from "react";
import { View, Pressable, TouchableOpacity, StyleSheet, Image, SafeAreaView, StatusBar, ActivityIndicator } from "react-native";

import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";
import { moderateScale } from "react-native-size-matters";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import TransactionPinSuccessModal from "../Onboarding/TransactionPinSuccessModal";
import { getAccessTokenAsync } from "../../services/session";
import { createTransactionPin } from "../../services/userApi";
import Fonts from "../../constants/Fonts";
import AppText from "../../Components/Common/AppText";

interface Props {
  navigation: any;
}

const OnboardingTransactionPin = ({ navigation }: Props) => {
  const [pin, setPin] = useState<string>("");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [helperMessage, setHelperMessage] = useState<string>("");

  const submitPin = useCallback(async (pinValue: string) => {
    const accessToken = await getAccessTokenAsync();

    if (!accessToken) {
      navigation.navigate("Login");
      return;
    }

    try {
      setErrorMessage("");
      setIsSubmitting(true);

      await createTransactionPin(accessToken, pinValue);
      setModalVisible(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create transaction PIN.";

      setErrorMessage(message);
      setPin("");
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const handlePress = (num: string) => {
    if (isSubmitting) return;

    setHelperMessage("");

    setPin((prev) => {
      if (prev.length >= 4) {
        return prev;
      }

      const next = `${prev}${num}`;

      if (next.length === 4) {
        void submitPin(next);
      }

      return next;
    });
  };

  const handleDelete = () => {
    if (isSubmitting) return;
    setHelperMessage("");
    setPin((prev) => prev.slice(0, -1));
  };

  const handleBiometricPress = () => {
    void (async () => {
      setErrorMessage("");

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setHelperMessage("No fingerprint enrolled on this device.");
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Verify your fingerprint",
        fallbackLabel: "Use PIN",
      });

      if (result.success) {
        setHelperMessage("Fingerprint verified. Continue entering your PIN.");
      }
    })();
  };

  const renderDot = (index: number) => {
    const filled = index < pin.length;

    return (
      <View
        key={index}
        style={[
          styles.dot,
          {
            backgroundColor: filled ? "#22C55E" : "#E5E7EB",
          },
        ]}
      />
    );
  };

  const NumberButton = ({ value }: { value: string }) => (
    <Pressable
      style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
      onPressIn={() => handlePress(value)}
    >
      <AppText style={styles.keyText}>{value}</AppText>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={moderateScale(22)} />
        </TouchableOpacity>

        <Image
          source={require("../../../assets/login.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={{ width: moderateScale(24) }} />
      </View>

      <View style={styles.header}>
        <AppText style={styles.title}>Create your Transaction PIN</AppText>
        <AppText style={styles.subtitle}>
          Your PIN should not cotain any repeated or consecutive numbers
        </AppText>
      </View>

      <View style={styles.dotsContainer}>{[0, 1, 2, 3].map(renderDot)}</View>

      <View style={styles.keypadContainer}>
        {isSubmitting ? (
          <View style={styles.submittingState}>
            <ActivityIndicator color="#0B3963" />
            <AppText style={styles.submittingText}>Saving your transaction PIN...</AppText>
          </View>
        ) : null}

        <View style={styles.row}>
          <NumberButton value="1" />
          <NumberButton value="2" />
          <NumberButton value="3" />
        </View>

        <View style={styles.row}>
          <NumberButton value="4" />
          <NumberButton value="5" />
          <NumberButton value="6" />
        </View>

        <View style={styles.row}>
          <NumberButton value="7" />
          <NumberButton value="8" />
          <NumberButton value="9" />
        </View>

        <View style={styles.row}>
          <Pressable
            style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
            onPress={handleBiometricPress}
          >
            <Ionicons
              name="finger-print-outline"
              size={moderateScale(28)}
              color="#000"
            />
          </Pressable>

          <NumberButton value="0" />

          <Pressable
            style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
            onPressIn={handleDelete}
          >
            <Ionicons
              name="backspace-outline"
              size={moderateScale(26)}
              color="#000"
            />
          </Pressable>
        </View>
      </View>

      {errorMessage ? <AppText style={styles.errorText}>{errorMessage}</AppText> : null}
      {!errorMessage && helperMessage ? (
        <AppText style={styles.helperText}>{helperMessage}</AppText>
      ) : null}

      <View style={styles.footer}>
        <AppText style={styles.forgot}>Forgot your PIN?</AppText>
        <AppText style={styles.logout}>Logout</AppText>
      </View>

      <TransactionPinSuccessModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        navigation={navigation}
      />
    </SafeAreaView>
  );
};

export default OnboardingTransactionPin;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(5),
    marginTop: responsiveHeight(5),
  },

  logo: {
    width: responsiveWidth(50),
    height: responsiveHeight(5),
  },

  header: {
    marginTop: responsiveHeight(3),
    paddingHorizontal: responsiveWidth(6),
  },

  title: {
    fontSize: responsiveFontSize(2.4),
    fontFamily: Fonts.semiBold,
    color: "#000",
  },

  subtitle: {
    fontSize: responsiveFontSize(1.6),
    color: "#6B7280",
    marginTop: responsiveHeight(0.7),
    fontFamily: Fonts.semiBold,
  },

  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: responsiveHeight(6),
  },

  dot: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(50),
    marginHorizontal: moderateScale(10),
  },

  keypadContainer: {
    marginTop: responsiveHeight(7),
  },

  submittingState: {
    alignItems: "center",
    marginBottom: responsiveHeight(2),
  },

  submittingText: {
    marginTop: responsiveHeight(1),
    color: "#0B3963",
    fontFamily: Fonts.semiBold,
    fontSize: responsiveFontSize(1.5),
  },

  errorText: {
    marginTop: responsiveHeight(1),
    textAlign: "center",
    color: "#FB002E",
    fontFamily: Fonts.semiBold,
    fontSize: responsiveFontSize(1.4),
  },

  helperText: {
    marginTop: responsiveHeight(1),
    textAlign: "center",
    color: "#0B3963",
    fontFamily: Fonts.semiBold,
    fontSize: responsiveFontSize(1.35),
    paddingHorizontal: responsiveWidth(8),
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginVertical: responsiveHeight(3),
  },

  key: {
    width: responsiveWidth(22),
    height: responsiveWidth(10),
    justifyContent: "center",
    alignItems: "center",
  },

  keyPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.7,
  },

  keyText: {
    fontSize: responsiveFontSize(3.5),
    color: "#000",
    fontFamily: Fonts.bold,
  },

  footer: {
    position: "absolute",
    bottom: responsiveHeight(7),
    left: responsiveWidth(6),
    right: responsiveWidth(6),
    flexDirection: "row",
    justifyContent: "space-between",
  },

  forgot: {
    color: "#27AE60",
    fontSize: responsiveFontSize(1.6),
    fontFamily: Fonts.semiBold,
  },

  logout: {
    color: "#FB002E",
    fontSize: responsiveFontSize(1.6),
    fontFamily: Fonts.semiBold,
  },
});
