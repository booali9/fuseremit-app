import React, { useState } from "react";
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Image, StatusBar, ScrollView, ActivityIndicator } from "react-native";

import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";

import { moderateScale } from "react-native-size-matters";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getAccessTokenAsync } from "../../services/session";
import { changePassword } from "../../services/authApi";
import Fonts from "../../constants/Fonts";
import AppText from "../Common/AppText";
import AppTextInput from "../Common/AppTextInput";

const ChangePassword: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [hideCurrent, setHideCurrent] = useState(true);
  const [hideNew, setHideNew] = useState(true);
  const [hideConfirm, setHideConfirm] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      alert("New password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getAccessTokenAsync();
      if (!token) {
        alert("Session expired.");
        return;
      }

      await changePassword({ currentPassword, newPassword }, token);
      alert("Password updated successfully!");
      navigation.goBack();
    } catch (error: any) {
      alert(error.message || "Failed to update password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="chevron-back"
              size={moderateScale(20)}
              color="#000"
            />
          </TouchableOpacity>

          <Image
            source={require("../../../assets/two.png")}
            style={styles.headerImage}
            resizeMode="contain"
          />

          <View style={{ width: responsiveWidth(8) }} />
        </View>

        <AppText style={styles.screenTitle}>SECURITY SETTINGS</AppText>

        <View style={styles.profileWrapper}>
          <Image
            source={require("../../../assets/profileimg.png")}
            style={styles.profileImage}
          />

          <TouchableOpacity style={styles.cameraIcon}>
            <Feather name="camera" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.formWrapper}>
          <AppText style={styles.label}>Current Password</AppText>
          <View style={styles.inputContainer}>
            <AppTextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={hideCurrent}
              style={styles.input}
              placeholder="Enter current password"
              placeholderTextColor="#999"
            />
            <TouchableOpacity onPress={() => setHideCurrent(!hideCurrent)}>
              <Feather
                name={hideCurrent ? "eye-off" : "eye"}
                size={20}
                color="#000"
              />
            </TouchableOpacity>
          </View>

          <AppText style={styles.label}>New Password</AppText>
          <View style={styles.inputContainer}>
            <AppTextInput
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={hideNew}
              style={styles.input}
              placeholder="Enter new password"
              placeholderTextColor="#999"
            />
            <TouchableOpacity onPress={() => setHideNew(!hideNew)}>
              <Feather
                name={hideNew ? "eye-off" : "eye"}
                size={20}
                color="#000"
              />
            </TouchableOpacity>
          </View>

          <AppText style={styles.label}>Confirm Password</AppText>
          <View style={styles.inputContainer}>
            <AppTextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={hideConfirm}
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor="#999"
            />
            <TouchableOpacity onPress={() => setHideConfirm(!hideConfirm)}>
              <Feather
                name={hideConfirm ? "eye-off" : "eye"}
                size={20}
                color="#000"
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonWrapper}>
        <TouchableOpacity
          style={[styles.saveButton, isSubmitting && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <AppText style={styles.saveButtonText}>Save Changes</AppText>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ChangePassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },

  scrollContainer: {
    paddingHorizontal: responsiveWidth(6),
    paddingBottom: responsiveHeight(5),
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: responsiveHeight(5),
  },

  backButton: {
    width: responsiveWidth(8),
  },

  headerImage: {
    width: responsiveWidth(30),
    height: responsiveHeight(5),
    resizeMode: "contain",
  },

  screenTitle: {
    textAlign: "center",
    fontSize: responsiveFontSize(2.1),
    fontFamily: Fonts.semiBold,
    marginTop: responsiveHeight(2),
  },

  profileWrapper: {
    alignItems: "center",
    marginTop: responsiveHeight(3),
    marginBottom: responsiveHeight(3),
  },

  profileImage: {
    width: responsiveWidth(25),
    height: responsiveWidth(25),
    borderRadius: responsiveWidth(12.5),
  },

  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: responsiveWidth(32),
    backgroundColor: "#1F2A50",
    width: responsiveWidth(8),
    height: responsiveWidth(8),
    borderRadius: responsiveWidth(4),
    justifyContent: "center",
    alignItems: "center",
  },

  formWrapper: {
    marginTop: responsiveHeight(2),
  },

  label: {
    fontSize: responsiveFontSize(1.4),
    marginBottom: responsiveHeight(0.5),
    fontFamily: Fonts.semiBold,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8f8d8d16",
    borderRadius: moderateScale(8),
    paddingHorizontal: responsiveWidth(4),
    height: responsiveHeight(6.5),
    marginBottom: responsiveHeight(2.5),
  },

  input: {
    flex: 1,
    fontSize: responsiveFontSize(1.5),
    color: "#000",
    fontFamily: Fonts.semiBold,
  },

  buttonWrapper: {
    paddingHorizontal: responsiveWidth(6),
    paddingBottom: responsiveHeight(3),
    backgroundColor: "#F5F6FA",
  },

  saveButton: {
    backgroundColor: "#1F2A50",
    height: responsiveHeight(7),
    borderRadius: moderateScale(8),
    justifyContent: "center",
    alignItems: "center",
  },

  saveButtonText: {
    color: "#FFF",
    fontSize: responsiveFontSize(1.8),
    fontFamily: Fonts.semiBold,
  },
});
