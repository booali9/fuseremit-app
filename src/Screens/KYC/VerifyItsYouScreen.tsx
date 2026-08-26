import React, { useEffect, useRef, useState } from "react";
import { View, TouchableOpacity, SafeAreaView, StyleSheet, StatusBar, Image, ActivityIndicator } from "react-native";

import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";

import { moderateScale } from "react-native-size-matters";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import { updateManualKycDraft } from "../../services/manualKycDraft";
import Fonts from "../../constants/Fonts";
import AppText from "../../Components/Common/AppText";

const PREVIEW_WIDTH = responsiveWidth(60);
const PREVIEW_HEIGHT = responsiveHeight(45);

const VerifyItsYouScreen = () => {
  const navigation = useNavigation<any>();
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleCapture = () => {
    void (async () => {
      if (!cameraRef.current || isSaving) return;

      try {
        setIsSaving(true);
        setCameraError(null);

        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.75,
          base64: true,
        });

        setCapturedUri(photo.uri);

        await updateManualKycDraft({
          livenessImageUri: photo.uri,
          livenessImageBase64: photo.base64,
        });
      } catch (error) {
        setCameraError(
          error instanceof Error ? error.message : "Unable to capture liveness image.",
        );
      } finally {
        setIsSaving(false);
      }
    })();
  };

  const handleContinue = () => {
    if (!capturedUri) {
      setCameraError("Please capture a liveness photo first.");
      return;
    }

    navigation.replace("VerificationProgress");
  };

  const handleRetake = () => {
    setCapturedUri(null);
    setCameraError(null);
  };

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <AppText>Camera permission required</AppText>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={moderateScale(20)} color="#000" />
        </TouchableOpacity>

        <AppText style={styles.headerTitle}>Verify it’s you</AppText>
        <View style={{ width: moderateScale(20) }} />
      </View>

      <View style={styles.previewWrapper}>
        <View style={styles.cameraOuter}>
          {capturedUri ? (
            <Image source={{ uri: capturedUri }} style={styles.camera} />
          ) : (
            <CameraView ref={cameraRef} style={styles.camera} facing="front" />
          )}
        </View>

        <View style={styles.borderWrapper} pointerEvents="none">
          <View style={styles.faceBorder} />
        </View>
      </View>

      <AppText style={styles.instruction}>
        {capturedUri
          ? "Liveness photo captured. Continue to verification."
          : "Please align your face within the frame"}
      </AppText>

      {cameraError ? <AppText style={styles.errorText}>{cameraError}</AppText> : null}

      {!capturedUri ? (
        <TouchableOpacity
          style={styles.captureButton}
          onPress={handleCapture}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <FontAwesome name="camera" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
            <AppText style={styles.retakeButtonText}>Retake</AppText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextButton} onPress={handleContinue}>
            <AppText style={styles.nextButtonText}>Next</AppText>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default VerifyItsYouScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(4),
    paddingTop: responsiveHeight(2),
  },
  headerTitle: {
    fontSize: responsiveFontSize(2.2),
    fontFamily: Fonts.bold,
    color: "#000",
  },

  previewWrapper: {
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    marginTop: responsiveHeight(4),
    justifyContent: "center",
    alignItems: "center",
  },

  cameraOuter: {
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    borderRadius: PREVIEW_WIDTH / 2,
    overflow: "hidden",
  },

  camera: {
    width: "100%",
    height: "100%",
  },

  borderWrapper: {
    position: "absolute",
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },

  faceBorder: {
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    borderRadius: PREVIEW_WIDTH / 2,
    borderWidth: moderateScale(3),
    borderColor: "#CFF7E2",
  },

  instruction: {
    marginTop: responsiveHeight(4),
    fontSize: responsiveFontSize(1.8),
    color: "#555",
    fontFamily: Fonts.semiBold,
    textAlign: "center",
    paddingHorizontal: responsiveWidth(8),
  },

  errorText: {
    marginTop: responsiveHeight(1.2),
    color: "#FB002E",
    fontSize: responsiveFontSize(1.45),
    fontFamily: Fonts.semiBold,
    textAlign: "center",
    width: responsiveWidth(85),
  },

  captureButton: {
    position: "absolute",
    bottom: responsiveHeight(6),
    width: responsiveWidth(18),
    height: responsiveWidth(18),
    borderRadius: responsiveWidth(9),
    backgroundColor: "#0B3963",
    justifyContent: "center",
    alignItems: "center",
  },

  bottomActions: {
    position: "absolute",
    bottom: responsiveHeight(6),
    width: responsiveWidth(90),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  nextButton: {
    width: responsiveWidth(62),
    height: responsiveHeight(6.5),
    backgroundColor: "#0B3963",
    borderRadius: moderateScale(10),
    justifyContent: "center",
    alignItems: "center",
  },
  nextButtonText: {
    color: "#fff",
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.bold,
  },

  retakeButton: {
    width: responsiveWidth(24),
    height: responsiveHeight(6.5),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: "#0B3963",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F8FF",
  },

  retakeButtonText: {
    color: "#0B3963",
    fontSize: responsiveFontSize(1.8),
    fontFamily: Fonts.semiBold,
  },
});
