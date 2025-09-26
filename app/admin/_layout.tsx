// app/admin/_layout.tsx
import React from "react";
import { Platform } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function AdminTabsLayout() {
  return (
    <Tabs
      initialRouteName="dashboard"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#6B7280",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
          marginBottom: Platform.select({ ios: -2, android: 2 }),
        },
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E7EB",
          borderTopWidth: 1,
          height: Platform.select({ ios: 86, android: 64 }),
          paddingBottom: Platform.select({ ios: 24, android: 10 }),
          paddingTop: 6,
        },
      }}
    >
      {/* 1) แดชบอร์ด */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "แดชบอร์ด",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "speedometer" : "speedometer-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* 2) dropoff */}
      <Tabs.Screen
        name="dropoff"
        options={{
          title: "dropoff",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "shield-checkmark" : "shield-checkmark-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* 3) รายงาน (ไฟล์: reports.tsx) */}
      <Tabs.Screen
        name="reports"
        options={{
          title: "รายงาน",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "bar-chart" : "bar-chart-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* 4) โปรไฟล์ */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "โปรไฟล์",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* ซ่อนหน้าแก้ไขโปรไฟล์จากแท็บบาร์ */}
      <Tabs.Screen
        name="edit-profile"
        options={{
          href: null, // ซ่อนจากแท็บบาร์และการนำทางด้วย URL
        }}
      />
    </Tabs>
  );
}