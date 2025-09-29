// app/profile.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/useAuth";
import BottomBar from "./BottomBar";

const { width } = Dimensions.get("window");
const BOTTOM_BAR_HEIGHT = 64;

// ปรับจำนวนวันที่เก็บเองได้ที่นี่
const HOLD_DAYS = 7;

/** คำนวณเหลือกี่วันจาก post_time (+HOLD_DAYS) */
function getDaysLeft(postTime?: string | null, days = HOLD_DAYS) {
  if (!postTime) return null;
  const start = new Date(postTime);
  const deadline = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diff = Math.ceil((deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  return {
    daysLeft: Math.abs(diff),
    overdue: diff < 0,
    deadline,
  };
}

function EmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 32 }}>
      <Ionicons name="folder-open-outline" size={36} color="#9CA3AF" />
      <Text style={{ marginTop: 8, color: "#6B7280" }}>ยังไม่มีประกาศ</Text>
      <TouchableOpacity
        onPress={onRetry}
        style={{
          marginTop: 12,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 8,
          backgroundColor: "#2563EB",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>ลองโหลดใหม่</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [stats, setStats] = React.useState<any[]>([]);
  const [posts, setPosts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [sortOrder, setSortOrder] = React.useState<"desc" | "asc">("desc"); // เรียงใหม่→เก่าเริ่มต้น
  const [showAll, setShowAll] = React.useState(false);

  // โหลดสถิติ
  React.useEffect(() => {
    (async () => {
      if (!user) {
        setStats([]);
        return;
      }
      const statuses = ["lost", "found", "returned"] as const;
      const result: any[] = [];
      for (const s of statuses) {
        const { count, error } = await supabase
          .from("items")
          .select("*", { count: "exact", head: true })
          .eq("posted_by", user.psu_id)
          .eq("status", s);
        if (!error) {
          result.push({
            label: s === "lost" ? "ของหาย" : s === "found" ? "พบของ" : "ส่งคืนแล้ว",
            count: count || 0,
            color: s === "lost" ? "#FDE2E2" : s === "found" ? "#FFF4D9" : "#E0F8EC",
          });
        }
      }
      setStats(result);
    })();
  }, [user]);

  // โหลดโพสต์ (ตาม sortOrder)
  const fetchPosts = React.useCallback(async () => {
    if (!user) {
      setPosts([]);
      return;
    }
    setLoading(true);
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
        due_time,
        keep_method,
        contact_info,
        item_photos(photo_url)
      `)
      .eq("posted_by", user.psu_id)
      .order("post_time", { ascending: sortOrder === "asc" });

    if (error) {
      console.warn("[items] select error:", error);
      setPosts([]);
    } else {
      const mapped =
        (data ?? []).map((p) => ({
          ...p,
          statusLabel: p.status === "lost" ? "ของหาย" : p.status === "found" ? "พบของ" : "ส่งคืนแล้ว",
          thumbnail: p.item_photos?.[0]?.photo_url || null,
          // แจ้งเตือนเฉพาะ found + เก็บเอง 7 วัน
          foundCountdown:
            p.status === "found" && p.keep_method === "self_7days"
              ? getDaysLeft(p.post_time, HOLD_DAYS)
              : null,
        })) || [];
      setPosts(mapped);
    }
    setLoading(false);
  }, [user, sortOrder]);

  React.useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const displayed = showAll ? posts : posts.slice(0, 3);

  const toggleSort = () => setSortOrder((s) => (s === "desc" ? "asc" : "desc"));

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      router.replace("/login");
    }
  };

  function formatDateTime(ts?: string) {
    if (!ts) return "-";
    const d = new Date(ts);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")} น.`;
  }

  // ป้ายสถานะ + ชิพแจ้งเตือนแบบในรูปตัวอย่าง
  function renderFoundChips(item: any) {
    const base =
      item.status === "lost" ? (
        <View style={[styles.pill, { backgroundColor: "#ffafafba" }]}>
          <Text style={[styles.pillText, { color: "#ed0202ff" }]}>ของหาย</Text>
        </View> 
      ) : item.status === "found" ? (
        <View style={[styles.pill, { backgroundColor: "#FDEAD7" /* ส้มอ่อน */ }]}>
          <Text style={[styles.pillText, { color: "#D97706" /* ส้มเข้ม */ }]}>พบของ</Text>
        </View>
      ) : (
        <View style={[styles.pill, { backgroundColor: "#DCFCE7" }]}>
          <Text style={[styles.pillText, { color: "#16A34A" }]}>ส่งคืนแล้ว</Text>
        </View>
      );

    // แสดงชิพม่วงเฉพาะ found + keep_method=self_7days
    if (!(item.status === "found" && item.keep_method === "self_7days" && item.foundCountdown)) {
      return base;
    }
    const { daysLeft, overdue } = item.foundCountdown;
    const txt = overdue ? `เลยกำหนด ${daysLeft} วัน` : `เหลืออีก ${daysLeft} วัน ต้องนำไปตึกกิจกรรม`;
    return (
      <View style={{ flexDirection: "row", gap: 8 }}>
        {base}
        <View
          style={[
            styles.pill,
            {
              backgroundColor: "#EDE9FE", // ม่วงอ่อน
            },
          ]}
        >
          <Text style={[styles.pillText, { color: "#4F46E5" /* ม่วงเข้ม */ }]} numberOfLines={1}>
            {txt}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>โปรไฟล์</Text>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: BOTTOM_BAR_HEIGHT + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* โปรไฟล์การ์ด */}
          <View style={styles.profileCard}>
            <View style={styles.row}>
              <View style={styles.avatar} />
              <View style={styles.infoContainer}>
                <Text style={styles.name}>{user?.full_name ?? ""}</Text>
                <Text style={styles.info}>Student ID: {user?.psu_id ?? "-"}</Text>
                <Text style={styles.info}>Email: {user?.email ?? ""}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.profileLogoutBtn} onPress={handleLogout} accessibilityLabel="ออกจากระบบ">
              <Ionicons name="log-out-outline" size={18} color="#FF4444" />
            </TouchableOpacity>
          </View>

          {/* สถิติ */}
          <View style={styles.statsRow}>
            {stats.map((s, i) => (
              <View key={i} style={[styles.statCard, { backgroundColor: s.color }]}>
                <Text
                  style={[
                    styles.statNumber,
                    { color: s.color === "#FDE2E2" ? "#DC2626" : s.color === "#FFF4D9" ? "#D97706" : "#16A34A" },
                  ]}
                >
                  {s.count}
                </Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* หัวข้อ + ปุ่มเรียง */}
          <View style={styles.postsHeader}>
            <Text style={styles.sectionTitle}>ประกาศของฉัน</Text>
            <TouchableOpacity style={styles.sortBtn} onPress={toggleSort} accessibilityLabel="สลับเรียง">
              <Ionicons name={sortOrder === "desc" ? "arrow-down" : "arrow-up"} size={16} color="#2563EB" />
              <Text style={styles.sortText}>{sortOrder === "desc" ? "ใหม่→เก่า" : "เก่า→ใหม่"}</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={{ paddingVertical: 16 }}>
              <ActivityIndicator size="small" color="#2563EB" />
            </View>
          ) : displayed.length === 0 ? (
            <EmptyState onRetry={fetchPosts} />
          ) : (
            displayed.map((item) => (
              <TouchableOpacity
                key={item.item_id}
                style={styles.card}
                onPress={() => router.push({ pathname: "/DetailScreen", params: { item_id: item.item_id } })}
              >
                <View style={{ flexDirection: "row" }}>
                  {item.thumbnail ? (
                    <Image source={{ uri: item.thumbnail }} style={styles.imageThumb} />
                  ) : (
                    <View style={styles.imagePlaceholder} />
                  )}

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {renderFoundChips(item)}
                    </View>

                    <Text style={styles.cardDesc} numberOfLines={1}>
                      {item.location}
                    </Text>

                    <Text style={styles.cardMeta}>วันโพสต์: {formatDateTime(item.post_time)}</Text>
                    
                    {item.contact_info && <Text style={styles.cardMeta}>ติดต่อ: {item.contact_info}</Text>}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}

          {posts.length > 3 && !loading && (
            <View style={styles.toggleContainer}>
              <TouchableOpacity style={styles.toggleBtn} onPress={() => setShowAll((v) => !v)}>
                <Text style={styles.toggleText}>{showAll ? "ย่อ" : `ดูเพิ่มเติม (${posts.length - 3})`}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* BottomBar */}
        <View style={styles.bottomBarWrap}>
          <BottomBar active="profile" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { flex: 1, backgroundColor: "#F9FAFB" },

  header: {
    backgroundColor: "#2563EB",
    paddingTop: 16,
    paddingBottom: 18,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800", letterSpacing: 0.3 },

  scrollContent: { paddingBottom: 160 },

  profileCard: {
    position: "relative",
    backgroundColor: "#fff",
    margin: 12,
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  row: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: Math.round(width * 0.14),
    height: Math.round(width * 0.14),
    borderRadius: Math.round(width * 0.07),
    backgroundColor: "#ddd",
    marginRight: 12,
  },
  infoContainer: { flex: 1, paddingRight: 56 },
  name: { fontSize: 16, fontWeight: "700", color: "#111827" },
  info: { fontSize: 14, color: "#6B7280" },

  profileLogoutBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FFEAEA",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  statsRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 18, paddingHorizontal: 16 },
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
  statNumber: { fontSize: 22, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 13, marginTop: 6, color: "#6B7280" },

  postsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginVertical: 12, color: "#111827" },

  sortBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 },
  sortText: { color: "#2563EB", marginLeft: 6, fontWeight: "600", fontSize: 13 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    marginHorizontal: 12,
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
    flex: 1,
    marginRight: 8,
  },
  cardDesc: { color: "#374151", marginTop: 4, fontSize: 14, lineHeight: 20 },
  cardMeta: { color: "#6B7280", fontSize: 12, marginTop: 4 },

  // pills
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  pillText: { fontSize: 12, fontWeight: "800" },

  toggleContainer: { alignItems: "center", marginVertical: 10 },
  toggleBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  toggleText: { color: "#0066FF", fontWeight: "700" },

  bottomBarWrap: { position: "absolute", left: 0, right: 0, bottom: 0 },
});