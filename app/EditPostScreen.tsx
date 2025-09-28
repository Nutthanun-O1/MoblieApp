// app/EditPostScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import uuid from "react-native-uuid";

import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/useAuth";

type RouteParams = {
  item_id: string;
};

type ItemRow = {
  item_id: string;
  title: string;
  description: string | null;
  category: "card" | "clothes" | "equipment" | "other";
  status: "lost" | "found" | "returned";
  location: string;
  post_time: string; // timestamp
  contact_info: string | null;
};

type PhotoRow = {
  photo_id: string;
  item_id: string;
  photo_url: string;
  order: number;
  caption: string | null;
};

const categories = [
  { key: "card", label: "บัตร" },
  { key: "clothes", label: "เสื้อผ้า" },
  { key: "equipment", label: "อุปกรณ์" },
  { key: "other", label: "อื่น ๆ" },
] as const;

export default function EditPostScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { item_id } = (route.params || {}) as RouteParams;

  // loading
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] =
    useState<ItemRow["category"]>("other");
  const [status, setStatus] =
    useState<ItemRow["status"]>("lost");
  const [location, setLocation] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  // datetime (แก้ไขได้)
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // photo
  const [existingPhotoId, setExistingPhotoId] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [newImageUri, setNewImageUri] = useState<string | null>(null); // ถ้าเลือกใหม่

  // ───────────────────────────────────────────────────────
  // Helpers
  const dateLabel = useMemo(
    () => (date ? date.toISOString().split("T")[0] : "เลือกวัน"),
    [date]
  );
  const timeLabel = useMemo(
    () =>
      time
        ? time.toTimeString().slice(0, 5)
        : "เลือกเวลา",
    [time]
  );

  function buildPostTime(d: Date, t: Date) {
    return new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      t.getHours(),
      t.getMinutes(),
      0
    );
  }

  async function pickImage() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!res.canceled && res.assets?.length && res.assets[0]) {
      setNewImageUri(res.assets[0].uri);
    }
  }

  async function uploadImageToStorage(imageUri: string, itemId: string) {
    const ext = (imageUri.split(".").pop() || "jpg").toLowerCase();
    const fileName = `${itemId}_${Date.now()}.${ext}`;
    const storagePath = `items/${fileName}`;

    const res = await fetch(imageUri);
    // @ts-ignore – RN Response supports arrayBuffer in Expo
    const arrayBuffer: ArrayBuffer = await res.arrayBuffer();

    const { error: uploadErr } = await supabase.storage
      .from("item-photos")
      .upload(storagePath, arrayBuffer, {
        contentType: `image/${ext}`,
        upsert: true,
      });
    if (uploadErr) throw uploadErr;

    const { data } = supabase.storage.from("item-photos").getPublicUrl(storagePath);
    return data.publicUrl as string;
  }

  // ───────────────────────────────────────────────────────
  // Fetch current data
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // item
        const { data: item, error: itemErr } = await supabase
          .from("items")
          .select("*")
          .eq("item_id", item_id)
          .single<ItemRow>();
        if (itemErr) throw itemErr;

        setTitle(item.title ?? "");
        setDescription(item.description ?? "");
        setCategory(item.category ?? "other");
        setStatus(item.status ?? "lost");
        setLocation(item.location ?? "");
        setContactInfo(item.contact_info ?? "");

        const dt = new Date(item.post_time);
        setDate(dt);
        setTime(dt);

        // main photo (เอา order น้อยสุดเป็นรูปหลัก)
        const { data: photos, error: photoErr } = await supabase
          .from("item_photos")
          .select("*")
          .eq("item_id", item_id)
          .order("order", { ascending: true }); // ✅ ใช้ชื่อคอลัมน์จริง
        if (photoErr) throw photoErr;

        if (photos && photos.length > 0) {
          setExistingPhotoId(photos[0].photo_id);
          setExistingPhotoUrl(photos[0].photo_url);
        } else {
          setExistingPhotoId(null);
          setExistingPhotoUrl(null);
        }
      } catch (e: any) {
        console.error(e);
        Alert.alert("Error", e?.message ?? "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, [item_id]);

  // ───────────────────────────────────────────────────────
  // Save
  async function handleSave() {
    try {
      if (!title || !location) {
        Alert.alert("กรอกข้อมูลไม่ครบ", "กรุณากรอก ‘ชื่อสิ่งของ’ และ ‘สถานที่’");
        return;
      }
      if (!user) {
        Alert.alert("กรุณาเข้าสู่ระบบ", "พบว่าคุณยังไม่ได้เข้าสู่ระบบ");
        return;
      }

      setSaving(true);

      // รวมวันเวลา ถ้าผู้ใช้แก้
      let post_time: Date | null = null;
      if (date && time) post_time = buildPostTime(date, time);

      // 1) update items
      const payload: Partial<ItemRow> = {
        title,
        description,
        category,
        status,
        location,
        contact_info: contactInfo,
      };
      if (post_time) {
        // @ts-ignore
        payload.post_time = post_time.toISOString();
      }

      const { error: upErr } = await supabase
        .from("items")
        .update(payload)
        .eq("item_id", item_id);

      if (upErr) throw upErr;

      // 2) ถ้าเลือกรูปใหม่ → อัปโหลดแล้ว upsert/insert เป็นรูปหลัก (order = 1)
      if (newImageUri) {
        const url = await uploadImageToStorage(newImageUri, item_id);

        if (existingPhotoId) {
          // upsert โดยยึด photo_id เดิม (จะทับค่า url เดิม)
          const { error: upPhotoErr } = await supabase
            .from("item_photos")
            .upsert(
              [
                {
                  photo_id: existingPhotoId,
                  item_id,
                  photo_url: url,
                  order: 1,
                  caption: status === "found" ? "ฝากศูนย์" : "ภาพตัวอย่าง",
                  uploaded_by: user.psu_id,
                  uploaded_at: new Date().toISOString(),
                } as PhotoRow,
              ],
              { onConflict: "photo_id" }
            );
          if (upPhotoErr) throw upPhotoErr;
        } else {
          // ไม่มีรูปเก่า → insert ใหม่เป็นรูปหลัก
          const { error: insPhotoErr } = await supabase.from("item_photos").insert([
            {
              photo_id: uuid.v4() as string,
              item_id,
              photo_url: url,
              order: 1,
              caption: status === "found" ? "ฝากศูนย์" : "ภาพตัวอย่าง",
              uploaded_by: user.psu_id,
              uploaded_at: new Date().toISOString(),
            } as PhotoRow,
          ]);
          if (insPhotoErr) throw insPhotoErr;
        }
      }

      // Navigate to success screen
      navigation.navigate("SuccessEditScreen", {
        item_id,
        title,
        location,
        post_time: post_time?.toISOString() || new Date().toISOString(),
        image_url: newImageUri || existingPhotoUrl,
        status,
      });
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.message ?? "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  // ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text>กำลังโหลด...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>แก้ไขประกาศ</Text>
      </SafeAreaView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        {/* Image */}
        <Text style={styles.label}>รูปหลัก</Text>
        <View style={styles.row}>
          {newImageUri ? (
            <Image source={{ uri: newImageUri }} style={styles.previewImage} />
          ) : existingPhotoUrl ? (
            <Image source={{ uri: existingPhotoUrl }} style={styles.previewImage} />
          ) : (
            <View style={[styles.previewImage, { backgroundColor: "#E5E7EB" }]} />
          )}

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
          style={[styles.input, { height: 90, textAlignVertical: "top" }]}
          multiline
          value={description}
          onChangeText={setDescription}
        />

        {/* Category */}
        <Text style={styles.label}>หมวดหมู่</Text>
        <View style={styles.row}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[styles.chip, category === c.key && styles.chipActive]}
              onPress={() => setCategory(c.key as any)}
            >
              <Text style={{ color: category === c.key ? "#fff" : "#2563eb" }}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Status */}
        <Text style={styles.label}>สถานะ</Text>
        <View style={styles.row}>
          {(["lost", "found", "returned"] as const).map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.statusChip,
                status === s && (s === "lost" ? styles.lost : s === "found" ? styles.found : styles.returned),
              ]}
              onPress={() => setStatus(s)}
            >
              <Text style={{ color: status === s ? "#fff" : "#333" }}>
                {s === "lost" ? "ของหาย" : s === "found" ? "พบของ" : "ส่งคืนแล้ว"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Location */}
        <Text style={styles.label}>สถานที่</Text>
        <TextInput style={styles.input} value={location} onChangeText={setLocation} />

        {/* Contact */}
        <Text style={styles.label}>ช่องทางติดต่อ</Text>
        <TextInput style={styles.input} value={contactInfo} onChangeText={setContactInfo} />

        {/* Date & Time */}
        <Text style={styles.label}>วัน–เวลา</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity style={styles.inputRow} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={18} color="#6B7280" />
            <Text style={{ marginLeft: 8 }}>{dateLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.inputRow} onPress={() => setShowTimePicker(true)}>
            <Ionicons name="time-outline" size={18} color="#6B7280" />
            <Text style={{ marginLeft: 8 }}>{timeLabel}</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date ?? new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_, d) => {
              setShowDatePicker(false);
              if (d) setDate(d);
            }}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={time ?? new Date()}
            mode="time"
            is24Hour
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_, t) => {
              setShowTimePicker(false);
              if (t) setTime(t);
            }}
          />
        )}

        {/* Save */}
        <TouchableOpacity
          style={[styles.postButton, { opacity: saving ? 0.6 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.postButtonText}>{saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}</Text>
        </TouchableOpacity>
      </ScrollView>
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
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "900", marginLeft: 14 },
  label: { marginTop: 14, marginBottom: 6, fontWeight: "600", color: "#374151", fontSize: 15 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: "#fff",
    marginBottom: 14,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
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
    backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: "#2563eb" },
  statusChip: {
    borderWidth: 1.2,
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderColor: "#d1d5db",
  },
  lost: { backgroundColor: "#ef4444", borderColor: "#ef4444" },
  found: { backgroundColor: "#f59e0b", borderColor: "#f59e0b" },
  returned: { backgroundColor: "#10b981", borderColor: "#10b981" },
  inputRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
  },
  postButton: {
    marginTop: 18,
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  postButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});