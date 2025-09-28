import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function SuccessEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get data from navigation params
  const {
    item_id,
    title,
    location,
    post_time,
    image_url,
    status,
  } = params as any;

  const handleGoHome = () => {
    router.replace('/home');
  };

  const handleViewMyPosts = () => {
    router.push('/Profile');
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

  const getStatusLabel = (stat: string) => {
    return stat === 'lost' ? 'ของหาย' : 'พบของ';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ประกาศ</Text>
      </View>

      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.successIconContainer}>
          <View style={styles.successIconOuter}>
            <View style={styles.successIconInner}>
              <Ionicons name="checkmark" size={48} color="#fff" />
            </View>
          </View>
        </View>

        {/* Success Message */}
        <Text style={styles.successTitle}>อัพเดทสำเร็จ!</Text>
        <Text style={styles.successSubtitle}>
          ประกาศของคุณถูกบันทึกแล้ว และจะแสดงในรายการค้นหา
        </Text>

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
              { backgroundColor: status === 'lost' ? '#EF4444' : '#60A5FA' }
            ]}>
              <Text style={styles.badgeText}>{getStatusLabel(status)}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGoHome}
          >
            <Text style={styles.primaryButtonText}>กลับไปหน้าหลัก</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleViewMyPosts}
          >
            <Text style={styles.secondaryButtonText}>ดูโพสต์ของฉัน</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#2563EB',
    paddingTop: 16,
    paddingBottom: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Success Icon
  successIconContainer: {
    marginBottom: 32,
  },
  successIconOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#DCFCE7', // Light green
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#22C55E', // Vibrant green
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Success Message
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },

  // Preview Card
  previewCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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

  // Buttons
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
});
