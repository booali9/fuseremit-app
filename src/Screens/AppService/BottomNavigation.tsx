import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";

import AlertsScreen from "./AlertsScreen";
import HomeStack from "../../Components/Home/HomeStack";
import SendMoneyStack from "../../Components/SendMoney/SendMoneyStack";
import HistoryStack from "../../Components/History/HistoryStack";
import ProfileStack from "../../Components/Profile/ProfileStack";

import { useLanguage } from "../../context/LanguageContext";
import Fonts from "../../constants/Fonts";

const Tab = createBottomTabNavigator();

const BottomNavigation = () => {
  const { t, isRTL } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [
          styles.tabBar,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ],
      }}
    >
      {/* HOME */}
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Image
                source={
                  focused
                    ? require("../../../assets/homeactive.png")
                    : require("../../../assets/homeinactive.png")
                }
                style={styles.iconImage}
                resizeMode="contain"
              />
              <Text
                style={[styles.label, focused && styles.labelActive]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.5}
              >
                {t("common.home")}
              </Text>
            </View>
          ),
        }}
      />

      {/* FUSE SEND */}
      <Tab.Screen
        name="FuseSend"
        component={SendMoneyStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Image
                source={
                  focused
                    ? require("../../../assets/sendinactive.png")
                    : require("../../../assets/sendactive.png")
                }
                style={styles.centerIcon}
                resizeMode="contain"
              />
              <Text
                style={[styles.label, focused && styles.labelActive]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.5}
              >
                {t("common.sendFuse")}
              </Text>
            </View>
          ),
        }}
      />

      {/* HISTORY */}
      <Tab.Screen
        name="History"
        component={HistoryStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Image
                source={
                  focused
                    ? require("../../../assets/historyactive.png")
                    : require("../../../assets/historyinactive.png")
                }
                style={styles.iconImage}
                resizeMode="contain"
              />
              <Text
                style={[styles.label, focused && styles.labelActive]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.5}
              >
                {t("common.history")}
              </Text>
            </View>
          ),
        }}
      />

      {/* ALERTS */}
      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Image
                source={
                  focused
                    ? require("../../../assets/alertactive.png")
                    : require("../../../assets/alertinactive.png")
                }
                style={styles.iconImage}
                resizeMode="contain"
              />
              <Text
                style={[styles.label, focused && styles.labelActive]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.5}
              >
                {t("common.alerts")}
              </Text>
            </View>
          ),
        }}
      />

      {/* PROFILE */}
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Image
                source={
                  focused
                    ? require("../../../assets/profileactive.png")
                    : require("../../../assets/profileinactive.png")
                }
                style={styles.iconImage}
                resizeMode="contain"
              />
              <Text
                style={[styles.label, focused && styles.labelActive]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.5}
              >
                {t("common.profile")}
              </Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomNavigation;

const styles = StyleSheet.create({
  tabBar: {
    height: responsiveHeight(12),
    paddingVertical: responsiveHeight(0.5),
    backgroundColor: "#FFFFFF",
    borderTopWidth: 0.5,
    borderTopColor: "#E5E7EB",
    elevation: 8,
    justifyContent: "space-around",
    paddingTop: responsiveHeight(3),
  },

  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },

  iconImage: {
    width: responsiveWidth(7),
    height: responsiveWidth(7),
    resizeMode: "contain",
  },

  centerIcon: {
    width: responsiveWidth(8),
    height: responsiveWidth(8),
  },

  label: {
    fontSize: responsiveFontSize(1.4),
    marginTop: responsiveHeight(0.3),
    color: "#0B3963",
    fontFamily: Fonts.semiBold,
    textAlign: "center",
    width: responsiveWidth(18),
  },

  labelActive: {
    color: "#1E2A5A",
    fontWeight: "600",
  },
});
