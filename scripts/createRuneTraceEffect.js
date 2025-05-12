export async function createRuneTraceEffect({
  rune,
  target,
  tokenID,
  id,
  type,
}) {
  const { name, img, enriched_desc } = rune;

  const targetToken = canvas.tokens.get(target?.token);
  const tokenSource = canvas.tokens.get(tokenID);

  const person = target?.token ? targetToken?.name : null;
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
            onDeleteActions: {
              grantee: "restrict",
            },
            allowDuplicate: true,
            uuid: effectUUID,
          })),
      level: {
        value: tokenSource?.actor?.level ?? 1,
      },
      flags: {
        "pf2e-runesmith-assistant": {
          source: {
            id,
            actorUUID: tokenSource.actor.uuid,
            type,
          },
        },
      },
      source: {
        value: "created by PF2e Runesmith Assistant",
      },
      // note: naming this just 'temporary-effect-...' will lead to a PF2E bug, apparently!
      slug: game.pf2e.system.sluggify(name),
    },
  };
  const act = object ? tokenSource.actor : targetToken?.actor;
  const effects = await act.createEmbeddedDocuments("Item", [effectData], {
    parent: tokenSource.actor,
  });
  //console.log({ effects });
  return effects;
}

export async function createEffect({ tokenID, targetID, effectData }) {
  const targetToken = canvas.tokens.get(targetID);
  const act = targetToken?.actor;

  const effects = await act.createEmbeddedDocuments(
    "Item",
    [
      {
        ...effectData,
      },
    ],
    {
      parent: targetToken.actor,
    }
  );
  return effects;
}
