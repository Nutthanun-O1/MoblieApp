import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/useAuth"; // ✅ ใช้ user ที่ login

type RootStackParamList = {
  DetailScreen: { item_id: string };
  UpdateStatusScreen: { item_id: string; currentStatus: string };
};

export default function DetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, "DetailScreen">>();
  const { item_id } = route.params;

  const { user } = useAuth(); // ✅ ดึง user login
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItem();
  }, []);

  async function fetchItem() {
    setLoading(true);
    const { data, error } = await supabase
      .from("items")
      .select(
        `
        item_id,
        title,
        description,
        category,
        status,
        location,
        post_time,
        contact_info,
        posted_by,
        users:posted_by (psu_id, full_name),
        item_photos(photo_url)
      `
      )
      .eq("item_id", item_id)
      .single();

    if (error) {
      console.error("DB error:", error.message);
    } else {
      setItem(data);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <Text>ไม่พบข้อมูล</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>รายละเอียด</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Image */}
        <View style={styles.imageBox}>
          {item.item_photos?.length > 0 ? (
            <Image
              source={{ uri: item.item_photos[0].photo_url }}
              style={styles.previewImage}
            />
          ) : (
            <Ionicons name="image-outline" size={60} color="#9CA3AF" />
          )}
        </View>

        {/* Title */}
        <Text style={styles.itemTitle}>{item.title}</Text>

        {/* Status */}
        <Text
          style={[
            styles.statusChip,
            item.status === "lost"
              ? styles.lost
              : item.status === "found"
              ? styles.found
              : styles.returned,
          ]}
        >
          {item.status === "lost"
            ? "ของหาย"
            : item.status === "found"
            ? "เจอของ"
            : "ส่งคืนแล้ว"}
        </Text>

        {/* Info */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Ionicons name="pricetag-outline" size={18} color="#2563EB" />
            <Text style={styles.infoText}>หมวดหมู่: {item.category}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color="#2563EB" />
            <Text style={styles.infoText}>สถานที่: {item.location}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color="#2563EB" />
            <Text style={styles.infoText}>
              เวลาโพสต์: {new Date(item.post_time).toLocaleString("th-TH")}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color="#2563EB" />
            <Text style={styles.infoText}>ติดต่อ: {item.contact_info}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="barcode-outline" size={18} color="#2563EB" />
            <Text style={styles.infoText}>รหัส: {item.item_id}</Text>
          </View>

          {item.users && (
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={18} color="#2563EB" />
              <Text style={styles.infoText}>
                ผู้โพสต์: {item.users.full_name} ({item.users.psu_id})
              </Text>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.descBox}>
          <Text style={styles.descTitle}>รายละเอียดเพิ่มเติม</Text>
          <Text style={styles.descText}>
            {item.description || "ไม่มีรายละเอียดเพิ่มเติม"}
          </Text>
        </View>

        {/* ✅ ปุ่มอัปเดตสถานะ: แสดงเฉพาะเจ้าของโพสต์ */}
        {user && item.posted_by === user.psu_id && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() =>
              navigation.navigate("UpdateStatusScreen", {
                item_id: item.item_id,
                currentStatus: item.status,
              })
            }
          >
            <Text style={styles.actionBtnText}>อัปเดตสถานะ</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingVertical: 18,
    paddingHorizontal: 16,
    elevation: 4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 10,
  },

  imageBox: {
    width: "100%",
    height: 200,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
  },
  previewImage: { width: "100%", height: "100%", borderRadius: 14 },

  itemTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },

  statusChip: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
  },
  lost: { backgroundColor: "#EF4444" },
  found: { backgroundColor: "#F59E0B" },
  returned: { backgroundColor: "#10B981" },

  infoBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  infoText: { fontSize: 15, color: "#374151" },

  descBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  descTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111827",
  },
  descText: { fontSize: 14, lineHeight: 20, color: "#374151" },

  actionBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  actionBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
