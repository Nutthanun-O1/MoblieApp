// app/SearchScreen.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "../lib/supabaseClient";

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("");

  // Date & Time
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    const { data, error } = await supabase
      .from("items")
      .select(`
        item_id,
        title,
        location,
        post_time,
        status,
        item_photos:item_photos (
          photo_url,
          order
        )
      `)
      .order("post_time", { ascending: false })
      .limit(1, { foreignTable: "item_photos" })
      .order("order", { ascending: true, foreignTable: "item_photos" });

    if (error) console.error(error.message);
    else {
      const mapped = (data || []).map((row: any) => ({
        ...row,
        thumbnailUrl: row.item_photos?.[0]?.photo_url ?? null,
      }));
      setItems(mapped);
    }
  }

  const formatDate = (d?: Date | null) =>
    d ? d.toLocaleDateString("en-GB") : "เลือกวัน";
  const formatTime = (d?: Date | null) =>
    d
      ? d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })
      : "เลือกเวลา";

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
      const postDate = new Date(it.post_time);
      if (selectedDate) {
        if (selectedDate.toDateString() !== postDate.toDateString()) return false;
      }
      if (selectedTime) {
        const hhmmA = selectedTime.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
        const hhmmB = postDate.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
        if (hhmmA !== hhmmB) return false;
      }
      return true;
    });
  }, [items, search, statusFilter, categoryFilter, selectedDate, selectedTime, locationFilter]);

  function renderBadge(status: string) {
    if (status === "lost")
      return <Text style={[styles.badge, { backgroundColor: "#F87171" }]}>ของหาย</Text>;
    if (status === "found")
      return <Text style={[styles.badge, { backgroundColor: "#60A5FA" }]}>พบของ</Text>;
    return <Text style={[styles.badge, { backgroundColor: "#34D399" }]}>ส่งคืนแล้ว</Text>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
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

        {/* Status */}
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

        {/* Category */}
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
          <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="calendar-outline" size={18} color="#6B7280" />
              <Text style={{ color: selectedDate ? "#111827" : "#9CA3AF" }}>
                {formatDate(selectedDate)}
              </Text>
            </View>
          </TouchableOpacity>
          {selectedDate && (
            <TouchableOpacity onPress={() => setSelectedDate(null)} style={styles.clearChip}>
              <Ionicons name="close" size={14} color="#6B7280" />
              <Text style={styles.clearChipText}>ล้างวัน</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.dateTimeRow, { marginTop: 6 }]}>
          <TouchableOpacity style={styles.dateInput} onPress={() => setShowTimePicker(true)}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="time-outline" size={18} color="#6B7280" />
              <Text style={{ color: selectedTime ? "#111827" : "#9CA3AF" }}>
                {formatTime(selectedTime)}
              </Text>
            </View>
          </TouchableOpacity>
          {selectedTime && (
            <TouchableOpacity onPress={() => setSelectedTime(null)} style={styles.clearChip}>
              <Ionicons name="close" size={14} color="#6B7280" />
              <Text style={styles.clearChipText}>ล้างเวลา</Text>
            </TouchableOpacity>
          )}
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_, date) => {
              setShowDatePicker(false);
              if (date) setSelectedDate(date);
            }}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={selectedTime || new Date()}
            mode="time"
            is24Hour
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_, time) => {
              setShowTimePicker(false);
              if (time) setSelectedTime(time);
            }}
          />
        )}

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
          <TouchableOpacity
            key={item.item_id}
            style={styles.card}
            activeOpacity={0.9}
            onPress={() =>
              navigation.navigate("DetailScreen", { item_id: item.item_id })
            }
          >
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={styles.thumbWrap}>
                {item.thumbnailUrl ? (
                  <Image
                    source={{ uri: item.thumbnailUrl }}
                    style={styles.thumb}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.thumbPlaceholder}>
                    <Ionicons name="image-outline" size={20} color="#9CA3AF" />
                  </View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {renderBadge(item.status)}
                </View>
                <Text style={styles.cardMeta} numberOfLines={1}>
                  สถานที่: {item.location}
                </Text>
                <Text style={styles.cardMeta}>
                  เวลา:{" "}
                  {new Date(item.post_time).toLocaleTimeString("th-TH", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
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
    paddingTop: 40,
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
    alignItems: "center",
    marginBottom: 6,
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
  clearChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
  },
  clearChipText: { color: "#6B7280", fontSize: 12, fontWeight: "700" },
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
  thumbWrap: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  thumb: { width: "100%", height: "100%" },
  thumbPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});