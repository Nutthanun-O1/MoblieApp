import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabaseClient";

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "lost" | "found" | "returned">(
    "all"
  );
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  // ✅ รีโหลดเมื่อกลับมาที่หน้า Home
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchItems();
    });
    return unsubscribe;
  }, [navigation]);

  async function fetchItems() {
    const { data, error } = await supabase
      .from("items")
      .select(`
        item_id,
        title,
        description,
        category,
        status,
        location,
        post_time,
        contact_info,
        item_photos(photo_url)
      `)
      .order("post_time", { ascending: false });

    if (error) {
      console.error("DB error:", error.message);
      return;
    }
    setItems(data || []);
  }

  const counts = useMemo(() => {
    return {
      lost: items.filter((i) => i.status === "lost").length,
      found: items.filter((i) => i.status === "found").length,
      returned: items.filter((i) => i.status === "returned").length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (filter !== "all" && it.status !== filter) return false;
      if (
        search &&
        !`${it.title} ${it.location}`.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [items, filter, search]);

  function renderBadge(status: string) {
    if (status === "lost")
      return (
        <Text style={[styles.badge, { backgroundColor: "#F87171" }]}>ของหาย</Text>
      );
    if (status === "found")
      return (
        <Text style={[styles.badge, { backgroundColor: "#60A5FA" }]}>พบของ</Text>
      );
    return (
      <Text style={[styles.badge, { backgroundColor: "#34D399" }]}>
        ส่งคืนแล้ว
      </Text>
    );
  }

  function formatDateTime(ts: string) {
    if (!ts) return "-";
    const d = new Date(ts);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(
      2,
      "0"
    )}:${String(d.getMinutes()).padStart(2, "0")} น.`;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView style={styles.header}>
        <Text style={styles.headerTitle}>หน้าหลัก</Text>
      </SafeAreaView>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#FEE2E2" }]}>
          <Text style={[styles.statNumber, { color: "#DC2626" }]}>
            {counts.lost}
          </Text>
          <Text style={styles.statLabel}>ประกาศของหาย</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#FEF3C7" }]}>
          <Text style={[styles.statNumber, { color: "#D97706" }]}>
            {counts.found}
          </Text>
          <Text style={styles.statLabel}>ประกาศพบของ</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#DCFCE7" }]}>
          <Text style={[styles.statNumber, { color: "#16A34A" }]}>
            {counts.returned}
          </Text>
          <Text style={styles.statLabel}>ส่งคืนแล้ว</Text>
        </View>
      </View>

      <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
        <TouchableOpacity
          style={styles.searchInput}
          onPress={() => navigation.navigate("SearchScreen")}
        >
          <Text style={{ color: "#9CA3AF" }}>ค้นหาชื่อของ/สถานที่...</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        {[
          { key: "all", label: "ทั้งหมด" },
          { key: "lost", label: "ของหาย" },
          { key: "found", label: "พบของ" },
          { key: "returned", label: "ส่งคืนเจ้าของแล้ว" },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterBtn,
              filter === f.key && styles.filterBtnActive,
            ]}
            onPress={() => setFilter(f.key as any)}
          >
            <Text
              style={
                filter === f.key ? styles.filterTextActive : styles.filterText
              }
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <ScrollView style={{ flex: 1, padding: 12 }}>
        {filtered.map((item) => (
          <View key={item.item_id} style={styles.card}>
            <View style={{ flexDirection: "row" }}>
              {/* ✅ แสดงรูปแทน Placeholder */}
              {item.item_photos && item.item_photos.length > 0 ? (
                <Image
                  source={{ uri: item.item_photos[0].photo_url }}
                  style={styles.imageThumb}
                />
              ) : (
                <View style={styles.imagePlaceholder} />
              )}
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  {renderBadge(item.status)}
                </View>
                <Text style={styles.cardDesc}>{item.location}</Text>
                <Text style={styles.cardMeta}>
                  วันหาย: {formatDateTime(item.post_time)}
                </Text>
                {item.due_time && (
                  <Text style={styles.cardMeta}>
                    เวลาที่นัดหมาย: {formatDateTime(item.due_time)}
                  </Text>
                )}
                {item.contact_info && (
                  <Text style={styles.cardMeta}>
                    ติดต่อ: {item.contact_info}
                  </Text>
                )}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomTab}>
          <Ionicons name="home" size={22} color="#2563EB" />
          <Text style={[styles.bottomText, { color: "#2563EB" }]}>หน้าหลัก</Text>
        </TouchableOpacity>
        <View style={{ width: 60 }} />
        <TouchableOpacity style={styles.bottomTab}>
          <Ionicons name="person" size={22} color="#6B7280" />
          <Text style={styles.bottomText}>โปรไฟล์</Text>
        </TouchableOpacity>
      </View>

      {/* Floating Plus Button */}
      <TouchableOpacity
        style={styles.plusButton}
        onPress={() => navigation.navigate("PostScreen")}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB", // พื้นหลังโทนอ่อน อ่านง่าย
  },

  header: {
    backgroundColor: "#2563EB", // ฟ้าน้ำเงิน primary
    paddingTop: 16,
    paddingBottom: 18,
    paddingHorizontal: 20, // ลดจาก 26 -> 20 เพื่อไม่ให้มันชิดเกิน
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.3,
    textAlign: "left", // ชิดซ้าย
    marginLeft: 4, // ขยับเข้ามานิดเพื่อไม่ให้ชิดขอบเกิน
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 18,
    paddingHorizontal: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  statLabel: {
    fontSize: 13,
    marginTop: 6,
    color: "#6B7280",
  },

  searchInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },

  searchResults: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    marginTop: 6,
    maxHeight: 220,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  filtersRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: "#E5E7EB",
  },
  filterBtnActive: {
    backgroundColor: "#2563EB",
  },
  filterText: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  imagePlaceholder: {
    width: 56,
    height: 56,
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    marginRight: 12,
  },
  imageThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: "#E5E7EB",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  cardDesc: {
    color: "#374151",
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
  },
  cardMeta: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 4,
  },

  badge: {
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 12,
    overflow: "hidden",
    fontWeight: "600",
    backgroundColor: "#10B981", // เขียวสด
    alignSelf: "flex-start",
  },

  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 64,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    paddingHorizontal: 40,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomTab: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  bottomText: {
    fontSize: 12,
    marginTop: 3,
    color: "#6B7280",
    fontWeight: "500",
  },

  plusButton: {
    position: "absolute",
    bottom: 34,
    alignSelf: "center",
    backgroundColor: "#2563EB",
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
});

