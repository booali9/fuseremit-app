import React, { useCallback, useMemo, useRef, useState } from "react";
import { View, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Animated, ActivityIndicator } from "react-native";
import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";
import { moderateScale, scale } from "react-native-size-matters";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";
import { getAccessTokenAsync } from "../../services/session";
import { fetchCurrentUserStatus } from "../../services/userApi";
import Fonts from "../../constants/Fonts";
import AppText from "../../Components/Common/AppText";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ChecklistState {
  accountCreated: boolean;
  pinCompleted: boolean;
  classicCompleted: boolean;
  premiumCompleted: boolean;
}

interface TaskItem {
  title: string;
  completed: boolean;
  enabled: boolean;
  onPress?: () => void;
}

const AnimatedTaskTick = ({ completed }: { completed: boolean }) => {
  const progress = useRef(new Animated.Value(completed ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(progress, {
      toValue: completed ? 1 : 0,
      duration: 420,
      useNativeDriver: false,
    }).start();
  }, [completed, progress]);

  const backgroundColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["#F3F4F6", "#27AE60"],
  });

  const borderColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["#D1D5DB", "#27AE60"],
  });

  const scaleValue = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  return (
    <Animated.View
      style={[
        styles.tickCircle,
        {
          backgroundColor,
          borderColor,
          transform: [{ scale: scaleValue }],
        },
      ]}
    >
      <Ionicons
        name="checkmark"
        size={moderateScale(14)}
        color={completed ? "#fff" : "#8B8B8B"}
      />
    </Animated.View>
  );
};

const MainOnbaordingScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [checklist, setChecklist] = useState<ChecklistState>({
    accountCreated: true,
    pinCompleted: false,
    classicCompleted: false,
    premiumCompleted: false,
  });

  const loadChecklist = useCallback(async () => {
    const accessToken = await getAccessTokenAsync();

    if (!accessToken) {
      setChecklist((prev) => ({
        ...prev,
        accountCreated: true,
      }));
      setErrorMessage("Session not found. Please login again to sync progress.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const me = await fetchCurrentUserStatus(accessToken);
      const isClassicCompleted = me.kycStatus !== "pending";
      const isPremiumCompleted = me.kycStatus === "verified";

      setChecklist({
        accountCreated: Boolean(me.id),
        pinCompleted: me.hasTransactionPin,
        classicCompleted: isClassicCompleted,
        premiumCompleted: isPremiumCompleted,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to sync onboarding progress.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadChecklist();
    }, [loadChecklist]),
  );

  const tasks = useMemo<TaskItem[]>(
    () => [
      {
        title: "Create An Account",
        completed: checklist.accountCreated,
        enabled: false,
      },
      {
        title: "Create Your Transaction PIN",
        completed: checklist.pinCompleted,
        enabled: checklist.accountCreated,
        onPress: () => navigation.navigate("OnboardingTransactionPin"),
      },
      {
        title: "Upgrade to FuseRemit Classic",
        completed: checklist.classicCompleted,
        enabled: checklist.pinCompleted,
        onPress: () => navigation.navigate("OnboardingClassic"),
      },
      {
        title: "Upgrade to FuseRemit Premium",
        completed: checklist.premiumCompleted,
        enabled: checklist.classicCompleted,
        onPress: () => navigation.navigate("OnboardingPremium"),
      },
    ],
    [checklist, navigation],
  );

  const canGoHome = checklist.premiumCompleted;

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

      <View style={styles.descriptionContainer}>
        <AppText style={styles.descriptionText}>
          Complete these tasks to fully utilize your FuseRemit account.
        </AppText>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#0B3963" />
          <AppText style={styles.loadingText}>Syncing your progress...</AppText>
        </View>
      ) : null}

      {errorMessage ? <AppText style={styles.errorText}>{errorMessage}</AppText> : null}

      <View style={styles.taskContainer}>
        {tasks.map((task) => {
          const isClickable = Boolean(task.onPress) && task.enabled;

          return (
            <TouchableOpacity
              key={task.title}
              activeOpacity={isClickable ? 0.7 : 1}
              onPress={task.onPress}
              disabled={!isClickable}
              style={styles.taskItem}
            >
              <AnimatedTaskTick completed={task.completed} />
              <AppText style={[styles.taskText, !isClickable && !task.completed && styles.taskTextDisabled]}>
                {task.title}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      {!canGoHome ? (
        <AppText style={styles.lockedHint}>Complete all KYC steps to unlock Home.</AppText>
      ) : null}

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.homeButton, !canGoHome && styles.homeButtonDisabled]}
          onPress={() => navigation.navigate("AppServiceBottomNavigation")}
          disabled={!canGoHome}
        >
          <AppText style={styles.homeButtonText}>Go To Home</AppText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default MainOnbaordingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: responsiveWidth(5),
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: responsiveHeight(5),
  },

  headerTitle: {
    fontSize: responsiveFontSize(2.5),
    fontFamily: Fonts.semiBold,
    color: "#000",
  },

  descriptionContainer: {
    marginTop: responsiveHeight(5),
    paddingHorizontal: responsiveWidth(5),
  },

  descriptionText: {
    textAlign: "center",
    fontSize: responsiveFontSize(1.8),
    color: "#1E1E1E",
    fontFamily: Fonts.semiBold,
  },

  loadingWrap: {
    alignItems: "center",
    marginTop: responsiveHeight(2),
  },

  loadingText: {
    marginTop: responsiveHeight(0.8),
    color: "#0B3963",
    fontFamily: Fonts.semiBold,
    fontSize: responsiveFontSize(1.4),
  },

  errorText: {
    marginTop: responsiveHeight(1.4),
    textAlign: "center",
    color: "#FB002E",
    fontFamily: Fonts.semiBold,
    fontSize: responsiveFontSize(1.4),
  },

  taskContainer: {
    marginTop: responsiveHeight(6),
    paddingHorizontal: scale(10),
  },

  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: responsiveHeight(4),
  },

  tickCircle: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(24),
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    marginRight: responsiveWidth(3),
  },

  taskText: {
    fontSize: responsiveFontSize(2),
    color: "#333",
    fontFamily: Fonts.semiBold,
  },

  taskTextDisabled: {
    color: "#9CA3AF",
  },

  lockedHint: {
    textAlign: "center",
    color: "#6B7280",
    fontFamily: Fonts.semiBold,
    fontSize: responsiveFontSize(1.45),
    marginTop: responsiveHeight(0.5),
    paddingHorizontal: responsiveWidth(8),
  },

  bottomContainer: {
    position: "absolute",
    bottom: responsiveHeight(8),
    left: 0,
    right: 0,
    alignItems: "center",
  },

  homeButton: {
    width: responsiveWidth(90),
    height: responsiveHeight(6.5),
    backgroundColor: "#0B3963",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: moderateScale(10),
  },

  homeButtonDisabled: {
    backgroundColor: "#AEB8C2",
  },

  homeButtonText: {
    color: "#fff",
    fontSize: responsiveFontSize(1.8),
    fontFamily: Fonts.semiBold,
  },
});
