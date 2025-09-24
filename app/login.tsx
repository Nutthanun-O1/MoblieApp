// app/login.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { supabase } from "../lib/supabaseClient"; // <- ใช้ตัวจริง

// สลับเป็น true ถ้าอยากข้าม DB เพื่อเดโม่เฉพาะ UI
const DEMO_MODE = false;

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const onLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert("กรอกข้อมูลไม่ครบ", "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }

    if (DEMO_MODE) {
      router.replace("/home");
      return;
    }

    try {
      setLoading(true);

      // ✅ เรียก RPC ฝั่งฐานข้อมูล (ตรวจรหัสผ่านใน DB)
      const { data, error } = await supabase.rpc("app_login", {
        p_psu_id: username.trim(),
        p_password: password,
      });

      if (error) {
        Alert.alert("ล็อกอินไม่สำเร็จ", error.message);
        return;
      }
      if (!data || data.length === 0) {
        Alert.alert("ล็อกอินไม่สำเร็จ", "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        return;
      }

      // สำเร็จ → ไปหน้า Home
      router.replace("/home");
    } catch (e: any) {
      Alert.alert("ข้อผิดพลาด", e?.message ?? "ไม่สามารถเข้าสู่ระบบได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          backgroundColor: "#fff",
          paddingBottom: insets.bottom + 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ===== Header (คงดีไซน์เดิม) ===== */}
        <ImageBackground
          source={require("../assets/images/header.jpg")}
          style={[styles.header, { paddingTop: insets.top + 12 }]}
          resizeMode="cover"
        >
          <View style={styles.headerOverlay} />
          <View style={styles.headerInner}>
            <Image
              source={require("../assets/images/PSU-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>ของหายได้คืน</Text>
            <Text style={styles.subtitle}>
              ระบบประกาศของหาย/พบของ สำหรับนักศึกษาและบุคลากร
            </Text>
          </View>
        </ImageBackground>

        {/* ===== Form Card (ไม่ทับ header) ===== */}
        <View style={[styles.container, { marginTop: 12 }]}>
          <View style={styles.card}>
            <Text style={styles.label}>ชื่อผู้ใช้ (username)</Text>
            <TextInput
              style={styles.input}
              placeholder="username"
              placeholderTextColor="#98A4B5"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              inputMode="text"           // พิมพ์ได้ทั้งตัวอักษร/ตัวเลข
              textContentType="username"
              returnKeyType="next"
            />

            <Text style={[styles.label, { marginTop: 12 }]}>รหัสผ่าน</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#98A4B5"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              returnKeyType="done"
            />

            <TouchableOpacity
              style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
              onPress={onLogin}
              disabled={loading}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.noteText}>* ใช้บัญชีมหาวิทยาลัย (SSO) เท่านั้น</Text>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>หรือ</Text>
            <View style={styles.divider} />
          </View>

          {/* ===== External (คนนอก PSU) ===== */}
          <View style={styles.external}>
            <Text style={styles.extTitle}>
              สำหรับบุคคลภายนอก <Text style={{ fontWeight: "900" }}>(คนนอก PSU)</Text>
            </Text>
            <Text style={styles.extDesc}>
              บุคคลภายนอกไม่มีสิทธิ์เข้าใช้งานระบบ กรุณาติดต่อหน่วยงานที่รับผิดชอบ
            </Text>

            <View style={styles.extRow}>
              <View style={styles.extBox}>
                <View style={styles.extIconCircle}><Text style={styles.extIcon}>📞</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.extBoxTitle}>โทรติดต่อ</Text>
                  <Text style={styles.extBoxText}>074-XXX-XXX</Text>
                </View>
              </View>

              <View style={styles.extBox}>
                <View style={styles.extIconCircle}><Text style={styles.extIcon}>✉️</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.extBoxTitle}>อีเมลหน่วยงาน</Text>
                  <View style={styles.emailPillWrap}>
                    <Text numberOfLines={1} style={styles.emailPill}>
                      student.affairs@psu.ac.th
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <Text style={styles.extFootNote}>* เจ้าหน้าที่จะช่วยประสานงานรับ–ส่งของหายให้</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const R = 16;

const styles = StyleSheet.create({
  // Header
  header: { height: 240, justifyContent: "flex-end" },
  headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  headerInner: { paddingHorizontal: 20, paddingBottom: 28 },
  logo: { width: 180, height: 80, marginBottom: 10 },
  title: { color: "#fff", fontSize: 28, fontWeight: "900" },
  subtitle: { color: "#E5E7EB", fontSize: 13, marginTop: 6 },

  // Card
  container: { alignItems: "center", paddingHorizontal: 16 },
  card: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "#fff",
    borderRadius: R,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E6ECF4",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1,
  },
  label: { color: "#0F172A", fontSize: 14, fontWeight: "800", marginBottom: 6 },
  input: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#F3F6FB",
    borderWidth: 1,
    borderColor: "#DCE5F1",
  },
  primaryBtn: {
    marginTop: 16,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  noteText: { color: "#8A97A8", fontSize: 12, marginTop: 10, textAlign: "center" },

  // Divider
  dividerRow: { flexDirection: "row", alignItems: "center", marginTop: 14, marginBottom: 6, paddingHorizontal: 8 },
  divider: { flex: 1, height: 1, backgroundColor: "#E8EEF6" },
  dividerText: { color: "#9CA3AF", paddingHorizontal: 10, fontSize: 12 },

  // External/help section
  external: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "#F8FAFC",
    borderRadius: R,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E6ECF4",
    marginTop: 8,
    marginBottom: 8,
  },
  extTitle: { fontSize: 15, fontWeight: "800", color: "#111827", marginBottom: 6 },
  extDesc: { color: "#4B5563", fontSize: 12, marginBottom: 12 },
  extRow: { flexDirection: "row", columnGap: 12 },
  extBox: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E6ECF4",
  },
  extIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  extIcon: { fontSize: 16, color: "#2563EB" as any },
  extBoxTitle: { fontSize: 12, fontWeight: "900", color: "#0F172A" },
  extBoxText: { fontSize: 12, color: "#4B5563" },
  emailPillWrap: { flexDirection: "row", flexWrap: "wrap" },
  emailPill: {
    backgroundColor: "#EEF2FF",
    color: "#1E40AF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    maxWidth: 220,
  },
  extFootNote: { color: "#8A97A8", fontSize: 12, marginTop: 10 },
});