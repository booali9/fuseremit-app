import React, { useState } from "react";
import { View, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar, ScrollView, Image, Switch } from "react-native";

import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";

import { moderateScale } from "react-native-size-matters";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Fonts from "../../constants/Fonts";
import AppText from "../Common/AppText";

// ponytail: unreachable — Profile's "Ask MAYA" now opens the real chat screen. Both rows here
// were dead ("AI Voice Response" has no voice feature; chat history isn't persisted, so there
// is nothing to clear). Safe to delete once your local changes are committed.
const MayAIScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F5F7" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: responsiveHeight(5) }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather
              name="chevron-left"
              size={moderateScale(18)}
              color="#000"
            />
          </TouchableOpacity>

          <Image
            source={require("../../../assets/ai.png")}
            style={styles.headerImage}
            resizeMode="contain"
          />

          <View style={{ width: responsiveWidth(6) }} />
        </View>

        <AppText style={styles.title}>ASK MAYA</AppText>

        {menuRow(
          "AI Voice Response",
          "English (US)",
          require("../../../assets/lang.png"),
          <Feather name="chevron-right" size={moderateScale(18)} />,
        )}

        {menuRow(
          "Clear History",
          "",
          require("../../../assets/del.png"),
          <Feather name="chevron-right" size={moderateScale(18)} />,
          //   () => navigation.navigate("PrivaryPolicy" as never),
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default MayAIScreen;

const menuRow = (
  title: string,
  subtitle: string,
  icon: any,
  rightComponent: React.ReactNode,
  onPress?: () => void,
) => {
  const hasSubtitle = subtitle && subtitle.trim().length > 0;
  const isDanger = title === "Clear History";

  return (
    <TouchableOpacity
      style={styles.menuCard}
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.leftSection}>
        <Image source={icon} style={styles.menuIcon} />

        <View
          style={[
            styles.textContainer,
            !hasSubtitle && { justifyContent: "center" },
          ]}
        >
          <AppText style={[styles.menuTitle, isDanger && { color: "#E53935" }]}>
            {title}
          </AppText>

          {hasSubtitle && <AppText style={styles.menuSubtitle}>{subtitle}</AppText>}
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
});
