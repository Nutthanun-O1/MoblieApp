import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/useAuth";

export default function PostConfirmationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  
  // Get data from navigation params
  const {
    item_id,
    title,
    description,
    category,
    status,
    location,
    contact_info,
    post_time,
    image_url,
  } = params as any;

  const [selectedOption, setSelectedOption] = useState<'self_7days' | 'drop_off'>('self_7days');
  const [loading, setLoading] = useState(false);

  // ฟังก์ชันบันทึกข้อมูล keep_method
  const handleConfirm = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('items')
        .update({ 
          keep_method: selectedOption,
          due_time: selectedOption === 'self_7days' 
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
            : null
        })
        .eq('item_id', item_id);

      if (error) {
        console.error('Update error:', error.message);
        Alert.alert('เกิดข้อผิดพลาด', error.message);
        return;
      }

      // Navigate to success screen
      router.push({
        pathname: '/PostSuccessScreen',
        params: {
          item_id,
          title,
          location,
          post_time,
          image_url,
          status,
        },
      });
    } catch (e) {
      console.error('Unexpected error:', e);
      Alert.alert('เกิดข้อผิดพลาด', String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const getCategoryLabel = (cat: string) => {
    const categories: { [key: string]: string } = {
      card: 'บัตร',
      clothes: 'เสื้อผ้า',
      equipment: 'อุปกรณ์',
      other: 'อื่น ๆ'
    };
    return categories[cat] || cat;
  };

  const getStatusLabel = (stat: string) => {
    return stat === 'lost' ? 'ของหาย' : 'พบของ';
  };

  const formatDateTime = (dateTime: string) => {
    if (!dateTime) return '-';
    const d = new Date(dateTime);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(
      2,
      "0"
    )}:${String(d.getMinutes()).padStart(2, "0")} น.`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ประกาศ</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Item Preview Card */}
        <View style={styles.previewCard}>
          <View style={styles.itemRow}>
            {/* Image placeholder */}
            <View style={styles.imagePlaceholder}>
              {image_url ? (
                <Image source={{ uri: image_url }} style={styles.itemImage} />
              ) : (
                <Ionicons name="image-outline" size={32} color="#9CA3AF" />
              )}
            </View>
            
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle}>{title}</Text>
              <Text style={styles.itemLocation}>สถานที่: {location}</Text>
              <Text style={styles.itemTime}>เวลาหาย: {formatDateTime(post_time)}</Text>
            </View>
          </View>
          
          {/* Status Badge - positioned at bottom right */}
          <View style={styles.badgeContainer}>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: status === 'lost' ? '#F87171' : '#FF69B4' }
            ]}>
              <Text style={styles.badgeText}>{getStatusLabel(status)}</Text>
            </View>
          </View>
        </View>

        {/* Keep Method Options - Only show for found items */}
        {status === 'found' && (
          <View style={styles.optionsSection}>
            <Text style={styles.sectionTitle}>ตัวเลือกเมื่อ "พบของ"</Text>
            <Text style={styles.sectionSubtitle}>กรุณาเลือกวิธีจัดการสิ่งของที่พบ</Text>

            {/* Option 1: Keep for 7 days */}
            <TouchableOpacity
              style={[
                styles.option,
                selectedOption === 'self_7days' && styles.optionSelectedOrange,
              ]}
              onPress={() => setSelectedOption('self_7days')}
            >
              <View style={[styles.radioCircleOuter, { borderColor: '#F59E0B' }]}>
                {selectedOption === 'self_7days' && (
                  <View style={[styles.radioCircleInner, { backgroundColor: '#F59E0B' }]} />
                )}
              </View>
              <View style={styles.optionTextBox}>
                <Text style={[styles.optionTitle, { color: '#F59E0B' }]}>
                  เก็บไว้กับตัวเอง (7 วัน)
                </Text>
                <Text style={[styles.optionDetail, { color: '#F59E0B' }]}>
                  ครบกำหนด: 7 วันนับจากวัน/เวลาที่โพสต์
                </Text>
              </View>
            </TouchableOpacity>

            {/* Option 2: Drop off at center */}
            <TouchableOpacity
              style={[
                styles.option,
                selectedOption === 'drop_off' && styles.optionSelectedBlue,
              ]}
              onPress={() => setSelectedOption('drop_off')}
            >
              <View style={[styles.radioCircleOuter, { borderColor: '#2563EB' }]}>
                {selectedOption === 'drop_off' && (
                  <View style={[styles.radioCircleInner, { backgroundColor: '#2563EB' }]} />
                )}
              </View>
              <View style={styles.optionTextBox}>
                <Text style={[styles.optionTitle, { color: '#2563EB' }]}>
                  นำไปเก็บที่ตึกกิจกรรมทันที
                </Text>
                <Text style={[styles.optionDetail, { color: '#2563EB' }]}>
                  จุดเห็นของหาย ชั้น 1 ตึกกิจกรรมนักศึกษา
                </Text>
              </View>
            </TouchableOpacity>

            {/* Note */}
            <Text style={styles.noteText}>
              * หากเลือกเก็บไว้เอง ระบบจะแจ้งเตือนให้นำไปจุดเก็บเมื่อครบ 7 วัน
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.confirmButton, loading && { opacity: 0.6 }]}
            onPress={handleConfirm}
            disabled={loading}
          >
            <Text style={styles.confirmText}>
              {loading ? 'กำลังโพสต์...' : 'ยืนยันการโพสต์'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButtonSecondary} onPress={handleGoBack}>
            <Text style={styles.backText}>กลับไปแก้ไขโพสต์</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingTop: 16,
    paddingBottom: 18,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginLeft: 14,
    letterSpacing: 0.3,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  
  // Preview Card
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  itemLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  itemTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  badgeContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Options Section
  optionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optionSelectedOrange: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  optionSelectedBlue: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  radioCircleOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  radioCircleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  optionTextBox: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDetail: {
    fontSize: 14,
    lineHeight: 20,
  },
  noteText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 16,
  },

  // Buttons
  buttonContainer: {
    gap: 12,
  },
  confirmButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  backButtonSecondary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  backText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
});
