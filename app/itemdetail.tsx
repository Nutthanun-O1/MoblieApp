import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
// ⚠️ สำคัญ: ต้องแน่ใจว่า path นี้ถูกต้อง
import { supabase } from '../utils/supabase'; 

// ฟังก์ชันช่วยในการจัดรูปแบบวันที่และเวลา
const formatDateTime = (isoString) => {
    if (!isoString) return { date: 'N/A', time: 'N/A' };
    const date = new Date(isoString);
    // แปลงเป็นวันที่ DD/MM/YYYY (สมมติว่าใช้ format ไทย)
    const formattedDate = date.toLocaleDateString('th-TH', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
    // แปลงเป็นเวลา HH:MM น.
    const formattedTime = date.toLocaleTimeString('th-TH', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
    }) + ' น.';

    return { date: formattedDate, time: formattedTime };
};


// ⚠️ เปลี่ยน PostDetailScreen ให้รับ item_id ที่ต้องการดึงข้อมูล
const PostDetailScreen = ({ route }) => {
    // สมมติว่า item_id ถูกส่งมาทาง route params หรือกำหนดค่าเริ่มต้น
    // ในการใช้งานจริงควรดึง item_id มาจากหน้าก่อนหน้า
    const itemId = route?.params?.itemId || 'PSU-LF-2025-00123'; // ใช้ค่าตัวอย่างหากไม่ได้รับ prop

    const [item, setItem] = useState(null); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ----------------------------------------------------------------
    // การดึงข้อมูลจาก Supabase
    // ----------------------------------------------------------------
    useEffect(() => {
        const getItemDetails = async () => {
            setLoading(true);
            try {
                // 1. ระบุตาราง 'items' และใช้ .select()
                // 2. ใช้ .eq() เพื่อดึงข้อมูลเฉพาะรายการที่มี item_id ตรงกัน
                const { data, error } = await supabase
                    .from('items')
                    .select('*')
                    .eq('item_id', itemId)
                    .single(); // ใช้ .single() เพราะเราคาดหวังผลลัพธ์เดียว

                if (error) {
                    console.error('Supabase Error fetching item:', error.message);
                    setError(`Error: ${error.message}`);
                    setItem(null);
                    return;
                }

                if (data) {
                    setItem(data);
                } else {
                    setError('ไม่พบรายการสิ่งของ');
                    setItem(null);
                }
            } catch (e) {
                console.error('Unexpected error:', e.message);
                setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
                setItem(null);
            } finally {
                setLoading(false);
            }
        };

        if (itemId) {
            getItemDetails();
        } else {
            setLoading(false);
            setError('Item ID ไม่ถูกต้อง');
        }
    }, [itemId]);

    // จัดรูปแบบข้อมูลสำหรับแสดงผล
    const { date: postedDate, time: postedTime } = formatDateTime(item?.post_time);
    
    // ฟังก์ชันสำหรับ Render ข้อมูลแต่ละบรรทัด
    const DetailRow = ({ label, value }) => (
        <Text style={styles.detailText}>
            {label}: <Text style={styles.detailValue}>{value}</Text>
        </Text>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.centerScreen]}>
                <ActivityIndicator size="large" color="#007aff" />
                <Text>กำลังโหลดข้อมูล...</Text>
            </View>
        );
    }

    if (error || !item) {
        return (
            <View style={[styles.container, styles.centerScreen]}>
                <Text style={styles.errorText}>
                    {error || 'ไม่พบรายการสิ่งของในระบบ'}
                </Text>
            </View>
        );
    }
    
    // แปลง category จากโค้ดเป็นภาษาไทยเพื่อให้แสดงผลตรงตามภาพ
    const categoryDisplay = item.category === 'card' ? 'บัตร' : 
                            item.category === 'clothes' ? 'เสื้อผ้า' : 
                            item.category === 'equipment' ? 'อุปกรณ์' : 
                            'อื่นๆ';

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header Section */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => console.log('Back pressed')}>
                        <Text style={styles.backArrow}>&lt;</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>รายละเอียดสิ่งของ</Text>
                </View>
                
                <View style={styles.contentContainer}>
                    {/* Top image placeholder (ใช้ item.photos ถ้ามีตาราง item_photos) */}
                    <View style={styles.imagePlaceholder} />
                    
                    {/* Item Details - ดึงข้อมูลจาก State 'item' ที่มาจาก Supabase */}
                    <View style={styles.detailsSection}>
                        <Text style={styles.itemTitle}>{item.title}</Text>

                        {/* กล่องสถานะ - ใช้ item.status เพื่อกำหนดข้อความและสี */}
                        <Text style={[
                            styles.itemTag, 
                            item.status === 'lost' && styles.lostTag,
                            item.status === 'found' && styles.foundTag,
                            item.status === 'returned' && styles.returnedTag,
                        ]}>
                            {item.status === 'lost' ? 'ของหาย' : 
                             item.status === 'found' ? 'ของพบ' : 
                             'ส่งคืนแล้ว'}
                        </Text>
                        
                        {/* ข้อมูลที่เชื่อมกับ Field ในตาราง 'items' */}
                        <DetailRow label="Item ID" value={item.item_id} />
                        <DetailRow label="หมวดหมู่" value={categoryDisplay} />
                        <DetailRow label="สถานที่" value={item.location} />
                        <DetailRow label="วันที่โพสต์" value={postedDate} />
                        <DetailRow label="เวลาโพสต์" value={postedTime} />
                        <DetailRow label="ติดต่อ" value={item.contact_info} />
                    </View>
                    
                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.updateButton}>
                            <Text style={styles.updateButtonText}>อัปเดตสถานะ</Text>
                        </TouchableOpacity>
                        <View style={styles.bottomButtons}>
                            <TouchableOpacity style={styles.bottomButton}>
                                <Text style={styles.bottomButtonText}>แชร์ประกาศ</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.bottomButton}>
                                <Text style={styles.bottomButtonText}>ติดต่อหน่วยงาน</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
                
                {/* Navigation Bar */}
                <View style={styles.navBar}>
                    <TouchableOpacity style={styles.navBarItem}>
                        <Text>🏠</Text>
                        <Text style={styles.navBarText}>หน้าหลัก</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navBarAddButton}>
                        <Text style={styles.navBarAddButtonText}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navBarItem}>
                        <Text>👤</Text>
                        <Text style={styles.navBarText}>โปรไฟล์</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

// ... (Styles จากโค้ดเดิม) ...
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    centerScreen: { justifyContent: 'center', alignItems: 'center' },
    header: {
      flexDirection: 'row', alignItems: 'center', padding: 15,
      backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0',
    },
    backArrow: { fontSize: 24, color: '#007aff', marginRight: 15 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    contentContainer: { flex: 1, padding: 20 },
    imagePlaceholder: {
      height: 200, backgroundColor: '#e0e0e0', borderRadius: 10, marginBottom: 20,
    },
    detailsSection: {
      backgroundColor: '#fff', padding: 20, borderRadius: 10,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    },
    itemTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 5, color: '#333' },
    
    // สไตล์สำหรับป้ายสถานะ (Tag)
    itemTag: {
      fontSize: 14, alignSelf: 'flex-start', paddingVertical: 4,
      paddingHorizontal: 10, borderRadius: 15, overflow: 'hidden',
      marginBottom: 15, fontWeight: 'bold',
    },
    // สไตล์เฉพาะสำหรับ 'ของหาย' (สีแดงตามภาพ)
    lostTag: {
      color: '#f44336', 
      backgroundColor: '#ffebee', 
    },
    // สไตล์สำหรับ 'ของพบ' 
    foundTag: {
      color: '#1976D2', 
      backgroundColor: '#E3F2FD', 
    },
    // สไตล์สำหรับ 'ส่งคืนแล้ว' 
    returnedTag: {
      color: '#388E3C', 
      backgroundColor: '#E8F5E9', 
    },
    
    detailText: { fontSize: 16, color: '#555', lineHeight: 24 },
    detailValue: { fontWeight: 'bold', color: '#333' },
    errorText: { color: 'red', fontSize: 16 },
  
    // Buttons and Navigation Styles
    buttonContainer: { marginTop: 20 },
    updateButton: {
      backgroundColor: '#007aff', paddingVertical: 15, borderRadius: 10,
      alignItems: 'center', marginBottom: 10,
    },
    updateButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    bottomButtons: { flexDirection: 'row', justifyContent: 'space-between' },
    bottomButton: {
      flex: 1, backgroundColor: '#fff', paddingVertical: 15, borderRadius: 10,
      alignItems: 'center', marginHorizontal: 5, borderWidth: 1, borderColor: '#007aff',
    },
    bottomButtonText: { color: '#007aff', fontSize: 16, fontWeight: 'bold' },
    navBar: {
      flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
      backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e0e0e0', paddingVertical: 10,
    },
    navBarItem: { alignItems: 'center' },
    navBarText: { fontSize: 12, color: '#888', marginTop: 5 },
    navBarAddButton: {
      backgroundColor: '#007aff', width: 60, height: 60, borderRadius: 30,
      justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    },
    navBarAddButtonText: { color: '#fff', fontSize: 30 },
  });

export default PostDetailScreen;