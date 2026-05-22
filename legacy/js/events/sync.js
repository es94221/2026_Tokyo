import { connectSupabase } from "../persistence.js";
import { renderAll } from "../render/index.js";
import { state } from "../state.js";
import { dom } from "../dom.js";

export function bindSyncEvents() {
  dom.syncStatus.addEventListener("click", async () => {
    state.cloud.ready = false;
    state.cloud.failureMessage = "";
    await connectSupabase();
    renderAll();
  });
}
