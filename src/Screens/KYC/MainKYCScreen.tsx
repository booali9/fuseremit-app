import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator } from "react-native";
import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";
import { moderateScale } from "react-native-size-matters";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getAccessTokenAsync } from "../../services/session";
import { fetchCurrentUserStatus } from "../../services/userApi";
import { getManualKycDraft } from "../../services/manualKycDraft";
import Fonts from "../../constants/Fonts";
import AppText from "../../Components/Common/AppText";

interface KycCompletionState {
  personalInfoDone: boolean;
  documentDone: boolean;
  livenessDone: boolean;
}

const MainKYCScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [completion, setCompletion] = useState<KycCompletionState>({
    personalInfoDone: false,
    documentDone: false,
    livenessDone: false,
  });

  const loadKycState = useCallback(async () => {
    try {
      setErrorMessage("");
      setIsLoading(true);

      const [accessToken, draft] = await Promise.all([
        getAccessTokenAsync(),
        getManualKycDraft(),
      ]);

      let personalInfoDone = Boolean(
        draft.personalInfo?.firstName &&
          draft.personalInfo?.lastName &&
          draft.personalInfo?.email &&
          draft.personalInfo?.dateOfBirth &&
          draft.personalInfo?.gender,
      );

      if (accessToken) {
        const me = await fetchCurrentUserStatus(accessToken);
        personalInfoDone = Boolean(
          me.firstName &&
            me.lastName &&
            me.email &&
            me.dateOfBirth &&
            me.gender,
        );
      }

      setCompletion({
        personalInfoDone,
        documentDone: Boolean(draft.documentImageBase64),
        livenessDone: Boolean(draft.livenessImageBase64),
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load KYC progress.";

      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadKycState();
    }, [loadKycState]),
  );

  const canVerify = useMemo(
    () =>
      completion.personalInfoDone &&
      completion.documentDone &&
      completion.livenessDone,
    [completion],
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={moderateScale(22)} />
        </TouchableOpacity>

        <AppText style={styles.headerTitle}>KYC</AppText>

        <TouchableOpacity>
          <Ionicons
            name="notifications"
            size={moderateScale(22)}
            color="#000"
          />
        </TouchableOpacity>
      </View>

      <AppText style={styles.description}>
        To fully unlock the potential of FuseRemit, you'll need to complete
        identity verification by providing the following:
      </AppText>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#0B3963" />
          <AppText style={styles.loadingText}>Refreshing KYC checklist...</AppText>
        </View>
      ) : null}

      {errorMessage ? <AppText style={styles.errorText}>{errorMessage}</AppText> : null}

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("PersonalInformation")}
      >
        <AppText style={styles.cardText}>
          Some personal information: your name, date of birth etc.
        </AppText>

        <View style={styles.iconRow}>
          {completion.personalInfoDone ? (
            <Ionicons
              name="checkmark-circle"
              size={moderateScale(24)}
              color="#19D36B"
            />
          ) : (
            <MaterialCommunityIcons
              name="playlist-check"
              size={26}
              color="#fff"
            />
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("DocumentType")}
      >
        <AppText style={styles.cardText}>
          A picture of your passport or ID card
        </AppText>

        {completion.documentDone ? (
          <Ionicons
            name="checkmark-circle"
            size={moderateScale(24)}
            color="#19D36B"
          />
        ) : (
          <Ionicons
            name="phone-portrait-outline"
            size={moderateScale(22)}
            color="#fff"
          />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("LivenessVerify")}
      >
        <AppText style={styles.cardText}>Liveness check</AppText>

        {completion.livenessDone ? (
          <Ionicons
            name="checkmark-circle"
            size={moderateScale(24)}
            color="#19D36B"
          />
        ) : (
          <MaterialCommunityIcons
            name="emoticon-happy-outline"
            size={moderateScale(22)}
            color="#fff"
          />
        )}
      </TouchableOpacity>

      <View style={{ flex: 1 }} />

      {!canVerify ? (
        <AppText style={styles.lockHint}>Complete all three KYC items to continue.</AppText>
      ) : null}

      <TouchableOpacity
        style={[styles.verifyButton, !canVerify && styles.verifyButtonDisabled]}
        onPress={() => navigation.navigate("VerificationProgress")}
        disabled={!canVerify}
      >
        <AppText style={styles.verifyText}>Verify</AppText>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default MainKYCScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: responsiveWidth(5),
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: responsiveHeight(5),
  },

  headerTitle: {
    fontSize: responsiveFontSize(2.4),
    fontFamily: Fonts.bold,
    color: "#000",
  },

  description: {
    marginTop: responsiveHeight(5),
    fontSize: responsiveFontSize(1.8),
    color: "#1E1E1E",
    lineHeight: moderateScale(22),
    fontFamily: Fonts.medium,
    marginBottom: responsiveHeight(6),
  },

  loadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: responsiveHeight(1),
  },

  loadingText: {
    marginLeft: responsiveWidth(2),
    color: "#0B3963",
    fontFamily: Fonts.semiBold,
    fontSize: responsiveFontSize(1.4),
  },

  errorText: {
    color: "#FB002E",
    fontFamily: Fonts.semiBold,
    fontSize: responsiveFontSize(1.35),
    marginBottom: responsiveHeight(0.8),
  },

  card: {
    marginTop: responsiveHeight(2),
    backgroundColor: "#0B3963",
    borderRadius: moderateScale(8),
    paddingVertical: responsiveHeight(2),
    paddingHorizontal: responsiveWidth(4),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cardText: {
    flex: 1,
    color: "#fff",
    fontSize: responsiveFontSize(1.9),
    marginRight: responsiveWidth(3),
    fontFamily: Fonts.semiBold,
  },

  iconRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  verifyButton: {
    backgroundColor: "#0B3963",
    borderRadius: moderateScale(10),
    paddingVertical: responsiveHeight(2),
    alignItems: "center",
    marginBottom: responsiveHeight(8),
  },

  verifyButtonDisabled: {
    backgroundColor: "#A7B6C8",
  },

  lockHint: {
    color: "#5B6470",
    fontSize: responsiveFontSize(1.45),
    fontFamily: Fonts.semiBold,
    textAlign: "center",
    marginBottom: responsiveHeight(1.2),
  },

  verifyText: {
    color: "#fff",
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.bold,
  },
});
