import { getTokenImage } from "./targetDialog.js";

/**
 * Gets the effect Link strings from inside
 * @param {string} description Description of the item to extract effects from
 * @returns {string[]} Array of Effect UUIDs
 */
export function getEffects(description) {
  const regex = /@UUID\[([^\]]+)\](?=\{(?:Spell )?Effect: )/g;
  return description.match(regex)?.map((str) => str?.slice(6, -1)) ?? [];
}

/**
 * Gets your selected or Character if you have one set
 * @returns {token} Your selected or owned token
 */
export function getYourToken() {
  return (
    canvas.tokens.controlled?.[0] ||
    canvas.tokens.placeables.find(
      (t) => t?.actor?.id === game?.user?.character?.id
    )
  );
}

/**
 * Get the Max Number of etched runes for an actor
 * @param {Actor} actor Actor to get max etched Runes for
 * @returns {number} Returns the max number of etched runes
 */
export function getMaxEtchedRunes(actor) {
  return 2 + Math.floor((actor.level - 1) / 4);
}

export async function createRuneTraceEffect({
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

  const effectName = `[${type === "etched" ? "Etched" : "Traced"}] ${name}${
    object || item ? " on " : ""
  }${object ? object : ""}${item ? item : ""}`;

  const effectData = {
    type: "effect",
    name: effectName,
    img: img,
    system: {
      tokenIcon: { show: false },
      duration: {
        value: 1,
        unit: type === "etched" ? "unlimited" : "rounds",
        sustained: false,
        expiry: "turn-end",
      },
      description: {
        value: enriched_desc,
      },
      unidentified: false,
      traits: {
        custom: "",
        rarity: "common",
        value: rune.traits,
      },
      rules: object
        ? []
        : rune.effects.map((effectUUID) => ({
            key: "GrantItem",
            onDeleteEffects: {
              grantee: "restrict",
            },
            uuid: effectUUID,
          })),
      level: {
        value: tokenSRC?.actor?.level ?? 1,
      },
      flags: {
        "pf2e-runesmith-assistant": {
          source: {
            id,
            actorUUID: actor.uuid,
            type,
          },
        },
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
  const act = object ? token.actor : tokenSRC?.actor;
  const effects = await act.createEmbeddedDocuments("Item", [effectData], {
    parent: token.actor,
  });
  console.log({ effects });
  //   const effect = effects?.[0];
  //   effect?.setFlag(MODULE_ID, "rune", {
  //     rune,
  //     target,
  //     token,
  //     actor,
  //     id,
  //   });
}
