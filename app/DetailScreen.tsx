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
import { useRouter, useLocalSearchParams } from "expo-router"; // ✅ expo-router
import { supabase } from "../lib/supabaseClient";

export default function DetailScreen() {
  const router = useRouter();
  const { item_id } = useLocalSearchParams(); // ✅ รับค่าจาก Profile

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

    if (!error) setItem(data);
    setLoading(false);
  }

  function renderStatusChip(status: string) {
    if (status === "lost")
      return <Text style={[styles.statusChip, styles.lost]}>ของหาย</Text>;
    if (status === "found")
      return <Text style={[styles.statusChip, styles.found]}>พบของ</Text>;
    return <Text style={[styles.statusChip, styles.returned]}>ส่งคืนแล้ว</Text>;
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
        <TouchableOpacity onPress={() => router.back()}>
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
          <Text>รหัส: {item.item_id}</Text>
          <Text>หมวดหมู่: {item.category}</Text>
          <Text>สถานที่: {item.location}</Text>
          <Text>เวลาโพสต์: {new Date(item.post_time).toLocaleString()}</Text>
          {item.contact_info && <Text>ติดต่อ: {item.contact_info}</Text>}
        </View>

        {/* Description */}
        {item.description && (
          <View style={styles.descBox}>
            <Text style={styles.descTitle}>รายละเอียดเพิ่มเติม</Text>
            <Text style={styles.descText}>{item.description}</Text>
          </View>
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
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  previewImage: { width: "100%", height: "100%", borderRadius: 14 },
  itemTitle: { fontSize: 22, fontWeight: "800", marginBottom: 8 },
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
  },
  descBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  descTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  descText: { fontSize: 14, lineHeight: 20 },
});
