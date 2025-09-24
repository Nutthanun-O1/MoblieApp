import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import { useRouter } from 'expo-router';
import { supabase } from "../lib/supabaseClient"; // <- ใช้ตัวจริง

export default async function ProfileScreen() {
  const router = useRouter();

const [user, setUser] = React.useState<any>(null);
const [loading, setLoading] = React.useState(true);

React.useEffect(() => {
    const fetchUser = async () => {
        const { data, error } = await supabase
            .from("users")
            .select("id, name, email, phone")
            .eq("id", "user-uuid-here")
            .single();
        if (error) {
            console.error("Error fetching user data:", error);
        }
        setUser(data);
        setLoading(false);
    };
    fetchUser();
}, []);

if (loading) {
    return <Text>Loading...</Text>;
}
if (!user) {
    return <Text>ไม่พบข้อมูลผู้ใช้</Text>;
}

  // mock statistics
  const stats = [
    { label: "ประกาศของหาย", count: 5, color: "#FDE2E2" },
    { label: "ประกาศพบของ", count: 2, color: "#FFF4D9" },
    { label: "ส่งคืนแล้ว", count: 3, color: "#E0F8EC" },
  ];

  // mock posts
  const posts = [
    {
      id: "PSU-LF-2025-00123",
      title: "บัตรนักศึกษา",
      place: "หอสมุดคณะหญิงชล ชั้น 5",
      time: "14:05",
      status: "พบของ",
      statusColor: "#34A853",
      action: "ส่งคืนพร้อม 2 ชม.กิจกรรม",
    },
    {
      id: "PSU-LF-2025-01180",
      title: "ร่มสีดำ",
      place: "ตึกวิทยาการคอมพิวเตอร์ ห้อง 105",
      time: "08:10",
      status: "ของหาย",
      statusColor: "#EA4335",
    },
  ];

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
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.info}>
                {user.email} | {user.phone}
              </Text>
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

        {/* My Posts */}
        <Text style={styles.sectionTitle}>ประกาศของฉัน</Text>
        {posts.map((p) => (
          <View key={p.id} style={styles.postCard}>
            <View style={styles.postImage} />
            <View style={{ flex: 1 }}>
              <Text style={styles.postTitle}>{p.title}</Text>
              <Text style={styles.postText}>Item ID: {p.id}</Text>
              <Text style={styles.postText}>พิกัด: {p.place}</Text>
              <Text style={styles.postText}>เวลา {p.time}</Text>
              <Text style={[styles.postStatus, { color: p.statusColor }]}>
                {p.status}
              </Text>
              {p.action && <Text style={styles.postAction}>{p.action}</Text>}
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
        <TouchableOpacity style={styles.logoutBtn}>
          <Text style={styles.logoutText}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/home')}> 
          <Text style={[styles.navIcon, styles.navActive]}>🏠</Text>
          <Text style={[styles.navLabel, styles.navActive]}>หน้าหลัก</Text>
        </TouchableOpacity>
        <View style={styles.navSpacer} />
        <TouchableOpacity style={styles.navItem} onPress={() => setModalVisible(true)}>
          <Text style={styles.navIcon}>➕</Text>
          <Text style={styles.navLabel}>ประกาศ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            router.push('/profile');
          }}
        >
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>โปรไฟล์</Text>
        </TouchableOpacity>
      </View>
    </>
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
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
    postAction: { fontSize: 12, color: "#FF6600", marginTop: 2 },
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

    // Bottom navigation styles (updated)
    bottomNav: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 56,
        flexDirection: 'row',
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        borderTopWidth: 1,
        borderColor: '#E5E7EB',
    },
    navItem: { alignItems: 'center' },
    navIcon: { fontSize: 18 },
    navLabel: { fontSize: 12, color: '#6B7280' },
    navActive: { color: '#1E40AF' },
    navSpacer: { width: 32 },
});
function setModalVisible(arg0: boolean): void {
    throw new Error("Function not implemented.");
}
