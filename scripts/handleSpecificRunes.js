const RUNES = {
  "holtrick-dwarven-ramparts":
    "Compendium.pf2e-playtest-data.impossible-playtest-runes.Item.WCVwAFVojZeiw3Z3",
};

const RUNE_CHECK_LIST = Object.values(RUNES);

export function handleSpecificRunes({
  id,
  target,
  srcToken,
  sourceID,
  type,
  invocation,
}) {
  if (!RUNE_CHECK_LIST.includes(sourceID)) return;
  const actor = canvas.tokens.get(srcToken).actor;
  const runes = actor.getFlag(MODULE_ID, "runes");
  const rune = runes[type].find((r) => r.id === id);
  const effectData = {
    type: "effect",
    name: `[Invoked] ${rune.name}`,
    img: rune.img,
    system: {
      tokenIcon: { show: true },
      traits: {
        custom: "",
        rarity: "common",
        value: rune.traits,
      },
      description: `<p>Granted by @UUID[${sourceID}]</p>${invocation}`,
      level: {
        value: tokenSource?.actor?.level ?? 1,
      },
    },
    source: {
      value: "created by PF2e Runesmith Assistant",
    },
    slug: game.pf2e.system.sluggify(`[Invoked] ${rune.name}`),
  };

  switch (sourceID) {
    case RUNES["holtrick-dwarven-ramparts"]:
      effectData.system.rules = getGrantItemRules([
        ITEMS["Effect: Holtrik, Rune of Dwarven Ramparts"],
        ITEMS["Effect: Raise a Shield"],
      ]);
      game.pf2eRunesmithAssistant.socket.executeAsGM("createEffect", {
        targetID: target.token,
        tokenID: srcToken,
        effectData,
      });
      break;
  }
}

const ITEMS = {
  "Effect: Holtrik, Rune of Dwarven Ramparts":
    "Compendium.pf2e-playtest-data.impossible-playtest-effects.Item.gBwMb0QqrBJVzyYc",
  "Effect: Raise a Shield":
    "Compendium.pf2e.equipment-effects.Item.2YgXoHvJfrDHucMr",
};

function getGrantItemRules(itemUUIDs) {
  return rune.effects.map((effectUUID) => ({
    key: "GrantItem",
    onDeleteEffects: {
      grantee: "restrict",
    },
    uuid: effectUUID,
  }));
}
