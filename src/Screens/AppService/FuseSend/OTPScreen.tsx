import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";
import { moderateScale } from "react-native-size-matters";
import Fonts from "../../../constants/Fonts";
import { verifyTransactionPin } from "../../../services/userApi";
import { createTransfer, CreateTransferRequest } from "../../../services/paymentApi";

interface Props {
  navigation: any;
  route: { params: { transferData: CreateTransferRequest } };
}

const OTP_LENGTH = 4;
const INITIAL_TIME = 60;

const OTPScreen = ({ navigation, route }: Props) => {
  const transferData = route?.params?.transferData;

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [seconds, setSeconds] = useState(INITIAL_TIME);
  const [activeIndex, setActiveIndex] = useState<number | null>(0);
  const [isFilled, setIsFilled] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (seconds === 0) return;
    const timer = setInterval(() => setSeconds((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const handleChange = (text: string, index: number) => {
    if (!/^\d*$/.test(text)) return;
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    setIsFilled(newOtp.every((v) => v !== ""));
    if (text && index < OTP_LENGTH - 1) {
      setActiveIndex(index + 1);
      inputs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      setActiveIndex(index - 1);
      inputs.current[index - 1]?.focus();
    }
  };

  const handleContinue = async () => {
    if (!isFilled || loading) return;

    const pin = otp.join("");

    try {
      setLoading(true);

      // 1. Verify transaction PIN
      const valid = await verifyTransactionPin(pin);
      if (!valid) {
        Alert.alert("Incorrect PIN", "The PIN you entered is incorrect. Please try again.");
        setOtp(Array(OTP_LENGTH).fill(""));
        setIsFilled(false);
        inputs.current[0]?.focus();
        return;
      }

      // 2. Create transfer
      if (!transferData) {
        Alert.alert("Error", "Transfer data missing. Please go back and try again.");
        return;
      }

      const transaction = await createTransfer(transferData);

      // 3. Navigate to success screen with real transaction
      navigation.navigate("Transaction", { transaction });
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Transfer failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.container}>
        <View style={styles.topbar}>
          <Text style={styles.topTitle}>Enter Transaction PIN</Text>
        </View>

        <Text style={styles.title}>Confirm Your Transfer</Text>
        <Text style={styles.subtitle}>
          Enter your 4-digit transaction PIN to authorise this transfer.
        </Text>

        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputs.current[index] = ref; }}
              style={[styles.otpBox, activeIndex === index && styles.otpActive]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              secureTextEntry
              onFocus={() => setActiveIndex(index)}
              onChangeText={(t) => handleChange(t, index)}
              onKeyPress={({ nativeEvent }) => handleBackspace(nativeEvent.key, index)}
              editable={!loading}
            />
          ))}
        </View>

        <Text style={styles.timerText}>
          {seconds > 0 ? `Session expires in ${seconds}s` : "Session expired"}
        </Text>

        <View style={styles.bottom}>
          <TouchableOpacity
            style={[styles.continueBtn, isFilled && !loading && styles.continueActive]}
            disabled={!isFilled || loading || seconds === 0}
            onPress={handleContinue}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.continueText, isFilled && styles.continueTextActive]}>
                Confirm Transfer
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default OTPScreen;

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: responsiveWidth(6), paddingTop: responsiveHeight(6), backgroundColor: "#fff" },
  topbar: { alignItems: "center", justifyContent: "center" },
  topTitle: { fontSize: responsiveFontSize(2.4), fontFamily: Fonts.semiBold },
  title: { fontSize: responsiveFontSize(2.3), fontFamily: Fonts.semiBold, marginTop: responsiveHeight(2) },
  subtitle: { fontSize: responsiveFontSize(1.5), color: "#777", marginTop: moderateScale(6), fontFamily: Fonts.regular, lineHeight: 22 },
  otpRow: { flexDirection: "row", justifyContent: "space-between", marginTop: responsiveHeight(4) },
  otpBox: {
    width: responsiveWidth(19),
    height: responsiveWidth(19),
    borderRadius: moderateScale(10),
    textAlign: "center",
    fontSize: responsiveFontSize(2.2),
    backgroundColor: "#e5e5e569",
    fontFamily: Fonts.bold,
  },
  otpActive: { borderColor: "#0B3963", borderWidth: 2 },
  timerText: { textAlign: "center", marginTop: responsiveHeight(2), color: "#888", fontFamily: Fonts.regular, fontSize: responsiveFontSize(1.4) },
  bottom: { position: "absolute", bottom: responsiveHeight(4), alignSelf: "center", alignItems: "center" },
  continueBtn: {
    width: responsiveWidth(88),
    height: responsiveHeight(6.5),
    borderRadius: moderateScale(12),
    backgroundColor: "#F5F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  continueActive: { backgroundColor: "#0B3963" },
  continueText: { fontSize: responsiveFontSize(1.9), color: "#1E1E1E", fontFamily: Fonts.regular },
  continueTextActive: { color: "#fff", fontFamily: Fonts.semiBold },
});
