import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabaseClient";

export default function UpdateStatusScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { item_id, currentStatus } = route.params;
  const insets = useSafeAreaInsets();

  const [status, setStatus] = useState(currentStatus);
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  // 📸 เลือกรูป
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.length) {
      const uri = result.assets[0]?.uri;
      if (uri) {
        setImageUri(uri);
      }
    }
  };

  // 💾 กดบันทึก
  const handleUpdate = async () => {
    if (!confirmed) {
      Alert.alert("แจ้งเตือน", "กรุณาติ๊กยืนยันก่อนบันทึก");
      return;
    }

    try {
      let evidenceUrl = null;

      // ✅ อัปโหลดรูปถ้ามี
      if (imageUri) {
        const fileExt = imageUri.split(".").pop();
        const fileName = `${item_id}_${Date.now()}.${fileExt}`;
        const filePath = `evidence/${fileName}`;

        const img = await fetch(imageUri);
        const blob = await img.blob();

        const { error: uploadError } = await supabase.storage
          .from("evidence")
          .upload(filePath, blob);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("evidence")
          .getPublicUrl(filePath);

        evidenceUrl = urlData.publicUrl;
      }

      // ✅ update item status
      const { error: updateError } = await supabase
        .from("items")
        .update({ status })
        .eq("item_id", item_id);

      if (updateError) throw updateError;

      // ✅ insert history log
      const { error: historyError } = await supabase
        .from("item_status_history")
        .insert([
          {
            item_id,
            old_status: currentStatus,
            new_status: status,
            note,
            evidence_url: evidenceUrl,
            updated_by: "psu1234", // TODO: แก้เป็น user จริงที่ล็อกอิน
          },
        ]);

      if (historyError) throw historyError;

      Alert.alert("สำเร็จ", "อัปเดตสถานะเรียบร้อยแล้ว", [
        {
          text: "ตกลง",
          onPress: () => navigation.navigate("Home", { refresh: true }),
        },
      ]);
    } catch (err: any) {
      Alert.alert("ผิดพลาด", err.message);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>อัปเดตสถานะ</Text>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* การ์ดข้อมูล */}
        <View style={styles.card}>
          <View style={{ width: 60, height: 60, backgroundColor: "#E5E7EB", borderRadius: 10 }} />
          <View style={{ marginLeft: 10 }}>
            <Text style={{ fontWeight: "700" }}>บัตรนักศึกษา</Text>
            <Text style={{ color: "#6B7280" }}>หมวด: บัตร · สถานที่: โรงอาหาร</Text>
          </View>
        </View>

        {/* เลือกสถานะ */}
        <Text style={styles.label}>เปลี่ยนสถานะเป็น</Text>
        <View style={styles.statusRow}>
          <TouchableOpacity
            style={[styles.statusChip, status === "lost" && styles.activeLost]}
            onPress={() => setStatus("lost")}
          >
            <Text style={styles.chipText}>ของหาย</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusChip, status === "found" && styles.activeFound]}
            onPress={() => setStatus("found")}
          >
            <Text style={styles.chipText}>พบของ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusChip, status === "returned" && styles.activeReturned]}
            onPress={() => setStatus("returned")}
          >
            <Text style={styles.chipText}>ส่งคืนแล้ว</Text>
          </TouchableOpacity>
        </View>

        {/* เวลา */}
        <TextInput
          placeholder="เวลาอัปเดต (HH:MM)"
          style={styles.input}
          value={time}
          onChangeText={setTime}
        />

        {/* หลักฐาน */}
        <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <Ionicons name="add" size={32} color="#9CA3AF" />
          )}
        </TouchableOpacity>

        {/* บันทึกเพิ่มเติม */}
        <TextInput
          placeholder="เช่น ชื่อผู้รับคืน/ห้อง/อาคาร จุดรับ-จุดฯลฯ"
          style={[styles.input, { height: 90, textAlignVertical: "top" }]}
          multiline
          value={note}
          onChangeText={setNote}
        />

        {/* Checkbox */}
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}
          onPress={() => setConfirmed(!confirmed)}
        >
          <Ionicons
            name={confirmed ? "checkbox" : "square-outline"}
            size={22}
            color={confirmed ? "#2563EB" : "#9CA3AF"}
          />
          <Text style={{ marginLeft: 8, color: "#111827" }}>
            ยืนยันว่าเป็นการอัปเดตที่แท้จริง
          </Text>
        </TouchableOpacity>

        {/* ปุ่ม */}
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#9CA3AF" }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>ยกเลิก</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: "#2563EB" }]} onPress={handleUpdate}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>บันทึกสถานะ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    padding: 16,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginLeft: 10 },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  label: { fontWeight: "700", marginBottom: 6, color: "#111827" },
  statusRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statusChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
  },
  chipText: { fontWeight: "600", color: "#fff" },
  activeLost: { backgroundColor: "#EF4444" },
  activeFound: { backgroundColor: "#F59E0B" },
  activeReturned: { backgroundColor: "#10B981" },

  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 16,
  },

  uploadBox: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  previewImage: { width: "100%", height: "100%", borderRadius: 10 },

  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  btn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
});
