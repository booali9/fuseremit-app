import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";

import { moderateScale } from "react-native-size-matters";
import { Feather } from "@expo/vector-icons";
import { resetToLogin } from "../../navigation/navigationHelpers";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { logoutAccount } from "../../services/authApi";
import { clearManualKycDraft } from "../../services/manualKycDraft";
import {
  clearSession,
  getAccessTokenAsync,
  getSessionUser,
} from "../../services/session";
import { fetchCurrentUserStatus, uploadProfilePicture } from "../../services/userApi";
import { ApiError } from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";
import Fonts from "../../constants/Fonts";
import * as ImagePicker from "expo-image-picker";

interface ProfileIdentity {
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
}

type RootStackParamList = {
  ProfileSettings: undefined;
  SecuritySettings: undefined;
  GeneralSettings: undefined;
  MayaAI: undefined;
  Referral: undefined;
  Reporting: undefined;
  AdvancedKYC: undefined;
  Login: undefined;
};

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useLanguage();

  const sessionUser = getSessionUser();
  const [identity, setIdentity] = useState<ProfileIdentity>({
    firstName: sessionUser?.firstName ?? "FuseRemit",
    lastName: sessionUser?.lastName ?? "User",
    email: sessionUser?.email ?? "",
    profilePicture: sessionUser?.profilePicture,
  });
  const [isLoadingIdentity, setIsLoadingIdentity] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const resetToLoginScreen = useCallback(() => {
    resetToLogin(navigation);
  }, [navigation]);

  const loadProfileIdentity = useCallback(async () => {
    try {
      setErrorMessage("");
      setIsLoadingIdentity(true);

      const accessToken = await getAccessTokenAsync();

      if (!accessToken) {
        await clearSession();
        resetToLoginScreen();
        return;
      }

      const me = await fetchCurrentUserStatus(accessToken);

      setIdentity({
        firstName: me.firstName?.trim() || "FuseRemit",
        lastName: me.lastName?.trim() || "User",
        email: me.email,
        profilePicture: me.profilePicture,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await Promise.all([clearSession(), clearManualKycDraft()]);
        resetToLoginScreen();
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "Unable to load profile details.";

      setErrorMessage(message);
    } finally {
      setIsLoadingIdentity(false);
    }
  }, [resetToLoginScreen]);

  const handleProfilePicturePress = useCallback(async () => {
    try {
      // Permission request
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        setErrorMessage("Permission to access gallery was denied.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setIsUploading(true);
        setErrorMessage("");

        const accessToken = await getAccessTokenAsync();
        if (!accessToken) throw new Error("No access token found.");

        const res = await uploadProfilePicture(accessToken, result.assets[0].uri);
        
        setIdentity(prev => ({
          ...prev,
          profilePicture: res.profilePicture,
        }));
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfileIdentity();
    }, [loadProfileIdentity]),
  );

  const handleLogout = useCallback(() => {
    void (async () => {
      if (isLoggingOut) return;

      try {
        setErrorMessage("");
        setIsLoggingOut(true);

        const accessToken = await getAccessTokenAsync();
        await logoutAccount(accessToken ?? undefined);
      } catch {
        // Logout should still proceed locally even if network logout fails.
      } finally {
        await Promise.all([clearSession(), clearManualKycDraft()]);
        setIsLoggingOut(false);
        resetToLoginScreen();
      }
    })();
  }, [isLoggingOut, resetToLoginScreen]);

  const fullName = useMemo(
    () => `${identity.firstName} ${identity.lastName}`.trim(),
    [identity.firstName, identity.lastName],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F5F7" }}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: responsiveHeight(4) }}
      >
        <View style={{ height: responsiveHeight(35) }}>
          <ImageBackground
            source={require("../../../assets/mainbg.png")}
            style={{ flex: 1 }}
            resizeMode="cover"
          >
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>{t("profile.title")}</Text>

              <TouchableOpacity 
                style={styles.profileImageContainer} 
                onPress={handleProfilePicturePress}
                disabled={isUploading}
              >
                <Image
                  source={
                    identity.profilePicture 
                      ? { uri: identity.profilePicture } 
                      : require("../../../assets/profileimg.png")
                  }
                  style={styles.profileImage}
                />
                <View style={styles.editBadge}>
                  {isUploading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Feather name="camera" size={moderateScale(14)} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>

              {isLoadingIdentity ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.loadingText}>Syncing profile...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.name}>{fullName}</Text>
                  <Text style={styles.email}>{identity.email}</Text>
                </>
              )}

              {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
              ) : null}
            </View>
          </ImageBackground>
        </View>

        <View style={styles.inviteCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inviteTitle}>{t("common.inviteFriends")}</Text>
            <Text style={styles.inviteSub}>
              {t("common.inviteSub")}
            </Text>
          </View>

          <Image
            source={require("../../../assets/invite.png")}
            style={styles.inviteImage}
          />
        </View>

        <View style={styles.menuContainer}>
          {menuItem(t("common.profile"), require("../../../assets/user.png"), () =>
            navigation.navigate("ProfileSettings"),
          )}

          {menuItem(
            t("common.security"),
            require("../../../assets/security.png"),
            () => navigation.navigate("SecuritySettings"),
          )}

          {menuItem(
            t("common.settings"),
            require("../../../assets/general.png"),
            () => navigation.navigate("GeneralSettings"),
          )}

          {menuItem("Ask MAYA", require("../../../assets/maya.png"), () =>
            navigation.navigate("MayaAI"),
          )}

          {menuItem("Refer & Earn", require("../../../assets/invite_icon.png"), () =>
            navigation.navigate("Referral"),
          )}

          {menuItem("Reporting", require("../../../assets/pdf_icon.png"), () =>
            navigation.navigate("Reporting"),
          )}

          {menuItem("Advanced KYC", require("../../../assets/passport_icon.png"), () =>
            navigation.navigate("AdvancedKYC"),
          )}

          <TouchableOpacity
            style={styles.logoutRow}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <Text style={styles.logoutText}>
              {isLoggingOut ? "Logging out..." : t("common.logout")}
            </Text>

            <Image
              source={require("../../../assets/logout.png")}
              style={styles.logoutImage}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const menuItem = (title: string, icon: any, onPress: () => void) => {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress}>
      <View style={styles.leftSection}>
        <View style={styles.iconCircle}>
          <Image source={icon} style={styles.menuIcon} />
        </View>

        <Text style={styles.menuText}>{title}</Text>
      </View>

      <Feather name="chevron-right" size={moderateScale(18)} color="#000000" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  headerContent: {
    flex: 1,
    alignItems: "center",
    paddingTop: responsiveHeight(6),
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(2.2),
    fontFamily: Fonts.semiBold,
    marginBottom: responsiveHeight(2),
  },

  profileImage: {
    width: responsiveWidth(25),
    height: responsiveWidth(25),
    borderRadius: responsiveWidth(20),
    marginBottom: responsiveHeight(1.5),
  },
  
  profileImageContainer: {
    position: 'relative',
    marginBottom: responsiveHeight(1.5),
  },

  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1F2A50',
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },

  loadingWrap: {
    alignItems: "center",
    marginBottom: responsiveHeight(0.8),
  },

  loadingText: {
    marginTop: responsiveHeight(0.7),
    color: "#E1E6EF",
    fontSize: responsiveFontSize(1.4),
    fontFamily: Fonts.semiBold,
  },

  name: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(2.4),
    fontFamily: Fonts.bold,
  },

  email: {
    color: "#D6D6D6",
    fontSize: responsiveFontSize(1.7),
    marginTop: responsiveHeight(0.5),
  },

  errorText: {
    marginTop: responsiveHeight(0.7),
    color: "#FFD3D3",
    fontSize: responsiveFontSize(1.2),
    fontFamily: Fonts.semiBold,
    textAlign: "center",
    paddingHorizontal: responsiveWidth(10),
  },

  inviteCard: {
    flexDirection: "row",
    backgroundColor: "#253B6E",
    marginHorizontal: responsiveWidth(5),
    marginTop: responsiveHeight(2),
    borderRadius: moderateScale(5),
    padding: responsiveWidth(4),
    alignItems: "center",
  },

  inviteTitle: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.semiBold,
    marginBottom: responsiveHeight(0.5),
  },

  inviteSub: {
    color: "#DADADA",
    fontSize: responsiveFontSize(1.5),
  },

  inviteImage: {
    width: responsiveWidth(18),
    height: responsiveWidth(18),
    resizeMode: "contain",
    marginLeft: responsiveWidth(3),
  },

  menuContainer: {
    marginTop: responsiveHeight(2),
    paddingHorizontal: responsiveWidth(5),
    gap: responsiveHeight(1.5),
  },

  menuRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#98939309",
    paddingVertical: responsiveWidth(3.5),
    paddingHorizontal: responsiveWidth(4),
    borderRadius: moderateScale(8),
  },

  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconCircle: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: responsiveWidth(3),
  },

  menuIcon: {
    width: responsiveWidth(9),
    height: responsiveWidth(9),
    resizeMode: "contain",
  },

  menuText: {
    fontSize: responsiveFontSize(1.9),
    fontFamily: Fonts.semiBold,
    color: "#1F2A50",
  },

  logoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#98939309",
    paddingVertical: responsiveWidth(4),
    paddingHorizontal: responsiveWidth(4),
    borderRadius: moderateScale(8),
  },

  logoutText: {
    color: "#FB002E",
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.semiBold,
  },

  logoutImage: {
    width: responsiveWidth(6),
    height: responsiveWidth(6),
    resizeMode: "contain",
  },
});
