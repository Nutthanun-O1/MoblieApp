import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Platform } from "react-native";
import { supabase } from "../lib/supabaseClient";
import { router } from "expo-router";

export default function Login() {
  const [psuId, setPsuId] = useState("");
  const [password, setPassword] = useState("");
  const [log, setLog] = useState<string>("ยังไม่ได้ทดสอบ");
  const [loading, setLoading] = useState(false);

  const envOk = !!process.env.EXPO_PUBLIC_SUPABASE_URL && !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  const pingDB = async () => {
    setLoading(true);
    setLog("กำลัง Ping DB …");
    try {
      const { data, error } = await supabase.from("users").select("psu_id").limit(1);
      if (error) setLog("❌ DB Error: " + error.message);
      else setLog("✅ DB Connected: " + JSON.stringify(data));
    } catch (e: any) {
      setLog("❌ Exception: " + e?.message);
    } finally {
      setLoading(false);
    }
  };

  const tryLogin = async () => {
    setLoading(true);
    setLog("กำลังตรวจสอบล็อกอิน …");
    try {
      if (!psuId || !password) {
        setLog("⚠️ กรุณากรอก PSU ID และรหัสผ่าน");
        return;
      }
      const { data, error } = await supabase.rpc("app_login", {
        p_psu_id: psuId.trim(),
        p_password: password,
      });
      if (error) {
        setLog("❌ RPC Error: " + error.message);
        return;
      }
      if (!data || data.length === 0) {
        setLog("❌ ไม่พบผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง");
        return;
      }
      setLog("✅ ล็อกอินสำเร็จ: " + data[0].full_name);
      router.replace("/home");
    } catch (e: any) {
      setLog("❌ Exception: " + e?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>เข้าสู่ระบบ</Text>

      <TextInput style={styles.input} placeholder="PSU ID" autoCapitalize="none" value={psuId} onChangeText={setPsuId} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />

      <TouchableOpacity style={styles.btn} onPress={tryLogin} disabled={loading}>
        <Text style={styles.btnText}>เข้าสู่ระบบ</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.gray]} onPress={pingDB} disabled={loading}>
        <Text style={styles.btnText}>🔌 Ping DB</Text>
      </TouchableOpacity>

      {loading && (
        <View style={{ marginTop: 10 }}>
          <ActivityIndicator />
        </View>
      )}

      <View style={styles.debugBox}>
        <Text style={styles.debugTitle}>Debug</Text>
        <Text selectable style={styles.debugText}>platform: {Platform.OS}</Text>
        <Text selectable style={styles.debugText}>
          env loaded: {String(envOk)} {"  "}
          url: {(process.env.EXPO_PUBLIC_SUPABASE_URL || "").slice(0, 40)}…
        </Text>
        <Text selectable style={styles.debugText}>{log}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, marginBottom: 12, padding: 12, backgroundColor: "#F9FAFB" },
  btn: { backgroundColor: "#2563EB", padding: 14, borderRadius: 10, marginVertical: 6, alignItems: "center" },
  gray: { backgroundColor: "#111827" },
  btnText: { color: "#fff", fontWeight: "700" },
  debugBox: { marginTop: 16, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 12, backgroundColor: "#F8FAFC" },
  debugTitle: { fontWeight: "800", marginBottom: 6 },
  debugText: { fontFamily: Platform.select({ web: "monospace", default: undefined }) },
});