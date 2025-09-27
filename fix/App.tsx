import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// ✅ import ตามไฟล์จริง
import HomeScreen from "./home";
import PostScreen from "./PostScreen";
import SearchScreen from "./SearchScreen"; 
import DetailScreen from "./DetailScreen";
import UpdateStatusScreen from "./UpdateStatusScreen";
import ProfileScreen  from "./Profile";
import EditProfileScreen from "./EditProfileScreen";

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Post" component={PostScreen} />
        <Stack.Screen name="Search" component={SearchScreen} /> 
        <Stack.Screen name="Detail" component={DetailScreen} />
        <Stack.Screen name="UpdateStatus" component={UpdateStatusScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
