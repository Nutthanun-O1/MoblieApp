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
import { supabase } from "../lib/supabaseClient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "../lib/useAuth";
import uuid from "react-native-uuid";
import * as FileSystem from "expo-file-system/legacy";


export default function PostScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  // states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [status, setStatus] = useState("lost");
  const [location, setLocation] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [image, setImage] = useState<string | null>(null);

  // date & time
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const categories = [
    { key: "card", label: "บัตร" },
    { key: "clothes", label: "เสื้อผ้า" },
    { key: "equipment", label: "อุปกรณ์" },
    { key: "other", label: "อื่น ๆ" },
  ];

  // ✅ generate item_id (รันตามปี)
  async function generateItemId(status: string) {
    const prefix = status === "lost" ? "l" : "f";
    const year = new Date().getFullYear().toString().slice(-2); // "25"

    const { data, error } = await supabase
      .from("items")
      .select("item_id")
      .like("item_id", `${prefix}${year}%`)
      .order("item_id", { ascending: false })
      .limit(1);

    if (error) throw error;

    let running = 1;
    if (data && data.length > 0 && data[0] && typeof data[0].item_id === "string") {
      const lastId = data[0].item_id; // เช่น "f2507"
      const lastNum = parseInt(lastId.slice(3)); // ตัด prefix+ปี → เลขรัน
      if (!Number.isNaN(lastNum)) {
        running = lastNum + 1;
      }
    }

    const runningStr = running.toString().padStart(2, "0");
    return `${prefix}${year}${runningStr}`;
  }

  // 📷 เลือกรูป
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      const uri = result.assets?.[0]?.uri;
      if (uri) setImage(uri);
    }
  };

  // 📤 upload image ไป Supabase Storage
  async function uploadImage(imageUri: string, item_id: string, psu_id: string) {
    try {
      const fileExt = imageUri.split(".").pop() || "jpg";
      const fileName = `${item_id}_${Date.now()}.${fileExt}`;
      const filePath = `items/${fileName}`;

      // ✅ อ่านไฟล์เป็น base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: "base64",
      });

      // ✅ แปลง base64 → Uint8Array
      const fileData = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

      // อัปโหลดขึ้น Supabase
      const { error: uploadError } = await supabase.storage
        .from("item-photos")
        .upload(filePath, fileData, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // ดึง public URL
      const { data } = supabase.storage.from("item-photos").getPublicUrl(filePath);
      return data.publicUrl;
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    }
  }

  // 🚀 กดโพสต์
  async function handlePost() {
    try {
      if (!title || !location || !contactInfo || !selectedDate || !selectedTime) {
        Alert.alert("กรอกข้อมูลไม่ครบ", "กรุณากรอกข้อมูลให้ครบทุกช่อง");
        return;
      }

      if (!user) {
        Alert.alert("Error", "กรุณาเข้าสู่ระบบก่อนโพสต์");
        return;
      }

      const psu_id = user.psu_id;
      const item_id = await generateItemId(status);

      // รวมวัน+เวลา
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const hours = String(selectedTime.getHours()).padStart(2, "0");
      const minutes = String(selectedTime.getMinutes()).padStart(2, "0");
      const post_time = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`);

      // ✅ insert items
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

      // ✅ upload image
      if (image) {
        const photo_id = uuid.v4() as string;
        const photo_url = await uploadImage(image, item_id, psu_id);
        if (photo_url) {
          await supabase.from("item_photos").insert([
            {
              photo_id,
              item_id,
              photo_url,
              order: 1,
              caption: status === "found" ? "ฝากศูนย์" : "ภาพตัวอย่าง",
              uploaded_by: psu_id,
              uploaded_at: new Date().toISOString(),
            },
          ]);
        }
      }

      // ✅ กรณีโพสต์ found → เพิ่ม activity_hours
      if (status === "found") {
        const { error: hoursError } = await supabase.from("activity_hours").insert([
          {
            psu_id,
            item_id,
            hours: 2,
            reason: "dropped_at_center",
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
            {image && <Image source={{ uri: image }} style={styles.previewImage} />}
            <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
              <Text style={{ fontSize: 28, color: "#888" }}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text style={styles.label}>ชื่อสิ่งของ</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} />

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
                style={[styles.chip, category === c.key && styles.chipActive]}
                onPress={() => setCategory(c.key)}
              >
                <Text style={{ color: category === c.key ? "#fff" : "#2563eb" }}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Location */}
          <Text style={styles.label}>สถานที่</Text>
          <TextInput style={styles.input} value={location} onChangeText={setLocation} />

          {/* Status */}
          <Text style={styles.label}>สถานะ</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.statusChip, status === "lost" && styles.lost]}
              onPress={() => setStatus("lost")}
            >
              <Text style={{ color: status === "lost" ? "#fff" : "#333" }}>ของหาย</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusChip, status === "found" && styles.found]}
              onPress={() => setStatus("found")}
            >
              <Text style={{ color: status === "found" ? "#fff" : "#333" }}>พบของ</Text>
            </TouchableOpacity>
          </View>

          {/* Date */}
          <Text style={styles.label}>วัน</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
            <Text>{selectedDate ? selectedDate.toISOString().split("T")[0] : "เลือกวัน"}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) setSelectedDate(date);
              }}
            />
          )}

          {/* Time */}
          <Text style={styles.label}>เวลา</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(true)}>
            <Text>{selectedTime ? selectedTime.toTimeString().slice(0, 5) : "เลือกเวลา"}</Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={selectedTime || new Date()}
              mode="time"
              is24Hour={true}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, time) => {
                setShowTimePicker(false);
                if (time) setSelectedTime(time);
              }}
            />
          )}

          {/* Contact */}
          <Text style={styles.label}>ช่องทางติดต่อ</Text>
          <TextInput style={styles.input} value={contactInfo} onChangeText={setContactInfo} />

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
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingTop: 40,
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
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 12 },
  imageBox: {
    width: 190,
    height: 160,
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#fff",
  },
  previewImage: { width: 100, height: 100, borderRadius: 14 },
  chip: {
    borderWidth: 1.2,
    borderColor: "#2563eb",
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: "#2563eb" },
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
  postButton: {
    marginTop: 28,
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  postButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
