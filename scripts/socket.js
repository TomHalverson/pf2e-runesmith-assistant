import { createRuneTraceEffect } from "./misc.js";
import { MODULE_ID } from "./module.js";

let socketlibSocket = undefined;
// Taken by Reference from Pf2e Action Support
async function createEffect(data) {
  await createRuneTraceEffect(data);
}
export const setupSocket = () => {
  if (globalThis.socketlib) {
    socketlibSocket = globalThis.socketlib.registerModule(MODULE_ID);
    socketlibSocket.register("createEffect", createEffect);
  }
  return !!globalThis.socketlib;
};
