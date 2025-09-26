// app/admin/dashboard.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabaseClient";

/* =========================
   Types & helpers
========================= */
type ItemRow = {
  item_id: string;
  title: string;
  category: "card" | "clothes" | "equipment" | "other" | string;
  status: "lost" | "found" | "returned";
  location: string;
  posted_by: string;
  post_time: string | null;
  due_time: string | null;
  keep_method: "self_7days" | "drop_off" | null;
  drop_off_at?: string | null;
};

type Stats = {
  lost_count: number;
  found_count: number;
  returned_count: number;
  not_at_center_count: number; // พบของแบบเก็บเอง 7 วัน และยังไม่ฝากที่ศูนย์
  one_year_count: number; // ฝากครบ 1 ปี
};

const STATUS_CHIPS: Array<{ key: ItemRow["status"] | "all"; label: string }> = [
  { key: "all", label: "ทั้งหมด" },
  { key: "lost", label: "ของหาย" },
  { key: "found", label: "พบของ" },
  { key: "returned", label: "ส่งคืนแล้ว" },
];

function fmt(n: number) {
  return new Intl.NumberFormat("th-TH").format(n);
}
function dayDateStr(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

/* =========================
   Main Page
========================= */
export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  // สรุป
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  // แจ้งเตือน
  const [dueToday, setDueToday] = useState<ItemRow[]>([]);
  const [drop1y, setDrop1y] = useState<ItemRow[]>([]);
  const [expandDue, setExpandDue] = useState(false);
  const [expand1y, setExpand1y] = useState(false);

  // ค้นหาด่วน
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ItemRow["status"]>("all");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [results, setResults] = useState<ItemRow[]>([]);
  const [searching, setSearching] = useState(false);

  // หมวดหมู่แบบไดนามิก
  const [categories, setCategories] = useState<string[]>(["all"]);
  // debounce ค้นหาอัตโนมัติ
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadCategories();
    loadSummary();
    loadAlerts();
    doQuickSearch(true); // โหลดล่าสุดตอนเริ่ม
  }, []);

  // ค้นหาแบบอัตโนมัติเมื่อพิมพ์ (หน่วง 400ms)
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      doQuickSearch();
    }, 400);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [q]);

  async function loadCategories() {
    try {
      const { data, error } = await supabase
        .from("items")
        .select("category")
        .neq("category", null)
        .order("category", { ascending: true });
      if (error) throw error;
      const set = new Set<string>(["all"]);
      (data as any[] | null)?.forEach((r) => r?.category && set.add(String(r.category)));
      setCategories(Array.from(set));
    } catch {
      setCategories(["all", "card", "clothes", "equipment", "other"]);
    }
  }

  async function loadSummary() {
    try {
      setBusy(true);

      const nowIso = new Date().toISOString();
      const oneYearAgoIso = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

      const [
        lostRes,
        foundRes,
        retRes,
        notAtCenterRes,
        oneYearRes,
      ] = await Promise.all([
        supabase.from("items").select("item_id", { count: "exact", head: true }).eq("status", "lost"),
        supabase.from("items").select("item_id", { count: "exact", head: true }).eq("status", "found"),
        supabase.from("items").select("item_id", { count: "exact", head: true }).eq("status", "returned"),
        supabase
          .from("items")
          .select("item_id", { count: "exact", head: true })
          .eq("status", "found")
          .eq("keep_method", "self_7days")
          .is("drop_off_at", null), // ✅ ยังไม่มาเก็บที่ศูนย์
        supabase
          .from("items")
          .select("item_id", { count: "exact", head: true })
          .not("drop_off_at", "is", null)
          .lte("drop_off_at", oneYearAgoIso), // ฝากครบ 1 ปี
      ]);

      setStats({
        lost_count: lostRes.count ?? 0,
        found_count: foundRes.count ?? 0,
        returned_count: retRes.count ?? 0,
        not_at_center_count: notAtCenterRes.count ?? 0,
        one_year_count: oneYearRes.count ?? 0,
      });
    } catch (e: any) {
      Alert.alert("โหลดสรุปล้มเหลว", e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function loadAlerts() {
    try {
      // ครบ 7 วัน (วันนี้) + ยังไม่ฝากศูนย์
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);

      const [a, b] = await Promise.all([
        supabase
          .from("items")
          .select("*")
          .eq("status", "found")
          .eq("keep_method", "self_7days")
          .is("drop_off_at", null) // ✅ ยังไม่ถูกนำมาฝากศูนย์
          .gte("due_time", start.toISOString())
          .lte("due_time", end.toISOString())
          .order("due_time", { ascending: true })
          .limit(100),
        supabase
          .from("items")
          .select("*")
          .not("drop_off_at", "is", null)
          .lte("drop_off_at", new Date(Date.now() - 365 * 86400 * 1000).toISOString())
          .order("drop_off_at", { ascending: true })
          .limit(100),
      ]);

      setDueToday((a.data || []) as ItemRow[]);
      setDrop1y((b.data || []) as ItemRow[]);
    } catch (e: any) {
      Alert.alert("โหลดรายการเตือนล้มเหลว", e?.message ?? String(e));
    }
  }

  async function doQuickSearch(isInitial = false) {
    try {
      setSearching(true);
      let query = supabase.from("items").select("*").order("post_time", { ascending: false }).limit(30);

      if (q.trim()) {
        query = query.or(`title.ilike.%${q}%,location.ilike.%${q}%,item_id.ilike.%${q}%`);
      }
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      if (catFilter !== "all") query = query.eq("category", catFilter);

      const { data, error } = await query;
      if (error) throw error;
      setResults((data || []) as ItemRow[]);
    } catch (e: any) {
      if (!isInitial) Alert.alert("ค้นหาล้มเหลว", e?.message ?? String(e));
    } finally {
      setSearching(false);
    }
  }

  const dueTodayShown = expandDue ? dueToday : dueToday.slice(0, 3);
  const drop1yShown = expand1y ? drop1y : drop1y.slice(0, 3);

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>แดชบอร์ดแอดมิน</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Summary cards */}
        {/* Summary cards */}
<View style={styles.cardsRow}>
  <SummaryCard color="#FEE2E2" title="ประกาศของหาย" value={fmt(stats?.lost_count ?? 0)} />
  <SummaryCard color="#FEF3C7" title="ประกาศพบของ" value={fmt(stats?.found_count ?? 0)} />
  <SummaryCard color="#DCFCE7" title="ส่งคืนแล้ว" value={fmt(stats?.returned_count ?? 0)} />
</View>

<View style={styles.cardsRow}>
  <SummaryCard color="#E0E7FF" title="ที่ยังไม่มาเก็บที่ศูนย์" value={fmt(stats?.not_at_center_count ?? 0)} />
  {/* เปลี่ยนสีเป็นโทนสีน้ำเงิน */}
  <SummaryCard color="#DBEAFE" title="ฝากครบ 1 ปี" value={fmt(stats?.one_year_count ?? 0)} />
</View>
        {busy && <ActivityIndicator style={{ marginTop: 8 }} />}

        {/* Alerts panel */}
        <View style={styles.alertPanel}>
          <Text style={styles.alertTitle}>รายการต้องดำเนินการ</Text>

          {/* 7-day due today (ยังไม่ฝากศูนย์) */}
          <View style={styles.alertBlock}>
            <View style={styles.alertBlockHeader}>
              <Badge label="ครบกำหนด 7 วัน (ยังไม่ฝากศูนย์)" color="#4338CA" />
              <Text style={styles.alertCount}>{fmt(dueToday.length)} รายการ</Text>
            </View>

            {dueTodayShown.length === 0 ? (
              <Text style={styles.emptyText}>— ไม่มีรายการครบกำหนดวันนี้ —</Text>
            ) : (
              dueTodayShown.map((it) => (
                <NoticeRow
                  key={it.item_id}
                  badge="ครบ 7 วัน"
                  color="#4338CA"
                  itemId={it.item_id}
                  title={it.title}
                  sub={`ผู้พบ: ${it.posted_by} • กำหนด: ${dayDateStr(it.due_time)}`}
                />
              ))
            )}

            {dueToday.length > 3 && (
              <TouchableOpacity
                onPress={() => setExpandDue((s) => !s)}
                style={styles.linkBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.linkBtnText}>{expandDue ? "ย่อรายการ" : "ดูทั้งหมด"}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 1-year at center */}
          <View style={[styles.alertBlock, { marginTop: 12 }]}>
            <View style={styles.alertBlockHeader}>
              <Badge label="ฝากครบ 1 ปี—ตรวจสอบการจัดเก็บ/จำหน่าย" color="#BE123C" />
              <Text style={styles.alertCount}>{fmt(drop1y.length)} รายการ</Text>
            </View>

            {drop1yShown.length === 0 ? (
              <Text style={styles.emptyText}>— ยังไม่มีรายการฝากครบ 1 ปี —</Text>
            ) : (
              drop1yShown.map((it) => (
                <NoticeRow
                  key={it.item_id}
                  badge="ครบ 1 ปี"
                  color="#BE123C"
                  itemId={it.item_id}
                  title={it.title}
                  sub={`ผู้ฝาก: ${it.posted_by} • ฝากเมื่อ: ${dayDateStr(it.drop_off_at || undefined)}`}
                />
              ))
            )}

            {drop1y.length > 3 && (
              <TouchableOpacity
                onPress={() => setExpand1y((s) => !s)}
                style={styles.linkBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.linkBtnText}>{expand1y ? "ย่อรายการ" : "ดูทั้งหมด"}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick search */}
        <Text style={styles.sectionTitle}>ค้นหาด่วน</Text>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color="#6B7280" />
          <TextInput
            ref={inputRef}
            placeholder="พิมพ์เพื่อค้นหา (ชื่อเรื่อง/สถานที่/Item ID)"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            value={q}
            onChangeText={setQ} // ✅ พิมพ์แล้วค้นหาอัตโนมัติ (debounce)
            returnKeyType="search"
            onSubmitEditing={() => doQuickSearch()}
          />
          <TouchableOpacity
            onPress={() => {
              inputRef.current?.focus();
              doQuickSearch();
            }}
            style={styles.searchBtn}
            activeOpacity={0.85}
          >
            <Text style={styles.searchBtnText}>ค้นหา</Text>
          </TouchableOpacity>
        </View>

        {/* Status filter */}
        <View style={styles.chipsRow}>
          {STATUS_CHIPS.map((c) => (
            <Chip
              key={c.key}
              label={c.label}
              active={statusFilter === c.key}
              onPress={() => {
                setStatusFilter(c.key as any);
                setTimeout(() => doQuickSearch(), 0); // ✅ กดแล้วค้นหาทันที
              }}
            />
          ))}
        </View>

        {/* Category chips: ดึงจาก DB */}
        <View style={[styles.chipsRow, { marginTop: 6 }]}>
          {categories.map((c) => (
            <Chip
              key={c}
              label={c === "all" ? "ทุกหมวด" : c}
              active={catFilter === c}
              onPress={() => {
                setCatFilter(c);
                setTimeout(() => doQuickSearch(), 0); // ✅ กดแล้วค้นหาทันที
              }}
            />
          ))}
        </View>

        {searching ? (
          <ActivityIndicator style={{ marginVertical: 12 }} />
        ) : (
          results.map((it) => <ItemCard key={it.item_id} item={it} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* =========================
   Small components
========================= */
function SummaryCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <View style={[styles.card, { backgroundColor: color }]}>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, active && { backgroundColor: "#2563EB15", borderColor: "#2563EB" }]}
      activeOpacity={0.9}
    >
      <Text style={[styles.chipText, active && { color: "#2563EB", fontWeight: "700" }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ItemCard({ item }: { item: ItemRow }) {
  return (
    <View style={styles.itemCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.title || "(ไม่มีชื่อเรื่อง)"}
        </Text>
        <Text style={styles.itemSub} numberOfLines={1}>
          #{item.item_id} • {item.location}
        </Text>
        <View style={{ flexDirection: "row", columnGap: 8, marginTop: 6 }}>
          <Badge
            label={item.status === "lost" ? "ของหาย" : item.status === "found" ? "พบของ" : "ส่งคืนแล้ว"}
            color={item.status === "lost" ? "#EF4444" : item.status === "found" ? "#F59E0B" : "#10B981"}
          />
          {item.keep_method && (
            <Badge
              label={item.keep_method === "self_7days" ? "เก็บเอง 7 วัน" : "ฝากศูนย์"}
              color={item.keep_method === "self_7days" ? "#4338CA" : "#0EA5E9"}
            />
          )}
        </View>
      </View>
    </View>
  );
}

function NoticeRow({
  badge,
  color,
  itemId,
  title,
  sub,
}: {
  badge: string;
  color: string;
  itemId: string;
  title: string;
  sub?: string;
}) {
  return (
    <View style={styles.noticeRow}>
      <Badge label={badge} color={color} />
      <View style={{ flex: 1 }}>
        <Text style={styles.noticeTitle} numberOfLines={1}>
          {title || "(ไม่มีชื่อเรื่อง)"}
        </Text>
        <Text style={styles.noticeSub} numberOfLines={2}>
          #{itemId}
          {sub ? ` • ${sub}` : ""}
        </Text>
      </View>
    </View>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + "22" }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

/* =========================
   Styles
========================= */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },

  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 8 : 0,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#111827" },

  cardsRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  card: { flex: 1, borderRadius: 14, padding: 14 },
  cardValue: { fontSize: 22, fontWeight: "900", color: "#111827" },
  cardTitle: { marginTop: 6, color: "#374151", fontWeight: "700" },

  /* Alerts panel */
  alertPanel: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#FFF",
    marginTop: 12,
  },
  alertTitle: { fontSize: 16, fontWeight: "900", color: "#111827", marginBottom: 8 },
  alertBlock: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#FAFAFB",
  },
  alertBlockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  alertCount: { color: "#111827", fontWeight: "900" },
  linkBtn: { alignSelf: "flex-start", marginTop: 6, paddingVertical: 4, paddingHorizontal: 6 },
  linkBtnText: { color: "#2563EB", fontWeight: "800" },

  sectionTitle: { marginTop: 16, fontSize: 16, fontWeight: "800", color: "#111827" },

  searchRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 48,
    backgroundColor: "#FFFFFF",
  },
  searchInput: { flex: 1, color: "#111827" },
  searchBtn: { backgroundColor: "#111827", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  searchBtnText: { color: "#fff", fontWeight: "700" },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  chip: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { color: "#374151" },

  itemCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    backgroundColor: "#fff",
  },
  itemTitle: { fontWeight: "800", fontSize: 15, color: "#111827" },
  itemSub: { color: "#6B7280", marginTop: 2 },

  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  badgeText: { fontWeight: "800", fontSize: 12 },

  emptyText: { color: "#6B7280", marginTop: 4 },

  noticeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    backgroundColor: "#fff",
  },
  noticeTitle: { fontWeight: "800", color: "#111827" },
  noticeSub: { color: "#6B7280", marginTop: 2 },
});