import React, { useEffect, useRef, useState } from "react";
import { View, TouchableOpacity, SafeAreaView, StyleSheet, StatusBar, ActivityIndicator, Image } from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome,
} from "@expo/vector-icons";
import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";
import { moderateScale } from "react-native-size-matters";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import {
  getManualKycDraft,
  updateManualKycDraft,
} from "../../services/manualKycDraft";
import Fonts from "../../constants/Fonts";
import AppText from "../../Components/Common/AppText";

const SelectDocumentScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const cameraRef = useRef<any>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [documentLabel, setDocumentLabel] = useState("ID card");

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }

    void (async () => {
      const draft = await getManualKycDraft();

      if (draft.documentType === "passport") {
        setDocumentLabel("Passport");
      } else if (draft.documentType === "drivers_license") {
        setDocumentLabel("Driver’s license");
      } else {
        setDocumentLabel("ID card");
      }
    })();
  }, [permission]);

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      setIsSaving(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      setCapturedPhoto(photo.uri);
      setIsCameraReady(true);

      await updateManualKycDraft({
        documentImageUri: photo.uri,
        documentImageBase64: photo.base64,
      });
    } catch (error) {
      console.log("Capture error:", error);
      setCameraError("Failed to capture photo");
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinue = () => {
    if (!capturedPhoto) return;
    navigation.navigate("LivenessVerify");
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setCameraError(null);
  };

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <AppText style={{ color: "#000" }}>Camera permission is required.</AppText>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={moderateScale(18)} color="#000" />
        </TouchableOpacity>

        <AppText style={styles.headerTitle}>{`Take a picture of your ${documentLabel}`}</AppText>

        <View style={{ width: moderateScale(24) }} />
      </View>

      <View style={styles.cameraWrapper}>
        {cameraError ? (
          <View style={styles.center}>
            <AppText style={{ color: "#f00" }}>{cameraError}</AppText>
          </View>
        ) : capturedPhoto ? (
          <Image source={{ uri: capturedPhoto }} style={styles.camera} />
        ) : (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            flash={flash}
            onCameraReady={() => setIsCameraReady(true)}
            onMountError={(error) => {
              console.error("Camera mount error:", error);
              setCameraError("Failed to start camera");
            }}
          />
        )}

        <View style={styles.overlayBox} />

        {!isCameraReady && !cameraError && !capturedPhoto && (
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.2)",
            }}
          >
            <ActivityIndicator size="large" color="#0FA958" />
            <AppText style={{ color: "#0FA958", marginTop: 10 }}>
              Loading Camera...
            </AppText>
          </View>
        )}
      </View>

      <View style={styles.infoSection}>
        {capturedPhoto ? (
          <AppText style={styles.capturedText}>
            Picture saved. Continue to liveness verification.
          </AppText>
        ) : (
          <>
            <AppText style={styles.title}>{`Front of ${documentLabel}`}</AppText>
            <AppText style={styles.subtitle}>
              Ensure all 4 sides are visible and text is clear
            </AppText>
          </>
        )}
      </View>

      <View style={styles.bottomControls}>
        {capturedPhoto ? (
          <View style={styles.savedActionsWrap}>
            <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
              <AppText style={styles.retakeButtonText}>Retake</AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleContinue}
              disabled={isSaving}
            >
              <AppText style={styles.nextButtonText}>Next</AppText>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setFlash(flash === "off" ? "on" : "off")}
            >
              <Ionicons
                name={flash === "off" ? "flash-off" : "flash"}
                size={moderateScale(24)}
                color="#000"
              />
              <AppText style={styles.iconText}>Flash</AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleCapture}
              disabled={!isCameraReady || !!cameraError || isSaving}
            >
              <FontAwesome name="camera" size={26} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => console.log("Help pressed")}
            >
              <MaterialCommunityIcons
                name="help-circle"
                size={moderateScale(24)}
                color="#000"
              />
              <AppText style={styles.iconText}>Help</AppText>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export default SelectDocumentScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: responsiveWidth(4),
    paddingTop: responsiveHeight(2),
  },
  headerTitle: {
    fontSize: responsiveFontSize(2.2),
    fontFamily: Fonts.bold,
    color: "#000",
    textAlign: "center",
    flex: 1,
  },
  cameraWrapper: {
    alignSelf: "center",
    width: responsiveWidth(85),
    height: responsiveHeight(48),
    borderRadius: moderateScale(10),
    overflow: "hidden",
    marginTop: responsiveHeight(2),
  },
  camera: { flex: 1 },
  overlayBox: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderWidth: moderateScale(1),
    borderColor: "#0FA958",
    borderRadius: moderateScale(10),
  },
  infoSection: { alignItems: "center", marginTop: responsiveHeight(3) },
  title: {
    fontSize: responsiveFontSize(2.2),
    fontFamily: Fonts.semiBold,
    color: "#000",
    textAlign: "center",
    width: responsiveWidth(80),
  },
  subtitle: {
    fontSize: responsiveFontSize(1.5),
    color: "#666",
    textAlign: "center",
    width: responsiveWidth(80),
    fontFamily: Fonts.bold,
  },
  capturedText: {
    fontSize: responsiveFontSize(1.6),
    color: "#1E1E1E",
    fontFamily: Fonts.bold,
    textAlign: "center",
  },
  bottomControls: {
    position: "absolute",
    bottom: responsiveHeight(5),
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  iconButton: { alignItems: "center" },
  iconText: {
    marginTop: responsiveHeight(0.5),
    fontSize: responsiveFontSize(1.4),
    color: "#000",
    fontFamily: Fonts.semiBold,
  },
  captureButton: {
    width: responsiveWidth(17),
    height: responsiveWidth(17),
    borderRadius: responsiveWidth(9),
    backgroundColor: "#1F2A44",
    justifyContent: "center",
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

  savedActionsWrap: {
    width: responsiveWidth(90),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
