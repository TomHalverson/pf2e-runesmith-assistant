import { invokeRuneDialog } from "./invokeRuneDialog.js";
import { runeEtchTraceDialog } from "./runeDialog.js";

export function setupAPI() {
  game.pf2eRunesmithAssistant = Object.assign(game?.pf2eRunesmithAssistant ?? {}, {
    dialog: {
      openEtchTrace: runeEtchTraceDialog,
      openInvoke: invokeRuneDialog,
    },
  });
}
