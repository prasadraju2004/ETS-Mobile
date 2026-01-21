import React, { useContext } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AuthContext } from "../context/AuthContext";
import AuthScreen from "../screens/AuthScreen";
import HomeScreen from "../screens/HomeScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isLoading, userToken } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#000",
        }}
      >
        <ActivityIndicator size="large" color="#FF0055" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken === null ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <Stack.Screen name="Home" component={HomeScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
