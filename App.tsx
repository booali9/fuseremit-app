import { useEffect, useState } from "react";
import { useFonts } from "expo-font";
import { Provider as PaperProvider, MD3LightTheme, configureFonts } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./src/navigation/AppNavigator";
import StripeWrapper from "./src/Components/Common/StripeWrapper";
import { LanguageProvider } from "./src/context/LanguageContext";
import { registerForPushNotificationsAsync } from "./src/services/notifications";
import Fonts from "./src/constants/Fonts";
import AnimatedSplash from "./src/Screens/AnimatedSplash";

const fontConfig = {
  displayLarge: { fontFamily: Fonts.extraBold },
  displayMedium: { fontFamily: Fonts.bold },
  displaySmall: { fontFamily: Fonts.semiBold },
  headlineLarge: { fontFamily: Fonts.bold },
  headlineMedium: { fontFamily: Fonts.semiBold },
  headlineSmall: { fontFamily: Fonts.medium },
  titleLarge: { fontFamily: Fonts.semiBold },
  titleMedium: { fontFamily: Fonts.medium },
  titleSmall: { fontFamily: Fonts.regular },
  labelLarge: { fontFamily: Fonts.medium },
  labelMedium: { fontFamily: Fonts.regular },
  labelSmall: { fontFamily: Fonts.regular },
  bodyLarge: { fontFamily: Fonts.regular },
  bodyMedium: { fontFamily: Fonts.regular },
  bodySmall: { fontFamily: Fonts.regular },
};

const theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
};

export default function App() {
  const [fontsLoaded] = useFonts({
    "Manrope-Regular": require("./assets/fonts/Manrope-Regular.ttf"),
    "Manrope-Medium": require("./assets/fonts/Manrope-Medium.ttf"),
    "Manrope-SemiBold": require("./assets/fonts/Manrope-SemiBold.ttf"),
    "Manrope-Bold": require("./assets/fonts/Manrope-Bold.ttf"),
    "Manrope-ExtraBold": require("./assets/fonts/Manrope-ExtraBold.ttf"),
    "Manrope-Light": require("./assets/fonts/Manrope-Light.ttf"),
    "Manrope-ExtraLight": require("./assets/fonts/Manrope-ExtraLight.ttf"),
    "KronaOne-Regular": require("./assets/fonts/KronaOne-Regular.ttf"),
  });

  useEffect(() => {
    // Ask for notification permission right after the splash screen, before login.
    void registerForPushNotificationsAsync();
  }, []);

  const [showSplash, setShowSplash] = useState(true);

  if (!fontsLoaded) {
    return null;
  }

  if (showSplash) {
    return <AnimatedSplash onFinish={() => setShowSplash(false)} />;
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <PaperProvider theme={theme}>
          <StripeWrapper>
            <AppNavigator />
          </StripeWrapper>
        </PaperProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
