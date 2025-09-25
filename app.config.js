// app.config.js
export default ({ config }) => ({
  ...config,
  name: "PSU Lost & Found",
  slug: "psu-lost-found",
  android: {
    package: "ac.th.psu.lostfound",   // 👈 ต้องไม่ซ้ำกับแอพอื่น
  },
  ios: {
    bundleIdentifier: "ac.th.psu.lostfound", // สำหรับ iOS (เผื่อใช้ทีหลัง)
  },
  extra: {
    ...(config.extra ?? {}),
    eas: {
      projectId: "28e42cc0-81fc-4172-8ba1-8f3c27ab1ae1",
    },
  },
});
