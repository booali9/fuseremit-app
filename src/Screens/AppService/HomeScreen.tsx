import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ImageBackground, Image, TouchableOpacity, StatusBar, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";

import { moderateScale } from "react-native-size-matters";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import ButtonsScreen from "./Home/ButtonsScreen";
import RecentTransactions from "./Home/RecentTransactions";
import {
  clearSession,
  getAccessToken,
  getAccessTokenAsync,
} from "../../services/session";
import { syncFcmTokenWithBackend } from "../../services/notifications";
import { fetchCurrentUserStatus } from "../../services/userApi";
import { ApiError } from "../../services/api";
import { mayaInsights } from "../../services/mayaApi";
import { resetToLogin } from "../../navigation/navigationHelpers";
import { useLanguage } from "../../context/LanguageContext";
import Fonts from "../../constants/Fonts";
import AppText from "../../Components/Common/AppText";

interface DashboardIdentityState {
  firstName: string;
  accountTier: "Classic" | "Premium";
  kycStatus: "pending" | "in_progress" | "verified" | "rejected";
  balance: number;
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLanguage();
  const [identity, setIdentity] = useState<DashboardIdentityState | null>(null);
  const [isLoadingIdentity, setIsLoadingIdentity] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [insightBullets, setInsightBullets] = useState<string[]>([]);

  const redirectToLogin = useCallback(() => {
    resetToLogin(navigation);
  }, [navigation]);

  const loadDashboardIdentity = useCallback(
    async (isRetry = false) => {
      try {
        setErrorMessage("");
        setIsLoadingIdentity(true);

        const accessToken = getAccessToken() ?? (await getAccessTokenAsync());

        if (!accessToken) {
          if (!isRetry) {
            // A token set moments ago by the OTP screen can take a beat to be
            // readable here. Give it one short retry before treating it as logged out.
            await new Promise((resolve) => setTimeout(resolve, 500));
            return loadDashboardIdentity(true);
          }

          redirectToLogin();
          return;
        }

        const me = await fetchCurrentUserStatus(accessToken);

        const nextIdentity = {
          firstName: me.firstName?.trim() || "there",
          accountTier: me.accountTier,
          kycStatus: me.kycStatus,
          balance: me.balance ?? 0,
        };
        setIdentity(nextIdentity);

        // ponytail: fire-and-forget Maya insights; dashboard still works if Gemini fails
        void mayaInsights()
          .then((data) => {
            if (Array.isArray(data.bullets) && data.bullets.length) {
              setInsightBullets(data.bullets.slice(0, 2));
            }
          })
          .catch(() => undefined);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          if (!isRetry) {
            // ponytail: a freshly issued token failing its first check then working
            // on retry is the signature of a transient/first-use hiccup, not a real
            // logout. One retry covers it; revisit if it ever needs backoff/more tries.
            await new Promise((resolve) => setTimeout(resolve, 800));
            return loadDashboardIdentity(true);
          }

          await clearSession();
          redirectToLogin();
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to sync dashboard right now.";

        setErrorMessage(message);
      } finally {
        setIsLoadingIdentity(false);
      }
    },
    [redirectToLogin],
  );

  useFocusEffect(
    useCallback(() => {
      void loadDashboardIdentity();
    }, [loadDashboardIdentity]),
  );

  // Sync the FCM token once we're on the authenticated dashboard. Running it here
  // (rather than at login) ensures the notification permission prompt has been
  // resolved first, so a real token gets registered against the user.
  useEffect(() => {
    void syncFcmTokenWithBackend();
  }, []);

  const kycLabel = useMemo(() => {
    if (!identity) return "Pending";

    if (identity.kycStatus === "verified") return "Verified";
    if (identity.kycStatus === "in_progress") return "In Review";
    if (identity.kycStatus === "rejected") return "Rejected";

    return "Pending";
  }, [identity]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: responsiveHeight(3) }}
      >
        <ImageBackground
          source={require("../../../assets/mainbg.png")}
          style={styles.hero}
          resizeMode="cover"
        >
          <View
            style={[
              styles.contentWrapper,
              { paddingTop: insets.top + responsiveHeight(2) },
            ]}
          >
              <View style={styles.topSection}>
                <View>
                  <AppText style={styles.balanceLabel}>Total Balance</AppText>
                  <AppText style={styles.balanceAmount}>
                    $
                    {identity?.balance.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) ?? "0.00"}
                  </AppText>

                  {isLoadingIdentity ? (
                    <View style={styles.identityLoadingRow}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <AppText style={styles.identityLoadingText}>
                        Syncing profile...
                      </AppText>
                    </View>
                  ) : (
                    <AppText style={styles.identityText}>
                      {`Hi ${identity?.firstName ?? "there"} • ${identity?.accountTier ?? "Classic"} • KYC ${kycLabel}`}
                    </AppText>
                  )}

                  {errorMessage ? (
                    <AppText style={styles.identityErrorText}>{errorMessage}</AppText>
                  ) : null}
                </View>

                <View style={styles.topActions}>
                  {/* ponytail: $20 mirrors REFERRAL_DISCOUNT in the backend's
                      referral.controller.ts — hardcoded to avoid an extra API
                      call on Home just to render a static number. */}
                  <TouchableOpacity
                    style={styles.referralPill}
                    onPress={() => navigation.navigate("Profile", { screen: "Referral" })}
                  >
                    <AppText style={styles.referralPillText}>$20</AppText>
                    <FontAwesome5 name="gift" size={moderateScale(15)} color="#0B3963" />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => navigation.navigate("MayaAI")}>
                    <Image
                      source={require("../../../assets/maya.png")}
                      style={styles.mayaIcon}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View
                style={[
                  styles.buttonRow,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
              >
                <TouchableOpacity
                  style={styles.buttonBox}
                  onPress={() =>
                    navigation.navigate("FuseSend", {
                      screen: "FuseRemittance",
                    })
                  }
                >
                  <View style={styles.iconWrapper}>
                    <Image
                      source={require("../../../assets/robot.png")}
                      style={styles.fuseIcon}
                    />
                    <AppText style={styles.buttonText}>{t("home.fuseSend")}</AppText>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.buttonBox}
                  onPress={() =>
                    navigation.navigate("FuseSend", {
                      screen: "FuseRemittance",
                    })
                  }
                >
                  <View style={styles.iconWrapper}>
                    <FontAwesome
                      name="send"
                      size={moderateScale(19)}
                      style={{ marginBottom: responsiveHeight(0.8) }}
                      color="#fff"
                    />
                    <AppText style={styles.buttonText}>{t("common.send")}</AppText>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.buttonBox}
                  onPress={() => navigation.navigate("AddMoney")}
                >
                  <View style={styles.iconWrapper}>
                    <FontAwesome5
                      name="plus"
                      size={moderateScale(19)}
                      style={{ marginBottom: responsiveHeight(0.8) }}
                      color="#fff"
                    />
                    <AppText style={styles.buttonText}>{t("home.addMoney")}</AppText>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.card}>
                <AppText
                  style={[
                    styles.cardTitle,
                    { textAlign: isRTL ? "right" : "left" },
                  ]}
                >
                  {t("home.aiInsights")}
                </AppText>

                <AppText
                  style={[
                    styles.cardSub,
                    { textAlign: isRTL ? "right" : "left" },
                  ]}
                >
                  {identity
                    ? `${identity.firstName} ${t("home.insightsSub")}`
                    : t("home.insightsSub")}
                </AppText>

                {(insightBullets.length
                  ? insightBullets
                  : [
                      `Tier status: ${identity?.accountTier ?? "Classic"}. Keep transacting to unlock better transfer benefits.`,
                      `KYC status: ${kycLabel}. Your dashboard is synced securely with your backend profile.`,
                    ]
                ).map((bullet) => (
                  <View
                    key={bullet}
                    style={[
                      styles.bulletRow,
                      { flexDirection: isRTL ? "row-reverse" : "row" },
                    ]}
                  >
                    <AppText
                      style={[
                        styles.bullet,
                        {
                          [isRTL ? "marginLeft" : "marginRight"]:
                            moderateScale(6),
                        },
                      ]}
                    >
                      •
                    </AppText>
                    <AppText
                      style={[
                        styles.bulletText,
                        { textAlign: isRTL ? "right" : "left" },
                      ]}
                    >
                      {bullet}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>
        </ImageBackground>
        <ButtonsScreen />
        <RecentTransactions />
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F5F7",
  },

  hero: {
    paddingBottom: responsiveHeight(3.5),
    borderBottomLeftRadius: moderateScale(28),
    borderBottomRightRadius: moderateScale(28),
    overflow: "hidden",
  },

  contentWrapper: {
    paddingHorizontal: responsiveWidth(5),
    gap: responsiveHeight(2.8),
  },

  topSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  balanceLabel: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.semiBold,
  },

  balanceAmount: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(4),
    fontFamily: Fonts.bold,
  },

  identityLoadingRow: {
    marginTop: responsiveHeight(0.8),
    flexDirection: "row",
    alignItems: "center",
  },

  identityLoadingText: {
    color: "#E1E7F0",
    marginLeft: responsiveWidth(2),
    fontSize: responsiveFontSize(1.4),
    fontFamily: Fonts.semiBold,
  },

  identityText: {
    marginTop: responsiveHeight(0.8),
    color: "#DCE8FF",
    fontSize: responsiveFontSize(1.4),
    fontFamily: Fonts.semiBold,
  },

  identityErrorText: {
    marginTop: responsiveHeight(0.4),
    color: "#FFD3D3",
    fontSize: responsiveFontSize(1.2),
    fontFamily: Fonts.semiBold,
    maxWidth: responsiveWidth(58),
  },

  robotCircle: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    borderRadius: responsiveWidth(9),
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  robotImage: {
    width: responsiveWidth(7),
    height: responsiveWidth(7),
    resizeMode: "contain",
  },
  mayaIcon: {
    width: responsiveWidth(12),
    height: responsiveWidth(12),
  },

  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(2.5),
  },

  referralPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(1.5),
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(20),
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.8),
  },

  referralPillText: {
    color: "#0B3963",
    fontSize: responsiveFontSize(1.7),
    fontFamily: Fonts.bold,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  buttonBox: {
    width: responsiveWidth(27),
    minHeight: responsiveHeight(8.5),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    borderRadius: moderateScale(16),
    paddingVertical: responsiveHeight(1.4),
    paddingHorizontal: responsiveWidth(2),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },

  fuseIcon: {
    width: responsiveWidth(7),
    height: responsiveWidth(7),
    resizeMode: "contain",
    marginBottom: responsiveHeight(0.8),
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(1.65),
    fontFamily: Fonts.semiBold,
    textAlign: "center",
    lineHeight: responsiveFontSize(2.2),
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: moderateScale(18),
    paddingVertical: responsiveHeight(2),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    paddingHorizontal: responsiveWidth(5),
    gap: responsiveHeight(0.6),
  },

  cardTitle: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(1.75),
    fontFamily: Fonts.bold,
    marginBottom: responsiveHeight(0.4),
  },

  cardSub: {
    color: "rgba(255,255,255,0.72)",
    fontSize: responsiveFontSize(1.5),
    marginBottom: responsiveHeight(1),
    fontFamily: Fonts.semiBold,
  },

  bulletRow: {
    flexDirection: "row",
    marginTop: responsiveHeight(0.4),
  },

  bullet: {
    color: "#7FA8FF",
    marginRight: moderateScale(6),
    fontSize: responsiveFontSize(1.6),
    lineHeight: responsiveFontSize(2.1),
  },

  bulletText: {
    flex: 1,
    color: "rgba(255,255,255,0.88)",
    fontSize: responsiveFontSize(1.4),
    fontFamily: Fonts.medium,
    lineHeight: responsiveFontSize(2.1),
  },
});
