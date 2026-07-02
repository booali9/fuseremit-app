import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HistoryScreen from "../../Screens/AppService/HistoryScreen";
import HistoryDetail from "../../Screens/AppService/History/HistoryDetail";

const Stack = createNativeStackNavigator();

const HistoryStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainHistory" component={HistoryScreen} />
      <Stack.Screen name="HistoryDetail" component={HistoryDetail as React.ComponentType<any>} />
    </Stack.Navigator>
  );
};

export default HistoryStack;
