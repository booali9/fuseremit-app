import React, { useRef, useState } from "react";
import { View, StyleSheet, ImageBackground, Image, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, ActivityIndicator } from "react-native";

import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";

import { moderateScale } from "react-native-size-matters";
import { Ionicons, FontAwesome, Entypo } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Fonts from "../../../constants/Fonts";
import AppText from "../../../Components/Common/AppText";
import AppTextInput from "../../../Components/Common/AppTextInput";
import { mayaChat, MayaChatMessage } from "../../../services/mayaApi";

const PROMPTS = [
  { title: "FUSE Rates", text: "What are the most competitive USD to NGN exchange rates right now?" },
  { title: "Save Money", text: "How can I save on remittance fees based on typical FuseRemit transfers?" },
  { title: "Instant Transfer Status", text: "Where is my money? How do I check an active transfer?" },
];

const MayaAIScreen: React.FC = () => {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<MayaChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigation = useNavigation();
  const scrollRef = useRef<ScrollView>(null);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    setError("");
    setMessage("");
    setBusy(true);
    const nextHistory = [...history, { role: "user" as const, text: trimmed }];
    setHistory(nextHistory);

    try {
      const reply = await mayaChat(trimmed, history);
      setHistory([...nextHistory, { role: "model", text: reply }]);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Maya is unavailable right now.");
      setHistory(history);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F2F2F7" }}>
      <StatusBar barStyle="light-content" />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: responsiveHeight(15),
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ height: responsiveHeight(30) }}>
              <ImageBackground
                source={require("../../../../assets/mainbg.png")}
                style={{ flex: 1 }}
                resizeMode="cover"
              >
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons name="close-circle" size={24} color="white" />
                </TouchableOpacity>

                <View style={styles.headerContent}>
                  <View style={styles.robotCircle}>
                    <Image
                      source={require("../../../../assets/robot.png")}
                      style={styles.robotImage}
                    />
                  </View>

                  <AppText style={styles.askText}>Ask Maya</AppText>

                  <AppText style={styles.description}>
                    Hello, I am MAYA AI, a highly advanced Assistant to help
                    with your everyday needs..
                  </AppText>
                </View>
              </ImageBackground>
            </View>

            <View style={styles.cardContainer}>
              {PROMPTS.map((p) => (
                <TouchableOpacity
                  key={p.title}
                  style={styles.card}
                  onPress={() => void send(p.text)}
                  disabled={busy}
                >
                  <AppText style={styles.cardTitle}>{p.title}</AppText>
                  <AppText style={styles.cardSub}>{p.text}</AppText>
                </TouchableOpacity>
              ))}

              {history.map((m, i) => (
                <View
                  key={`${m.role}-${i}`}
                  style={[styles.bubble, m.role === "user" ? styles.userBubble : styles.modelBubble]}
                >
                  <AppText
                    style={[
                      styles.bubbleText,
                      m.role === "user" && { color: "#FFFFFF" },
                    ]}
                  >
                    {m.text}
                  </AppText>
                </View>
              ))}

              {busy ? <ActivityIndicator color="#203A73" style={{ marginTop: 8 }} /> : null}
              {error ? <AppText style={styles.errorText}>{error}</AppText> : null}
            </View>
          </ScrollView>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={styles.inputWrapper}>
              <View style={styles.inputRow}>
                <TouchableOpacity style={styles.plusButton}>
                  <Entypo name="plus" size={24} color="#203A73" />
                </TouchableOpacity>

                <View style={styles.inputContainer}>
                  <AppTextInput
                    placeholder="Type your message..."
                    placeholderTextColor="#7A7A7A"
                    value={message}
                    onChangeText={setMessage}
                    style={styles.input}
                    editable={!busy}
                    onSubmitEditing={() => void send(message)}
                  />

                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={() => void send(message)}
                    disabled={busy}
                  >
                    <FontAwesome name="send" size={14} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default MayaAIScreen;

const styles = StyleSheet.create({
  headerContent: {
    flex: 1,
    paddingHorizontal: responsiveWidth(6),
    paddingTop: responsiveHeight(6),
  },

  closeButton: {
    position: "absolute",
    top: responsiveHeight(4),
    right: responsiveWidth(5),
    zIndex: 10,
  },

  robotCircle: {
    width: responsiveWidth(14),
    height: responsiveWidth(14),
    borderRadius: responsiveWidth(20),
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  robotImage: {
    width: responsiveWidth(9),
    height: responsiveWidth(9),
    resizeMode: "contain",
  },

  askText: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(2.5),
    fontFamily: Fonts.branding,
    marginBottom: responsiveHeight(1),
    marginTop: responsiveHeight(1.2),
  },

  description: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.branding,
  },

  cardContainer: {
    paddingTop: responsiveHeight(2),
    paddingHorizontal: responsiveWidth(5),
    gap: responsiveHeight(2),
  },

  card: {
    backgroundColor: "#1f2a5017",
    borderRadius: moderateScale(14),
    paddingVertical: responsiveHeight(2),
    paddingHorizontal: responsiveWidth(5),
    borderWidth: 1,
    borderColor: "#1F2A50",
  },

  cardTitle: {
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.bold,
    color: "#000000",
    marginBottom: responsiveHeight(0.5),
  },

  cardSub: {
    fontSize: responsiveFontSize(1.6),
    fontFamily: Fonts.semiBold,
    color: "#000000",
  },

  bubble: {
    borderRadius: moderateScale(14),
    paddingVertical: responsiveHeight(1.5),
    paddingHorizontal: responsiveWidth(4),
  },

  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#203A73",
    maxWidth: "85%",
  },

  modelBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#1F2A50",
    maxWidth: "90%",
  },

  bubbleText: {
    fontSize: responsiveFontSize(1.7),
    fontFamily: Fonts.semiBold,
    color: "#000",
  },

  errorText: {
    color: "#B00020",
    fontFamily: Fonts.semiBold,
    fontSize: responsiveFontSize(1.5),
  },

  inputWrapper: {
    width: "100%",
    paddingHorizontal: responsiveWidth(4),
    paddingBottom: responsiveHeight(2),
    backgroundColor: "#F2F2F7",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  plusButton: {
    marginRight: responsiveWidth(3),
  },

  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(30),
    paddingHorizontal: responsiveWidth(2),
    paddingVertical: responsiveHeight(0.5),
  },

  input: {
    flex: 1,
    fontSize: responsiveFontSize(1.7),
    fontFamily: Fonts.semiBold,
    color: "#000",
  },

  sendButton: {
    width: responsiveWidth(9),
    height: responsiveWidth(9),
    borderRadius: responsiveWidth(10),
    backgroundColor: "#203A73",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: responsiveWidth(2),
  },
});
