import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Modal, TouchableOpacity, Animated, Easing, Image, ActivityIndicator } from "react-native";
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
  onEnableBiometric?: () => Promise<void>;
}

const PinSuccessModal: React.FC<Props> = ({ visible, onClose, navigation, onEnableBiometric }) => {
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(300);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const [isEnrolling, setIsEnrolling] = React.useState(false);

  const handleBiometric = async () => {
    if (onEnableBiometric) {
      setIsEnrolling(true);
      try {
        await onEnableBiometric();
      } finally {
        setIsEnrolling(false);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
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

          <AppText style={styles.title}>Congratulations!</AppText>

          <AppText style={styles.subtitle}>
            You’ve created your account successfully
          </AppText>

          {onEnableBiometric && (
            <TouchableOpacity
              style={[styles.button, styles.biometricButton]}
              onPress={handleBiometric}
              disabled={isEnrolling}
            >
              {isEnrolling ? (
                <ActivityIndicator color="#0B3963" />
              ) : (
                <>
                  <Feather
                    name="mic"
                    size={moderateScale(18)}
                    color="#0B3963"
                    style={{ marginRight: 8 }}
                  />
                  <AppText style={[styles.buttonText, styles.biometricButtonText]}>
                    Enable Biometric Login
                  </AppText>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("MainOnboarding")}
          >
            <AppText style={styles.buttonText}>Continue</AppText>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default PinSuccessModal;

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
    color: "#1E1E1E",
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
    marginBottom: responsiveHeight(2),
  },

  biometricButton: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#0B3963",
    flexDirection: "row",
  },

  biometricButtonText: {
    color: "#0B3963",
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
