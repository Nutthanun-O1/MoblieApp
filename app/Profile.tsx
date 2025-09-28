import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/useAuth"; // ✅ ใช้ context ที่มี user จาก login

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = React.useState<any[]>([]);
  const [posts, setPosts] = React.useState<any[]>([]);

  // --- ดึงสถิติ ---
  React.useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

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
            label:
              s === "lost" ? "ของหาย" : s === "found" ? "พบของ" : "ส่งคืนแล้ว",
            count: count || 0,
            color:
              s === "lost"
                ? "#FDE2E2"
                : s === "found"
                ? "#FFF4D9"
                : "#E0F8EC",
          });
        }
      }
      setStats(results);
    };

    fetchStats();
  }, [user]);

  // --- ดึงโพสต์ ---
  React.useEffect(() => {
    const fetchPosts = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("items")
        .select(`
          item_id,
          title,
          location,
          post_time,
          status,
          item_photos(photo_url)
        `) // ✅ join ตาราง item_photos
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
          // ✅ ดึงรูปแรก ถ้ามี
          thumbnail: p.item_photos?.[0]?.photo_url || null,
        }));
        setPosts(mapped);
      }
    };

    fetchPosts();
  }, [user]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>โปรไฟล์</Text>
        </View>

        {/* User Info */}
        <View style={styles.profileCard}>
          <View style={styles.row}>
            <View style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{user?.full_name ?? ""}</Text>
              <Text style={styles.info}>
                {(user?.email ?? "") + " | " + (user?.phone ?? "")}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push("/EditProfileScreen")}
            >
              <Text style={{ color: "#0066FF" }}>แก้ไขโปรไฟล์</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map((s, idx) => (
            <View
              key={idx}
              style={[styles.statBox, { backgroundColor: s.color }]}
            >
              <Text style={styles.statNum}>{s.count}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Posts */}
        <Text style={styles.sectionTitle}>ประกาศของฉัน</Text>
        {posts.map((p) => (
          <TouchableOpacity
            key={p.item_id}
            style={styles.postCard}
            onPress={() =>
              router.push({
                pathname: "/DetailScreen",
                params: { item_id: p.item_id }, // ✅ ส่ง item_id
              })
            }
          >
            {p.thumbnail ? (
              <Image
                source={{ uri: p.thumbnail }}
                style={styles.postImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.postImage} />
            )}

            <View style={{ flex: 1 }}>
              <Text style={styles.postTitle}>{p.title}</Text>
              <Text style={styles.postText}>Item ID: {p.item_id}</Text>
              <Text style={styles.postText}>พิกัด: {p.location}</Text>
              <Text style={styles.postText}>
                เวลา {new Date(p.post_time).toLocaleTimeString()}
              </Text>
              <Text
                style={[
                  styles.postStatus,
                  {
                    color:
                      p.status === "lost"
                        ? "#EA4335"
                        : p.status === "found"
                        ? "#34A853"
                        : "#4285F4",
                  },
                ]}
              >
                {p.statusLabel}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Settings */}
        <TouchableOpacity style={styles.settingBtn}>
          <Text>ความเป็นส่วนตัว</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingBtn}>
          <Text>ช่วยเหลือ & คำแนะนำ</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={async () => {
            await supabase.auth.signOut();
            router.replace("/login");
          }}
        >
          <Text style={styles.logoutText}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ✅ Bottom Navigation */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bottomTab}
          onPress={() => router.replace("/home")}
        >
          <Ionicons name="home" size={22} color="#6B7280" />
          <Text style={styles.bottomText}>หน้าหลัก</Text>
        </TouchableOpacity>

        <View style={{ width: 60 }} />

        <TouchableOpacity
          style={styles.bottomTab}
          onPress={() => router.replace("/profile")}
        >
          <Ionicons name="person" size={22} color="#2563EB" />
          <Text style={styles.bottomText}>โปรไฟล์</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ Floating Plus Button */}
      <TouchableOpacity
        style={styles.plusButton}
        onPress={() => router.push("/post")}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { backgroundColor: "#0066FF", padding: 16 },
  headerText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  profileCard: {
    backgroundColor: "#fff",
    margin: 12,
    padding: 12,
    borderRadius: 12,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ddd",
    marginRight: 12,
  },
  name: { fontSize: 16, fontWeight: "bold" },
  info: { fontSize: 14, color: "#555" },
  editBtn: {
    borderWidth: 1,
    borderColor: "#0066FF",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 12,
    marginTop: 8,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 12,
  },
  statNum: { fontSize: 20, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#555" },
  sectionTitle: { fontSize: 16, fontWeight: "bold", margin: 12 },
  postCard: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    padding: 8,
  },
  postImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#ddd",
    marginRight: 8,
  },
  postTitle: { fontWeight: "bold", fontSize: 14 },
  postText: { fontSize: 12, color: "#555" },
  postStatus: { fontSize: 12, marginTop: 4, fontWeight: "bold" },
  settingBtn: {
    backgroundColor: "#f5f5f5",
    marginHorizontal: 12,
    padding: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  logoutBtn: {
    backgroundColor: "#FF4444",
    margin: 12,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "bold" },

  // ✅ Bottom Bar + Floating Button
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
