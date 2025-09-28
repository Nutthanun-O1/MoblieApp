import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/useAuth"; // context ที่มี user
import BottomBar from "./BottomBar";

const { width } = Dimensions.get("window");
const BOTTOM_BAR_HEIGHT = 64;

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = React.useState<any[]>([]);
  const [posts, setPosts] = React.useState<any[]>([]);
  const [showAll, setShowAll] = React.useState(false);
  const [loadingPosts, setLoadingPosts] = React.useState(false);
  const [sortOrder, setSortOrder] = React.useState<"desc" | "asc">("desc"); // desc = ใหม่->เก่า

  // --- ดึงสถิติ ---
  React.useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setStats([]);
        return;
      }
      const statuses = ["lost", "found", "returned"];
      const results: any[] = [];
      for (let s of statuses) {
        const { count, error } = await supabase
          .from("items")
          .select("*", { count: "exact", head: true })
          .eq("posted_by", user.psu_id)
          .eq("status", s);
        if (!error) {
          results.push({
            label: s === "lost" ? "ของหาย" : s === "found" ? "พบของ" : "ส่งคืนแล้ว",
            count: count || 0,
            color: s === "lost" ? "#FDE2E2" : s === "found" ? "#FFF4D9" : "#E0F8EC",
          });
        }
      }
      setStats(results);
    };
    fetchStats();
  }, [user]);

  // --- ดึงโพสต์ (รวม item_photos) ---
  React.useEffect(() => {
    const fetchPosts = async () => {
      if (!user) {
        setPosts([]);
        return;
      }
      setLoadingPosts(true);
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
          contact_info,
          item_photos(photo_url)
        `)
        .eq("posted_by", user.psu_id)
        .order("post_time", { ascending: false });

      if (!error && data) {
        const mapped = data.map((p) => ({
          ...p,
          statusLabel:
            p.status === "lost"
              ? "ของหาย"
              : p.status === "found"
              ? "พบของ"
              : "ส่งคืนแล้ว",
          thumbnail: p.item_photos?.[0]?.photo_url || null,
        }));
        setPosts(mapped);
      } else {
        setPosts([]);
      }
      setLoadingPosts(false);
    };
    fetchPosts();
  }, [user]);

  // Toggle show all / collapse
  const handleToggleShow = () => setShowAll((v) => !v);

  // Toggle sort order
  const toggleSortOrder = () => setSortOrder((s) => (s === "desc" ? "asc" : "desc"));

  // Logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // ignore
    } finally {
      router.replace("/login");
    }
  };

  // Sort posts by post_time according to sortOrder, then slice
  const sortedPosts = React.useMemo(() => {
    const arr = [...posts];
    arr.sort((a, b) => {
      const ta = a?.post_time ? new Date(a.post_time).getTime() : 0;
      const tb = b?.post_time ? new Date(b.post_time).getTime() : 0;
      return sortOrder === "desc" ? tb - ta : ta - tb;
    });
    return arr;
  }, [posts, sortOrder]);

  const displayedPosts = showAll ? sortedPosts : sortedPosts.slice(0, 3);

  // badge render
  function renderBadge(status: string) {
    if (status === "lost")
      return <Text style={[styles.badge, { backgroundColor: "#F87171" }]}>ของหาย</Text>;
    if (status === "found")
      return <Text style={[styles.badge, { backgroundColor: "#60A5FA" }]}>พบของ</Text>;
    return <Text style={[styles.badge, { backgroundColor: "#34D399" }]}>ส่งคืนแล้ว</Text>;
  }

  function formatDateTime(ts: string) {
    if (!ts) return "-";
    const d = new Date(ts);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} น.`;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>โปรไฟล์</Text>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: BOTTOM_BAR_HEIGHT + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Card (มีปุ่ม logout บนมุม) */}
          <View style={styles.profileCard}>
            <View style={styles.row}>
              <View style={styles.avatar} />
              <View style={styles.infoContainer}>
                <Text style={styles.name}>{user?.full_name ?? ""}</Text>
                <Text style={styles.info}>Student ID: {user?.psu_id ?? "-"}</Text>
                <Text style={styles.info}>Email: {user?.email ?? ""}</Text>
              </View>
            </View>

            {/* Logout button (อยู่มุมบนขวาของ profileCard) */}
            <TouchableOpacity
              style={styles.profileLogoutBtn}
              onPress={handleLogout}
              accessibilityLabel="ออกจากระบบ"
            >
              <Ionicons name="log-out-outline" size={18} color="#FF4444" />
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {stats.map((s, idx) => (
              <View key={idx} style={[styles.statCard, { backgroundColor: s.color }]}>
                <Text
                  style={[
                    styles.statNumber,
                    {
                      color:
                        s.color === "#FDE2E2"
                          ? "#DC2626"
                          : s.color === "#FFF4D9"
                          ? "#D97706"
                          : "#16A34A",
                    },
                  ]}
                >
                  {s.count}
                </Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Posts header with sort control */}
          <View style={styles.postsHeader}>
            <Text style={styles.sectionTitle}>ประกาศของฉัน</Text>

            <TouchableOpacity style={styles.sortBtn} onPress={toggleSortOrder} accessibilityLabel="เรียงโพสต์">
              <Ionicons
                name={sortOrder === "desc" ? "arrow-down" : "arrow-up"}
                size={16}
                color="#2563EB"
              />
              <Text style={styles.sortText}>{sortOrder === "desc" ? "ใหม่→เก่า" : "เก่า→ใหม่"}</Text>
            </TouchableOpacity>
          </View>

          {loadingPosts && <Text style={{ marginHorizontal: 12 }}>กำลังโหลด...</Text>}

          {displayedPosts.map((item) => (
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
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {renderBadge(item.status)}
                  </View>

                  <Text style={styles.cardDesc} numberOfLines={1} ellipsizeMode="tail">
                    {item.location}
                  </Text>

                  <Text style={styles.cardMeta}>วันโพสต์: {formatDateTime(item.post_time)}</Text>

                  {item.due_time && <Text style={styles.cardMeta}>เวลาที่นัดหมาย: {formatDateTime(item.due_time)}</Text>}

                  {item.contact_info && <Text style={styles.cardMeta}>ติดต่อ: {item.contact_info}</Text>}
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {/* Toggle ดูเพิ่มเติม / ย่อ (อยู่ใต้รายการโพสต์) */}
          {posts.length > 3 && (
            <View style={styles.toggleContainer}>
              <TouchableOpacity style={styles.toggleBtn} onPress={handleToggleShow}>
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
    </SafeAreaView>
  );
}

// Styles (maintain home-like look)
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

  // Posts header (title + sort control)
  postsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginVertical: 12, color: "#111827" },

  sortBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 },
  sortText: { color: "#2563EB", marginLeft: 6, fontWeight: "600", fontSize: 13 },

  // Card styles (like home)
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
    fontWeight: "600",
    alignSelf: "flex-start",
  },

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

  bottomBarWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
});
