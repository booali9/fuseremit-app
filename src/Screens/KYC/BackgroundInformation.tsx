import React, { useState, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Animated } from "react-native";

import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";

import { moderateScale } from "react-native-size-matters";
import { Feather, Ionicons } from "@expo/vector-icons";
import Fonts from "../../constants/Fonts";
import AppText from "../../Components/Common/AppText";

interface Props {
  navigation: any;
}

const BackgroundlInformation = ({ navigation }: Props) => {
  const [residence, setResidence] = useState("");
  const [passport, setPassport] = useState("");

  const [showResidenceDropdown, setShowResidenceDropdown] = useState(false);
  const [showPassportDropdown, setShowPassportDropdown] = useState(false);

  const [confirmPassport, setConfirmPassport] = useState(false);
  const [agree, setAgree] = useState(false);

  const scaleAnim1 = useRef(new Animated.Value(1)).current;
  const scaleAnim2 = useRef(new Animated.Value(1)).current;

  const animateCheckbox = (anim: Animated.Value) => {
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const countries = [
    "Pakistan",
    "United States",
    "United Kingdom",
    "Canada",
    "Australia",
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Feather name="chevron-left" size={moderateScale(22)} />
            </TouchableOpacity>

            <AppText style={styles.title}>Background Information</AppText>

            <TouchableOpacity style={{ position: "absolute", right: 0 }}>
              <Ionicons name="notifications" size={moderateScale(22)} />
            </TouchableOpacity>
          </View>

          <View style={{ zIndex: 20 }}>
            <AppText style={styles.label}>Country of your residence</AppText>

            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => {
                setShowResidenceDropdown(!showResidenceDropdown);
                setShowPassportDropdown(false);
              }}
            >
              <AppText style={{ flex: 1 }}>{residence || "e.g. America"}</AppText>
              <Feather name="chevron-down" size={20} />
            </TouchableOpacity>

            {showResidenceDropdown && (
              <View style={styles.dropdownAbsolute}>
                {countries.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setResidence(c);
                      setShowResidenceDropdown(false);
                    }}
                  >
                    <AppText>{c}</AppText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={{ zIndex: 10 }}>
            <AppText style={styles.label}>Country of your passport</AppText>

            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => {
                setShowPassportDropdown(!showPassportDropdown);
                setShowResidenceDropdown(false);
              }}
            >
              <AppText style={{ flex: 1 }}>{passport || "e.g. America"}</AppText>
              <Feather name="chevron-down" size={20} />
            </TouchableOpacity>

            {showPassportDropdown && (
              <View style={styles.dropdownAbsolute}>
                {countries.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setPassport(c);
                      setShowPassportDropdown(false);
                    }}
                  >
                    <AppText>{c}</AppText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.rowCheckContainer}>
            <AppText style={styles.rowText}>I am Politically Exposed Person</AppText>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setConfirmPassport(!confirmPassport);
                animateCheckbox(scaleAnim1);
              }}
            >
              <Animated.View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: confirmPassport ? "#0B3963" : "#1e1e1e16",
                    transform: [{ scale: scaleAnim1 }],
                  },
                ]}
              >
                {confirmPassport && (
                  <Feather name="check" size={14} color="#fff" />
                )}
              </Animated.View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.bottomSection}>
          <View style={styles.rowCheckContainer}>
            <AppText style={styles.rowText}>
              I hereby confirm that the information I have provided is true,
              accurate and complete.
            </AppText>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setAgree(!agree);
                animateCheckbox(scaleAnim2);
              }}
            >
              <Animated.View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: agree ? "#0B3963" : "#1e1e1e16",
                    transform: [{ scale: scaleAnim2 }],
                  },
                ]}
              >
                {agree && <Feather name="check" size={14} color="#fff" />}
              </Animated.View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("KYCSubmission")}
          >
            <AppText style={styles.buttonText}>Next</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default BackgroundlInformation;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: responsiveWidth(6),
    paddingTop: responsiveHeight(5),
    paddingBottom: responsiveHeight(4),
  },

  topBar: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: responsiveHeight(3),
  },

  backBtn: {
    position: "absolute",
    left: 0,
  },

  title: {
    fontSize: responsiveFontSize(2.4),
    fontFamily: Fonts.semiBold,
  },

  label: {
    marginTop: responsiveHeight(2),
    marginBottom: 5,
    fontSize: responsiveFontSize(1.4),
    fontFamily: Fonts.semiBold,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: responsiveHeight(6.3),
    backgroundColor: "#1e1e1e16",
  },

  dropdownAbsolute: {
    position: "absolute",
    top: responsiveHeight(11),
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

  rowCheckContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: responsiveHeight(3),
  },

  rowText: {
    flex: 1,
    fontSize: responsiveFontSize(1.8),
    fontFamily: Fonts.semiBold,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },

  bottomSection: {
    paddingHorizontal: responsiveWidth(6),
    paddingBottom: responsiveHeight(10),
  },

  button: {
    width: "100%",
    height: responsiveHeight(6.6),
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0B3963",
    marginTop: responsiveHeight(2),
  },

  buttonText: {
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.bold,
    color: "#fff",
  },
});
