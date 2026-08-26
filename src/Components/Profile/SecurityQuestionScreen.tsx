import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from "react-native";

import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";

import { moderateScale } from "react-native-size-matters";
import { Feather } from "@expo/vector-icons";
import { getAccessTokenAsync } from "../../services/session";
import { updateSecurityQuestions } from "../../services/authApi";
import Fonts from "../../constants/Fonts";
import AppText from "../Common/AppText";
import AppTextInput from "../Common/AppTextInput";

interface Props {
  navigation: any;
}

const SecurityQuestionScreen = ({ navigation }: Props) => {
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState("");

  const [a1, setA1] = useState("");
  const [a2, setA2] = useState("");
  const [a3, setA3] = useState("");

  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [show3, setShow3] = useState(false);

  const questions = [
    "What was your Childhood dream job?",
    "What is your mother's maiden name?",
    "What was the name of your first pet?",
    "What is your favorite teacher's name?",
  ];

  const renderDropdown = (
    value: string,
    setValue: (val: string) => void,
    show: boolean,
    setShow: (val: boolean) => void,
    zIndex: number,
  ) => (
    <View style={{ zIndex }}>
      <TouchableOpacity
        style={styles.inputContainer}
        onPress={() => {
          setShow1(false);
          setShow2(false);
          setShow3(false);
          setShow(!show);
        }}
      >
        <AppText style={{ flex: 1 }}>{value || "Select Security Question"}</AppText>
        <Feather name="chevron-down" size={20} />
      </TouchableOpacity>

      {show && (
        <View style={styles.dropdownAbsolute}>
          {questions.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.dropdownItem}
              onPress={() => {
                setValue(item);
                setShow(false);
              }}
            >
              <AppText>{item}</AppText>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderAnswerInput = (
    value: string,
    setValue: (val: string) => void,
  ) => (
    <>
      <AppText style={styles.answerLabel}>Answer to the Question</AppText>
      <View style={styles.answerInputContainer}>
        <AppTextInput
          value={value}
          onChangeText={setValue}
          placeholder="Provide an Answer"
          placeholderTextColor="#999"
          style={styles.answerInput}
        />
      </View>
    </>
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!q1 || !a1 || !q2 || !a2 || !q3 || !a3) {
      alert("Please select all 3 questions and provide answers.");
      return;
    }

    const questionsPayload = [
      { question: q1, answer: a1 },
      { question: q2, answer: a2 },
      { question: q3, answer: a3 },
    ];

    setIsSubmitting(true);
    try {
      const token = await getAccessTokenAsync();
      if (!token) {
        alert("Session expired.");
        return;
      }

      await updateSecurityQuestions(questionsPayload, token);
      alert("Security questions updated successfully!");
      navigation.goBack();
    } catch (error: any) {
      alert(error.message || "Failed to update security questions.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Feather name="chevron-left" size={moderateScale(22)} />
            </TouchableOpacity>

            <Image
              source={require("../../../assets/two.png")}
              style={styles.headerImage}
              resizeMode="contain"
            />
          </View>

          <AppText style={styles.title}>SECURITY QUESTIONS</AppText>

          <AppText style={styles.label}>Pick The First Security Question</AppText>
          {renderDropdown(q1, setQ1, show1, setShow1, 30)}
          {renderAnswerInput(a1, setA1)}

          <AppText style={styles.label}>Pick The Second Security Question</AppText>
          {renderDropdown(q2, setQ2, show2, setShow2, 20)}
          {renderAnswerInput(a2, setA2)}

          <AppText style={styles.label}>Pick The Third Security Question</AppText>
          {renderDropdown(q3, setQ3, show3, setShow3, 10)}
          {renderAnswerInput(a3, setA3)}

          <TouchableOpacity 
            style={[styles.button, isSubmitting && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <AppText style={styles.buttonText}>Save Changes</AppText>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SecurityQuestionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },

  scrollContainer: {
    paddingHorizontal: responsiveWidth(6),
    paddingTop: responsiveHeight(5),
    paddingBottom: responsiveHeight(5),
  },

  header: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: responsiveHeight(2),
  },

  backBtn: {
    position: "absolute",
    left: 0,
  },

  headerImage: {
    width: responsiveWidth(30),
    height: responsiveHeight(5),
    resizeMode: "contain",
  },

  title: {
    textAlign: "center",
    fontSize: responsiveFontSize(2.2),
    fontFamily: Fonts.semiBold,
    marginBottom: responsiveHeight(2),
  },

  label: {
    marginTop: responsiveHeight(2),
    marginBottom: 6,
    fontSize: responsiveFontSize(1.4),
    fontFamily: Fonts.semiBold,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: responsiveHeight(6.5),
    backgroundColor: "#1e1e1e16",
  },

  dropdownAbsolute: {
    position: "absolute",
    top: responsiveHeight(7.5),
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 8,
    paddingVertical: 5,
  },

  dropdownItem: {
    padding: 12,
  },

  answerLabel: {
    marginTop: responsiveHeight(1.5),
    marginBottom: 6,
    fontSize: responsiveFontSize(1.3),
    fontFamily: Fonts.semiBold,
  },

  answerInputContainer: {
    backgroundColor: "#1e1e1e16",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: responsiveHeight(6.5),
    justifyContent: "center",
    marginBottom: responsiveHeight(1),
  },

  answerInput: {
    fontSize: responsiveFontSize(1.5),
    fontFamily: Fonts.semiBold,
    color: "#000",
  },

  button: {
    marginTop: responsiveHeight(3),
    height: responsiveHeight(7),
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1F2A50",
    width: "100%",
  },

  buttonText: {
    fontSize: responsiveFontSize(1.9),
    fontFamily: Fonts.bold,
    color: "#fff",
  },
});
