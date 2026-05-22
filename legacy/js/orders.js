import { state } from "./state.js";

export function getOrdersForDay(dayNumber) {
  const dayPattern = new RegExp(`\\bday\\s*${dayNumber}\\b`, "i");
  return state.orders.filter(
    (order) => dayPattern.test(order.name) || dayPattern.test(order.type),
  );
}
