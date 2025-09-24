import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  Linking,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

export default function LoginScreen() {
  const [psuId, setPsuId] = useState("");
  const [password, setPassword] = useState("");

  const onLogin = () => {
    // TODO: ใส่ลอจิกล็อกอินจริง
    // ตัวอย่าง: alert("เข้าสู่ระบบ");
  };

  const callUnit = () => Linking.openURL("tel:074000000"); // <— แก้เป็นเบอร์จริง
  const mailUnit = () => Linking.openURL("mailto:student.affairs@psu.ac.th");

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: "#fff" }}>
        {/* ===== Header ===== */}
        <ImageBackground
          source={require("../assets/images/header.jpg")}
          style={styles.header}
          resizeMode="cover"
        >
          <View style={styles.headerOverlay} />
          <View style={styles.headerInner}>
            <Image
              source={require("../assets/images/PSU-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>ของหายได้คืน</Text>
            <Text style={styles.headerSubtitle}>
              ระบบประกาศของหาย/พบของ สำหรับนักศึกษาและบุคลากร
            </Text>
          </View>
        </ImageBackground>

        {/* ===== Login Card ===== */}
        <View style={styles.body}>
          <View style={styles.card}>
            <Text style={styles.label}>รหัสนักศึกษา</Text>
            <TextInput
              value={psuId}
              onChangeText={setPsuId}
              placeholder="6987654321"
              keyboardType="number-pad"
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

            <TouchableOpacity style={styles.loginBtn} onPress={onLogin} activeOpacity={0.9}>
              <Text style={styles.loginText}>เข้าสู่ระบบ</Text>
            </TouchableOpacity>

            {/* Note */}
            <View >
              <Text style={styles.noteText}>* ใช้บัญชีมหาวิทยาลัย (SSO) เท่านั้น</Text>
            </View>
          </View>

{/* Divider OR */}
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>หรือ</Text>
              <View style={styles.divider} />
            </View>
          {/* ===== External Section (คนนอก PSU) ===== */}
          <View style={styles.externalCard}>
            <Text style={styles.externalTitle}>
              สำหรับบุคคลภายนอก <Text style={{ fontWeight: "900" }}>(คนนอก PSU)</Text>
            </Text>
            <Text style={styles.externalDesc}>
              บุคคลภายนอกไม่มีสิทธิ์เข้าใช้งานระบบ กรุณาติดต่อหน่วยงานรับผิดชอบ
            </Text>

            <View style={styles.contactRow}>
              {/* โทรติดต่อ */}
              <TouchableOpacity style={styles.contactBtn} onPress={callUnit} activeOpacity={0.9}>
                <View style={styles.iconBadge}>
                  <Ionicons name="call" size={18} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactTitle}>โทรติดต่อ</Text>
                  <Text style={styles.contactText}>074-XXX-XXX</Text>
                </View>
              </TouchableOpacity>

              {/* อีเมลหน่วยงาน */}
              <TouchableOpacity style={styles.contactBtn} onPress={mailUnit} activeOpacity={0.9}>
                <View style={styles.iconBadge}>
                  <MaterialIcons name="email" size={18} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactTitle}>อีเมลหน่วยงาน</Text>
                  <Text style={styles.emailPill}>student.affairs@psu.ac.th</Text>
                </View>
              </TouchableOpacity>
            </View>

            <Text style={styles.tip}>* เจ้าหน้าที่จะช่วยประสานงานประกาศ รับ–ส่งของหายให้</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const RADIUS = 14;

const styles = StyleSheet.create({
  header: { height: 220, justifyContent: "flex-end" },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  headerInner: { paddingHorizontal: 16, paddingBottom: 16 },
  logo: { width: 140, height: 64, marginBottom: 12 }, // โลโก้ใหญ่ตามแบบ
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "900" },
  headerSubtitle: { color: "#E5E7EB", fontSize: 12, marginTop: 4 },

  body: { paddingHorizontal: 16, marginTop: -28 },
  card: {
    backgroundColor: "#fff",
    borderRadius: RADIUS,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EBEEF3",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  label: { fontSize: 13, color: "#0F172A", fontWeight: "700", marginBottom: 6 },
  input: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#F3F6FB",
    borderWidth: 1,
    borderColor: "#DDE4EE",
  },
  loginBtn: {
    marginTop: 16,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
  },
  loginText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  noteBox: {
    marginTop: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#EBEEF3",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  noteText: { fontSize: 12, color: "#94A3B8" },

  dividerRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  divider: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: { color: "#9CA3AF", paddingHorizontal: 10, fontSize: 12 },

  externalCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: RADIUS,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EBEEF3",
    marginTop: 12,
  },
  externalTitle: { fontWeight: "800", color: "#111827", marginBottom: 6 },
  externalDesc: { color: "#475569", fontSize: 12, marginBottom: 12 },
  contactRow: { flexDirection: "row", gap: 12 },
  contactBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  contactTitle: { fontSize: 12, fontWeight: "800", color: "#0F172A" },
  contactText: { fontSize: 12, color: "#475569" },
  emailPill: {
    marginTop: 2,
    alignSelf: "flex-start",
    backgroundColor: "#EEF2FF",
    color: "#1E40AF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    overflow: "hidden",
  },
  tip: { color: "#94A3B8", fontSize: 12, marginTop: 10 },
});