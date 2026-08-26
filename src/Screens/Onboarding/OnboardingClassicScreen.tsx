import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Image, Animated, StatusBar } from "react-native";
import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";
import { moderateScale } from "react-native-size-matters";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import Svg, { Circle } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import { getAccessTokenAsync } from "../../services/session";
import { updateKycStatus } from "../../services/userApi";
import Fonts from "../../constants/Fonts";
import AppText from "../../Components/Common/AppText";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const allowedFormats = ["png", "jpg", "jpeg", "svg", "gif", "pdf"];

const OnboardingClassicScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [isError, setIsError] = useState<boolean>(false);
  const [fileType, setFileType] = useState<"image" | "pdf" | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [syncError, setSyncError] = useState<string>("");

  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Auto navigate after 3 seconds when completed
  useEffect(() => {
    if (progress === 100) {
      let isMounted = true;

      const syncClassicTier = async () => {
        const accessToken = await getAccessTokenAsync();

        if (!accessToken) {
          return;
        }

        try {
          await updateKycStatus(accessToken, "in_progress");
        } catch (error) {
          if (!isMounted) return;

          const message =
            error instanceof Error
              ? error.message
              : "Unable to sync classic upgrade status";

          setSyncError(message);
        }
      };

      void syncClassicTier();

      const timer = setTimeout(() => {
        navigation.navigate("MainOnboarding");
      }, 2500);

      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
  }, [progress]);

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const file = result.assets[0];
    const extension = file.name.split(".").pop()?.toLowerCase() || "";

    if (allowedFormats.includes(extension)) {
      setIsError(false);
      setFileName(file.name);
      setProgress(0);
      setFileType(extension === "pdf" ? "pdf" : "image");
      simulateUpload();
    } else {
      setIsError(true);
      setFileType(null);
    }
  };

  const simulateUpload = () => {
    let value = 0;
    const interval = setInterval(() => {
      value += 10;
      setProgress(value);
      if (value >= 100) clearInterval(interval);
    }, 300);
  };

  const removeFile = () => {
    setFileType(null);
    setFileName("");
    setProgress(0);
  };

  const radius = 16;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  const isUploading = progress > 0 && progress < 100;
  const isCompleted = progress === 100;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={moderateScale(22)} />
        </TouchableOpacity>

        <AppText style={styles.headerTitle}>Get Started</AppText>

        <TouchableOpacity>
          <Ionicons name="notifications" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <AppText style={styles.subTitle}>
          Complete the steps below to upgrade your account to FuseRemit Classic.
        </AppText>

        <View style={styles.stepRow}>
          <Feather name="check" size={moderateScale(18)} color="#000000" />
          <AppText style={styles.stepText}>Upload Means of Identification</AppText>
        </View>

        <AppText style={styles.uploadLabel}>Upload Means Of Identification</AppText>

        {!fileType && (
          <TouchableOpacity
            style={[
              styles.uploadBox,
              { borderColor: isError ? "#E53935" : "#0B3963" },
            ]}
            onPress={pickFile}
          >
            <View style={styles.iconRow}>
              <Image
                source={require("../../../assets/image.png")}
                style={styles.iconImage}
              />
              <Image
                source={require("../../../assets/pdf.png")}
                style={[styles.iconImage, { marginLeft: responsiveWidth(3) }]}
              />
            </View>

            <View>
              <AppText style={styles.uploadText}>
                Drop your files here or{" "}
                <AppText style={styles.uploadLink}>Click To Upload</AppText>
              </AppText>
              <AppText style={styles.formatText}>
                PNG, JPG, JPEG, SVG, GIF or PDF
              </AppText>
            </View>
          </TouchableOpacity>
        )}

        {fileType && (
          <View
            style={[
              styles.fileContainer,
              {
                borderColor: isUploading
                  ? "#F4F4F5"
                  : isCompleted
                    ? "#F4F4F5"
                    : "#0B3963",
              },
            ]}
          >
            <View
              style={[
                styles.progressBackground,
                {
                  width: `${progress}%`,
                  backgroundColor: isUploading
                    ? "#F4F4F5"
                    : isCompleted
                      ? "#17c96420"
                      : "#BFDBFE",
                },
              ]}
            />

            <View style={styles.fileContent}>
              {fileType === "image" ? (
                <Image
                  source={require("../../../assets/image.png")}
                  style={styles.fileIcon}
                />
              ) : (
                <Image
                  source={require("../../../assets/pdf.png")}
                  style={styles.fileIcon}
                />
              )}

              <View style={{ flex: 1 }}>
                <AppText style={styles.fileName}>{fileName}</AppText>
                <AppText style={styles.progressText}>{progress}% uploaded</AppText>
              </View>

              {isUploading && (
                <Svg width={40} height={40}>
                  <Circle
                    stroke="#F4F4F5"
                    fill="none"
                    cx="20"
                    cy="20"
                    r={radius}
                    strokeWidth={strokeWidth}
                  />
                  <AnimatedCircle
                    stroke="#006FEE"
                    fill="none"
                    cx="20"
                    cy="20"
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </Svg>
              )}

              {isCompleted && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="checkmark-circle" size={24} color="#17C964" />
                  <TouchableOpacity onPress={removeFile}>
                    <MaterialIcons
                      name="delete-outline"
                      size={28}
                      color="#64696B"
                      style={{ marginLeft: responsiveWidth(3) }}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {syncError ? <AppText style={styles.syncErrorText}>{syncError}</AppText> : null}
      </View>
    </SafeAreaView>
  );
};

export default OnboardingClassicScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FB" },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: responsiveWidth(5),
    marginTop: responsiveHeight(5),
  },
  headerTitle: {
    fontSize: responsiveFontSize(2.5),
    fontFamily: Fonts.semiBold,
  },
  content: { paddingHorizontal: responsiveWidth(6) },
  subTitle: {
    fontSize: responsiveFontSize(1.9),
    textAlign: "center",
    marginVertical: responsiveHeight(5),
    fontFamily: Fonts.semiBold,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: responsiveHeight(6),
  },
  stepText: {
    marginLeft: responsiveWidth(2),
    fontFamily: Fonts.semiBold,
  },
  uploadLabel: {
    marginTop: responsiveHeight(10),
    marginBottom: responsiveHeight(2),
    fontFamily: Fonts.semiBold,
  },
  uploadBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 20,
    backgroundColor: "#F4F8FF",
  },
  iconRow: { flexDirection: "row", marginBottom: 10 },
  iconImage: { width: 30, height: 30, resizeMode: "contain" },
  uploadText: { color: "#6B7280" },
  uploadLink: { color: "#0B3963", fontWeight: "600" },
  formatText: { color: "#0B3963", marginTop: 5 },
  fileContainer: {
    borderWidth: 1.5,
    borderRadius: 14,
    height: responsiveHeight(9),
    justifyContent: "center",
    overflow: "hidden",
  },
  progressBackground: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  fileContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(4),
  },
  fileIcon: {
    width: 35,
    height: 35,
    marginRight: 10,
    resizeMode: "contain",
  },
  fileName: { fontFamily: Fonts.semiBold },
  progressText: { fontSize: 12, color: "#555" },
  syncErrorText: {
    marginTop: responsiveHeight(1.2),
    color: "#FB002E",
    fontFamily: Fonts.semiBold,
    fontSize: responsiveFontSize(1.3),
  },
});
