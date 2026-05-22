window.tripConfig = {
  map: {
    query: "Tokyo, Japan",
    zoom: 12,
    googleMapsApiKey: "",
  },

  supabase: {
    enabled: false,
    projectUrl: "",
    publishableKey: "",
    tableName: "trip_state",
    rowId: "family-trip",
  },

  tripSettings: {
    startDate: "2026-06-22",
    dayCount: 6,
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
      type: "hotel",
      name: "Day 1-2 湖邊小屋住宿確認信",
      url: "https://mail.google.com/mail/u/0/#search/lake+house+booking",
    },
    {
      type: "car",
      name: "機場接送與 Day 3 包車",
      url: "https://mail.google.com/mail/u/0/#search/car+reservation",
    },
    {
      type: "activity",
      name: "Day 3 自然導覽活動預約",
      url: "https://mail.google.com/mail/u/0/#search/tour+confirmation",
    },
  ],

  defaultWishes: [
    { person: "媽媽", place: "有漂亮花園的咖啡店", day: "Day 2", done: false },
  ],
};
