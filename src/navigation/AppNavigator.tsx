import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WelcomeScreen from "../Screens/WelcomeScreen";
import { RootStackParamList } from "../types/navigation";
import LoginScreen from "../Screens/LoginScreen";
import ChangeDevicePin from "../Components/DeviceChange/ChangeDevicePin";
import ChangeDeviceScreen from "../Components/DeviceChange/ChangeDeviceScreen";
import ChangeDevicePhoneVerify from "../Components/DeviceChange/ChangeDevicePhoneVerify";
import PhoneNumberVerify from "../Components/Login/PhoneNumberVerify";
import SignUpScreen from "../Screens/SignUpScreen";
import CreatePin from "../Screens/CreatePin";
import MainOnbaordingScreen from "../Screens/Onboarding/MainOnbaordingScreen";
import OnboardingTransactionPin from "../Screens/Onboarding/OnboardingTransactionPin";
import OnboardingClassicScreen from "../Screens/Onboarding/OnboardingClassicScreen";
import OnboardingPremiumScreen from "../Screens/Onboarding/OnboardingPremiumScreen";
import MainKYCScreen from "../Screens/KYC/MainKYCScreen";
import AdvancedKYCScreen from "../Screens/KYC/AdvancedKYCScreen";
import PersonalInformation from "../Screens/KYC/PersonalInformation";
import BackgroundlInformation from "../Screens/KYC/BackgroundInformation";
import Submission from "../Screens/KYC/Submission";
import DocumentTypeScreen from "../Screens/KYC/DocumentTypeScreen";
import SelectDocumentScreen from "../Screens/KYC/SelectDocumentScreen";
import BottomNavigation from "../Screens/AppService/BottomNavigation";
import VerifyItsYouScreen from "../Screens/KYC/VerifyItsYouScreen";
import VerificationProgressScreen from "../Screens/KYC/VerificationProgressScreen";
import IdentityWebViewScreen from "../Screens/KYC/IdentityWebViewScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ChangeDevicePin" component={ChangeDevicePin} />
        <Stack.Screen name="ChangeDeviceMain" component={ChangeDeviceScreen} />
        <Stack.Screen
          name="ChangeDevicePhoneVerify"
          component={ChangeDevicePhoneVerify}
        />
        <Stack.Screen name="PhoneNumberVerify" component={PhoneNumberVerify} />
        <Stack.Screen name="Signup" component={SignUpScreen} />
        <Stack.Screen name="CreatePin" component={CreatePin} />
        <Stack.Screen name="MainOnboarding" component={MainOnbaordingScreen} />
        <Stack.Screen
          name="OnboardingTransactionPin"
          component={OnboardingTransactionPin}
        />
        <Stack.Screen
          name="OnboardingClassic"
          component={OnboardingClassicScreen}
        />
        <Stack.Screen
          name="OnboardingPremium"
          component={OnboardingPremiumScreen}
        />
        <Stack.Screen name="MainKYC" component={MainKYCScreen} />
        <Stack.Screen name="AdvancedKYC" component={AdvancedKYCScreen} />
        <Stack.Screen
          name="PersonalInformation"
          component={PersonalInformation}
        />
        <Stack.Screen
          name="BackgroundInformation"
          component={BackgroundlInformation}
        />
        <Stack.Screen name="KYCSubmission" component={Submission} />
        <Stack.Screen name="DocumentType" component={DocumentTypeScreen} />
        <Stack.Screen name="SelectDocument" component={SelectDocumentScreen} />
        <Stack.Screen
          name="AppServiceBottomNavigation"
          component={BottomNavigation}
        />
        <Stack.Screen name="LivenessVerify" component={VerifyItsYouScreen} />
        <Stack.Screen name="VerificationProgress" component={VerificationProgressScreen} />
        <Stack.Screen name="IdentityWebView" component={IdentityWebViewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
