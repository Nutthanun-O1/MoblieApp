import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabaseClient";

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .order("post_time", { ascending: false });

    if (error) console.error(error.message);
    else setItems(data || []);
  }

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (statusFilter !== "all" && it.status !== statusFilter) return false;
      if (categoryFilter !== "all" && it.category !== categoryFilter) return false;
      if (search && !`${it.title} ${it.location}`.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (locationFilter && !it.location.toLowerCase().includes(locationFilter.toLowerCase())) {
        return false;
      }
      if (dateFilter) {
        const dateStr = new Date(it.post_time).toLocaleDateString("en-GB"); // DD/MM/YYYY
        if (dateStr !== dateFilter) return false;
      }
      if (timeFilter) {
        const timeStr = new Date(it.post_time).toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        });
        if (timeStr !== timeFilter) return false;
      }
      return true;
    });
  }, [items, search, statusFilter, categoryFilter, dateFilter, timeFilter, locationFilter]);

  function renderBadge(status: string) {
    if (status === "lost")
      return <Text style={[styles.badge, { backgroundColor: "#F87171" }]}>ของหาย</Text>;
    if (status === "found")
      return <Text style={[styles.badge, { backgroundColor: "#60A5FA" }]}>พบของ</Text>;
    return <Text style={[styles.badge, { backgroundColor: "#34D399" }]}>ส่งคืนแล้ว</Text>;
  }

  return (
    <View style={[{ flex: 1, backgroundColor: "#fff" }, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ค้นหา</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Search Box */}
        <Text style={styles.label}>ค้นหาด้วยชื่อ</Text>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
          <TextInput
            style={{ flex: 1, fontSize: 15 }}
            placeholder="เช่น บัตรนักศึกษา, ร่ม, เสื้อ, USB"
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filter: Status */}
        <Text style={styles.label}>สถานะ</Text>
        <View style={styles.filterRow}>
          {[
            { key: "all", label: "ทั้งหมด" },
            { key: "lost", label: "ของหาย" },
            { key: "found", label: "พบของ" },
            { key: "returned", label: "ส่งคืนแล้ว" },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterBtn, statusFilter === f.key && styles.filterBtnActive]}
              onPress={() => setStatusFilter(f.key)}
            >
              <Text style={statusFilter === f.key ? styles.filterTextActive : styles.filterText}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Filter: Category */}
        <Text style={styles.label}>หมวดหมู่</Text>
        <View style={styles.filterRow}>
          {[
            { key: "all", label: "ทั้งหมด" },
            { key: "card", label: "บัตร" },
            { key: "clothes", label: "เสื้อผ้า" },
            { key: "equipment", label: "อุปกรณ์" },
            { key: "other", label: "อื่น ๆ" },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterBtn, categoryFilter === f.key && styles.filterBtnActive]}
              onPress={() => setCategoryFilter(f.key)}
            >
              <Text style={categoryFilter === f.key ? styles.filterTextActive : styles.filterText}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date + Time */}
        <Text style={styles.label}>วันและเวลา</Text>
        <View style={styles.dateTimeRow}>
          <TextInput
            style={styles.dateInput}
            placeholder="DD/MM/YYYY"
            placeholderTextColor="#9CA3AF"
            value={dateFilter}
            onChangeText={setDateFilter}
          />
          <TextInput
            style={styles.dateInput}
            placeholder="HH:MM"
            placeholderTextColor="#9CA3AF"
            value={timeFilter}
            onChangeText={setTimeFilter}
          />
        </View>

        {/* Location */}
        <Text style={styles.label}>สถานที่</Text>
        <TextInput
          style={styles.searchRow}
          placeholder="เช่น โรงอาหาร, ห้องสมุด, อาคารวิทยาการคอมพิวเตอร์"
          placeholderTextColor="#9CA3AF"
          value={locationFilter}
          onChangeText={setLocationFilter}
        />

        {/* Results */}
        <Text style={styles.sectionTitle}>ผลการค้นหา</Text>
        {filtered.length === 0 && <Text style={{ color: "#6B7280" }}>ไม่พบข้อมูล</Text>}

        {filtered.map((item) => (
          <View key={item.item_id} style={styles.card}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {renderBadge(item.status)}
            </View>
            <Text style={styles.cardMeta}>สถานที่: {item.location}</Text>
            <Text style={styles.cardMeta}>
              เวลา: {new Date(item.post_time).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#1D4ED8",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 40, // เว้น status bar
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginTop: 10,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    marginRight: 8,
    marginBottom: 8,
  },
  filterBtnActive: { backgroundColor: "#1D4ED8" },
  filterText: { color: "#374151", fontSize: 13, fontWeight: "500" },
  filterTextActive: { color: "#fff", fontWeight: "700" },
  dateTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 10,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
    color: "#111827",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4, color: "#111" },
  cardMeta: { fontSize: 13, color: "#6B7280" },
  badge: {
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: "600",
    overflow: "hidden",
  },
});
