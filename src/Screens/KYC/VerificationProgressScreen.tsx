import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Animated } from "react-native";
import Svg, { Circle } from "react-native-svg";
import * as Animatable from "react-native-animatable";
import { Ionicons } from "@expo/vector-icons";
import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";
import { moderateScale } from "react-native-size-matters";
import { useNavigation } from "@react-navigation/native";
import { getAccessTokenAsync } from "../../services/session";
import { updateAccountTier, updateKycStatus } from "../../services/userApi";
import AppText from "../../Components/Common/AppText";

const VerificationProgressScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const progress = useRef(new Animated.Value(0)).current;
  const [completed, setCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const size = responsiveWidth(50);
  const strokeWidth = moderateScale(14);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start(() => {
      setCompleted(true);
    });
  }, []);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const handleGoToDashboard = () => {
    void (async () => {
      if (isSubmitting) return;

      try {
        setErrorMessage("");
        setIsSubmitting(true);

        const accessToken = await getAccessTokenAsync();

        if (accessToken) {
          await updateKycStatus(accessToken, "verified");
          await updateAccountTier(accessToken, "Premium");
        }

        navigation.navigate("AppServiceBottomNavigation");
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to sync premium upgrade status.";

        setErrorMessage(message);
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <AppText style={styles.headerTitle}>Verify it’s you</AppText>
      </View>

      <Animatable.View
        style={styles.loaderWrapper}
        animation="zoomIn"
        duration={550}
      >
        <Svg width={size} height={size}>
          <Circle
            stroke="#DDF6E7"
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />

          <AnimatedCircle
            stroke="#16A34A"
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            originX={size / 2}
            originY={size / 2}
          />
        </Svg>

        <Animatable.View
          style={styles.checkCenterWrap}
          animation="pulse"
          iterationCount="infinite"
          duration={1800}
        >
          <View style={styles.checkCenter}>
            <Ionicons name="checkmark" size={moderateScale(42)} color="#fff" />
          </View>
        </Animatable.View>
      </Animatable.View>

      <View style={styles.textContainer}>
        <AppText style={styles.title}>
          {completed ? "Verification Successful" : "Verification in Progress"}
        </AppText>

        <AppText style={styles.subtitle}>
          {completed
            ? "Your KYC details have been captured successfully. Final review is now in progress."
            : "We are securely validating your identity details. This will only take a moment."}
        </AppText>
      </View>

      {errorMessage ? <AppText style={styles.errorText}>{errorMessage}</AppText> : null}

      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleGoToDashboard}
        disabled={isSubmitting}
      >
        <AppText style={styles.buttonText}>
          {isSubmitting ? "Syncing..." : "Go to Dashboard"}
        </AppText>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default VerificationProgressScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4FBF7",
    alignItems: "center",
  },

  header: {
    width: "100%",
    alignItems: "center",
    marginTop: responsiveHeight(2),
  },

  headerTitle: {
    fontSize: responsiveFontSize(2.2),
    fontWeight: "600",
    color: "#000",
  },

  loaderWrapper: {
    marginTop: responsiveHeight(8),
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  checkCenterWrap: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },

  checkCenter: {
    width: responsiveWidth(22),
    height: responsiveWidth(22),
    borderRadius: responsiveWidth(14),
    backgroundColor: "#16A34A",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#16A34A",
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  textContainer: {
    width: responsiveWidth(85),
    alignItems: "center",
    marginTop: responsiveHeight(6),
  },

  title: {
    fontSize: responsiveFontSize(2.4),
    fontWeight: "600",
    color: "#0F5132",
    marginBottom: responsiveHeight(1.5),
    textAlign: "center",
  },

  subtitle: {
    fontSize: responsiveFontSize(1.8),
    color: "#2F4F3E",
    textAlign: "center",
    lineHeight: moderateScale(22),
  },

  button: {
    position: "absolute",
    bottom: responsiveHeight(4),
    width: responsiveWidth(85),
    height: responsiveHeight(7),
    backgroundColor: "#0B3963",
    borderRadius: moderateScale(12),
    justifyContent: "center",
    alignItems: "center",
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  errorText: {
    marginTop: responsiveHeight(2.5),
    color: "#FB002E",
    fontSize: responsiveFontSize(1.5),
    fontWeight: "600",
    textAlign: "center",
    width: responsiveWidth(85),
  },

  buttonText: {
    color: "#fff",
    fontSize: responsiveFontSize(2),
    fontWeight: "600",
  },
});
