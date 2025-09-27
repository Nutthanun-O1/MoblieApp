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
import { useAuth } from "../lib/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth(); // ✅ เรียกจาก useAuth

  const onLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("กรอกข้อมูลไม่ครบ", "กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    try {
      setLoading(true);

      // ✅ ใช้ Supabase Auth
      await signIn(email.trim(), password);

      // ✅ ล็อกอินสำเร็จ → ไปหน้า home
      router.replace("/home");
    } catch (e: any) {
      Alert.alert("ล็อกอินไม่สำเร็จ", e?.message ?? "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          backgroundColor: "#fff",
          paddingBottom: insets.bottom + 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ===== Header ===== */}
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

        {/* ===== Form Card ===== */}
        <View style={[styles.container, { marginTop: 12 }]}>
          <View style={styles.card}>
            <Text style={styles.label}>อีเมล (PSU Account)</Text>
            <TextInput
              style={styles.input}
              placeholder="student@mail.psu.ac.th"
              placeholderTextColor="#98A4B5"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
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

            <Text style={styles.noteText}>* ใช้ PSU email + password เท่านั้น</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const R = 16;

const styles = StyleSheet.create({
  header: { height: 240, justifyContent: "flex-end" },
  headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  headerInner: { paddingHorizontal: 20, paddingBottom: 28 },
  logo: { width: 180, height: 80, marginBottom: 10 },
  title: { color: "#fff", fontSize: 28, fontWeight: "900" },
  subtitle: { color: "#E5E7EB", fontSize: 13, marginTop: 6 },

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
});
