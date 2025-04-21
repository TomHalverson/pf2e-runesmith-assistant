import { deleteRuneEffect } from "./deleteEffect.js";
import { createRuneTraceEffect } from "./createRuneTraceEffect.js";
import { MODULE_ID } from "./module.js";

async function createEffect(data) {
  await createRuneTraceEffect(data);
}
async function deleteEffect(data) {
  await deleteRuneEffect(data);
}

export const setupSocket = () => {
  if (socketlib) {
    game.pf2eRunesmithAssistant = Object.assign(
      game?.pf2eRunesmithAssistant ?? {},
      {
        socket: socketlib.registerModule(MODULE_ID),
      }
    );
    game.pf2eRunesmithAssistant.socket.register("createEffect", createEffect);
    game.pf2eRunesmithAssistant.socket.register("deleteEffect", deleteEffect);
  }
  return !!socketlib;
};
