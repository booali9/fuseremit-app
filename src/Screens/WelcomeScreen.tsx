import { useEffect } from "react";
import { StyleSheet, Image, ImageBackground, StatusBar, View } from "react-native";
import * as Animatable from "react-native-animatable";
import {
  responsiveHeight,
  responsiveWidth,
} from "react-native-responsive-dimensions";
import { moderateScale } from "react-native-size-matters";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { getAccessTokenAsync, hydrateSession } from "../services/session";
import { fetchCurrentUserStatus } from "../services/userApi";

const WelcomeScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    let isMounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const bootstrapSession = async () => {
      try {
        await hydrateSession();
        const accessToken = await getAccessTokenAsync();

        let target: "AppServiceBottomNavigation" | "AdvancedKYC" | "Login" = "Login";
        if (accessToken) {
          target = "AdvancedKYC";
          try {
            const status = await fetchCurrentUserStatus(accessToken);
            if (status.kycStatus === "verified") target = "AppServiceBottomNavigation";
          } catch {
            // ponytail: fail closed — unverifiable status routes through KYC, not the app
          }
        }

        if (!isMounted) return;

        timer = setTimeout(() => {
          if (!isMounted) return;

          navigation.replace(target);
        }, 3500);
      } catch {
        if (!isMounted) return;
        
        timer = setTimeout(() => {
          if (!isMounted) return;
          navigation.replace("Login");
        }, 3500);
      }
    };

    void bootstrapSession();

    return () => {
      isMounted = false;

      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [navigation]);

  return (
    <ImageBackground
      source={require("../../assets/with purple Sprinkles.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <Animatable.View
        animation="zoomIn"
        duration={2500}
        delay={400}
        easing="ease-out-expo"
        useNativeDriver
      >
        <Image
          source={require("../../assets/login.png")}
          style={styles.image}
          resizeMode="contain"
        />
      </Animatable.View>
    </ImageBackground>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000", // Fallback
  },
  image: {
    width: responsiveWidth(45),
    height: responsiveWidth(45),
  },
});
