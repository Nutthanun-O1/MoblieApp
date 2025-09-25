import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabaseClient";

export default function ProfileScreen() {
  const router = useRouter();

  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState<any[]>([]);
  const [posts, setPosts] = React.useState<any[]>([]);

  // --- ดึง session ---
  React.useEffect(() => {
    const getSessionAndUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
        setLoading(false);
        return;
      }

      if (!session) {
        console.log("No active session");
        setLoading(false);
        return;
      }

      const authUser = session.user;

      // 🔑 map authUser.id → users.psu_id
      const { data, error: userError } = await supabase
        .from("users")
        .select("psu_id, full_name, email, phone")
        .eq("email", authUser.email)   // ✅ ใช้ email แทน
        .single();

      if (userError) {
        console.error("Error fetching user:", userError);
      } else {
        setUser(data);
      }
      setLoading(false);
    };

    getSessionAndUser();
  }, []);

  // --- ดึงสถิติ ---
  React.useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      const statuses = ["ของหาย", "พบของ", "ส่งคืนแล้ว"];
      const results: any[] = [];

      for (let s of statuses) {
        const { count, error } = await supabase
          .from("items")
          .select("*", { count: "exact", head: true })
          .eq("posted_by", user.psu_id)
          .eq("status", s);

        if (!error) {
          results.push({
            label: s,
            count: count || 0,
            color:
              s === "ของหาย"
                ? "#FDE2E2"
                : s === "พบของ"
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
        .select("item_id, title, location, post_time, status")
        .eq("posted_by", user.psu_id);

      if (!error) setPosts(data || []);
    };

    fetchPosts();
  }, [user]);

  // --- Loading/Error ---
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text>Loading...</Text>
      </View>
    );
  }
  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text>กรุณาเข้าสู่ระบบ</Text>
      </View>
    );
  }

  return (
    <>
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
              <Text style={styles.name}>{user.full_name}</Text>
              <Text style={styles.info}>{user.email} | {user.phone}</Text>
            </View>
            <TouchableOpacity style={styles.editBtn}>
              <Text style={{ color: "#0066FF" }}>แก้ไขโปรไฟล์</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map((s, idx) => (
            <View key={idx} style={[styles.statBox, { backgroundColor: s.color }]}>
              <Text style={styles.statNum}>{s.count}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Posts */}
        <Text style={styles.sectionTitle}>ประกาศของฉัน</Text>
        {posts.map((p) => (
          <View key={p.item_id} style={styles.postCard}>
            <View style={styles.postImage} />
            <View style={{ flex: 1 }}>
              <Text style={styles.postTitle}>{p.title}</Text>
              <Text style={styles.postText}>Item ID: {p.item_id}</Text>
              <Text style={styles.postText}>พิกัด: {p.location}</Text>
              <Text style={styles.postText}>
                เวลา {new Date(p.post_time).toLocaleTimeString()}
              </Text>
              <Text style={[styles.postStatus, { color: p.status === "ของหาย" ? "#EA4335" : "#34A853" }]}>
                {p.status}
              </Text>
            </View>
          </View>
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
            router.push("/login");
          }}
        >
          <Text style={styles.logoutText}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { backgroundColor: "#0066FF", padding: 16 },
  headerText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  profileCard: { backgroundColor: "#fff", margin: 12, padding: 12, borderRadius: 12, shadowOpacity: 0.1, elevation: 2 },
  row: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#ddd", marginRight: 12 },
  name: { fontSize: 16, fontWeight: "bold" },
  info: { fontSize: 14, color: "#555" },
  editBtn: { borderWidth: 1, borderColor: "#0066FF", borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8 },
  statsRow: { flexDirection: "row", justifyContent: "space-around", marginHorizontal: 12, marginTop: 8 },
  statBox: { flex: 1, alignItems: "center", padding: 12, marginHorizontal: 4, borderRadius: 12 },
  statNum: { fontSize: 20, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#555" },
  sectionTitle: { fontSize: 16, fontWeight: "bold", margin: 12 },
  postCard: { flexDirection: "row", backgroundColor: "#f9f9f9", marginHorizontal: 12, marginBottom: 8, borderRadius: 12, padding: 8 },
  postImage: { width: 60, height: 60, borderRadius: 8, backgroundColor: "#ddd", marginRight: 8 },
  postTitle: { fontWeight: "bold", fontSize: 14 },
  postText: { fontSize: 12, color: "#555" },
  postStatus: { fontSize: 12, marginTop: 4, fontWeight: "bold" },
  settingBtn: { backgroundColor: "#f5f5f5", marginHorizontal: 12, padding: 12, borderRadius: 12, marginTop: 6 },
  logoutBtn: { backgroundColor: "#FF4444", margin: 12, padding: 14, borderRadius: 12, alignItems: "center" },
  logoutText: { color: "#fff", fontWeight: "bold" },
});
