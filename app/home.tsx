import { View, Text, StyleSheet } from "react-native";

export default function Home() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.txt}>🎉 ยินดีต้อนรับสู่ Home</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  txt: { fontSize: 20, fontWeight: "700" },
});
