import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";

import { moderateScale } from "react-native-size-matters";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import {
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import ButtonsScreen from "./Home/ButtonsScreen";
import RecentTransactions from "./Home/RecentTransactions";
import { clearSession, getAccessToken, getAccessTokenAsync } from "../../services/session";
import { fetchCurrentUserStatus } from "../../services/userApi";
import { ApiError } from "../../services/api";
import { resetToLogin } from "../../navigation/navigationHelpers";
import { useLanguage } from "../../context/LanguageContext";
import Fonts from "../../constants/Fonts";

interface DashboardIdentityState {
  firstName: string;
  accountTier: "Classic" | "Premium";
  kycStatus: "pending" | "in_progress" | "verified" | "rejected";
  balance: number;
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { t, isRTL } = useLanguage();
  const [identity, setIdentity] = useState<DashboardIdentityState | null>(null);
  const [isLoadingIdentity, setIsLoadingIdentity] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const redirectToLogin = useCallback(() => {
    resetToLogin(navigation);
  }, [navigation]);

  const loadDashboardIdentity = useCallback(async (isRetry = false) => {
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

      setIdentity({
        firstName: me.firstName?.trim() || "there",
        accountTier: me.accountTier,
        kycStatus: me.kycStatus,
        balance: me.balance ?? 0,
      });
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
  }, [redirectToLogin]);

  useFocusEffect(
    useCallback(() => {
      void loadDashboardIdentity();
    }, [loadDashboardIdentity]),
  );

  const kycLabel = useMemo(() => {
    if (!identity) return "Pending";

    if (identity.kycStatus === "verified") return "Verified";
    if (identity.kycStatus === "in_progress") return "In Review";
    if (identity.kycStatus === "rejected") return "Rejected";

    return "Pending";
  }, [identity]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#F4F5F7" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: responsiveHeight(3) }}
      >
        <View style={{ height: responsiveHeight(45) }}>
          <ImageBackground
            source={require("../../../assets/mainbg.png")}
            style={{ flex: 1 }}
            resizeMode="cover"
          >
            <View style={styles.contentWrapper}>
              <View style={styles.topSection}>
                <View>
                  <Text style={styles.balanceLabel}>Total Balance</Text>
                  <Text style={styles.balanceAmount}>
                    ${identity?.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00"}
                  </Text>

                  {isLoadingIdentity ? (
                    <View style={styles.identityLoadingRow}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.identityLoadingText}>Syncing profile...</Text>
                    </View>
                  ) : (
                    <Text style={styles.identityText}>
                      {`Hi ${identity?.firstName ?? "there"} • ${identity?.accountTier ?? "Classic"} • KYC ${kycLabel}`}
                    </Text>
                  )}

                  {errorMessage ? (
                    <Text style={styles.identityErrorText}>{errorMessage}</Text>
                  ) : null}
                </View>

                <TouchableOpacity onPress={() => navigation.navigate("MayaAI")}>
                  <Image
                    source={require("../../../assets/maya.png")}
                    style={styles.mayaIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>

              <View style={[styles.buttonRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity
                  style={styles.buttonBox}
                  onPress={() => navigation.navigate("FuseSend")}
                >
                  <View style={[styles.iconWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Image
                      source={require("../../../assets/robot.png")}
                      style={[styles.fuseIcon, { [isRTL ? 'marginLeft' : 'marginRight']: responsiveWidth(2) }]}
                    />
                    <Text style={[styles.buttonText, { textAlign: isRTL ? 'right' : 'left' }]}>{t("home.fuseSend")}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.buttonBox}
                  onPress={() => navigation.navigate("FuseSend")}
                >
                  <View style={[styles.iconWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <FontAwesome
                      name="send"
                      size={moderateScale(19)}
                      style={{ [isRTL ? 'marginLeft' : 'marginRight']: responsiveWidth(3) }}
                      color="#fff"
                    />
                    <Text style={[styles.buttonText, { textAlign: isRTL ? 'right' : 'left' }]}>{t("common.send")}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.buttonBox}
                  onPress={() => navigation.navigate("AddMoney")}
                >
                  <View style={[styles.iconWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <FontAwesome5
                      name="plus"
                      size={moderateScale(19)}
                      style={{ [isRTL ? 'marginLeft' : 'marginRight']: responsiveWidth(3) }}
                      color="#fff"
                    />
                    <Text style={[styles.buttonText, { textAlign: isRTL ? 'right' : 'left' }]}>{t("home.addMoney")}</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.card}>
                <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t("home.aiInsights")}</Text>

                <Text style={[styles.cardSub, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {identity
                    ? `${identity.firstName} ${t("home.insightsSub")}`
                    : t("home.insightsSub")}
                </Text>

                <View style={[styles.bulletRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={[styles.bullet, { [isRTL ? 'marginLeft' : 'marginRight']: moderateScale(6) }]}>•</Text>
                  <Text style={[styles.bulletText, { textAlign: isRTL ? 'right' : 'left' }]}>
                    Tier status: {identity?.accountTier ?? "Classic"}. Keep transacting to unlock better transfer benefits.
                  </Text>
                </View>

                <View style={[styles.bulletRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={[styles.bullet, { [isRTL ? 'marginLeft' : 'marginRight']: moderateScale(6) }]}>•</Text>
                  <Text style={[styles.bulletText, { textAlign: isRTL ? 'right' : 'left' }]}>
                    KYC status: {kycLabel}. Your dashboard is synced securely with your backend profile.
                  </Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        </View>

        <ButtonsScreen />
        <RecentTransactions />
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  contentWrapper: {
    flex: 1,
    paddingHorizontal: responsiveWidth(5),
    paddingTop: responsiveHeight(1.5),
    gap: responsiveHeight(2.5),
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

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  buttonBox: {
    width: responsiveWidth(27),
    borderWidth: responsiveWidth(0.3),
    borderColor: "#FFFFFF",
    borderRadius: moderateScale(12),
    paddingVertical: responsiveWidth(3.2),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff49",
  },

  iconWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },

  fuseIcon: {
    width: responsiveWidth(8),
    height: responsiveWidth(8),
    resizeMode: "contain",
    marginRight: responsiveWidth(2),
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(1.8),
    fontFamily: Fonts.semiBold,
  },

  card: {
    backgroundColor: "#ffffff49",
    borderRadius: moderateScale(12),
    paddingVertical: responsiveWidth(2),
    borderWidth: 1,
    borderColor: "#FFFFFF",
    paddingHorizontal: responsiveWidth(5),
  },

  cardTitle: {
    color: "#1F2A50",
    fontSize: responsiveFontSize(1.6),
    fontFamily: Fonts.semiBold,
    marginBottom: responsiveHeight(1),
  },

  cardSub: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(1.5),
    marginBottom: responsiveHeight(1),
    fontFamily: Fonts.semiBold,
  },

  bulletRow: {
    flexDirection: "row",
  },

  bullet: {
    color: "#FFFFFF",
    marginRight: moderateScale(6),
  },

  bulletText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: responsiveFontSize(1.3),
    fontFamily: Fonts.semiBold,
  },
});
