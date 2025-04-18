import { MODULE_ID } from "./module.js";

export function setupHooks() {
  Hooks.on("preDeleteItem", async (effect, _misc, _userID) => {
    if (!game.user.isGM) return;
    if (effect.type !== "effect") return;

    const srcFlag = effect?.system?.flags?.[MODULE_ID]?.source;
    if (!srcFlag?.id) return;

    const { id, actorUUID, type } = srcFlag;
    const actor = await fromUuid(actorUUID);
    const flags = actor.getFlag(MODULE_ID, "runes");
    const rune = flags?.[type]?.find((r) => r.id === id);
    if (rune) {
      await actor.setFlag(
        MODULE_ID,
        "runes",
        flags?.[type]?.filter((r) => r.id !== id)
      );
    }
  });
}
