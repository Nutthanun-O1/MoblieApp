import React, { useState, useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

export default function App() {
  // -------------------------------
  // State
  // -------------------------------
  const [screen, setScreen] = useState("home"); // "home" | "search" | "profile"

  const [items, setItems] = useState([
    {
      id: 1,
      title: "บัตรนักศึกษา",
      description: "หายที่ โรงอาหารคณะวิทยาศาสตร์",
      location: "โรงอาหารคณะวิทยาศาสตร์",
      time: "12:38",
      status: "lost",
    },
    {
      id: 2,
      title: "เสื้อแจ็กเก็ต",
      description: "พบที่ หอสมุดชั้น 5",
      location: "หอสมุดชั้น 5",
      time: "11:19",
      status: "found",
    },
  ]);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  // modal
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newType, setNewType] = useState("lost");

  // -------------------------------
  // Derived data
  // -------------------------------
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
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        it.title.toLowerCase().includes(q) ||
        it.description.toLowerCase().includes(q) ||
        it.location.toLowerCase().includes(q)
      );
    });
  }, [items, query, filter]);

  // -------------------------------
  // Functions
  // -------------------------------
  function handleAddItem() {
    if (!newTitle.trim()) {
      Alert.alert("กรอกข้อมูลไม่ครบ", "กรุณากรอกชื่อรายการ");
      return;
    }

    const id = Date.now();
    const t = new Date();
    const timeStr = `${t.getHours()}:${String(t.getMinutes()).padStart(2, "0")}`;

    const newItem = {
      id,
      title: newTitle,
      description: newDesc || "-",
      location: newLocation || "-",
      time: timeStr,
      status: newType,
    };

    setItems((s) => [newItem, ...s]);
    setNewTitle("");
    setNewDesc("");
    setNewLocation("");
    setNewType("lost");
    setModalVisible(false);
  }

  function handleMarkReturned(id) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, status: "returned" } : it
      )
    );
  }

  function renderBadge(status) {
    if (status === "lost")
      return <Text style={[styles.badge, styles.badgeLost]}>ของหาย</Text>;
    if (status === "found")
      return <Text style={[styles.badge, styles.badgeFound]}>พบของ</Text>;
    return (
      <Text style={[styles.badge, styles.badgeReturned]}>ส่งคืนแล้ว</Text>
    );
  }

  // -------------------------------
  // Screens
  // -------------------------------
  function renderHome() {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>หน้าหลัก</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statLost]}>
            <Text style={styles.statNumber}>{counts.lost}</Text>
            <Text style={styles.statLabel}>ของหาย</Text>
          </View>
          <View style={[styles.statCard, styles.statFound]}>
            <Text style={styles.statNumber}>{counts.found}</Text>
            <Text style={styles.statLabel}>พบของ</Text>
          </View>
          <View style={[styles.statCard, styles.statReturned]}>
            <Text style={styles.statNumber}>{counts.returned}</Text>
            <Text style={styles.statLabel}>ส่งคืนแล้ว</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchWrapper}>
          <TouchableOpacity
            style={styles.searchInput}
            onPress={() => setScreen("search")}
          >
            <Text style={{ color: "#9CA3AF" }}>
              ค้นหาชื่อของ/สถานที่...
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filtersRow}>
          {["all", "lost", "found", "returned"].map((f) => {
            const isActive = filter === f;
            const label =
              f === "all"
                ? "ทั้งหมด"
                : f === "lost"
                ? "ของหาย"
                : f === "found"
                ? "พบของ"
                : "ส่งคืนแล้ว";

            return (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterBtn,
                  isActive && styles.filterBtnActive,
                ]}
                onPress={() => setFilter(f)}
                activeOpacity={0.8}
              >
                <Text
                  style={
                    isActive ? styles.filterTextActive : styles.filterText
                  }
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* List */}
        <ScrollView style={styles.list}>
          {filtered.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.imagePlaceholder} />
                <View style={{ flex: 1 }}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {renderBadge(item.status)}
                  </View>
                  <Text style={styles.cardDesc}>{item.description}</Text>
                  <Text style={styles.cardMeta}>
                    สถานที่: {item.location}
                  </Text>
                  <Text style={styles.cardMeta}>เวลา: {item.time}</Text>

                  {item.status !== "returned" && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleMarkReturned(item.id)}
                    >
                      <Text style={styles.actionText}>คืนแล้ว</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* FAB */}
        <View style={styles.fabWrapper}>
          <TouchableOpacity
            style={styles.fab}
            onPress={() =>
              Alert.alert("ยังไม่เชื่อมต่อ", "หน้านี้กำลังพัฒนา")
            }
          >
            <Text style={styles.fabPlus}>＋</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  function renderSearch() {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.searchHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setScreen("home")}
            activeOpacity={0.7}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.searchHeaderTitle}>ค้นหา</Text>
        </View>

        {/* Search box */}
        <View style={styles.searchBoxWrapper}>
          <TextInput
            placeholder="พิมพ์ชื่อของหรือสถานที่..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchBox}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
        </View>

        {/* Results */}
        <ScrollView style={styles.list}>
          {filtered.map((item) => (
            <View key={item.id} style={styles.searchCard}>
              <View style={styles.searchCardHeader}>
                <Text style={styles.searchCardTitle}>{item.title}</Text>
                {renderBadge(item.status)}
              </View>
              <Text style={styles.searchCardDesc}>{item.description}</Text>
              <Text style={styles.searchCardMeta}>📍 {item.location}</Text>
              <Text style={styles.searchCardMeta}>🕒 {item.time}</Text>
            </View>
          ))}

          {filtered.length === 0 && (
            <Text
              style={{
                textAlign: "center",
                marginTop: 20,
                color: "#6B7280",
              }}
            >
              ❌ ไม่พบผลลัพธ์
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  function renderProfile() {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>โปรไฟล์</Text>
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 18, color: "#374151" }}>👤 โปรไฟล์ผู้ใช้</Text>
          <Text style={{ marginTop: 8, color: "#6B7280" }}>
            (ยังไม่ทำระบบจริง)
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // -------------------------------
  // Render
  // -------------------------------
  function renderContent() {
    if (screen === "home") return renderHome();
    if (screen === "search") return renderSearch();
    if (screen === "profile") return renderProfile();
    return renderHome();
  }

  return (
    <View style={{ flex: 1 }}>
      {renderContent()}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navBtn, screen === "home" && styles.navBtnActive]}
          onPress={() => setScreen("home")}
        >
          <Text
            style={[
              styles.navText,
              screen === "home" && styles.navTextActive,
            ]}
          >
            🏠 Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navBtn,
            screen === "profile" && styles.navBtnActive,
          ]}
          onPress={() => setScreen("profile")}
        >
          <Text
            style={[
              styles.navText,
              screen === "profile" && styles.navTextActive,
            ]}
          >
            👤 Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// -------------------------------
// Styles
// -------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  // Header
  header: {
    backgroundColor: "#1E40AF",
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 10,
  },
  // Stats
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  statCard: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 6,
    alignItems: "center",
  },
  statLost: { backgroundColor: "#FEE2E2" },
  statFound: { backgroundColor: "#FEF3C7" },
  statReturned: { backgroundColor: "#DCFCE7" },
  statNumber: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 13, marginTop: 4, color: "#374151" },
  // Search bar
  searchWrapper: { paddingHorizontal: 16, marginBottom: 10 },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: 14,
  },
  // Filters
  filtersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
    paddingHorizontal: 12,
  },
  filterBtn: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  filterBtnActive: {
    backgroundColor: "#1E40AF",
    borderColor: "#1E40AF",
  },
  filterText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 14,
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  // List
  list: {
    flex: 1,
    paddingHorizontal: 14,
    marginTop: 6,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardRow: { flexDirection: "row" },
  imagePlaceholder: {
    width: 55,
    height: 55,
    backgroundColor: "#E5E7EB",
    marginRight: 12,
    borderRadius: 8,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontWeight: "700", fontSize: 15, color: "#111827" },
  cardDesc: { color: "#555", marginTop: 2, fontSize: 13 },
  cardMeta: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  // Badge
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: "600",
  },
  badgeLost: { backgroundColor: "#FECACA", color: "#B91C1C" },
  badgeFound: { backgroundColor: "#FDE68A", color: "#92400E" },
  badgeReturned: { backgroundColor: "#A7F3D0", color: "#065F46" },
  // Action button
  actionBtn: {
    backgroundColor: "#EFF6FF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  actionText: { color: "#1E40AF", fontWeight: "600" },
  // FAB
  fabWrapper: {
    position: "absolute",
    bottom: 70,
    alignSelf: "center",
  },
  fab: {
    backgroundColor: "#1E40AF",
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  fabPlus: { color: "#fff", fontSize: 32, fontWeight: "800" },
  // Search
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E40AF",
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  backBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 6,
    borderRadius: 8,
    marginRight: 10,
  },
  backIcon: { color: "#fff", fontSize: 18, fontWeight: "700" },
  searchHeaderTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  searchBoxWrapper: { padding: 14 },
  searchBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  searchCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  searchCardTitle: { fontWeight: "700", fontSize: 16 },
  searchCardDesc: { color: "#555", marginTop: 6 },
  searchCardMeta: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  // Bottom Nav
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
  },
  navBtn: { alignItems: "center" },
  navBtnActive: {},
  navText: { fontSize: 14, color: "#6B7280", fontWeight: "600" },
  navTextActive: { color: "#1E40AF", fontWeight: "700" },
});
