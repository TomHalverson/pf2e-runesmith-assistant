import { MODULE_ID } from "./module";

/**
 * Gets the effect Link strings from inside
 * @param {string} description Description of the item to extract effects from
 * @returns {string[]} Array of Effect UUIDs
 */
export function getEffects(description) {
  const regex = /@UUID\[[^\]]+\]\{(?:Spell )?Effect: [^}]+\}/g;
  return description.match(regex) ?? [];
}

export async function createRuneTraceEffectCounter({ rune, target, token, actor, id }) {
  const { name, img, enriched_desc } = rune;

  const person = target?.token ? canvas.tokens.get(target?.token)?.name : null;
  const object = target?.object;
  const item = target?.item;

  const effectName = `[Traced] ${name} on ${person ? person : ""}${
    object ? object : ""
  }${item ? "'s" : ""}${item ? " " : ""}${item ? item : ""}`;

  const effectData = {
    type: "effect",
    name: effectName,
    img: "icons/commodities/treasure/token-runed-nyd-green.webp" ?? img,
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
      level: {
        value: 0,
      },
      source: {
        value: "quick effect created by PF2e Runesmith Assistant",
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

  const effect = await token.actor.createEmbeddedDocuments("Item", [effectData]);
  effect.setFlag(MODULE_ID, "rune", {rune, target, token, actor, id})
}
