import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
  Switch,
  Modal,
  TextInput,
} from "react-native";

import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";

import { moderateScale } from "react-native-size-matters";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as LocalAuthentication from "expo-local-authentication";
import { setupBiometric, toggleTwoFactor } from "../../services/authApi";
import { verifyTransactionPin } from "../../services/userApi";
import { getAccessTokenAsync, setBiometricToken, hasBiometricEnabled } from "../../services/session";
import Fonts from "../../constants/Fonts";

const SecuritySettingScreen: React.FC = () => {
  const navigation = useNavigation();
  const [twoFactor, setTwoFactor] = useState(false);
  const [biometric, setBiometric] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");

  React.useEffect(() => {
    const checkBiometric = async () => {
      const enabled = await hasBiometricEnabled();
      setBiometric(enabled);
    };
    checkBiometric();
  }, []);

  const handleTwoFactorChange = async (value: boolean) => {
    setIsLoading(true);
    try {
      const token = await getAccessTokenAsync();
      if (!token) {
        alert("Session expired. Please login again.");
        return;
      }
      await toggleTwoFactor(value, token);
      setTwoFactor(value);
    } catch (error) {
      alert("Failed to update 2FA settings.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricChange = async (value: boolean) => {
    if (!value) {
      // Disable
      await setBiometricToken("");
      setBiometric(false);
      return;
    }

    // Enable
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      alert("No biometric hardware or enrollment found on this device.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Confirm identity to enable biometric login",
      });

      if (result.success) {
        setShowPinModal(true);
      }
    } catch (error: any) {
      alert(error.message || "Failed to enable biometric authentication.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSubmit = async () => {
    if (pinInput.length !== 4) return;

    setIsLoading(true);
    try {
      const token = await getAccessTokenAsync();
      if (!token) {
        alert("Session expired.");
        return;
      }

      const valid = await verifyTransactionPin(pinInput);
      if (!valid) {
        alert("Incorrect PIN. Please try again.");
        return;
      }

      const response = await setupBiometric({ pin: pinInput }, token);
      await setBiometricToken(response.biometricToken);
      setBiometric(true);
      setShowPinModal(false);
      alert("Biometric authentication enabled successfully!");
    } catch (error: any) {
      alert(error.message || "Failed to enable biometric authentication.");
    } finally {
      setPinInput("");
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F5F7" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: responsiveHeight(5) }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather
              name="chevron-left"
              size={moderateScale(18)}
              color="#000"
            />
          </TouchableOpacity>

          <Image
            source={require("../../../assets/security.png")}
            style={styles.headerImage}
            resizeMode="contain"
          />

          <View style={{ width: responsiveWidth(6) }} />
        </View>

        <Text style={styles.title}>SECURITY SETTINGS</Text>

        {menuRow(
          "Change Password",
          "Update our current password to ensure your account remains secure",
          require("../../../assets/user.png"),
          <Feather name="chevron-right" size={moderateScale(18)} />,
          () => navigation.navigate("ChangePassword" as never),
        )}

        {menuRow(
          "Two-Factor Authentication",
          "Enhance security of your account by requiring a second verification process",
          require("../../../assets/two.png"),
          <Switch
            value={twoFactor}
            onValueChange={handleTwoFactorChange}
            thumbColor="#FFFFFF"
            trackColor={{ false: "#ccc", true: "#253B6E" }}
            disabled={isLoading}
          />,
        )}

          {menuRow(
            "Biometric Authentication",
            "Use your device's biometric for a quick and secure login.",
            require("../../../assets/bio.png"),
            <Switch
              value={biometric}
              onValueChange={handleBiometricChange}
              thumbColor="#FFFFFF"
              trackColor={{ false: "#ccc", true: "#253B6E" }}
              disabled={isLoading}
            />,
          )}

        {menuRow(
          "Security Questions",
          "Add an extra layer of security by setting up security questions.",
          require("../../../assets/user.png"),
          <Feather name="chevron-right" size={moderateScale(18)} />,
          () => navigation.navigate("SecurityQuestion" as never),
        )}
      </ScrollView>

      <Modal visible={showPinModal} transparent animationType="fade" onRequestClose={() => setShowPinModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Enter Transaction PIN</Text>
            <Text style={styles.modalSubtitle}>Confirm your 4-digit PIN to enable biometric login.</Text>
            <TextInput
              style={styles.pinInput}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              value={pinInput}
              onChangeText={setPinInput}
              autoFocus
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setShowPinModal(false);
                  setPinInput("");
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handlePinSubmit}
                disabled={pinInput.length !== 4 || isLoading}
              >
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SecuritySettingScreen;

const menuRow = (
  title: string,
  subtitle: string,
  icon: any,
  rightComponent: React.ReactNode,
  onPress?: () => void,
) => {
  return (
    <TouchableOpacity
      style={styles.menuCard}
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.leftSection}>
        <Image source={icon} style={styles.menuIcon} />

        <View style={styles.textContainer}>
          <Text style={styles.menuTitle}>{title}</Text>
          <Text style={styles.menuSubtitle}>{subtitle}</Text>
        </View>
      </View>

      {rightComponent}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F5F7",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(5),
    marginTop: responsiveHeight(5),
  },

  headerImage: {
    width: responsiveWidth(35),
    height: responsiveHeight(5.5),
  },

  title: {
    textAlign: "center",
    fontSize: responsiveFontSize(2.1),
    fontFamily: Fonts.bold,
    marginTop: responsiveHeight(2),
    marginBottom: responsiveHeight(2),
    color: "#000000",
  },

  menuCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#98939309",
    marginHorizontal: responsiveWidth(5),
    paddingVertical: responsiveWidth(4),
    paddingHorizontal: responsiveWidth(4),
    borderRadius: moderateScale(8),
    marginBottom: responsiveHeight(1.5),
  },

  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  menuIcon: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    resizeMode: "contain",
    marginRight: responsiveWidth(3),
  },

  textContainer: {
    flex: 1,
    justifyContent: "center",
  },

  menuTitle: {
    fontSize: responsiveFontSize(1.7),
    fontFamily: Fonts.bold,
    color: "#1F2A50",
  },

  menuSubtitle: {
    fontSize: responsiveFontSize(1.5),
    color: "#6B6B6B",
    marginTop: responsiveHeight(0.3),
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalCard: {
    width: responsiveWidth(80),
    backgroundColor: "#fff",
    borderRadius: moderateScale(14),
    padding: responsiveWidth(6),
  },

  modalTitle: {
    fontSize: responsiveFontSize(1.9),
    fontFamily: Fonts.bold,
    color: "#1F2A50",
    textAlign: "center",
  },

  modalSubtitle: {
    fontSize: responsiveFontSize(1.4),
    color: "#6B6B6B",
    textAlign: "center",
    marginTop: responsiveHeight(1),
  },

  pinInput: {
    marginTop: responsiveHeight(2.5),
    height: responsiveHeight(6.5),
    borderRadius: moderateScale(10),
    backgroundColor: "#1e1e1e0f",
    textAlign: "center",
    fontSize: responsiveFontSize(2.4),
    letterSpacing: 8,
    fontFamily: Fonts.bold,
  },

  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: responsiveHeight(2.5),
    gap: responsiveWidth(3),
  },

  modalCancelBtn: {
    flex: 1,
    height: responsiveHeight(6),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: "#C7CBD6",
    justifyContent: "center",
    alignItems: "center",
  },

  modalCancelText: {
    color: "#1F2A50",
    fontFamily: Fonts.semiBold,
    fontSize: responsiveFontSize(1.6),
  },

  modalConfirmBtn: {
    flex: 1,
    height: responsiveHeight(6),
    borderRadius: moderateScale(10),
    backgroundColor: "#1F2A50",
    justifyContent: "center",
    alignItems: "center",
  },

  modalConfirmText: {
    color: "#fff",
    fontFamily: Fonts.semiBold,
    fontSize: responsiveFontSize(1.6),
  },
});
