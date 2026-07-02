import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import FuseSendScreen from "../../Screens/AppService/FuseSendScreen";
import SendMoneySecond from "../../Screens/AppService/FuseSend/SendMoneySecond";
import SendMoneyDetailScreen from "../../Screens/AppService/FuseSend/SendMoneyDetailScreen";
import OTPScreen from "../../Screens/AppService/FuseSend/OTPScreen";
import TransactionScreen from "../../Screens/AppService/FuseSend/TransactionScreen";
import FuseRemittance from "../../Screens/AppService/FuseSend/FuseRemittance";
import ReviewSendScreen from "../../Screens/AppService/FuseSend/ReviewSendScreen";
import FuseSendVoiceScreen from "../../Screens/AppService/FuseSend/FuseSendVoiceScreen";
import AnalyticsScreen from "../../Screens/AppService/FuseSend/AnalyticsScreen";
import DeliveryOptionsScreen from "../../Screens/AppService/FuseSend/DeliveryOptionsScreen";

const Stack = createNativeStackNavigator();

const SendMoneyStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="FuseRemittance">
      <Stack.Screen name="FuseSend" component={FuseSendScreen} />
      <Stack.Screen name="SendMoneySecond" component={SendMoneySecond} />
      <Stack.Screen name="SendMoneyDetail" component={SendMoneyDetailScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="Transaction" component={TransactionScreen} />
      <Stack.Screen name="FuseRemittance" component={FuseRemittance} />
      <Stack.Screen name="DeliveryOptions" component={DeliveryOptionsScreen as React.ComponentType<any>} />
      <Stack.Screen name="ReviewSend" component={ReviewSendScreen} />
      <Stack.Screen name="FuseSendVoice" component={FuseSendVoiceScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
    </Stack.Navigator>
  );
};

export default SendMoneyStack;
