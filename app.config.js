export default {
  expo: {
    name: "my-project",
    slug: "my-project",
    scheme: "myproject",   // 👈 ใส่ชื่อ scheme ที่ unique
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_KEY,
    },
  },
};
