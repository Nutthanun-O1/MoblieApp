import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

// Single-file Expo app (App.js)
// - ใช้งานได้ในโปรเจกต์ที่สร้างด้วย `npx create-expo-app` หรือ `expo init`
// - ไม่มี dependencies ภายนอก (ใช้เฉพาะ React Native ของ Expo)

export default function App() {
  // ตัวอย่างข้อมูลเริ่มต้น
  const [items, setItems] = useState([
    {
      id: 1,
      title: 'บัตรนักศึกษา',
      description: 'หายที่ โรงอาหารคณะวิทยาศาสตร์',
      location: 'โรงอาหารคณะวิทยาศาสตร์',
      time: '12:38',
      status: 'lost', // 'lost' | 'found' | 'returned'
    },
    {
      id: 2,
      title: 'เสื้อแจ็กเก็ต',
      description: 'พบที่ หอสมุดอุดมหญิงหลง ชั้น 5',
      location: 'หอสมุดอุดมหญิงหลง ชั้น 5',
      time: '11:19',
      status: 'found',
    },
  ]);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all | lost | found | returned

  // Modal for adding new item
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newType, setNewType] = useState('lost');

  // Counts
  const counts = useMemo(() => {
    const lost = items.filter((i) => i.status === 'lost').length;
    const found = items.filter((i) => i.status === 'found').length;
    const returned = items.filter((i) => i.status === 'returned').length;
    return { lost, found, returned };
  }, [items]);

  // Filtered list based on query & filter
  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (filter === 'lost' && it.status !== 'lost') return false;
      if (filter === 'found' && it.status !== 'found') return false;
      if (filter === 'returned' && it.status !== 'returned') return false;

      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        it.title.toLowerCase().includes(q) ||
        it.description.toLowerCase().includes(q) ||
        (it.location || '').toLowerCase().includes(q)
      );
    });
  }, [items, query, filter]);

  function handleAddItem() {
    if (!newTitle.trim()) {
      Alert.alert('กรอกข้อมูลไม่ครบ', 'กรุณากรอกชื่อรายการ');
      return;
    }
    const id = Date.now();
    const t = new Date();
    const timeStr = `${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')}`;
    const newItem = {
      id,
      title: newTitle,
      description: newDesc || '-',
      location: newLocation || '-',
      time: timeStr,
      status: newType,
    };
    setItems((s) => [newItem, ...s]);
    // reset form
    setNewTitle('');
    setNewDesc('');
    setNewLocation('');
    setNewType('lost');
    setModalVisible(false);
  }

  function handleMarkReturned(id) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: 'returned' } : it))
    );
    Alert.alert('สำเร็จ', 'ทำเครื่องหมายว่า "ส่งคืนแล้ว"');
  }

  function handleContact(item) {
    // ตัวอย่าง: แสดง Alert (ในแอปจริง อาจเปิดหน้าแชท / โทร / ส่งข้อความ)
    Alert.alert('ติดต่อผู้พบ/ผู้แจ้ง', `ติดต่อเกี่ยวกับ: ${item.title}`);
  }

  function handleView(item) {
    Alert.alert(item.title, `${item.description}\nสถานที่: ${item.location}\nเวลา: ${item.time}\nสถานะ: ${item.status}`);
  }

  function renderBadge(status) {
    if (status === 'lost') return <Text style={[styles.badge, styles.badgeLost]}>ของหาย</Text>;
    if (status === 'found') return <Text style={[styles.badge, styles.badgeFound]}>พบของ</Text>;
    return <Text style={[styles.badge, styles.badgeReturned]}>ส่งคืนแล้ว</Text>;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>หน้าหลัก</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.statLost]}>
          <Text style={styles.statNumber}>{counts.lost}</Text>
          <Text style={styles.statLabel}>ประกาศของหาย</Text>
        </View>
        <View style={[styles.statCard, styles.statFound]}>
          <Text style={styles.statNumber}>{counts.found}</Text>
          <Text style={styles.statLabel}>ประกาศพบของ</Text>
        </View>
        <View style={[styles.statCard, styles.statReturned]}>
          <Text style={styles.statNumber}>{counts.returned}</Text>
          <Text style={styles.statLabel}>ส่งคืนแล้ว</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <TextInput
          placeholder="ค้นหาชื่อของ/สถานที่..."
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={filter === 'all' ? styles.filterTextActive : styles.filterText}>ทั้งหมด</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, styles.filterDanger, filter === 'lost' && styles.filterBtnActive]}
          onPress={() => setFilter('lost')}
        >
          <Text style={filter === 'lost' ? styles.filterTextActive : styles.filterText}>ของหาย</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, styles.filterWarn, filter === 'found' && styles.filterBtnActive]}
          onPress={() => setFilter('found')}
        >
          <Text style={filter === 'found' ? styles.filterTextActive : styles.filterText}>พบของ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, styles.filterSuccess, filter === 'returned' && styles.filterBtnActive]}
          onPress={() => setFilter('returned')}
        >
          <Text style={filter === 'returned' ? styles.filterTextActive : styles.filterText}>ส่งคืนเจ้าของแล้ว</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 120 }}>
        {filtered.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.imagePlaceholder} />
              <View style={styles.cardContent}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  {renderBadge(item.status)}
                </View>
                <Text style={styles.cardDesc}>{item.description}</Text>
                <Text style={styles.cardMeta}>เวลาหาย/พบ: {item.time}</Text>

                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleView(item)}>
                    <Text style={styles.actionText}>รายละเอียด</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleContact(item)}>
                    <Text style={styles.actionText}>ติดต่อ</Text>
                  </TouchableOpacity>
                  {item.status !== 'returned' && (
                    <TouchableOpacity style={[styles.actionBtn, styles.returnBtn]} onPress={() => handleMarkReturned(item.id)}>
                      <Text style={styles.actionText}>คืนแล้ว</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        ))}

        {filtered.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>ไม่พบรายการตามเงื่อนไข</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Add Button (center) */}
      <View style={styles.fabWrapper} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.fabPlus}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => Alert.alert('หน้าหลัก')}> 
          <Text style={[styles.navIcon, styles.navActive]}>🏠</Text>
          <Text style={[styles.navLabel, styles.navActive]}>หน้าหลัก</Text>
        </TouchableOpacity>
        <View style={styles.navSpacer} />
        <TouchableOpacity style={styles.navItem} onPress={() => setModalVisible(true)}>
          <Text style={styles.navIcon}>➕</Text>
          <Text style={styles.navLabel}>ประกาศ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => Alert.alert('โปรไฟล์')}> 
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>โปรไฟล์</Text>
        </TouchableOpacity>
      </View>

      {/* Add Item Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>เพิ่มประกาศใหม่</Text>

            <TextInput
              placeholder="ชื่อรายการ เช่น บัตรนักศึกษา"
              value={newTitle}
              onChangeText={setNewTitle}
              style={styles.input}
            />
            <TextInput
              placeholder="คำอธิบาย/สถานที่"
              value={newDesc}
              onChangeText={setNewDesc}
              style={styles.input}
            />
            <TextInput
              placeholder="สถานที่ (เช่น โรงอาหาร)"
              value={newLocation}
              onChangeText={setNewLocation}
              style={styles.input}
            />

            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeBtn, newType === 'lost' && styles.typeBtnActive]}
                onPress={() => setNewType('lost')}
              >
                <Text style={newType === 'lost' ? styles.typeTextActive : styles.typeText}>ของหาย</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, newType === 'found' && styles.typeBtnActive]}
                onPress={() => setNewType('found')}
              >
                <Text style={newType === 'found' ? styles.typeTextActive : styles.typeText}>พบของ</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalAdd} onPress={handleAddItem}>
                <Text style={styles.modalAddText}>เพิ่มประกาศ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  header: { backgroundColor: '#1E40AF', paddingVertical: 14, paddingHorizontal: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  statsRow: { flexDirection: 'row', padding: 12, justifyContent: 'space-between' },
  statCard: { flex: 1, borderRadius: 12, padding: 12, marginHorizontal: 6, alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 12, color: '#374151', marginTop: 6 },
  statLost: { backgroundColor: '#FEF2F2' },
  statFound: { backgroundColor: '#FFFBEB' },
  statReturned: { backgroundColor: '#ECFDF5' },
  searchWrapper: { paddingHorizontal: 12, marginBottom: 6 },
  searchInput: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  filtersRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'space-between' },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: '#EEF2FF', marginHorizontal: 4 },
  filterBtnActive: { backgroundColor: '#1D4ED8' },
  filterText: { color: '#374151' },
  filterTextActive: { color: '#fff' },
  filterDanger: { backgroundColor: '#FEE2E2' },
  filterWarn: { backgroundColor: '#FFFBEB' },
  filterSuccess: { backgroundColor: '#ECFDF5' },
  list: { flex: 1, paddingHorizontal: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardRow: { flexDirection: 'row' },
  imagePlaceholder: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#E5E7EB', marginRight: 12 },
  cardContent: { flex: 1 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardDesc: { color: '#6B7280', marginTop: 4 },
  cardMeta: { color: '#9CA3AF', marginTop: 6, fontSize: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', fontWeight: '700', fontSize: 12 },
  badgeLost: { backgroundColor: '#FEE2E2', color: '#B91C1C' },
  badgeFound: { backgroundColor: '#FEF3C7', color: '#92400E' },
  badgeReturned: { backgroundColor: '#D1FAE5', color: '#065F46' },
  cardActions: { flexDirection: 'row', marginTop: 10 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: '#EEF2FF', marginRight: 8 },
  actionText: { color: '#1E3A8A', fontWeight: '700' },
  returnBtn: { backgroundColor: '#DCFCE7' },
  emptyBox: { padding: 20, alignItems: 'center' },
  emptyText: { color: '#9CA3AF' },
  fabWrapper: { position: 'absolute', left: 0, right: 0, bottom: 52, alignItems: 'center' },
  fab: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#6B7280', justifyContent: 'center', alignItems: 'center', elevation: 6 },
  fabPlus: { fontSize: 28, color: '#fff', fontWeight: '800' },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 56, flexDirection: 'row', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderTopWidth: 1, borderColor: '#E5E7EB' },
  navItem: { alignItems: 'center' },
  navIcon: { fontSize: 18 },
  navLabel: { fontSize: 12, color: '#6B7280' },
  navActive: { color: '#1E40AF' },
  navSpacer: { width: 32 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  modalBox: { backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  modalTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  input: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#E6EEF8' },
  typeRow: { flexDirection: 'row', marginBottom: 12 },
  typeBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center', backgroundColor: '#F3F4F6', marginHorizontal: 4 },
  typeBtnActive: { backgroundColor: '#1D4ED8' },
  typeText: { color: '#374151', fontWeight: '700' },
  typeTextActive: { color: '#fff', fontWeight: '700' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  modalCancel: { padding: 12, borderRadius: 8, backgroundColor: '#F3F4F6', flex: 1, marginRight: 8, alignItems: 'center' },
  modalAdd: { padding: 12, borderRadius: 8, backgroundColor: '#1E40AF', flex: 1, marginLeft: 8, alignItems: 'center' },
  modalCancelText: { color: '#374151', fontWeight: '700' },
  modalAddText: { color: '#fff', fontWeight: '800' },
});
