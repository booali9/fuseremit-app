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
import Fonts from "../../constants/Fonts";
import { getAccessTokenAsync, getSessionUser, setSession } from "../../services/session";
import { updateProfile } from "../../services/authApi";
import { Alert } from "react-native";
import AppText from "../Common/AppText";
import AppTextInput from "../Common/AppTextInput";

const ProfileSettingScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [isNameEditable, setIsNameEditable] = useState(false);
  const [isEmailEditable, setIsEmailEditable] = useState(false);
  const [isPhoneEditable, setIsPhoneEditable] = useState(false);

  const sessionUser = getSessionUser();
  const [fullName, setFullName] = useState(
    sessionUser ? `${sessionUser.firstName} ${sessionUser.lastName}`.trim() : ""
  );
  const [email, setEmail] = useState(sessionUser?.email ?? "");
  const [phone, setPhone] = useState(sessionUser?.phoneNumber ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (isSubmitting) return;

    const accessToken = await getAccessTokenAsync();
    if (!accessToken) {
      Alert.alert("Error", "Session expired. Please login again.");
      return;
    }

    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    setIsSubmitting(true);
    try {
      const payload: any = {
        firstName,
        lastName,
        email: email.trim().toLowerCase(),
        phoneNumber: phone.trim(),
      };

      const updatedUser = await updateProfile(payload, accessToken);

      // Update local session
      if (sessionUser) {
        await setSession({
          accessToken,
          user: {
            ...sessionUser,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            phoneNumber: updatedUser.phoneNumber,
          },
        });
      }

      Alert.alert("Success", "Profile updated successfully!");
      setIsNameEditable(false);
      setIsEmailEditable(false);
      setIsPhoneEditable(false);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to update profile");
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="chevron-back"
              size={moderateScale(18)}
              color="#000"
            />
          </TouchableOpacity>

          <Image
            source={require("../../../assets/user.png")}
            style={styles.headerImage}
            resizeMode="contain"
          />

          <View style={{ width: responsiveWidth(8) }} />
        </View>

        <AppText style={styles.screenTitle}>PROFILE</AppText>

        <View style={styles.profileImageWrapper}>
          <Image
            source={require("../../../assets/profileimg.png")}
            style={styles.profileImage}
          />

          <TouchableOpacity style={styles.cameraIconWrapper}>
            <Ionicons name="camera" size={moderateScale(15)} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.formWrapper}>
          <AppText style={styles.label}>Full Name</AppText>
          <View style={styles.inputContainer}>
            <AppTextInput
              value={fullName}
              editable={isNameEditable}
              onChangeText={setFullName}
              style={styles.input}
            />
            <TouchableOpacity
              onPress={() => setIsNameEditable(!isNameEditable)}
            >
              <Feather name="edit" size={20} color="#000000" />
            </TouchableOpacity>
          </View>

          <AppText style={styles.label}>Email Address</AppText>
          <View style={styles.inputContainer}>
            <AppTextInput
              value={email}
              editable={isEmailEditable}
              onChangeText={setEmail}
              style={styles.input}
            />
            <TouchableOpacity
              onPress={() => setIsEmailEditable(!isEmailEditable)}
            >
              <Feather name="edit" size={20} color="#000000" />
            </TouchableOpacity>
          </View>

          <AppText style={styles.label}>Phone Number</AppText>
          <View style={styles.inputContainer}>
            <AppTextInput
              value={phone}
              editable={isPhoneEditable}
              onChangeText={setPhone}
              style={styles.input}
              keyboardType="phone-pad"
            />
            <TouchableOpacity
              onPress={() => setIsPhoneEditable(!isPhoneEditable)}
            >
              <Feather name="edit" size={20} color="#000000" />
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
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <AppText style={styles.saveButtonText}>Save Changes</AppText>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ProfileSettingScreen;

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
  },

  screenTitle: {
    textAlign: "center",
    fontSize: responsiveFontSize(2.2),
    fontFamily: Fonts.semiBold,
    marginTop: responsiveHeight(1.5),
  },

  profileImageWrapper: {
    alignItems: "center",
    marginTop: responsiveHeight(2),
  },

  profileImage: {
    width: responsiveWidth(30),
    height: responsiveWidth(30),
    borderRadius: responsiveWidth(15),
  },

  cameraIconWrapper: {
    position: "absolute",
    bottom: 0,
    right: responsiveWidth(32),
    backgroundColor: "#FFF",
    width: responsiveWidth(7),
    height: responsiveWidth(7),
    borderRadius: responsiveWidth(4),
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  formWrapper: {
    marginTop: responsiveHeight(4),
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
    paddingVertical: 0,
    height: "100%",
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
