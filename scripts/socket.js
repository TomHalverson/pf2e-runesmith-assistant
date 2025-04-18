import { deleteRuneEffect } from "./deleteEffect.js";
import { createRuneTraceEffect } from "./misc.js";
import { MODULE_ID } from "./module.js";

let socketlibSocket = undefined;
// Taken by Reference from Pf2e Action Support
async function createEffect(data) {
  await createRuneTraceEffect(data);
}
async function deleteEffect(data) {
  await deleteRuneEffect(data);
}

export const setupSocket = () => {
  if (globalThis.socketlib) {
    socketlibSocket = globalThis.socketlib.registerModule(MODULE_ID);
    socketlibSocket.register("createEffect", createEffect);
    socketlibSocket.register("deleteEffect", deleteEffect);
  }
  return !!globalThis.socketlib;
};
