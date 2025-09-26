// app/admin/dropoff.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../lib/useAuth";

/** ===== Types ===== */
type ItemRow = {
  item_id: string;
  title: string;
  description: string | null;
  category: "card" | "clothes" | "equipment" | "other" | string;
  status: "lost" | "found" | "returned";
  location: string;
  posted_by: string; // psu_id ผู้พบของ
  post_time: string | null;
  due_time: string | null;
  keep_method: "self_7days" | "drop_off" | null;
  contact_info?: string | null;
  drop_off_at: string | null;
};

type ActivityRow = {
  activity_id: string;
  psu_id: string;
  item_id: string;
  hours: number;
  reason: "returned_to_owner" | "dropped_at_center";
  granted_at: string;
  verified_by: string | null;
};

const REASON: ActivityRow["reason"] = "dropped_at_center";

/** ===== Helpers ===== */
function dayDateStr(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}
function timeStr(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}
function toThaiStatus(s: ItemRow["status"]) {
  switch (s) {
    case "lost": return "ของหาย";
    case "found": return "พบของ";
    case "returned": return "ส่งคืนแล้ว";
    default: return s;
  }
}
function reasonTH(r: ActivityRow["reason"]) {
  return r === "dropped_at_center" ? "นำมาฝากที่ศูนย์" : "ส่งคืนเจ้าของ";
}
/** คืน: บวก=ยังเหลืออีกกี่วัน, 0=วันนี้, ลบ=เลยกำหนดแล้วกี่วัน */
function daysDiffToToday(iso?: string | null) {
  if (!iso) return null;
  const due = new Date(iso); const today = new Date();
  due.setHours(0,0,0,0); today.setHours(0,0,0,0);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

/** ===== Component ===== */
export default function AdminDropOffCounter() {
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const actorId = authUser?.psu_id ?? "unknown_admin";
  const actorName = authUser?.full_name ?? authUser?.psu_id ?? "Unknown";

  const [itemId, setItemId] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastAward, setLastAward] = useState<ActivityRow | null>(null);
  const [recentDrops, setRecentDrops] = useState<ItemRow[]>([]);
  const [itemPreview, setItemPreview] = useState<ItemRow | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [finderName, setFinderName] = useState<string | null>(null); // ชื่อผู้พบของ

  useEffect(() => {
    loadRecentDrops();
  }, []);

  useEffect(() => {
    if (!authUser) {
      Alert.alert("ยังไม่ได้เข้าสู่ระบบ", "ไม่พบข้อมูลผู้ใช้ที่ล็อกอิน");
    }
  }, [authUser]);

  async function loadRecentDrops() {
    const { data, error } = await supabase
      .from("items").select("*")
      .not("drop_off_at","is",null)
      .order("drop_off_at",{ ascending:false })
      .limit(20);
    if (!error) setRecentDrops((data as ItemRow[]) ?? []);
  }

  /** ดึงรายละเอียด + รูปแรก + ชื่อผู้พบของ */
  async function previewItem(id: string) {
    const pid = id.trim();
    if (!pid) { setItemPreview(null); setPhotoUrl(null); setFinderName(null); return; }

    const it = await supabase.from("items").select("*").eq("item_id", pid).single();
    if (!it.error && it.data) {
      const item = it.data as ItemRow;
      setItemPreview(item);

      // รูปแรก (ถ้ามี)
      const ph = await supabase.from("item_photos")
        .select("photo_url").eq("item_id", pid)
        .order("order",{ascending:true}).limit(1);
      setPhotoUrl(ph.data?.[0]?.photo_url ?? null);

      // ชื่อผู้พบของจาก users
      if (item.posted_by) {
        const u = await supabase.from("users")
          .select("full_name").eq("psu_id", item.posted_by).single();
        setFinderName(u.data?.full_name ?? null);
      } else {
        setFinderName(null);
      }
    } else {
      setItemPreview(null); setPhotoUrl(null); setFinderName(null);
    }
  }

  /** กล่องยืนยันก่อนรับฝาก */
  function confirmDropOff() {
    const id = itemId.trim();
    if (!id) { Alert.alert("กรอก Item ID", "โปรดกรอกรหัสอ้างอิงของสิ่งของ"); return; }
    if (itemPreview?.status === "returned") {
      Alert.alert("ไม่สามารถรับฝาก", "รายการนี้ถูกส่งคืนเจ้าของแล้ว");
      return;
    }
    const dleft = daysDiffToToday(itemPreview?.due_time);
    const more =
      itemPreview
        ? `• ชื่อเรื่อง: ${itemPreview.title || "-"}\n` +
          `• ผู้พบของ: ${finderName ? finderName + " (" + itemPreview.posted_by + ")" : itemPreview.posted_by}\n` +
          `• สถานะ: ${toThaiStatus(itemPreview.status)}\n` +
          `• วิธีเก็บ: ${itemPreview.keep_method === "drop_off" ? "ฝากที่ศูนย์" : "เก็บเอง 7 วัน"}\n` +
          (itemPreview.due_time ? `• ครบกำหนด: ${dayDateStr(itemPreview.due_time)}\n` : "") +
          (dleft==null ? "" : dleft<0 ? `• เลยกำหนด ${Math.abs(dleft)} วัน\n` : dleft===0 ? "• ครบกำหนดวันนี้\n" : `• เหลืออีก ${dleft} วัน\n`)
        : "";
    Alert.alert(
      "ยืนยันการรับฝาก",
      `ยืนยันรับฝากรายการนี้ไว้ที่ศูนย์?\n\n• ID: ${id}\n${more}\nเมื่อยืนยัน ระบบจะให้ชั่วโมงกิจกรรม 2 ชม. แก่ผู้พบของ`,
      [
        { text: "ยกเลิก", style: "cancel" },
        { text: "ยืนยัน", style: "default", onPress: submitDropOff },
      ]
    );
  }

  /** ทำการรับฝาก + ให้ชั่วโมง */
  async function submitDropOff() {
    const id = itemId.trim(); if (!id) return;
    setLoading(true); setLastAward(null);

    try {
      // พยายามใช้ RPC
      const tryRpc = await supabase.rpc("admin_award_drop_off", {
        p_item_id: id, p_actor_psu_id: actorId,
      });
      if (!tryRpc.error) {
        await previewItem(id); await loadRecentDrops();
        Alert.alert("สำเร็จ", "รับฝากและให้ชั่วโมงกิจกรรมเรียบร้อย");
        return;
      }

      // Fallback ดำเนินการบน client
      const { data: item, error: itemErr } = await supabase.from("items").select("*").eq("item_id", id).single();
      if (itemErr || !item) throw new Error("ไม่พบ Item ID นี้ในระบบ");
      const foundBy = item.posted_by as string;

      if (item.keep_method !== "drop_off" || !item.drop_off_at) {
        const { error: updErr } = await supabase.from("items")
          .update({ keep_method: "drop_off", drop_off_at: new Date().toISOString() })
          .eq("item_id", id);
        if (updErr) throw updErr;
      }

      const { data: act, error: upErr } = await supabase.from("activity_hours")
        .upsert(
          [{ psu_id: foundBy, item_id: id, hours: 2, reason: "dropped_at_center", verified_by: actorId }],
          { onConflict: "psu_id,item_id,reason", ignoreDuplicates: false }
        )
        .select()
        .limit(1);
      if (upErr) throw upErr;

      setLastAward((act?.[0] as ActivityRow) ?? null);
      await previewItem(id); await loadRecentDrops();
      Alert.alert("สำเร็จ", "รับฝากและให้ชั่วโมงกิจกรรมเรียบร้อย");
    } catch (e: any) {
      Alert.alert("ทำรายการไม่สำเร็จ", e?.message ?? String(e));
    } finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>จุดรับฝาก (Drop-off)</Text>
        <View style={styles.headerRight}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#16A34A" />
          <Text style={styles.headerRightText}>
            Admin: {actorName}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Fast drop-off form */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>ฟอร์มรับฝากเร็ว</Text>

          <View style={styles.inputRow}>
            <Ionicons name="pricetag-outline" size={18} color="#6B7280" />
            <TextInput
              placeholder="กรอก Item ID เช่น f2510"
              placeholderTextColor="#9CA3AF"
              value={itemId}
              onChangeText={(t) => { setItemId(t); previewItem(t); }}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={confirmDropOff}
            />
            <TouchableOpacity style={styles.scanBtn} activeOpacity={0.85}
              onPress={() => Alert.alert("เร็ว ๆ นี้","รองรับสแกน QR/บาร์โค้ดในเวอร์ชันถัดไป")}>
              <Ionicons name="qr-code-outline" size={18} color="#111827" />
            </TouchableOpacity>
          </View>

          {/* รายละเอียดสิ่งของแบบเต็ม */}
          {itemPreview ? (
            <View style={styles.detailCard}>
              {/* รูปแรก */}
              <View style={styles.photoBox}>
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="image-outline" size={36} color="#9CA3AF" />
                  </View>
                )}
              </View>

              {/* ชื่อ+บรรทัดรายละเอียด */}
              <Text style={styles.itemTitleFull}>{itemPreview.title || "(ไม่มีชื่อเรื่อง)"}</Text>

              <Text style={styles.metaLine}>Item ID: <Text style={styles.metaStrong}>{itemPreview.item_id}</Text></Text>
              <Text style={styles.metaLine}>หมวดหมู่: <Text style={styles.metaStrong}>{itemPreview.category || "-"}</Text></Text>
              <Text style={styles.metaLine}>สถานที่: <Text style={styles.metaStrong}>{itemPreview.location || "-"}</Text></Text>
              <Text style={styles.metaLine}>
                วันที่โพสต์: <Text style={styles.metaStrong}>{dayDateStr(itemPreview.post_time)}</Text>
                {"  "}เวลาโพสต์: <Text style={styles.metaStrong}>{timeStr(itemPreview.post_time)}</Text>
              </Text>
              {/* ชื่อ + PSU ID ผู้พบของ */}
              <Text style={styles.metaLine}>
                ผู้พบของ: <Text style={styles.metaStrong}>
                  {finderName ? `${finderName} (${itemPreview.posted_by})` : itemPreview.posted_by}
                </Text>
              </Text>
              {itemPreview.contact_info ? (
                <Text style={styles.metaLine}>ติดต่อ: <Text style={styles.metaStrong}>{itemPreview.contact_info}</Text></Text>
              ) : null}

              <View style={{ height: 8 }} />

              <View style={{ flexDirection:"row", flexWrap:"wrap", gap:8 }}>
                <Badge
                  label={toThaiStatus(itemPreview.status)}
                  color={itemPreview.status==="lost" ? "#EF4444" : itemPreview.status==="found" ? "#F59E0B" : "#10B981"}
                />
                <Badge
                  label={itemPreview.keep_method === "drop_off" ? "ฝากที่ศูนย์" : "เก็บเอง 7 วัน"}
                  color={itemPreview.keep_method === "drop_off" ? "#0EA5E9" : "#4338CA"}
                />
                {itemPreview.keep_method === "self_7days" && itemPreview.due_time ? (() => {
                  const dleft = daysDiffToToday(itemPreview.due_time);
                  const color = dleft===null ? "#6B7280" : dleft<0 ? "#DC2626" : dleft===0 ? "#F59E0B" : "#16A34A";
                  const label = dleft===null ? "ไม่พบวันครบกำหนด" : dleft<0 ? `เลยกำหนด ${Math.abs(dleft)} วัน` : dleft===0 ? "ครบกำหนดวันนี้" : `เหลืออีก ${dleft} วัน`;
                  return <Badge label={label} color={color} />;
                })() : null}
                {itemPreview.drop_off_at ? <Badge label={`ฝากเมื่อ ${dayDateStr(itemPreview.drop_off_at)}`} color="#10B981" /> : null}
              </View>

              <View style={{ height: 10 }} />

              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
                onPress={confirmDropOff}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>บันทึกการรับฝาก + ให้ชั่วโมง</Text>}
              </TouchableOpacity>

              {lastAward && (
                <View style={styles.successCard}>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text style={styles.successText}>
                    ให้ชั่วโมงกิจกรรมแล้ว • {lastAward.psu_id} • {lastAward.hours} ชม. • {reasonTH(lastAward.reason)}
                  </Text>
                </View>
              )}
            </View>
          ) : itemId.trim() ? (
            <Text style={styles.previewHint}>— ไม่พบรายการที่ตรงกับ Item ID —</Text>
          ) : null}
        </View>

        {/* Recent drop-offs */}
        <Text style={styles.sectionTitle}>รายการที่ฝากศูนย์ล่าสุด</Text>
        {recentDrops.length === 0 ? (
          <Text style={styles.emptyText}>— ยังไม่มีรายการ —</Text>
        ) : (
          recentDrops.map((it) => (
            <View key={it.item_id} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{it.title || "(ไม่มีชื่อเรื่อง)"}</Text>
                <Text style={styles.itemSub}>
                  #{it.item_id} • ผู้พบ {it.posted_by} • ฝากเมื่อ {dayDateStr(it.drop_off_at || undefined)}
                </Text>
              </View>
              <Badge label="ฝากที่ศูนย์" color="#0EA5E9" />
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/** ===== Small UI helpers ===== */
function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + "22" }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

/** ===== Styles ===== */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },

  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 8 : 0,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#111827" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerRightText: { color: "#16A34A", fontWeight: "700" },

  panel: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#FFF",
  },
  panelTitle: { fontWeight: "900", fontSize: 16, marginBottom: 8, color: "#111827" },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 48,
    backgroundColor: "#F9FAFB",
  },
  input: { flex: 1, color: "#111827" },
  scanBtn: { backgroundColor: "#F3F4F6", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },

  /* รายละเอียด */
  detailCard: { marginTop: 12, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, backgroundColor: "#fff", padding: 12 },
  photoBox: { width: "100%", height: 160, borderRadius: 12, overflow: "hidden", backgroundColor: "#F3F4F6" },
  photo: { width: "100%", height: "100%" },
  photoPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  itemTitleFull: { marginTop: 12, fontSize: 16, fontWeight: "900", color: "#111827" },
  metaLine: { color: "#374151", marginTop: 4 },
  metaStrong: { fontWeight: "700", color: "#111827" },

  primaryBtn: {
    marginTop: 12, height: 48, borderRadius: 12,
    backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "800" },

  previewHint: { marginTop: 8, color: "#6B7280" },

  successCard: {
    marginTop: 10, padding: 10, borderRadius: 10,
    borderWidth: 1, borderColor: "#DCFCE7", backgroundColor: "#ECFDF5",
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  successText: { color: "#065F46", fontWeight: "700" },

  sectionTitle: { marginTop: 16, marginBottom: 8, fontWeight: "900", color: "#111827" },

  itemRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderColor: "#E5E7EB", padding: 12, borderRadius: 12,
    marginBottom: 8, backgroundColor: "#fff",
  },
  itemTitle: { fontWeight: "800", color: "#111827" },
  itemSub: { color: "#6B7280", marginTop: 2 },

  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  badgeText: { fontWeight: "800", fontSize: 12 },
});