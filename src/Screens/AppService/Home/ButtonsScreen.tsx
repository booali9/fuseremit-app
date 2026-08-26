import React from "react";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";

import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";

import { moderateScale } from "react-native-size-matters";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Fonts from "../../../constants/Fonts";
import AppText from "../../../Components/Common/AppText";

const ButtonsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const cardHeight = responsiveHeight(16);

  const buttons = [
    {
      title: "FUSE\nSEND",
      image: require("../../../../assets/robot.png"),
      screen: "FuseSendVoice",
    },
    {
      title: "SEND",
      image: require("../../../../assets/send.png"),
      screen: "FuseSend",
    },
    {
      title: "FUSE\nREMITTANCE",
      image: require("../../../../assets/fuse.png"),
      screen: "FuseRemittance",
    },
    {
      title: "ANALYTICS",
      image: require("../../../../assets/analytics.png"),
      screen: "Analytics",
    },
  ];

  const handleNavigation = (screen: string) => {
    if (screen === "FuseRemittance") {
      navigation.navigate("FuseSend", {
        screen: "FuseRemittance",
      });
    } else if (screen === "FuseSendVoice") {
      navigation.navigate("FuseSend", {
        screen: "FuseSendVoice",
      });
    } else if (screen === "Analytics") {
      navigation.navigate("FuseSend", {
        screen: "Analytics",
      });
    } else if (screen === "FuseSend") {
      navigation.navigate("FuseSend");
    } else {
      navigation.navigate(screen as never);
    }
  };

  return (
    <View style={styles.container}>
      <AppText style={styles.sectionTitle}>Quick Actions</AppText>
      <View style={styles.gridContainer}>
        {buttons.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { height: cardHeight }]}
            activeOpacity={0.85}
            onPress={() => handleNavigation(item.screen)}
          >
            <View style={styles.iconCircle}>
              <Image source={item.image} style={styles.iconImage} />
            </View>
            <AppText style={styles.text}>{item.title}</AppText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default ButtonsScreen;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: responsiveWidth(5),
    marginTop: responsiveHeight(3),
  },

  sectionTitle: {
    fontSize: responsiveFontSize(2.1),
    fontFamily: Fonts.bold,
    color: "#1F2A50",
    marginBottom: responsiveHeight(2),
  },

  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: "#EDF0F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: responsiveHeight(2),
    shadowColor: "#1F2A50",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  iconCircle: {
    width: responsiveWidth(14),
    height: responsiveWidth(14),
    borderRadius: responsiveWidth(14),
    backgroundColor: "#EEF2FB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: responsiveHeight(1.2),
  },

  iconImage: {
    width: responsiveWidth(7),
    height: responsiveWidth(7),
    resizeMode: "contain",
  },

  text: {
    fontSize: responsiveFontSize(1.85),
    fontFamily: Fonts.bold,
    color: "#1D2B53",
    textAlign: "center",
    lineHeight: responsiveFontSize(2.5),
  },
});
