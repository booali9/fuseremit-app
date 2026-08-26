import React, { useEffect, useState } from "react";
import { View, StyleSheet, SafeAreaView, ImageBackground, Image, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator, Alert } from "react-native";

import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";

import { moderateScale } from "react-native-size-matters";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Audio } from "expo-av";
import { File } from "expo-file-system";
import Fonts from "../../../constants/Fonts";
import AppText from "../../../Components/Common/AppText";
import AppTextInput from "../../../Components/Common/AppTextInput";
import { currencyForCountry, deliveryOption } from "../../../constants/transfer";
import { getExchangeRate } from "../../../services/paymentApi";
import {
  mayaRecipientSuggestions,
  mayaVoiceCommand,
  MayaRecipientSuggestion,
  MayaVoiceCommand,
} from "../../../services/mayaApi";

const mimeTypeForUri = (uri: string) => {
  const ext = uri.split(".").pop()?.toLowerCase();
  if (ext === "wav") return "audio/wav";
  if (ext === "3gp" || ext === "3gpp") return "audio/3gpp";
  return "audio/m4a";
};

const FuseSendVoiceScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [country, setCountry] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [voice, setVoice] = useState<MayaVoiceCommand | null>(null);
  const [voiceError, setVoiceError] = useState("");

  const [suggestions, setSuggestions] = useState<MayaRecipientSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [continuing, setContinuing] = useState(false);

  useEffect(() => {
    void mayaRecipientSuggestions()
      .then(setSuggestions)
      .catch(() => setSuggestions([]))
      .finally(() => setLoadingSuggestions(false));
  }, []);

  const applyVoiceResult = (result: MayaVoiceCommand) => {
    setVoice(result);
    if (result.recipientName) setRecipient(result.recipientName);
    if (result.amount > 0) setAmount(String(result.amount));
    if (result.recipient) {
      setCountry(result.recipient.country);
      setBankName(result.recipient.bank);
      setAccountNumber(result.recipient.account);
    }
  };

  const startRecording = async () => {
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) {
      setVoiceError("Microphone permission is needed for voice commands.");
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording: started } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
    );
    setRecording(started);
    setIsRecording(true);
  };

  const stopAndSend = async () => {
    if (!recording) return;

    setIsRecording(false);
    setProcessing(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (!uri) throw new Error("Recording was not saved.");

      const audioBase64 = await new File(uri).base64();
      const result = await mayaVoiceCommand({
        audioBase64,
        mimeType: mimeTypeForUri(uri),
      });
      applyVoiceResult(result);
    } catch (e) {
      setVoiceError(
        e instanceof Error ? e.message : "Maya could not understand that. Try again.",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleVoicePress = async () => {
    if (processing) return;
    setVoiceError("");

    try {
      if (isRecording) {
        await stopAndSend();
      } else {
        setVoice(null);
        await startRecording();
      }
    } catch (e) {
      setIsRecording(false);
      setProcessing(false);
      setVoiceError(e instanceof Error ? e.message : "Recording failed.");
    }
  };

  /** Voice matched a known recipient — everything is known, so go straight to the PIN. */
  const confirmVoiceTransfer = () => {
    if (!voice?.recipient || !voice.exchange) return;

    const option = deliveryOption(voice.recipient.deliveryMethod);
    navigation.navigate("OTP", {
      transferData: {
        amount: voice.amount,
        currency: voice.currency,
        deliveryMethod: option.key,
        recipientName: voice.recipient.name,
        recipientBank: voice.recipient.bank,
        recipientAccount: voice.recipient.account,
        recipientCountry: voice.recipient.country,
        exchangeRate: voice.exchange.rate,
        fee: option.fee,
        amountReceived: voice.amount * voice.exchange.rate,
        receivedCurrency: voice.exchange.receivedCurrency,
      },
    });
  };

  const continueManually = async () => {
    const numericAmount = Number(amount) || 0;
    const receivedCurrency = currencyForCountry(country);

    if (!recipient.trim() || numericAmount <= 0) {
      setVoiceError("Enter a recipient and an amount to continue.");
      return;
    }
    if (!receivedCurrency) {
      setVoiceError(`We don't support payouts to "${country || "that country"}" yet.`);
      return;
    }

    try {
      setContinuing(true);
      setVoiceError("");
      const rate = await getExchangeRate("USD", receivedCurrency);

      navigation.navigate("DeliveryOptions", {
        amount: numericAmount,
        currency: "USD",
        recipientName: recipient.trim(),
        recipientCountry: country.trim(),
        recipientBank: bankName.trim(),
        recipientAccount: accountNumber.trim(),
        exchangeRate: rate,
        amountReceived: numericAmount * rate,
        receivedCurrency,
      });
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not fetch the rate.");
    } finally {
      setContinuing(false);
    }
  };

  const readyToSend = Boolean(voice?.ready);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Feather name="chevron-left" size={22} />
            </TouchableOpacity>
            <AppText style={styles.headerTitle}>FUSE SEND</AppText>
            <View style={{ width: 22 }} />
          </View>

          <ImageBackground
            source={require("../../../../assets/mainbg.png")}
            style={styles.bgCard}
            imageStyle={{ resizeMode: "contain" }}
          >
            <View style={styles.bgHeader}>
              <Image
                source={require("../../../../assets/robot.png")}
                style={styles.robot}
              />
              <AppText style={styles.bgTitle}>Maya’s FUSE Suggestions</AppText>
            </View>

            {loadingSuggestions ? (
              <ActivityIndicator color="#FFFFFF" style={{ marginVertical: 12 }} />
            ) : suggestions.length === 0 ? (
              <AppText style={styles.emptySuggestions}>
                No past recipients yet — speak or type the details below and Maya will
                remember them for next time.
              </AppText>
            ) : (
              suggestions.map((s) => (
                <TouchableOpacity
                  key={`${s.name}-${s.country}`}
                  style={styles.suggestionCard}
                  onPress={() => {
                    setRecipient(s.name);
                    setAmount(String(s.amount));
                    setCountry(s.country);
                  }}
                >
                  <View style={styles.userRow}>
                    <View style={styles.avatarCircle}>
                      <Feather
                        name="refresh-cw"
                        size={responsiveFontSize(1.2)}
                        color="#1F2A56"
                      />
                    </View>

                    <View>
                      <AppText style={styles.userName}>
                        {s.name}
                        {s.country ? ` (${s.country})` : ""}
                      </AppText>
                      <AppText style={styles.subText}>{s.reason}</AppText>
                    </View>
                  </View>

                  <AppText style={styles.price}>${s.amount}</AppText>
                </TouchableOpacity>
              ))
            )}
          </ImageBackground>

          <View style={styles.voiceSection}>
            <View style={styles.voiceHeader}>
              <MaterialCommunityIcons
                name="microphone"
                size={22}
                color="black"
              />
              <AppText style={styles.voiceHeaderText}>FUSE Voice Command</AppText>
            </View>

            <TouchableOpacity
              style={[
                styles.voiceBox,
                isRecording && { backgroundColor: "#fde2e2" },
              ]}
              activeOpacity={0.8}
              onPress={handleVoicePress}
              disabled={processing}
            >
              <View style={styles.voiceCircle}>
                {processing ? (
                  <ActivityIndicator color="#1F2A56" />
                ) : (
                  <Feather
                    name="mic"
                    size={responsiveFontSize(3)}
                    color={isRecording ? "#B00020" : "#1F2A56"}
                  />
                )}
              </View>

              <AppText style={styles.voiceText}>
                {processing
                  ? "Maya is listening…"
                  : isRecording
                    ? "Tap to stop"
                    : "Tap to Speak"}
              </AppText>
              <AppText style={styles.voiceHint}>
                Try: “Minhal ko 500 dollar bhej do”
              </AppText>
            </TouchableOpacity>

            {voice?.transcript ? (
              <View style={styles.transcriptCard}>
                <AppText style={styles.transcriptLabel}>You said</AppText>
                <AppText style={styles.transcriptText}>“{voice.transcript}”</AppText>
                {voice.reply ? (
                  <AppText style={styles.mayaReply}>{voice.reply}</AppText>
                ) : null}
              </View>
            ) : null}

            {voiceError ? (
              <AppText style={styles.errorText}>{voiceError}</AppText>
            ) : null}
          </View>

          {readyToSend && voice?.recipient && voice.exchange ? (
            <View style={styles.confirmCard}>
              <AppText style={styles.confirmTitle}>Ready to send</AppText>
              <AppText style={styles.confirmAmount}>
                ${voice.amount.toFixed(2)} {voice.currency} → {voice.recipient.name}
              </AppText>
              <AppText style={styles.confirmSub}>
                {voice.recipient.bank ? `${voice.recipient.bank} ` : ""}
                {voice.recipient.account
                  ? `••••${voice.recipient.account.slice(-4)} `
                  : ""}
                {voice.recipient.country}
              </AppText>
              <AppText style={styles.confirmSub}>
                They receive{" "}
                {(voice.amount * voice.exchange.rate).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}{" "}
                {voice.exchange.receivedCurrency} · fee $
                {deliveryOption(voice.recipient.deliveryMethod).fee.toFixed(2)}
              </AppText>

              <TouchableOpacity style={styles.confirmButton} onPress={confirmVoiceTransfer}>
                <Feather name="lock" size={16} color="#fff" />
                <AppText style={styles.confirmButtonText}>Confirm with PIN</AppText>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.manualSection}>
            <View style={styles.manualHeader}>
              <MaterialCommunityIcons
                name="pencil-outline"
                size={18}
                color="#000"
              />
              <AppText style={styles.manualTitle}>Manual Entry</AppText>
            </View>

            <Input
              label="Recipient"
              placeholder="Recipient full name"
              value={recipient}
              setValue={setRecipient}
            />

            <Input
              label="Amount (USD)"
              placeholder="Enter Amount"
              value={amount}
              setValue={(t) => setAmount(t.replace(/[^0-9.]/g, ""))}
              keyboardType="numeric"
            />

            <Input
              label="Recipient Country"
              placeholder="e.g. Nigeria"
              value={country}
              setValue={setCountry}
            />

            <Input
              label="Bank Name"
              placeholder="Enter Bank Name"
              value={bankName}
              setValue={setBankName}
            />

            <Input
              label="Account Number"
              placeholder="Enter Account Number"
              value={accountNumber}
              setValue={setAccountNumber}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, continuing && { opacity: 0.6 }]}
            onPress={() => void continueManually()}
            disabled={continuing}
          >
            {continuing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <AppText style={styles.buttonText}>Continue with FUSE Analysis</AppText>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default FuseSendVoiceScreen;

interface InputProps {
  label: string;
  placeholder: string;
  value: string;
  setValue: (text: string) => void;
  keyboardType?: any;
}

const Input = ({
  label,
  placeholder,
  value,
  setValue,
  keyboardType,
}: InputProps) => (
  <>
    <AppText style={styles.label}>{label}</AppText>
    <View style={styles.inputBox}>
      <AppTextInput
        style={styles.input}
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
  container: { flex: 1, backgroundColor: "#FFF" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: responsiveHeight(5),
    marginHorizontal: responsiveWidth(5),
  },

  headerTitle: {
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.bold,
  },

  bgCard: {
    marginHorizontal: responsiveWidth(5),
    marginTop: responsiveHeight(3),
    padding: moderateScale(15),
    borderRadius: moderateScale(14),
    backgroundColor: "#1F2A56",
  },

  bgHeader: { flexDirection: "row", alignItems: "center" },

  robot: {
    width: responsiveWidth(6),
    height: responsiveWidth(6),
    marginRight: responsiveWidth(2),
    resizeMode: "contain",
  },

  bgTitle: {
    color: "#fff",
    fontSize: responsiveFontSize(1.8),
    fontFamily: Fonts.semiBold,
  },

  emptySuggestions: {
    color: "#D7DEEF",
    fontSize: responsiveFontSize(1.3),
    fontFamily: Fonts.medium,
    marginTop: responsiveHeight(1.5),
  },

  suggestionCard: {
    backgroundColor: "#fff",
    marginTop: responsiveHeight(1.5),
    borderRadius: moderateScale(10),
    padding: moderateScale(12),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  userRow: { flexDirection: "row", alignItems: "center" },

  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1F2A56",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  userName: {
    fontSize: responsiveFontSize(1.6),
    fontFamily: Fonts.bold,
  },

  subText: { fontSize: responsiveFontSize(1.2), color: "#777" },

  price: {
    fontSize: responsiveFontSize(1.8),
    fontFamily: Fonts.bold,
  },

  voiceSection: {
    marginHorizontal: responsiveWidth(5),
    marginTop: responsiveHeight(3),
  },

  voiceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  voiceHeaderText: {
    marginLeft: 8,
    fontFamily: Fonts.semiBold,
    fontSize: responsiveFontSize(1.5),
  },

  voiceBox: {
    backgroundColor: "#e5e7eb",
    borderRadius: moderateScale(12),
    paddingVertical: responsiveHeight(3),
    alignItems: "center",
  },

  voiceCircle: {
    width: responsiveWidth(22),
    height: responsiveWidth(22),
    borderRadius: responsiveWidth(11),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  voiceText: {
    fontSize: responsiveFontSize(1.4),
    fontFamily: Fonts.semiBold,
  },

  voiceHint: {
    fontSize: responsiveFontSize(1.2),
    color: "#6B7280",
    marginTop: 4,
  },

  transcriptCard: {
    marginTop: responsiveHeight(1.5),
    backgroundColor: "#F3F6FF",
    borderRadius: moderateScale(10),
    padding: moderateScale(12),
  },

  transcriptLabel: {
    fontSize: responsiveFontSize(1.2),
    color: "#6B7280",
    fontFamily: Fonts.semiBold,
  },

  transcriptText: {
    fontSize: responsiveFontSize(1.5),
    fontFamily: Fonts.semiBold,
    color: "#111",
    marginTop: 2,
  },

  mayaReply: {
    fontSize: responsiveFontSize(1.3),
    color: "#1F2A56",
    marginTop: 6,
  },

  errorText: {
    marginTop: responsiveHeight(1),
    color: "#B00020",
    fontSize: responsiveFontSize(1.3),
    fontFamily: Fonts.semiBold,
  },

  confirmCard: {
    marginHorizontal: responsiveWidth(5),
    marginTop: responsiveHeight(2.5),
    padding: moderateScale(15),
    borderRadius: moderateScale(12),
    borderWidth: 1.5,
    borderColor: "#1F2A56",
    backgroundColor: "#F7F9FF",
  },

  confirmTitle: {
    fontSize: responsiveFontSize(1.3),
    color: "#6B7280",
    fontFamily: Fonts.semiBold,
  },

  confirmAmount: {
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.bold,
    color: "#1F2A56",
    marginTop: 2,
  },

  confirmSub: {
    fontSize: responsiveFontSize(1.3),
    color: "#444",
    marginTop: 4,
  },

  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: responsiveHeight(2),
    height: responsiveHeight(6),
    borderRadius: moderateScale(10),
    backgroundColor: "#1F2A50",
  },

  confirmButtonText: {
    color: "#fff",
    fontSize: responsiveFontSize(1.7),
    fontFamily: Fonts.bold,
  },

  manualSection: {
    marginHorizontal: responsiveWidth(5),
    marginTop: responsiveHeight(3),
  },

  manualHeader: { flexDirection: "row", alignItems: "center" },

  manualTitle: {
    marginLeft: 8,
    fontSize: responsiveFontSize(1.6),
    fontFamily: Fonts.semiBold,
  },

  label: {
    marginTop: responsiveHeight(2),
    fontSize: responsiveFontSize(1.4),
    fontFamily: Fonts.semiBold,
    marginBottom: responsiveHeight(0.5),
  },

  inputBox: {
    backgroundColor: "#1e1e1e0f",
    borderRadius: moderateScale(8),
    height: responsiveHeight(6.3),
    paddingHorizontal: 10,
    justifyContent: "center",
  },

  input: {
    fontSize: responsiveFontSize(1.6),
    fontFamily: Fonts.medium,
  },

  button: {
    marginHorizontal: responsiveWidth(5),
    marginVertical: responsiveHeight(4),
    height: responsiveHeight(6.8),
    backgroundColor: "#1F2A50",
    borderRadius: moderateScale(12),
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: responsiveFontSize(1.8),
    fontFamily: Fonts.bold,
  },
});
