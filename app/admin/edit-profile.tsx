// app/admin/edit-profile.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../lib/useAuth";

/* ========= Types ========= */
type UserRow = {
  psu_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: "admin" | "member";
  created_at: string;
  updated_at: string;
};

/* ========= Helpers ========= */
function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export default function AdminEditProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user: authUser } = useAuth(); // ← ใช้ useAuth() จากแอปของคุณ

  // ใช้ psu_id ของผู้ใช้ที่ล็อกอินจาก useAuth()
  const adminId = useMemo(() => authUser?.psu_id as string | undefined, [authUser]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [me, setMe] = useState<UserRow | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Change password modal state
  const [pwOpen, setPwOpen] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwSuccessMsg, setPwSuccessMsg] = useState<string | null>(null);

  // ปุ่มยืนยันใน modal พร้อมกดได้เมื่อ…
  const canSubmitPw =
    !!oldPw.trim() && !!newPw.trim() && newPw.length >= 8 && confirmPw === newPw && !pwBusy;

  useEffect(() => {
    if (!adminId) {
      setLoading(false);
      Alert.alert("ยังไม่ได้เข้าสู่ระบบ", "ไม่พบข้อมูลผู้ใช้ที่ล็อกอิน");
      return;
    }
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId]);

  async function loadMe() {
    try {
      if (!adminId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("psu_id", adminId)
        .single();
      if (error) throw error;
      const u = data as UserRow;
      setMe(u);
      setFullName(u.full_name ?? "");
      setEmail(u.email ?? "");
      setPhone(u.phone ?? "");
    } catch (e: any) {
      Alert.alert("โหลดข้อมูลไม่สำเร็จ", e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function onSave() {
    if (!adminId) return;
    if (!fullName.trim()) {
      Alert.alert("กรอกไม่ครบ", "โปรดกรอกชื่อ–สกุล");
      return;
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert("อีเมลไม่ถูกต้อง", "โปรดตรวจสอบรูปแบบอีเมล");
      return;
    }
    try {
      setSaving(true);
      const { error } = await supabase
        .from("users")
        .update({
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("psu_id", adminId);
      if (error) throw error;
      Alert.alert("บันทึกแล้ว", "แก้ไขโปรไฟล์เรียบร้อย");
      await loadMe();
      router.back();
    } catch (e: any) {
      Alert.alert("บันทึกไม่สำเร็จ", e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  // ===== เปลี่ยนรหัสผ่าน “ตรงกับตาราง users” ผ่าน RPC =====
  async function changePasswordDirect() {
    if (!adminId) return;
    if (!canSubmitPw) return;

    try {
      setPwBusy(true);
      setPwSuccessMsg(null);

      // ตรวจรหัสเดิม + อัปเดตรหัสใหม่ (ทำ hash ฝั่ง DB) ในฟังก์ชันเดียว
      // ต้องมีฟังก์ชันใน Postgres:
      // create or replace function user_change_password_plain(p_psu_id text, p_old_pw text, p_new_pw text)
      // returns boolean as $$ ... $$ language plpgsql security definer;
      const { data, error } = await supabase.rpc("user_change_password_plain", {
        p_psu_id: adminId,
        p_old_pw: oldPw,
        p_new_pw: newPw,
      });

      if (error) throw error;
      if (data !== true) throw new Error("รหัสผ่านเดิมไม่ถูกต้อง");

      // สำเร็จ
      setOldPw("");
      setNewPw("");
      setConfirmPw("");
      setPwSuccessMsg("เปลี่ยนรหัสผ่านเรียบร้อย");

      // แสดงแถบเขียวชั่วครู่แล้วปิด
      setTimeout(() => {
        setPwSuccessMsg(null);
        setPwOpen(false);
      }, 2200);
    } catch (e: any) {
      Alert.alert("เปลี่ยนรหัสผ่านไม่สำเร็จ", e?.message ?? String(e));
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>แก้ไขโปรไฟล์</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          {/* Avatar & ID */}
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(me?.full_name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{me?.full_name || "-"}</Text>
                <Text style={styles.idText}>PSU ID: {me?.psu_id || "-"}</Text>
              </View>
            </View>
          </View>

          {/* Form */}
          <View style={styles.card}>
            <Text style={styles.label}>ชื่อ–สกุล</Text>
            <TextInput
              style={styles.input}
              placeholder="เช่น อธิภัทร โลสันเทียะ"
              placeholderTextColor="#9CA3AF"
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={[styles.label, { marginTop: 10 }]}>อีเมล</Text>
            <TextInput
              style={styles.input}
              placeholder="you@student.edu"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={[styles.label, { marginTop: 10 }]}>โทรศัพท์</Text>
            <TextInput
              style={styles.input}
              placeholder="08x-xxx-xxxx"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                disabled={saving}
                onPress={onSave}
                activeOpacity={0.9}
                style={[styles.primaryBtn, saving && { opacity: 0.6 }]}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>บันทึก</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setPwOpen(true)} activeOpacity={0.9} style={styles.darkBtn}>
                <Ionicons name="key-outline" size={16} color="#fff" />
                <Text style={styles.darkBtnText}>เปลี่ยนรหัสผ่าน</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Password Modal */}
      <Modal visible={pwOpen} animationType="fade" transparent onRequestClose={() => setPwOpen(false)}>
        <KeyboardAvoidingView
          style={styles.modalWrap}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>เปลี่ยนรหัสผ่าน</Text>

            <Text style={styles.modalHint}>รหัสผ่านเดิม</Text>
            <TextInput
              style={styles.input}
              placeholder="รหัสผ่านเดิม"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={oldPw}
              onChangeText={setOldPw}
            />

            <Text style={[styles.modalHint, { marginTop: 8 }]}>รหัสผ่านใหม่</Text>
            <TextInput
              style={styles.input}
              placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={newPw}
              onChangeText={setNewPw}
            />
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              placeholder="ยืนยันรหัสผ่านใหม่"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={confirmPw}
              onChangeText={setConfirmPw}
            />

            {/* ปุ่มคู่: ปิด & ยืนยัน */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <TouchableOpacity style={styles.cancelBtnEqual} onPress={() => setPwOpen(false)} activeOpacity={0.9}>
                <Text style={styles.cancelBtnText}>ปิด</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryBtn, !canSubmitPw && { opacity: 0.5 }]}
                disabled={!canSubmitPw}
                onPress={changePasswordDirect}
                activeOpacity={0.9}
              >
                {pwBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>ยืนยันการเปลี่ยนรหัสผ่าน</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* แถบแจ้งเตือนสีเขียว */}
            {pwSuccessMsg ? (
              <View style={styles.successBar}>
                <Ionicons name="checkmark-circle" size={16} color="#065F46" />
                <Text style={styles.successText}>{pwSuccessMsg}</Text>
              </View>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

/* ========= Styles ========= */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 8 : 0,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#E5E7EB",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#111827" },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 12,
  },

  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#1F2937", fontWeight: "900", fontSize: 18 },
  name: { fontSize: 18, fontWeight: "900", color: "#111827" },
  idText: { color: "#6B7280", marginTop: 2, fontWeight: "700" },

  label: { color: "#111827", fontWeight: "800", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: "#F9FAFB",
    color: "#111827",
  },

  primaryBtn: {
    flex: 1,
    backgroundColor: "#2563EB",
    borderRadius: 10,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "900", textAlign: "center" },

  darkBtn: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 10,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  darkBtnText: { color: "#fff", fontWeight: "900" },

  // modal
  modalWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: { backgroundColor: "#fff", borderRadius: 14, padding: 16, width: "100%", maxWidth: 420 },
  modalTitle: { fontSize: 18, fontWeight: "900", color: "#111827" },
  modalHint: { color: "#374151", marginTop: 10, marginBottom: 6, fontWeight: "700" },

  // ปุ่มปิดที่ขนาดเท่ากับปุ่มยืนยัน (วางข้างกัน)
  cancelBtnEqual: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F3F4F6",
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: { color: "#111827", fontWeight: "800", textAlign: "center" },

  successBar: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    backgroundColor: "#ECFDF5",
  },
  successText: { color: "#065F46", fontWeight: "800" },
});