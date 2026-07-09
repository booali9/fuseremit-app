import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
} from "react-native";

import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";

import { moderateScale } from "react-native-size-matters";

import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { biometricLogin, requestForgotPinOtp } from "../../services/authApi";
import { resetToDashboardOrKyc } from "../../navigation/navigationHelpers";
import { getBiometricToken, setSession } from "../../services/session";
import { Alert } from "react-native";

const ChangeDevicePin = ({ navigation, route }: { navigation: any; route?: any }) => {
  const [pin, setPin] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const email = route?.params?.email;

  const handlePress = (num: string) => {
    if (pin.length < 6) {
      setPin(pin + num);
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleForgotPin = async () => {
    if (!email) {
      alert("Email not found. Please try logging in again.");
      return;
    }

    setLoading(true);
    try {
      const data = await requestForgotPinOtp({ email });
      // Reuse PhoneNumberVerify but we might need to update it to handle PIN reset
      // For now, navigate to it with the challenge
      navigation.navigate("PhoneNumberVerify", {
        challengeId: data.challengeId,
        email,
        purpose: "forgot_pin",
        otp: data.otp,
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to request PIN reset");
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    const token = await getBiometricToken();
    if (!token) {
      alert("Biometric login not enabled on this device.");
      return;
    }

    setLoading(true);
    try {
      const data = await biometricLogin({ biometricToken: token });
      await setSession({
        accessToken: data.accessToken,
        user: data.user,
      });
      await resetToDashboardOrKyc(navigation);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Biometric login failed");
    } finally {
      setLoading(false);
    }
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
    <TouchableOpacity
      style={styles.key}
      activeOpacity={0.7}
      onPress={() => handlePress(value)}
    >
      <Text style={styles.keyText}>{value}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity>
          <Ionicons name="arrow-back" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>

        <Image
          source={require("../../../assets/login.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={{ width: moderateScale(24) }} />
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Create your Pin</Text>

        <Text style={styles.subtitle}>
          This is requested after device change and to confirm transactions
        </Text>
      </View>

      <View style={styles.dotsContainer}>
        {[0, 1, 2, 3, 4, 5].map(renderDot)}
      </View>

      <View style={styles.keypadContainer}>
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
          <TouchableOpacity 
            style={styles.key}
            onPress={handleBiometricLogin}
            disabled={loading}
          >
            <MaterialIcons
              name="fingerprint"
              size={moderateScale(26)}
              color={loading ? "#ccc" : "#000"}
            />
          </TouchableOpacity>

          <NumberButton value="0" />

          <TouchableOpacity style={styles.key} onPress={handleDelete}>
            <Ionicons
              name="backspace-outline"
              size={moderateScale(26)}
              color="#000"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleForgotPin} disabled={loading}>
          <Text style={styles.forgot}>Forgot your PIN?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ChangeDevicePin;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  /* TOP BAR */
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(5),
    marginTop: responsiveHeight(1),
  },

  logo: {
    width: responsiveWidth(35),
    height: responsiveHeight(5),
  },

  /* HEADER */
  header: {
    marginTop: responsiveHeight(3),
    paddingHorizontal: responsiveWidth(6),
  },

  title: {
    fontSize: responsiveFontSize(2.4),
    fontWeight: "600",
    color: "#000",
  },

  subtitle: {
    fontSize: responsiveFontSize(1.6),
    color: "#6B7280",
    marginTop: responsiveHeight(0.7),
  },

  /* DOTS */
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: responsiveHeight(4),
  },

  dot: {
    width: moderateScale(14),
    height: moderateScale(14),
    borderRadius: moderateScale(7),
    marginHorizontal: moderateScale(7),
  },

  /* KEYPAD */
  keypadContainer: {
    marginTop: responsiveHeight(7),
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginVertical: responsiveHeight(1.5),
  },

  key: {
    width: responsiveWidth(20),
    height: responsiveWidth(15),
    justifyContent: "center",
    alignItems: "center",
  },

  keyText: {
    fontSize: responsiveFontSize(3.2),
    color: "#000",
    fontWeight: "500",
  },

  /* FOOTER */
  footer: {
    position: "absolute",
    bottom: responsiveHeight(4),
    left: responsiveWidth(6),
    right: responsiveWidth(6),
    flexDirection: "row",
    justifyContent: "space-between",
  },

  forgot: {
    color: "#22C55E",
    fontSize: responsiveFontSize(1.6),
  },

  logout: {
    color: "#EF4444",
    fontSize: responsiveFontSize(1.6),
  },
});
