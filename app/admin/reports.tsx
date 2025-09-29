// app/admin/reports.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
// ✅ ใช้ legacy API ที่ยังมี writeAsStringAsync
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import DateTimePicker, { AndroidEvent } from "@react-native-community/datetimepicker";
import { supabase } from "../../lib/supabaseClient";

/* =========================
   Types
========================= */
type ActivityRow = {
  psu_id: string;
  hours: number;
  reason: "returned_to_owner" | "dropped_at_center";
  granted_at: string;
};
type UserRow = { psu_id: string; full_name: string | null };
type AggRow = {
  psu_id: string;
  full_name: string;
  total_hours: number;
  total_times: number;
  returned_hours: number;
  returned_times: number;
  dropped_hours: number;
  dropped_times: number;
};

/* =========================
   Date helpers
========================= */
function startOfWeek(d = new Date()) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Mon-start ISO
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}
function endOfWeek(d = new Date()) {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(s.getDate() + 7);
  e.setMilliseconds(-1);
  return e;
}
function fmtDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function displayTh(dt: Date) {
  return dt.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

/* =========================
   CSV
========================= */
function toCSV(rows: AggRow[], fromISO: string, toISO: string) {
  const header = ["week_from", "week_to", "psu_id", "full_name", "total_hours", "total_times"];
  const esc = (v: any) =>
    String(v ?? "")
      .replace(/"/g, '""')
      .replace(/\r?\n/g, " ");
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        fromISO.slice(0, 10),
        toISO.slice(0, 10),
        `"${esc(r.psu_id)}"`,
        `"${esc(r.full_name)}"`,
        r.total_hours,
        r.total_times,
      ].join(",")
    );
  }
  return lines.join("\n");
}

/* =========================
   Main
========================= */
export default function AdminReports() {
  const insets = useSafeAreaInsets();

  const [from, setFrom] = useState<Date>(() => startOfWeek(new Date()));
  const [to, setTo] = useState<Date>(() => endOfWeek(new Date()));
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AggRow[]>([]);

  const fromISO = useMemo(() => new Date(from).toISOString(), [from]);
  const toISO = useMemo(() => new Date(to).toISOString(), [to]);

  // Date picker modal state
  const [pickerTarget, setPickerTarget] = useState<null | "from" | "to">(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromISO, toISO]);

  async function loadData() {
    try {
      setLoading(true);

      // 1) ดึง activity_hours ไม่ embed users (กัน ambiguous relation)
      const { data: actsData, error: actsErr } = await supabase
        .from("activity_hours")
        .select("psu_id, hours, reason, granted_at")
        .gte("granted_at", fromISO)
        .lte("granted_at", toISO);

      if (actsErr) throw actsErr;
      const activities = (actsData as ActivityRow[]) || [];

      // 2) ชื่อจาก users
      const idSet = Array.from(new Set(activities.map((a) => a.psu_id))).filter(Boolean);
      const usersMap = new Map<string, string>();
      if (idSet.length > 0) {
        const { data: usersData, error: usersErr } = await supabase
          .from("users")
          .select("psu_id, full_name")
          .in("psu_id", idSet);
        if (usersErr) throw usersErr;
        (usersData as UserRow[]).forEach((u) => usersMap.set(u.psu_id, u.full_name || ""));
      }

      // 3) รวมต่อ psu_id
      const map = new Map<string, AggRow>();
      for (const r of activities) {
        const key = r.psu_id;
        if (!map.has(key)) {
          map.set(key, {
            psu_id: key,
            full_name: usersMap.get(key) || "",
            total_hours: 0,
            total_times: 0,
            returned_hours: 0,
            returned_times: 0,
            dropped_hours: 0,
            dropped_times: 0,
          });
        }
        const agg = map.get(key)!;
        const h = Number(r.hours || 0);
        agg.total_hours += h;
        agg.total_times += 1;
        if (r.reason === "returned_to_owner") {
          agg.returned_hours += h;
          agg.returned_times += 1;
        } else if (r.reason === "dropped_at_center") {
          agg.dropped_hours += h;
          agg.dropped_times += 1;
        }
      }

      setRows(Array.from(map.values()).sort((a, b) => b.total_hours - a.total_hours));
    } catch (e: any) {
      Alert.alert("ดึงรายงานไม่สำเร็จ", e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  function filteredRows() {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        r.psu_id.toLowerCase().includes(s) ||
        r.full_name.toLowerCase().includes(s)
    );
  }

  async function onCopyCSV() {
    try {
      const csv = toCSV(filteredRows(), fromISO, toISO);
      await Clipboard.setStringAsync(csv);
      Alert.alert("คัดลอกแล้ว", "คัดลอกข้อมูลเป็น CSV เรียบร้อย");
    } catch (e: any) {
      Alert.alert("ไม่สำเร็จ", e?.message ?? "คัดลอก CSV ไม่ได้");
    }
  }

  // ✅ บันทึก + เปิด Share Sheet
  async function onSaveCSV() {
    try {
      const csv = toCSV(filteredRows(), fromISO, toISO);
      const fname = `psu-activity-week_${fmtDate(from)}_to_${fmtDate(to)}.csv`;
      const uri = (FileSystem.cacheDirectory || FileSystem.documentDirectory) + fname;

      await FileSystem.writeAsStringAsync(uri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "text/csv",
          dialogTitle: "ส่งออกรายงาน CSV",
          UTI: "public.comma-separated-values-text", // iOS
        });
      } else {
        Alert.alert("บันทึกไฟล์แล้ว", `ไฟล์ถูกบันทึกไว้ที่:\n${uri}`);
      }
    } catch (e: any) {
      Alert.alert("บันทึกไม่สำเร็จ", e?.message ?? "เกิดข้อผิดพลาด");
    }
  }

  function setThisWeek() {
    setFrom(startOfWeek(new Date()));
    setTo(endOfWeek(new Date()));
  }
  function setLastWeek() {
    const today = new Date();
    const last = new Date(today);
    last.setDate(today.getDate() - 7);
    setFrom(startOfWeek(last));
    setTo(endOfWeek(last));
  }

  // ===== Date Picker handlers =====
  function openPicker(target: "from" | "to") {
    setPickerTarget(target);
    setTempDate(target === "from" ? from : to);
  }
  function onAndroidPick(e: AndroidEvent, date?: Date) {
    if (e.type === "dismissed") {
      setPickerTarget(null);
      return;
    }
    if (e.type === "set" && date) {
      if (pickerTarget === "from") setFrom(date);
      else setTo(date);
    }
    setPickerTarget(null);
  }
  function onIOSConfirm() {
    if (pickerTarget === "from") {
      if (tempDate > to) setTo(tempDate);
      setFrom(tempDate);
    } else {
      if (tempDate < from) setFrom(tempDate);
      setTo(tempDate);
    }
    setPickerTarget(null);
  }

  return (
    <SafeAreaView style={[
      styles.safe,
      { paddingTop: Math.max(insets.top - 8, 0), paddingBottom: insets.bottom + 12 }
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>รายงาน & ส่งออก</Text>
        <View style={styles.headerRight}>
          <Ionicons name="document-text-outline" size={18} color="#2563EB" />
          <Text style={styles.headerRightText}>Weekly Activity</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}>
        {/* Filter Bar */}
        <View style={styles.filterBar}>
          <TouchableOpacity style={styles.dateBox} onPress={() => openPicker("from")} activeOpacity={0.9}>
            <Text style={styles.labelSm}>ตั้งแต่</Text>
            <View style={styles.dateInput}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={styles.dateText}>{fmtDate(from)}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateBox} onPress={() => openPicker("to")} activeOpacity={0.9}>
            <Text style={styles.labelSm}>ถึง</Text>
            <View style={styles.dateInput}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={styles.dateText}>{fmtDate(to)}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.weekBtn} onPress={setThisWeek} activeOpacity={0.85}>
            <Text style={styles.weekBtnText}>สัปดาห์นี้</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.weekBtn} onPress={setLastWeek} activeOpacity={0.85}>
            <Text style={styles.weekBtnText}>สัปดาห์ก่อน</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.rangeHint}>
          ช่วงสรุป: {displayTh(from)} – {displayTh(to)}
        </Text>

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color="#6B7280" />
          <TextInput
            placeholder="ค้นหา รหัสนักศึกษา / ชื่อ"
            placeholderTextColor="#9CA3AF"
            value={q}
            onChangeText={setQ}
            style={styles.searchInput}
            autoCapitalize="none"
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.reloadBtn} onPress={loadData} activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="refresh" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryBtn} onPress={onCopyCSV} activeOpacity={0.9}>
            <Ionicons name="copy-outline" size={16} color="#fff" />
            <Text style={styles.primaryBtnText}>คัดลอก CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.darkBtn} onPress={onSaveCSV} activeOpacity={0.9}>
            <Ionicons name="download-outline" size={16} color="#fff" />
            <Text style={styles.darkBtnText}>บันทึก/แชร์ไฟล์</Text>
          </TouchableOpacity>
        </View>

        {/* Table Header */}
        <View style={[styles.row, styles.headerRow]}>
          <Text style={[styles.cell, styles.cId]}>PSU ID</Text>
          <Text style={[styles.cell, styles.cName]}>ชื่อ - สกุล</Text>
          <Text style={[styles.cell, styles.cNum]}>รวมชม.</Text>
          <Text style={[styles.cell, styles.cNum]}>ครั้ง</Text>
        </View>

        {/* Rows */}
        {loading ? (
          <ActivityIndicator style={{ marginTop: 12 }} />
        ) : filteredRows().length === 0 ? (
          <Text style={styles.empty}>— ไม่พบข้อมูลในช่วงที่เลือก —</Text>
        ) : (
          filteredRows().map((r) => (
            <View key={r.psu_id} style={styles.row}>
              <Text style={[styles.cell, styles.cId]} numberOfLines={1}>{r.psu_id}</Text>
              <Text style={[styles.cell, styles.cName]} numberOfLines={1}>{r.full_name || "-"}</Text>
              <Text style={[styles.cell, styles.cNum]}>{r.total_hours}</Text>
              <Text style={[styles.cell, styles.cNum]}>{r.total_times}</Text>
            </View>
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ===== Date Picker Modal ===== */}
      <Modal
        visible={pickerTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerTarget(null)}
      >
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {pickerTarget === "from" ? "เลือกวันที่เริ่ม" : "เลือกวันที่สิ้นสุด"}
            </Text>

            {Platform.OS === "android" ? (
              <DateTimePicker
                value={pickerTarget === "from" ? from : to}
                mode="date"
                display="calendar"
                onChange={onAndroidPick}
                minimumDate={pickerTarget === "to" ? from : undefined}
                maximumDate={pickerTarget === "from" ? to : undefined}
              />
            ) : (
              <>
                <DateTimePicker
                  value={pickerTarget === "from" ? from : to}
                  mode="date"
                  display="spinner"
                  onChange={(_, d) => d && setTempDate(d)}
                  minimumDate={pickerTarget === "to" ? from : undefined}
                  maximumDate={pickerTarget === "from" ? to : undefined}
                />
                <View style={styles.modalBtnRow}>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: "#EF4444" }]}
                    onPress={() => setPickerTarget(null)}
                  >
                    <Text style={styles.modalBtnText}>ยกเลิก</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: "#2563EB" }]}
                    onPress={onIOSConfirm}
                  >
                    <Text style={styles.modalBtnText}>ตกลง</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* =========================
   Styles
========================= */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: "#E5E7EB",
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#111827" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerRightText: { color: "#2563EB", fontWeight: "700" },

  filterBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  dateBox: { gap: 6 },
  labelSm: { fontSize: 12, color: "#6B7280", fontWeight: "700" },
  dateInput: {
    width: 160,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 10,
    backgroundColor: "#F9FAFB",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateText: { color: "#111827", fontWeight: "700" },

  weekBtn: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  weekBtnText: { fontWeight: "800", color: "#111827" },
  rangeHint: { color: "#6B7280", marginTop: 6 },

  searchRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
    backgroundColor: "#F9FAFB",
  },
  searchInput: { flex: 1, color: "#111827" },
  reloadBtn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },

  actionRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  primaryBtn: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },
  darkBtn: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  darkBtnText: { color: "#fff", fontWeight: "900" },

  headerRow: { backgroundColor: "#F3F4F6", borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  row: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderTopWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: "center",
  },

  cell: { color: "#111827" },
  cId: { width: 140, fontWeight: "700" },
  cName: { flex: 1, paddingRight: 8 },
  cNum: { width: 80, textAlign: "right", fontVariant: ["tabular-nums"], fontWeight: "700" },

  empty: { textAlign: "center", color: "#6B7280", marginTop: 12 },

  // Modal / Date picker
  modalWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: { backgroundColor: "#fff", borderRadius: 14, padding: 16, width: "100%", maxWidth: 420 },
  modalTitle: { fontSize: 16, fontWeight: "900", color: "#111827", marginBottom: 8 },
  modalBtnRow: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 8 },
  modalBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  modalBtnText: { color: "#fff", fontWeight: "800" },
});