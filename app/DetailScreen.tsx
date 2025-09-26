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
import { useNavigation, useRoute } from "@react-navigation/native";
import { supabase } from "../lib/supabaseClient";

export default function DetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { item_id } = route.params;

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItem();
  }, [item_id]);

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

  function renderStatusChip(status: string) {
    if (status === "lost")
      return <Text style={[styles.statusChip, styles.lost]}>ของหาย</Text>;
    if (status === "found")
      return <Text style={[styles.statusChip, styles.found]}>พบของ</Text>;
    return <Text style={[styles.statusChip, styles.returned]}>ส่งคืนแล้ว</Text>;
  }

  function formatDate(ts: string) {
    if (!ts) return "-";
    const d = new Date(ts);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${d.getFullYear()}`;
  }

  function formatTime(ts: string) {
    if (!ts) return "-";
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")} น.`;
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
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>รายละเอียดสิ่งของ</Text>
      </View>

      <ScrollView style={{ flex: 1, padding: 18 }}>
        {/* Image */}
        <View style={styles.imageBox}>
          {item.item_photos && item.item_photos.length > 0 ? (
            <Image
              source={{ uri: item.item_photos[0].photo_url }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="image" size={64} color="#9CA3AF" />
          )}
        </View>

        {/* Title & Status */}
        <Text style={styles.itemTitle}>{item.title}</Text>
        {renderStatusChip(item.status)}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Ionicons name="barcode-outline" size={18} color="#2563EB" />
            <Text style={styles.infoText}>รหัส: {item.item_id}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="pricetag-outline" size={18} color="#2563EB" />
            <Text style={styles.infoText}>หมวดหมู่: {item.category}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color="#2563EB" />
            <Text style={styles.infoText}>สถานที่: {item.location}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color="#2563EB" />
            <Text style={styles.infoText}>
              วันที่โพสต์: {formatDate(item.post_time)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color="#2563EB" />
            <Text style={styles.infoText}>
              เวลาโพสต์: {formatTime(item.post_time)}
            </Text>
          </View>
          {item.contact_info && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={18} color="#2563EB" />
              <Text style={styles.infoText}>ติดต่อ: {item.contact_info}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {item.description && (
          <View style={styles.descBox}>
            <Text style={styles.descTitle}>รายละเอียดเพิ่มเติม</Text>
            <Text style={styles.descText}>{item.description}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>อัปเดตสถานะ</Text>
        </TouchableOpacity>

        <View style={styles.row}>
          <TouchableOpacity style={styles.secondaryBtn}>
            <Ionicons name="share-social-outline" size={18} color="#374151" />
            <Text style={styles.secondaryBtnText}>แชร์ประกาศ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn}>
            <Ionicons name="chatbubbles-outline" size={18} color="#374151" />
            <Text style={styles.secondaryBtnText}>ติดต่อหน่วยงาน</Text>
          </TouchableOpacity>
        </View>
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

  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 2,
  },
  secondaryBtnText: { fontWeight: "600", color: "#374151", fontSize: 14 },
});
