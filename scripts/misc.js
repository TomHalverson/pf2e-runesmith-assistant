import { MODULE_ID } from "./module.js";
import { getTokenImage } from "./targetDialog.js";

/**
 * Gets the effect Link strings from inside
 * @param {string} description Description of the item to extract effects from
 * @returns {string[]} Array of Effect UUIDs
 */
export function getEffects(description) {
  const regex = /@UUID\[([^\]]+)\](?=\{(?:Spell )?Effect: )/g;
  return description.match(regex).map((str) => str.slice(6, -1)) ?? [];
}

export async function createRuneTraceEffectCounter({
  rune,
  target,
  token,
  actor,
  id,
  type,
}) {
  const { name, img, enriched_desc } = rune;

  const tokenSRC = canvas.tokens.get(target?.token);

  const person = target?.token ? tokenSRC?.name : null;
  const object = target?.object;
  const item = target?.item;

  const effectName = `[${type === "etch" ? "Etched" : "Traced"}] ${name}${
    object || item ? " on " : ""
  }${object ? object : ""}${item ? item : ""}`;

  const effectData = {
    type: "effect",
    name: effectName,
    img: tokenSRC.id === token ? img : getTokenImage(tokenSRC),
    system: {
      tokenIcon: { show: false },
      duration: {
        value: 1,
        unit: "rounds",
        sustained: false,
        expiry: "turn-end",
      },
      description: {
        value: enriched_desc,
      },
      unidentified: true,
      traits: {
        custom: "",
        rarity: "common",
        value: [],
      },
      rules: rune.effects.map((effectUUID) => ({
        key: "GrantItem",
        onDeleteEffects: {
          grantee: "restrict",
        },
        uuid: effectUUID,
      })),
      level: {
        value: tokenSRC?.actor?.level ?? 1,
      },
      source: {
        value: "created by PF2e Runesmith Assistant",
      },
      // note: naming this just 'temporary-effect-...' will lead to a PF2E bug, apparently!
      slug: game.pf2e.system.sluggify(
        `pra-trace-tracker-${name}-${person ?? object ?? ""}${item ? "-" : ""}${
          item ?? ""
        }`
      ),
    },
    flags: {},
  };

  const effect = await token.actor.createEmbeddedDocuments("Item", [
    effectData,
  ]);
  await effect?.[0]?.setFlag(MODULE_ID, "rune", { rune, target, token, actor, id });
}
