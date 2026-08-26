import React from "react";
import { View, StyleSheet, TouchableOpacity, SafeAreaView, Image } from "react-native";

import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";
import Fonts from "../../constants/Fonts";
import AppText from "../../Components/Common/AppText";

interface Props {
  navigation: any;
}

const Submission = ({ navigation }: Props) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.circle}>
          <Image
            source={require("../../../assets/changetik.png")}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        <AppText style={styles.title}>Submission registered!</AppText>

        <AppText style={styles.description}>STEP 1/3 COMPLETED</AppText>
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("MainKYC")}
        >
          <AppText style={styles.buttonText}>Next</AppText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Submission;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "space-between",
  },

  content: {
    alignItems: "center",
    paddingHorizontal: responsiveWidth(8),
    marginTop: responsiveHeight(20),
  },

  circle: {
    width: responsiveWidth(50),
    height: responsiveWidth(50),
    borderRadius: responsiveWidth(50),
    backgroundColor: "#f7f7f7f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: responsiveHeight(4),
  },

  image: {
    width: "65%",
    height: "65%",
    resizeMode: "contain",
  },

  title: {
    fontSize: responsiveFontSize(2.8),
    fontFamily: Fonts.bold,
    marginBottom: responsiveHeight(1.5),
    textAlign: "center",
    paddingHorizontal: responsiveWidth(18),
  },

  description: {
    fontSize: responsiveFontSize(1.5),
    fontFamily: Fonts.medium,
    textAlign: "center",
    color: "#666",
    lineHeight: 22,
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
  },

  buttonText: {
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.bold,
    color: "#fff",
  },
});
