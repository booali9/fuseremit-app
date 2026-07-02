import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "../../Screens/AppService/ProfileScreen";
import ProfileSettingScreen from "./ProfileSettingScreen";
import SecuritySettingScreen from "./SecuritySettingScreen";
import ChangePassword from "./ChangePassword";
import SecurityQuestionScreen from "./SecurityQuestionScreen";
import GeneralSettingScreen from "./GeneralSettingScreen";
import PrivacyPolicyScreen from "./PrivacyPolicyScreen";
import MayAIScreen from "./MayaAIScreen";
import ReferralScreen from "../../Screens/AppService/ReferralScreen";
import ReportingScreen from "../../Screens/AppService/ReportingScreen";
import AdvancedKYCScreen from "../../Screens/KYC/AdvancedKYCScreen";

const Stack = createNativeStackNavigator();

const ProfileStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainProfile" component={ProfileScreen} />
      <Stack.Screen name="ProfileSettings" component={ProfileSettingScreen} />
      <Stack.Screen name="SecuritySettings" component={SecuritySettingScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePassword} />
      <Stack.Screen name="SecurityQuestion" component={SecurityQuestionScreen} />
      <Stack.Screen name="GeneralSettings" component={GeneralSettingScreen} />
      <Stack.Screen name="PrivaryPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="MayaAI" component={MayAIScreen} />
      <Stack.Screen name="Referral" component={ReferralScreen} />
      <Stack.Screen name="Reporting" component={ReportingScreen} />
      <Stack.Screen name="AdvancedKYC" component={AdvancedKYCScreen} />
    </Stack.Navigator>
  );
};

export default ProfileStack;
