import { runeEtchTraceDialog } from "./runeDialog.js";

export function setupAPI() {
  game.pf2eRunesmithAssistant = {
    dialog: {
      openEtchTrace: runeEtchTraceDialog,
    },
  };
}
