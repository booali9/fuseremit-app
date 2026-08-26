import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Modal, TouchableOpacity, Animated, Easing, Image } from "react-native";
import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";
import { moderateScale } from "react-native-size-matters";
import { Feather } from "@expo/vector-icons";
import Fonts from "../../constants/Fonts";
import AppText from "../Common/AppText";

interface Props {
  visible: boolean;
  onClose: () => void;
  navigation: any;
}

const ChangeDevicePhoneVerifyModal: React.FC<Props> = ({
  visible,
  onClose,
  navigation,
}) => {
  const slideAnim = useRef(new Animated.Value(300)).current;

  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    let timer: any;

    if (visible) {
      timer = setTimeout(() => {
        setShouldRender(true);

        slideAnim.setValue(300);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      }, 3000);
    } else {
      setShouldRender(false);
    }

    return () => clearTimeout(timer);
  }, [visible]);

  if (!shouldRender) return null;

  return (
    <Modal visible={true} transparent animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.iconWrapper}>
            <Image
              source={require("../../../assets/changetik.png")}
              style={styles.successImage}
              resizeMode="contain"
            />
          </View>

          <AppText style={styles.title}>Device Changed</AppText>

          <AppText style={styles.subtitle}>
            Your device change request has been successfully approved.
          </AppText>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Login")}
          >
            <AppText style={styles.buttonText}>Login</AppText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Feather name="x" size={responsiveWidth(7)} color="#000" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default ChangeDevicePhoneVerifyModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: moderateScale(25),
    borderTopRightRadius: moderateScale(25),
    paddingVertical: responsiveHeight(4),
    paddingHorizontal: responsiveWidth(6),
    alignItems: "center",
  },

  iconWrapper: {
    width: responsiveWidth(20),
    height: responsiveWidth(20),
    borderRadius: responsiveWidth(50),
    backgroundColor: "#f7f7f7f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: responsiveHeight(2.5),
  },

  successImage: {
    width: responsiveWidth(14),
    height: responsiveWidth(14),
    resizeMode: "contain",
  },

  title: {
    fontSize: responsiveFontSize(2.8),
    fontFamily: Fonts.semiBold,
    marginBottom: responsiveHeight(1),
  },

  subtitle: {
    fontSize: responsiveFontSize(1.8),
    textAlign: "center",
    color: "#555",
    marginBottom: responsiveHeight(3),
    fontFamily: Fonts.semiBold,
    paddingHorizontal: responsiveWidth(4),
  },

  button: {
    width: "100%",
    height: responsiveHeight(6.5),
    backgroundColor: "#0B3963",
    borderRadius: moderateScale(12),
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.semiBold,
  },

  closeButton: {
    marginTop: responsiveHeight(3),
    width: responsiveWidth(18),
    height: responsiveWidth(18),
    borderRadius: responsiveWidth(50),
    backgroundColor: "#dddddd60",
    justifyContent: "center",
    alignItems: "center",
  },
});
