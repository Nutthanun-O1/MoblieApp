import React, { useState } from "react";
import {
  View, Text, StyleSheet, Image, ImageBackground,
  TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../lib/supabaseClient";

const DEMO_MODE = false; // ตั้ง true เพื่อลองกดแล้วไปหน้า Home โดยไม่เช็คฐานข้อมูล

export default function LoginScreen() {
  const [psuId, setPsuId] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState("พร้อมทดสอบ");

  const onLogin = async () => {
    setLog("กดปุ่มแล้ว"); // เห็นทันทีว่า onPress ทำงาน
    console.log("[login] pressed");
    if (!psuId || !password) {
      setLog("⚠️ กรุณากรอกข้อมูลให้ครบ");
      Alert.alert("แจ้งเตือน", "กรุณากรอก รหัสนักศึกษา และ รหัสผ่าน");
      return;
    }

    if (DEMO_MODE) {
      setLog("DEMO_MODE: ข้ามการเชื่อมต่อ DB และไปหน้า Home");
      router.replace("/home");
      return;
    }

    try {
      setBusy(true);
      setLog("กำลังเชื่อมต่อฐานข้อมูล…");
      // ทดสอบว่าอ่านตาราง users ได้ไหม
      const { error: pingErr } = await supabase.from("users").select("psu_id").limit(1);
      if (pingErr) {
        setLog("❌ DB/policy error: " + pingErr.message);
        Alert.alert("DB Error", pingErr.message);
        setBusy(false);
        return;
      }

      setLog("เรียก RPC app_login …");
      const { data, error } = await supabase.rpc("app_login", {
        p_psu_id: psuId.trim(),
        p_password: password,
      });

      if (error) {
        setLog("❌ RPC error: " + error.message);
        Alert.alert("ล็อกอินไม่สำเร็จ", error.message);
        setBusy(false);
        return;
      }
      if (!data || data.length === 0) {
        setLog("❌ PSU ID หรือรหัสผ่านไม่ถูกต้อง");
        Alert.alert("ล็อกอินไม่สำเร็จ", "PSU ID หรือรหัสผ่านไม่ถูกต้อง");
        setBusy(false);
        return;
      }

      setLog("✅ สำเร็จ: " + data[0].full_name);
      Alert.alert("สำเร็จ", `สวัสดี ${data[0].full_name}`);
      router.replace("/home");
    } catch (e: any) {
      console.error(e);
      setLog("❌ Exception: " + (e?.message || String(e)));
      Alert.alert("ข้อผิดพลาด", e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const pingDB = async () => {
    try {
      setBusy(true);
      setLog("Ping ฐานข้อมูล…");
      const { data, error } = await supabase.from("users").select("psu_id").limit(1);
      if (error) setLog("❌ DB error: " + error.message);
      else setLog("✅ DB ok: " + JSON.stringify(data));
    } catch (e: any) {
      setLog("❌ Exception: " + e?.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: "#fff" }}>
        {/* HEADER (แบบเดิมของคุณ) */}
        <ImageBackground source={require("../assets/images/header.jpg")} style={styles.header} resizeMode="cover">
          <View style={styles.overlay} />
          <View style={styles.headerInner}>
            <Image source={require("../assets/images/PSU-logo.png")} style={styles.logo} resizeMode="contain" />
            <Text style={styles.headerTitle}>ของหายได้คืน</Text>
            <Text style={styles.headerSubtitle}>ระบบประกาศของหาย/พบของ สำหรับนักศึกษาและบุคลากร</Text>
          </View>
        </ImageBackground>

        {/* BODY */}
        <View style={styles.body}>
          <View style={styles.card}>
            <Text style={styles.label}>รหัสนักศึกษา</Text>
            <TextInput
              value={psuId}
              onChangeText={setPsuId}
              placeholder="6987654321"
              autoCapitalize="none"
              style={styles.input}
              placeholderTextColor="#94A3B8"
            />

            <Text style={[styles.label, { marginTop: 12 }]}>รหัสผ่าน</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              style={styles.input}
              placeholderTextColor="#94A3B8"
            />

            <TouchableOpacity style={[styles.btn, busy && { opacity: 0.6 }]} onPress={onLogin} disabled={busy} activeOpacity={0.9}>
              <Text style={styles.btnText}>{busy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btnSecondary, busy && { opacity: 0.6 }]} onPress={pingDB} disabled={busy} activeOpacity={0.9}>
              <Text style={styles.btnSecondaryText}>🔌 ทดสอบเชื่อมต่อฐานข้อมูล</Text>
            </TouchableOpacity>

            {busy && <ActivityIndicator style={{ marginTop: 8 }} />}
          </View>

          {/* DEBUG BOX */}
          <View style={styles.debugBox}>
            <Text style={styles.debugTitle}>Debug</Text>
            <Text selectable style={styles.debugText}>
              env: url={(process.env.EXPO_PUBLIC_SUPABASE_URL || "").slice(0, 32)}… key={(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "").slice(0, 6)}…
            </Text>
            <Text selectable style={styles.debugText}>{log}</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const RADIUS = 14;
const styles = StyleSheet.create({
  header: { height: 220, justifyContent: "flex-end" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  headerInner: { paddingHorizontal: 16, paddingBottom: 16 },
  logo: { width: 150, height: 68, marginBottom: 12 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "900" },
  headerSubtitle: { color: "#E5E7EB", fontSize: 12, marginTop: 4 },

  body: { paddingHorizontal: 16, marginTop: -28, alignItems: "center" },
  card: {
    width: "100%", maxWidth: 360, backgroundColor: "#fff",
    borderRadius: RADIUS, padding: 16, borderWidth: 1, borderColor: "#EBEEF3",
  },
  label: { fontSize: 13, color: "#0F172A", fontWeight: "700", marginBottom: 6 },
  input: {
    height: 44, paddingHorizontal: 12, borderRadius: 10,
    backgroundColor: "#F3F6FB", borderWidth: 1, borderColor: "#DDE4EE",
  },
  btn: {
    marginTop: 16, height: 48, borderRadius: 12,
    alignItems: "center", justifyContent: "center", backgroundColor: "#2563EB",
  },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  btnSecondary: {
    marginTop: 10, height: 44, borderRadius: 10, alignItems: "center",
    justifyContent: "center", backgroundColor: "#111827",
  },
  btnSecondaryText: { color: "#fff", fontWeight: "700" },

  debugBox: {
    width: "100%", maxWidth: 360, marginTop: 12,
    borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 12, backgroundColor: "#F8FAFC",
  },
  debugTitle: { fontWeight: "800", marginBottom: 6 },
  debugText: { fontFamily: Platform.select({ web: "monospace", default: undefined }) },
});