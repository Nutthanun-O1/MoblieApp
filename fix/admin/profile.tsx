// app/admin/profile.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
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
function dateTH(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user: authUser, signOut } = useAuth();

  // ใช้ psu_id จาก useAuth() (แทน ENV)
  const adminId = useMemo(() => authUser?.psu_id, [authUser]);

  const [me, setMe] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminId) {
      setLoading(false);
      Alert.alert("ออกจากระบบสำเร็จ");
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
      setMe(data as UserRow);
    } catch (e: any) {
      Alert.alert("โหลดโปรไฟล์ไม่สำเร็จ", e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function onSignOut() {
    try {
      // ถ้ามี signOut จาก useAuth ให้ใช้ก่อน
      if (typeof signOut === "function") {
        await signOut();
      } else {
        await supabase.auth.signOut().catch(() => {});
      }
      router.replace("/login");
    } catch (e: any) {
      Alert.alert("ออกจากระบบไม่สำเร็จ", e?.message ?? String(e));
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>โปรไฟล์</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <View style={{ padding: 16 }}>
          {/* Profile Card */}
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(me?.full_name)}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{me?.full_name || "-"}</Text>
                <Text style={styles.sub}>
                  {me?.email || "-"} {me?.phone ? ` | ${me.phone}` : ""}
                </Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                  <Badge label={`PSU ID: ${me?.psu_id || "-"}`} color="#2563EB" />
                  <Badge label={me?.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ใช้"} color="#10B981" />
                </View>
              </View>

              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => router.push("/admin/edit-profile")}
                activeOpacity={0.85}
              >
                <Ionicons name="create-outline" size={14} color="#111827" />
                <Text style={styles.editBtnText}>แก้ไขโปรไฟล์</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={{ gap: 6 }}>
              <InfoRow icon="time-outline" label="สร้างบัญชี" value={dateTH(me?.created_at)} />
              <InfoRow icon="refresh-outline" label="แก้ไขล่าสุด" value={dateTH(me?.updated_at)} />
            </View>
          </View>

          {/* Danger zone: Sign out */}
          <View style={[styles.card, { padding: 12 }]}>
            <TouchableOpacity style={styles.signOutBtn} onPress={onSignOut} activeOpacity={0.9}>
              <Text style={styles.signOutText}>ออกจากระบบ</Text>
            </TouchableOpacity>
          </View>

          {/* (ตัวอย่าง) ลิงก์ช่วยเหลือ/เวอร์ชัน */}
          <View style={[styles.card, { padding: 12 }]}>
            <InfoRow icon="help-circle-outline" label="ศูนย์ช่วยเหลือ" value="จันทร์–ศุกร์ 08:30–16:30" />
            <InfoRow icon="call-outline" label="ติดต่อ" value="074-XXX-XXX" />
            <InfoRow icon="mail-outline" label="อีเมล" value="student.affairs@psu.ac.th" />
            <InfoRow icon="information-circle-outline" label="แอปเวอร์ชัน" value="Admin 1.0.0" />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

/* ===== Small components ===== */
function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + "22" }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | null;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color="#6B7280" />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value || "-"}
      </Text>
    </View>
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
  sub: { color: "#6B7280", marginTop: 2 },

  editBtn: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  editBtnText: { color: "#111827", fontWeight: "800", fontSize: 12 },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },

  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  badgeText: { fontWeight: "800", fontSize: 12 },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  infoLabel: { width: 120, color: "#6B7280", fontWeight: "700" },
  infoValue: { flex: 1, color: "#111827", fontWeight: "700" },

  signOutBtn: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  signOutText: { color: "#fff", fontWeight: "900" },
});