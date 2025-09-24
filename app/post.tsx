import React, { useState } from 'react';
import { 
  Text, StyleSheet, View, TextInput, TouchableOpacity, 
  ScrollView, Image, Alert 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const post = () => {
  const [status, setStatus] = useState('lost');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState<string[]>([]); // เก็บรูปหลายรูป

  const handlePickOption = () => {
    Alert.alert(
      "เลือกรูปภาพ",
      "เลือกวิธีการเพิ่มรูปภาพ",
      [
        { text: "กล้อง", onPress: () => pickImage(true) },
        { text: "คลังรูปภาพ", onPress: () => pickImage(false) },
        { text: "ยกเลิก", style: "cancel" }
      ]
    );
  };

  const pickImage = async (fromCamera = false) => {
    let permission;
    if (fromCamera) {
      permission = await ImagePicker.requestCameraPermissionsAsync();
    } else {
      permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }

    if (!permission.granted) {
      alert('ต้องอนุญาตการเข้าถึงรูปภาพ/กล้องก่อน');
      return;
    }

    let result;
    if (fromCamera) {
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
    }

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>ประกาศของหาย/พบของ</Text>
      </View>

      {/* Upload image list */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        <View style={styles.uploadRow}>
          {images.map((img, i) => (
            <View key={i} style={styles.uploadBox}>
              <Image source={{ uri: img }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(i)}>
                <Text style={styles.removeText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.uploadBox} onPress={handlePickOption}>
            <Text style={styles.plus}>+</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Text style={styles.note}>
        กรุณาปิดข้อมูลส่วนตัว เช่น เลขบัตรประชาชน ก่อนอัปโหลด
      </Text>

      {/* Input fields */}
      <TextInput style={styles.input} placeholder="ชื่อสิ่งของ" />
      <TextInput style={[styles.input, { height: 80 }]} placeholder="รายละเอียด" multiline />

      <Text style={styles.label}>หมวดหมู่</Text>
      <View style={styles.row}>
        {['บัตร', 'เสื้อผ้า', 'อุปกรณ์', 'อื่น ๆ'].map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, category === cat && { backgroundColor: '#BFDBFE' }]}
            onPress={() => setCategory(cat)}
          >
            <Text style={styles.chipText}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput style={styles.input} placeholder="สถานที่" />

      <Text style={styles.label}>สถานะ</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.chip, status === 'lost' && { backgroundColor: '#FECACA' }]}
          onPress={() => setStatus('lost')}
        >
          <Text style={{ color: status === 'lost' ? '#DC2626' : '#374151' }}>ของหาย</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, status === 'found' && { backgroundColor: '#FEF08A' }]}
          onPress={() => setStatus('found')}
        >
          <Text style={{ color: status === 'found' ? '#CA8A04' : '#374151' }}>พบของ</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TextInput style={[styles.input, { flex: 1 }]} placeholder="DD/MM/YY" />
        <TextInput style={[styles.input, { flex: 1 }]} placeholder="HH:MM" />
      </View>

      <TextInput style={styles.input} placeholder="ช่องทางติดต่อ" />

      <TouchableOpacity style={styles.postButton}>
        <Text style={styles.postText}>โพสต์</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#FFF' },
  header: { backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 8, marginBottom: 16 },
  headerText: { color: '#FFF', fontWeight: 'bold', fontSize: 18, textAlign: 'center' },
  uploadRow: { flexDirection: 'row', gap: 10 },
  uploadBox: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 10,
  },
  plus: { fontSize: 32, color: '#9CA3AF' },
  imagePreview: { width: '100%', height: '100%', borderRadius: 8 },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  note: { fontSize: 12, color: '#6B7280', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, fontSize: 14, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F3F4F6' },
  chipText: { fontSize: 14, color: '#374151' },
  postButton: { backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 8, marginTop: 10 },
  postText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
});

export default post;
