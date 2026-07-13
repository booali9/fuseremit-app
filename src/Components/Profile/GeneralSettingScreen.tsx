import React, { useState, useEffect } from "react";
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
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";
import { moderateScale } from "react-native-size-matters";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useLanguage } from "../../context/LanguageContext";
import { getAccessTokenAsync } from "../../services/session";
import { fetchUserSettings, updateUserSettings } from "../../services/userApi";
import { registerForPushNotificationsAsync } from "../../services/notifications";
import Fonts from "../../constants/Fonts";

const GeneralSettingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t, changeLanguage, language, isRTL } = useLanguage();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const token = await getAccessTokenAsync();
      if (token) {
        try {
          const settings = await fetchUserSettings(token);
          setNotificationsEnabled(settings.preferences.pushNotifications);
          setEmailAlerts(settings.preferences.emailNotifications);
        } catch (error) {
          console.log("Failed to load settings", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadSettings();
  }, []);

  const handleTogglePush = async (value: boolean) => {
    setNotificationsEnabled(value);
    
    if (value) {
      const fcmToken = await registerForPushNotificationsAsync();
      if (!fcmToken) {
        Alert.alert('Permission Required', 'Please enable notifications in your device settings.');
        setNotificationsEnabled(false);
        return;
      }
    }

    await syncSettings({ pushNotifications: value });
  };

  const handleToggleEmail = async (value: boolean) => {
    setEmailAlerts(value);
    await syncSettings({ emailNotifications: value });
  };

  const syncSettings = async (prefs: any) => {
    const token = await getAccessTokenAsync();
    if (!token) return;

    setIsUpdating(true);
    try {
      let currentPushToken = "";
      // If push notifications are enabled (either from state or from the new update)
      if (prefs.pushNotifications || (notificationsEnabled && prefs.pushNotifications !== false)) {
        try {
          currentPushToken = (await registerForPushNotificationsAsync()) ?? "";
        } catch (error) {
          console.log("Error getting push token:", error);
        }
      }

      await updateUserSettings(token, {
        preferences: {
          language,
          pushNotifications: notificationsEnabled,
          emailNotifications: emailAlerts,
          pushToken: currentPushToken,
          ...prefs,
        } as any,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to update settings on server.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLanguageChange = () => {
    setIsLanguageModalVisible(true);
  };

  const languages = [
    { code: "en", label: "English (US)" },
    { code: "ar", label: "Arabic (العربية)" },
    { code: "de", label: "German (Deutsch)" },
    { code: "fr", label: "French (Français)" },
    { code: "es", label: "Spanish (Español)" },
  ];

  const getCurrentLanguageLabel = () => {
    const labels: Record<string, string> = {
      en: "English (US)",
      ar: "Arabic (العربية)",
      de: "German (Deutsch)",
      fr: "French (Français)",
      es: "Spanish (Español)",
    };
    return labels[language] || "English (US)";
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color="#1F2A50" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F5F7" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: responsiveHeight(5) }}
      >
        <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather
              name={isRTL ? "chevron-right" : "chevron-left"}
              size={moderateScale(18)}
              color="#000"
            />
          </TouchableOpacity>

          <Image
            source={require("../../../assets/general.png")}
            style={styles.headerImage}
            resizeMode="contain"
          />

          <View style={{ width: responsiveWidth(6) }} />
        </View>

        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>{t("generalSettings.title")}</Text>

        {menuRow(
          t("generalSettings.language"),
          getCurrentLanguageLabel(),
          require("../../../assets/lang.png"),
          <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={moderateScale(18)} />,
          handleLanguageChange,
          isRTL
        )}

        {menuRow(
          t("generalSettings.pushNotifications"),
          t("generalSettings.pushSub"),
          require("../../../assets/noti.png"),
          <Switch
            value={notificationsEnabled}
            onValueChange={handleTogglePush}
            thumbColor="#FFFFFF"
            trackColor={{ false: "#ccc", true: "#253B6E" }}
            disabled={isUpdating}
          />,
          undefined,
          isRTL
        )}

        {menuRow(
          t("generalSettings.emailAlerts"),
          t("generalSettings.emailSub"),
          require("../../../assets/noti.png"),
          <Switch
            value={emailAlerts}
            onValueChange={handleToggleEmail}
            thumbColor="#FFFFFF"
            trackColor={{ false: "#ccc", true: "#253B6E" }}
            disabled={isUpdating}
          />,
          undefined,
          isRTL
        )}

        {menuRow(
          t("generalSettings.privacyPolicy"),
          t("generalSettings.privacySub"),
          require("../../../assets/privacy.png"),
          <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={moderateScale(18)} />,
          () => navigation.navigate("PrivaryPolicy" as never),
          isRTL
        )}
        
        {isUpdating && (
          <Text style={{ textAlign: 'center', color: '#666', fontSize: 12, marginTop: 10 }}>
            Syncing settings...
          </Text>
        )}
      </ScrollView>

      <Modal
        visible={isLanguageModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsLanguageModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setIsLanguageModalVisible(false)} 
        />
        
        <View style={styles.modalContent}>
          <View style={[styles.modalHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
             <Text style={styles.modalTitle}>{t("generalSettings.selectLanguage")}</Text>
             <TouchableOpacity onPress={() => setIsLanguageModalVisible(false)}>
                <Feather name="x" size={24} color="#000" />
             </TouchableOpacity>
          </View>

          {languages.map((item) => {
            const isSelected = language === item.code;
            return (
              <TouchableOpacity
                key={item.code}
                style={[styles.languageOption, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                onPress={async () => {
                  await changeLanguage(item.code as any);
                  setIsLanguageModalVisible(false);
                }}
              >
                <Text style={[styles.languageLabel, isSelected && styles.selectedLabel]}>
                  {item.label}
                </Text>
                {isSelected && (
                  <View style={styles.selectedDot} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default GeneralSettingScreen;

const menuRow = (
  title: string,
  subtitle: string,
  icon: any,
  rightComponent: React.ReactNode,
  onPress?: () => void,
  isRTL: boolean = false
) => {
  const hasSubtitle = subtitle && subtitle.trim().length > 0;

  return (
    <TouchableOpacity
      style={[styles.menuCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.leftSection, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Image 
          source={icon} 
          style={[styles.menuIcon, { [isRTL ? 'marginLeft' : 'marginRight']: responsiveWidth(3) }]} 
        />

        <View
          style={[
            styles.textContainer,
            !hasSubtitle && { justifyContent: "center" },
            { alignItems: isRTL ? 'flex-end' : 'flex-start' }
          ]}
        >
          <Text style={[styles.menuTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>

          {hasSubtitle && (
            <Text style={[styles.menuSubtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {subtitle}
            </Text>
          )}
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
    fontSize: responsiveFontSize(1.8),
    fontFamily: Fonts.bold,
    color: "#1F2A50",
  },

  menuSubtitle: {
    fontSize: responsiveFontSize(1.4),
    color: "#6B6B6B",
    marginTop: responsiveHeight(0.3),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    paddingBottom: responsiveHeight(5),
    paddingHorizontal: responsiveWidth(5),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: responsiveHeight(2.5),
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginBottom: responsiveHeight(1),
  },
  modalTitle: {
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.bold,
    color: "#1F2A50",
  },
  languageOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: responsiveHeight(2.2),
    borderBottomWidth: 1,
    borderBottomColor: "#F9F9F9",
  },
  languageLabel: {
    fontSize: responsiveFontSize(1.8),
    fontFamily: Fonts.medium,
    color: "#333",
  },
  selectedLabel: {
    fontFamily: Fonts.bold,
    color: "#1F2A50",
  },
  selectedDot: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: 5,
    backgroundColor: "#1F2A50",
  },
});
