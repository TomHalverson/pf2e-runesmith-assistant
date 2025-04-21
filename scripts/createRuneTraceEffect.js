export async function createRuneTraceEffect({
  rune,
  target,
  tokenID,
  id,
  type,
}) {
  const { name, img, enriched_desc } = rune;

  const tokenSRC = canvas.tokens.get(target?.token);
  const token = canvas.tokens.get(tokenID);

  const person = target?.token ? tokenSRC?.name : null;
  const object = target?.object;
  const item = target?.item;

  const effectName = `[${type === "etched" ? "Etched" : "Traced"}] ${name}${
    object || item ? " on " : ""
  }${object || ""}${item || ""}`;

  const effectData = {
    type: "effect",
    name: effectName,
    img: img,
    system: {
      tokenIcon: { show: true },
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
            actorUUID: token.actor.uuid,
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
  };
  const act = object ? token.actor : tokenSRC?.actor;
  const effects = await act.createEmbeddedDocuments("Item", [effectData], {
    parent: token.actor,
  });
  console.log({ effects });
  return effects;
}
