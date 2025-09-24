import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabaseClient";

export default function PostScreen() {
  const navigation = useNavigation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<
    "card" | "clothes" | "equipment" | "other"
  >("other");
  const [status, setStatus] = useState<"lost" | "found">("lost");
  const [location, setLocation] = useState("");
  const [contact, setContact] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [image, setImage] = useState<string | null>(null);

  // เลือกรูป
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

  // บันทึกลง DB
  const handleSubmit = async () => {
    if (!title || !location || !contact) {
      Alert.alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    try {
      const item_id = crypto.randomUUID();
      const post_time = new Date(`${date}T${time || "00:00"}`);

      const { error: itemError } = await supabase.from("items").insert([
        {
          item_id,
          title,
          description,
          category,
          status,
          location,
          posted_by: "demo_user",
          post_time,
          contact_info: contact,
        },
      ]);

      if (itemError) throw itemError;

      if (image) {
        const fileExt = image.split(".").pop();
        const filePath = `${item_id}.${fileExt}`;

        const imgRes = await fetch(image);
        const blob = await imgRes.blob();

        const { error: uploadError } = await supabase.storage
          .from("item-photos")
          .upload(filePath, blob);

        if (uploadError) throw uploadError;

        const { publicUrl } = supabase.storage
          .from("item-photos")
          .getPublicUrl(filePath).data;

        await supabase.from("item_photos").insert([
          {
            item_id,
            photo_url: publicUrl,
          },
        ]);
      }

      Alert.alert("สำเร็จ", "โพสต์ประกาศเรียบร้อยแล้ว");
      navigation.goBack();
    } catch (err: any) {
      console.error(err);
      Alert.alert("เกิดข้อผิดพลาด", err.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ประกาศของหาย/พบของ</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* รูป */}
        <Text style={styles.label}>อัปโหลดรูปภาพ</Text>
        <View style={styles.imageRow}>
          {image && (
            <Image source={{ uri: image }} style={styles.imagePreview} />
          )}
          <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
            <Text style={{ fontSize: 28, color: "#888" }}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hintText}>
          กรุณาไม่อัปข้อมูลส่วนตัว เช่น เลขบัตรประชาชน ก่อนอัปโหลด
        </Text>

        {/* ฟอร์ม */}
        <Text style={styles.label}>ชื่อสิ่งของ</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>รายละเอียด</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>หมวดหมู่</Text>
        <View style={styles.row}>
          {["card", "clothes", "equipment", "other"].map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, category === c && styles.chipActive]}
              onPress={() => setCategory(c as any)}
            >
              <Text
                style={{ color: category === c ? "#fff" : "#333", fontSize: 13 }}
              >
                {c === "card"
                  ? "บัตร"
                  : c === "clothes"
                  ? "เสื้อผ้า"
                  : c === "equipment"
                  ? "อุปกรณ์"
                  : "อื่น ๆ"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>สถานที่</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
        />

        <Text style={styles.label}>สถานะ</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.chip, status === "lost" && styles.chipLost]}
            onPress={() => setStatus("lost")}
          >
            <Text style={{ color: status === "lost" ? "#fff" : "#333" }}>
              ของหาย
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, status === "found" && styles.chipFound]}
            onPress={() => setStatus("found")}
          >
            <Text style={{ color: status === "found" ? "#fff" : "#333" }}>
              พบของ
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>วันที่ (เช่น 2025-09-24)</Text>
        <TextInput style={styles.input} value={date} onChangeText={setDate} />

        <Text style={styles.label}>เวลา (HH:MM)</Text>
        <TextInput style={styles.input} value={time} onChangeText={setTime} />

        <Text style={styles.label}>ช่องทางติดต่อ</Text>
        <TextInput
          style={styles.input}
          value={contact}
          onChangeText={setContact}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>โพสต์</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Header
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1D4ED8",
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backArrow: {
    fontSize: 22,
    color: "#fff",
    marginRight: 12,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "700",
  },

  // Container
  container: {
    padding: 18,
    backgroundColor: "#F9FAFB",
  },

  // Image Upload
  imageRow: {
    flexDirection: "row",
    marginBottom: 10,
    gap: 12,
  },
  imageBox: {
    width: 90,
    height: 90,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  imagePreview: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  hintText: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 14,
  },

  // Label
  label: {
    marginBottom: 6,
    fontWeight: "600",
    color: "#374151",
    fontSize: 14,
  },

  // Input
  input: {
    borderWidth: 1.2,
    borderColor: "#D1D5DB",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 15,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },

  // Chip group
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
    gap: 10,
  },
  chip: {
    borderWidth: 1.2,
    borderColor: "#D1D5DB",
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chipActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  chipLost: {
    backgroundColor: "#EF4444",
    borderColor: "#EF4444",
  },
  chipFound: {
    backgroundColor: "#FACC15",
    borderColor: "#FACC15",
  },

  // Button
  button: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
