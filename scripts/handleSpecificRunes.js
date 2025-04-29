import { MODULE_ID } from "./module.js";

const RUNES = {
  "holtrick-dwarven-ramparts":
    "Compendium.pf2e-playtest-data.impossible-playtest-runes.Item.azxAqh6vmhgK2dzR",
};

const RUNE_CHECK_LIST = Object.values(RUNES);

export function handleSpecificRunes({ rune, target, srcToken, invocation }) {
  if (!RUNE_CHECK_LIST.includes(rune?.sourceId)) return;
  const tokenSource = canvas.tokens.get(srcToken);
  const effectData = {
    type: "effect",
    name: `[Invoked] ${rune.name}`,
    img: rune.img,
    system: {
      tokenIcon: { show: true },
      duration: {
        value: 1,
        unit: "rounds",
        sustained: false,
        expiry: "turn-end",
      },
      unidentified: false,
      traits: {
        custom: "",
        rarity: "common",
        value: rune?.traits?.toObject() ?? [],
      },
      description: {
        value: `<p>Granted by @UUID[${rune?.sourceId}]</p>${invocation}`,
      },
      level: {
        value: tokenSource?.actor?.level ?? 1,
      },
      source: {
        value: "created by PF2e Runesmith Assistant",
      },
      slug: game.pf2e.system.sluggify(`[Invoked] ${rune.name}`),
    },
  };

  switch (rune?.sourceId) {
    case RUNES["holtrick-dwarven-ramparts"]:
      effectData.system.rules = getGrantItemRules([
        ITEMS["Effect: Holtrik, Rune of Dwarven Ramparts"],
        ITEMS["Effect: Raise a Shield"],
      ]);
      effectData.system.duration.expiry = "turn-start";
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
  return itemUUIDs.map((UUID) => ({
    key: "GrantItem",
    onDeleteActions: {
      grantee: "restrict",
    },
    allowDuplicate: true,
    uuid: UUID,
  }));
}
