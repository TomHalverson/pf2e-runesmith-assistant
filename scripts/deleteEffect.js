import { MODULE_ID } from "./module.js";

export async function deleteRuneEffect({ id, target, srcToken }) {
  const token = target?.object
    ? srcToken
    : canvas.tokens.get(target.token) ||
      canvas.tokens.placeables.find((t) => t.actor.id === target.actor);
  const actor = token.actor;
  const effect = actor.items.contents.find(
    (i) => i?.system?.flags?.[MODULE_ID]?.source?.id === id
  );
  await effect?.delete();
}
