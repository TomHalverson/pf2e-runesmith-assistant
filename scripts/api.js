import { runeEtchTraceDialog } from "./runeDialog.js";

export function setupAPI() {
  game.runesmith_assistant = {
    openEtchTraceDialog: runeEtchTraceDialog(),
  };
}
