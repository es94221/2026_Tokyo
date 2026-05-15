window.tripConfig = {
  site: {
    browserTitle: "家族旅遊行程",
    brandText: "Family Trip",
    heroKicker: "2026 Family Journey",
    heroTitle: "家族旅遊行程總覽",
    heroDescription: "把每天的行程、訂單連結、大家想去的地方與旅途中照片放在同一個安靜漂亮的小網頁裡。",
    primaryButton: "看 Overall Itinerary",
    secondaryButton: "新增想去的點",
    mapNote: "food, rest, views, tiny adventures",
  },

  map: {
    title: "旅遊地圖",
    description: "把主要住宿、景點或集合地點放在這裡。放入 Google Maps API key 後會顯示互動地圖。",
    query: "Tokyo, Japan",
    zoom: 12,
    googleMapsApiKey: "<iframe src="https://www.google.com/maps/d/embed?mid=1fHAk2A0xAFNs1Vj2IZfE380LtdWxj_k&ehbc=2E312F" width="640" height="480"></iframe>", // 在引號中貼上你的 Google Maps Embed API key。
  },

  supabase: {
    enabled: true,
    projectUrl: "https://mttbgxymvjkkouccfztn.supabase.co",
    publishableKey: "sb_publishable_rtTOZndynoEfa902lESLIg_Ii1WVk9C",
    tableName: "trip_state",
    rowId: "family-trip",
  },

  tripSettings: {
    startDate: "2026-07-18",
    dayCount: 4,
  },

  dayColors: ["#d8c79d", "#b9b98d", "#a8b596", "#d6bd80", "#cfc5a5", "#8f9b73"],

  days: [
    {
      title: "",
      date: "7/18 Sat",
      color: "#d8c79d",
      summary: "",
      city: "",
      stay: "",
      timeline: [],
    },
    {
      title: "",
      date: "7/19 Sun",
      color: "#b9b98d",
      summary: "",
      city: "",
      stay: "",
      timeline: [],
    },
    {
      title: "",
      date: "7/20 Mon",
      color: "#a8b596",
      summary: "",
      city: "",
      stay: "",
      timeline: [],
    },
    {
      title: "",
      date: "7/21 Tue",
      color: "#d6bd80",
      summary: "",
      city: "",
      stay: "",
      timeline: [],
    },
  ],

  defaultOrders: [
    {
      type: "飯店",
      name: "Day 1-2 湖邊小屋住宿確認信",
      url: "https://mail.google.com/mail/u/0/#search/lake+house+booking",
    },
    {
      type: "訂車",
      name: "機場接送與 Day 3 包車",
      url: "https://mail.google.com/mail/u/0/#search/car+reservation",
    },
    {
      type: "活動",
      name: "Day 3 自然導覽活動預約",
      url: "https://mail.google.com/mail/u/0/#search/tour+confirmation",
    },
  ],

  defaultWishes: [
    { person: "媽媽", place: "有漂亮花園的咖啡店", day: "Day 2", done: false },
    { person: "爸爸", place: "不要太累的湖邊散步路線", day: "Day 3", done: true },
    { person: "小孩們", place: "可以買冰淇淋的市集", day: "Day 2", done: false },
  ],
};
