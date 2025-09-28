// components/BottomBar.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type Tab = "home" | "search" | "profile";

export default function BottomBar({
  active,
  onPlusPress,
  showPlus = true,
}: {
  active: Tab;
  onPlusPress?: () => void;
  showPlus?: boolean;
}) {
  const router = useRouter();

  const go = (path: string) => router.replace(path);
  const activeColor = "#2563EB";
  const idleColor = "#6B7280";

  return (
    <>
      {/* Floating + */}
      {showPlus && (
        <TouchableOpacity
          style={styles.plusButton}
          onPress={onPlusPress ?? (() => router.push("/PostScreen"))}
          activeOpacity={0.9}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomTab} onPress={() => go("/home")}>
          <Ionicons
            name="home"
            size={22}
            color={active === "home" ? activeColor : idleColor}
          />
          <Text
            style={[
              styles.bottomText,
              active === "home" && { color: activeColor, fontWeight: "700" },
            ]}
          >
            หน้าหลัก
          </Text>
        </TouchableOpacity>

        

        <TouchableOpacity style={styles.bottomTab} onPress={() => go("/Profile")}>
          <Ionicons
            name="person"
            size={22}
            color={active === "profile" ? activeColor : idleColor}
          />
          <Text
            style={[
              styles.bottomText,
              active === "profile" && { color: activeColor, fontWeight: "700" },
            ]}
          >
            โปรไฟล์
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomTab: { alignItems: "center", justifyContent: "center", flex: 1, gap: 2 },
  bottomText: { fontSize: 12, color: "#6B7280", fontWeight: "500", marginTop: 2 },
  plusButton: {
    position: "absolute",
    bottom: 34,
    alignSelf: "center",
    backgroundColor: "#2563EB",
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 10,
  },
});