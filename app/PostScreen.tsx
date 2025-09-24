import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";

export default function PostScreen({ onBack }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState("lost"); // lost | found

  function handleSubmit() {
    if (!title.trim()) {
      Alert.alert("กรอกข้อมูลไม่ครบ", "กรุณากรอกชื่อสิ่งของ");
      return;
    }
    Alert.alert("โพสต์สำเร็จ", "ข้อมูลถูกบันทึก (ยังไม่เชื่อม DB)");
    // TODO: เชื่อมกับฐานข้อมูลจริง
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ประกาศของหาย / พบของ</Text>
      </View>

      <ScrollView style={{ padding: 16 }}>
        {/* Upload image placeholder */}
        <View style={{ flexDirection: "row", marginBottom: 16 }}>
          <View style={styles.uploadBox}>
            <Text style={{ color: "#9CA3AF", fontSize: 22 }}>＋</Text>
          </View>
          <View style={styles.uploadBox}>
            <Text style={{ color: "#9CA3AF", fontSize: 22 }}>＋</Text>
          </View>
        </View>

        {/* Form */}
        <TextInput
          placeholder="ชื่อสิ่งของ"
          style={styles.input}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          placeholder="รายละเอียด"
          style={[styles.input, { height: 80 }]}
          value={desc}
          onChangeText={setDesc}
          multiline
        />
        <TextInput
          placeholder="หมวดหมู่ (บัตร/เสื้อผ้า/อุปกรณ์)"
          style={styles.input}
          value={category}
          onChangeText={setCategory}
        />
        <TextInput
          placeholder="สถานที่"
          style={styles.input}
          value={location}
          onChangeText={setLocation}
        />

        {/* สถานะ */}
        <View style={{ flexDirection: "row", marginVertical: 12 }}>
          <TouchableOpacity
            style={[
              styles.statusBtn,
              status === "lost" && styles.statusBtnActiveLost,
            ]}
            onPress={() => setStatus("lost")}
          >
            <Text
              style={[
                styles.statusText,
                status === "lost" && styles.statusTextActive,
              ]}
            >
              ของหาย
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statusBtn,
              status === "found" && styles.statusBtnActiveFound,
            ]}
            onPress={() => setStatus("found")}
          >
            <Text
              style={[
                styles.statusText,
                status === "found" && styles.statusTextActive,
              ]}
            >
              พบของ
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          placeholder="วันที่ (DD/MM/YY)"
          style={styles.input}
          value={date}
          onChangeText={setDate}
        />
        <TextInput
          placeholder="เวลา (HH:MM)"
          style={styles.input}
          value={time}
          onChangeText={setTime}
        />
        <TextInput
          placeholder="ช่องทางติดต่อ"
          style={styles.input}
          value={contact}
          onChangeText={setContact}
        />

        {/* Submit */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>โพสต์</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  header: {
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
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },

  uploadBox: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    backgroundColor: "#fff",
  },

  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
    fontSize: 14,
  },

  statusBtn: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  statusBtnActiveLost: {
    backgroundColor: "#FEE2E2",
    borderColor: "#DC2626",
  },
  statusBtnActiveFound: {
    backgroundColor: "#FEF3C7",
    borderColor: "#D97706",
  },
  statusText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  statusTextActive: { color: "#111827", fontWeight: "700" },

  submitBtn: {
    backgroundColor: "#1E40AF",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
  },
  submitText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
});
