import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../../Screens/AppService/HomeScreen";
import MayaAIScreen from "../../Screens/AppService/Home/MayaAIScreen";
import AddMoneyScreen from "../../Screens/AppService/Home/AddMoneyScreen";

const Stack = createNativeStackNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainHome" component={HomeScreen} />
      <Stack.Screen name="MayaAI" component={MayaAIScreen} />
      <Stack.Screen name="AddMoney" component={AddMoneyScreen} />
    </Stack.Navigator>
  );
};

export default HomeStack;
