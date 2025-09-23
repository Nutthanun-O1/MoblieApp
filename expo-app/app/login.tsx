import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image as ExpoImage } from 'expo-image';

export default function LoginScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <ExpoImage source={require('@/assets/images/react-logo.png')} style={styles.logo} />
        <Text style={styles.title}>ของหายได้คืน</Text>
        <Text style={styles.subtitle}>ระบบประกาศของหาย/พบของ สำหรับนักศึกษาและบุคลากร</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>รหัสนักศึกษา</Text>
        <TextInput style={styles.input} placeholder="6987654321" keyboardType="number-pad" />

        <Text style={[styles.label, { marginTop: 12 }]}>รหัสผ่าน</Text>
        <TextInput style={styles.input} placeholder="••••••••" secureTextEntry />

        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>เข้าสู่ระบบ</Text>
        </TouchableOpacity>

        <Text style={styles.note}>* ใช้บัญชียมหาวิทยาลัย (SSO) เท่านั้น</Text>
      </View>

      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>สำหรับบุคคลภายนอก (คนนอก PSU)</Text>
        <Text style={styles.contactText}>บุคคลภายนอกไม่มีสิทธิ์ใช้ระบบ กรุณาติดต่อหน่วยงานที่รับผิดชอบ</Text>

        <View style={styles.contactRow}>
          <View style={styles.contactItem}>
            <Text style={styles.contactLabel}>โทรติดต่อ</Text>
            <Text style={styles.contactValue}>074-XXX-XXX</Text>
          </View>
          <View style={styles.contactItem}>
            <Text style={styles.contactLabel}>อีเมลหน่วยงาน</Text>
            <Text style={styles.contactValue}>student.affairs@psu.ac.th</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 160,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0B4FF3',
  },
  subtitle: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 6,
  },
  form: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  label: {
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  note: {
    marginTop: 10,
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
  },
  contactCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFF2FF',
  },
  contactTitle: {
    fontWeight: '700',
    marginBottom: 6,
  },
  contactText: {
    color: '#6B7280',
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  contactItem: {
    flex: 1,
    padding: 8,
    backgroundColor: '#F8FAFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  contactLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  contactValue: {
    fontWeight: '600',
    marginTop: 6,
  },
});
