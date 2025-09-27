import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabaseClient';

export default function AnnouncementScreen() {
  const [selectedOption, setSelectedOption] = useState<'self_7days' | 'drop_off'>('self_7days');
  const [loading, setLoading] = useState(false);

  // ฟังก์ชันบันทึกข้อมูล
  const handlePost = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.from('items').insert([
        {
          item_id: crypto.randomUUID(), // สร้าง UUID
          title: 'บัตรนักศึกษา',
          description: 'พบที่โรงอาหาร เวลา 12:20',
          category: 'card',
          status: 'found',
          location: 'โรงอาหาร',
          posted_by: '6530012341', // <-- TODO: แก้เป็น psu_id ของ user ปัจจุบัน
          keep_method: selectedOption,
        },
      ]);

      if (error) {
        console.error('Insert error:', error.message);
        Alert.alert('เกิดข้อผิดพลาด', error.message);
      } else {
        Alert.alert('สำเร็จ', 'โพสต์ของคุณถูกบันทึกเรียบร้อยแล้ว');
      }
    } catch (e) {
      console.error('Unexpected error:', e);
      Alert.alert('เกิดข้อผิดพลาด', String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>ประกาศ</Text>

      {/* ตัวเลือก */}
      <View style={styles.optionContainer}>
        <Text style={styles.subHeader}>ตัวเลือกเมื่อ “พบของ”</Text>
        <Text style={styles.instruction}>กรุณาเลือกวิธีจัดการสิ่งของที่พบ</Text>

        {/* เก็บไว้เอง */}
        <TouchableOpacity
          style={[
            styles.option,
            selectedOption === 'self_7days' && styles.optionSelected,
          ]}
          onPress={() => setSelectedOption('self_7days')}
        >
          <View style={styles.radioCircleOuter}>
            {selectedOption === 'self_7days' && <View style={styles.radioCircleInner} />}
          </View>
          <View style={styles.optionTextBox}>
            <Text style={styles.optionTitle}>เก็บไว้กับตัวเอง (7 วัน)</Text>
            <Text style={styles.optionDetail}>ครบกำหนด: 7 วันนับจากวันโพสต์</Text>
          </View>
        </TouchableOpacity>

        {/* นำไปส่งศูนย์กิจกรรม */}
        <TouchableOpacity
          style={[
            styles.option,
            selectedOption === 'drop_off' && styles.optionSelectedBlue,
          ]}
          onPress={() => setSelectedOption('drop_off')}
        >
          <View style={[styles.radioCircleOuter, { borderColor: '#2E5BFF' }]}>
            {selectedOption === 'drop_off' && (
              <View
                style={[styles.radioCircleInner, { backgroundColor: '#2E5BFF' }]}
              />
            )}
          </View>
          <View style={styles.optionTextBox}>
            <Text style={[styles.optionTitle, { color: '#2E5BFF' }]}>
              นำไปเก็บที่ศูนย์กิจกรรมนักศึกษา
            </Text>
            <Text style={[styles.optionDetail, { color: '#2E5BFF' }]}>
              ชั้น 1 ตึกกิจกรรมนักศึกษา
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ปุ่ม */}
      <TouchableOpacity
        style={[styles.confirmButton, loading && { opacity: 0.6 }]}
        onPress={handlePost}
        disabled={loading}
      >
        <Text style={styles.confirmText}>
          {loading ? 'กำลังโพสต์...' : 'ยืนยันการโพสต์'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton}>
        <Text style={styles.backText}>กลับไปแก้ไขโพสต์</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', padding: 20, flexGrow: 1 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#0055FF', marginBottom: 20 },
  optionContainer: { marginBottom: 25 },
  subHeader: { fontWeight: 'bold', fontSize: 16 },
  instruction: { color: '#666', marginBottom: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1.5,
    borderColor: '#FFD580',
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  optionSelected: { borderColor: '#FFB800', backgroundColor: '#FFF3CC' },
  optionSelectedBlue: { borderColor: '#2E5BFF', backgroundColor: '#EAF0FF' },
  optionTextBox: { flex: 1 },
  optionTitle: { fontWeight: 'bold', color: '#444' },
  optionDetail: { color: '#666', fontSize: 13 },
  radioCircleOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFB800',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  radioCircleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFB800',
  },
  confirmButton: {
    backgroundColor: '#0055FF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  backButton: {
    borderWidth: 1.5,
    borderColor: '#0055FF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  backText: { color: '#0055FF', fontWeight: 'bold', fontSize: 16 },
});
