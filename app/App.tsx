import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// ✅ import ตามไฟล์จริง
import HomeScreen from "./home";
import PostScreen from "./PostScreen";
import SearchScreen from "./SearchScreen"; // 👈 เพิ่มเข้ามา

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Post" component={PostScreen} />
        <Stack.Screen name="Search" component={SearchScreen} /> {/* 👈 เพิ่ม */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
