import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import uuid from "react-native-uuid";
import { supabase } from "../lib/supabaseClient";

export default function PostScreen() {
  const navigation = useNavigation<any>();

  // states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [status, setStatus] = useState("lost");
  const [location, setLocation] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [image, setImage] = useState<string | null>(null);

  const categories = [
    { key: "card", label: "บัตร" },
    { key: "clothes", label: "เสื้อผ้า" },
    { key: "equipment", label: "อุปกรณ์" },
    { key: "other", label: "อื่น ๆ" },
  ];

  // 📷 เลือกรูป
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

// 🚀 กดโพสต์
async function handlePost() {
  try {
    if (!title || !location || !contactInfo || !date || !time) {
      Alert.alert("กรอกข้อมูลไม่ครบ", "กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    // ✅ ดึง session ของผู้ใช้
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      Alert.alert("Error", "กรุณาเข้าสู่ระบบก่อนโพสต์");
      return;
    }
    const user = sessionData.session.user;

    // ✅ หา psu_id จาก users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("psu_id")
      .eq("email", user.email)
      .single();

    if (userError || !userData) {
      Alert.alert("Error", "ไม่พบข้อมูลผู้ใช้ในระบบ");
      return;
    }

    const psu_id = userData.psu_id;
    const item_id = uuid.v4().toString();

    // ✅ รวมวันเวลา
    const post_time = new Date(`${date}T${time}:00`);

    // ✅ insert ข้อมูล items
    const { error: insertError } = await supabase.from("items").insert([
      {
        item_id,
        title,
        description,
        category,
        status,
        location,
        posted_by: psu_id,
        post_time,
        contact_info: contactInfo,
      },
    ]);
    if (insertError) throw insertError;

    // ✅ ถ้ามีรูป -> upload ไป storage + บันทึก item_photos
    if (image) {
      const fileExt = image.split(".").pop();
      const filePath = `${item_id}_${Date.now()}.${fileExt}`;

      const imgRes = await fetch(image);
      const blob = await imgRes.blob();

      const { error: uploadError } = await supabase.storage
        .from("item-photos")
        .upload(filePath, blob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("item-photos")
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        await supabase.from("item_photos").insert([
          {
            item_id,
            photo_url: publicUrlData.publicUrl,
            uploaded_by: psu_id,
          },
        ]);
      }
    }

    // ✅ ถ้าโพสต์เป็น "found" → เพิ่ม activity_hours อัตโนมัติ
    if (status === "found") {
      const { error: hoursError } = await supabase
        .from("activity_hours")
        .insert([
          {
            psu_id,
            item_id,
            hours: 2, // ค่า default
            reason: "dropped_at_center", // หรือจะใช้ "returned_to_owner"
            verified_by: null,
          },
        ]);

      if (hoursError) throw hoursError;
    }

    Alert.alert("สำเร็จ", "โพสต์ถูกบันทึกแล้ว ✅");
    navigation.goBack();
  } catch (err: any) {
    console.error("โพสต์ error:", err);
    Alert.alert("Error", err.message || "เกิดข้อผิดพลาด");
  }
}


  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ประกาศของหาย/พบของ</Text>
      </SafeAreaView>

      {/* ✅ KeyboardAvoidingView ป้องกันคีย์บอร์ดบัง */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={10}
      >
        <ScrollView
          style={styles.form}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Upload */}
          <Text style={styles.label}>อัปโหลดรูปภาพ</Text>
          <View style={styles.row}>
            {image && (
              <Image source={{ uri: image }} style={styles.previewImage} />
            )}
            <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
              <Text style={{ fontSize: 28, color: "#888" }}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text style={styles.label}>ชื่อสิ่งของ</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
          />

          {/* Description */}
          <Text style={styles.label}>รายละเอียด</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          {/* Category */}
          <Text style={styles.label}>หมวดหมู่</Text>
          <View style={styles.row}>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.key}
                style={[
                  styles.chip,
                  category === c.key && styles.chipActive,
                ]}
                onPress={() => setCategory(c.key)}
              >
                <Text
                  style={{ color: category === c.key ? "#fff" : "#2563eb" }}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Location */}
          <Text style={styles.label}>สถานที่</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
          />

          {/* Status */}
          <Text style={styles.label}>สถานะ</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.statusChip, status === "lost" && styles.lost]}
              onPress={() => setStatus("lost")}
            >
              <Text style={{ color: status === "lost" ? "#fff" : "#333" }}>
                ของหาย
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusChip, status === "found" && styles.found]}
              onPress={() => setStatus("found")}
            >
              <Text style={{ color: status === "found" ? "#fff" : "#333" }}>
                พบของ
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date & Time */}
          <Text style={styles.label}>วัน</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={date}
            onChangeText={setDate}
          />
          <Text style={styles.label}>เวลา</Text>
          <TextInput
            style={styles.input}
            placeholder="HH:MM"
            value={time}
            onChangeText={setTime}
          />

          {/* Contact */}
          <Text style={styles.label}>ช่องทางติดต่อ</Text>
          <TextInput
            style={styles.input}
            value={contactInfo}
            onChangeText={setContactInfo}
          />

          {/* Post */}
          <TouchableOpacity style={styles.postButton} onPress={handlePost}>
            <Text style={styles.postButtonText}>โพสต์</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },

  // 🔵 Header แบบเต็มสวยๆ
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingTop: 40, // ทำให้ header ลงมาลึกกว่าเดิม
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    marginLeft: 14,
    letterSpacing: 0.5,
  },

  // 📋 Form และ Label
  form: { padding: 18 },
  label: {
    marginTop: 14,
    marginBottom: 6,
    fontWeight: "600",
    color: "#374151",
    fontSize: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: "#fff",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },

  // 📦 Image Upload Box
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 12,
  },
  imageBox: {
    width: 190,
    height: 160,
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  previewImage: { width: 100, height: 100, borderRadius: 14 },

  // 🟦 Chips (ตัวเลือก)
  chip: {
    borderWidth: 1.2,
    borderColor: "#2563eb",
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  chipActive: { backgroundColor: "#2563eb" },

  // 🟨 สถานะ Lost / Found
  statusChip: {
    borderWidth: 1.2,
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginRight: 8,
    backgroundColor: "#fff",
    borderColor: "#d1d5db",
  },
  lost: { backgroundColor: "#ef4444", borderColor: "#ef4444" },
  found: { backgroundColor: "#facc15", borderColor: "#facc15" },

  // ✅ Post Button
  postButton: {
    marginTop: 28,
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  postButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});

