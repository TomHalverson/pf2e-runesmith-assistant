import { localize } from "./misc.js";
import { MODULE_ID } from "./module.js";

/** Mapping of Rune SLUG to its Source ID */
const RUNES = {
  "holtrick-dwarven-ramparts":
  "Compendium.pf2e-playtest-data.impossible-playtest-runes.Item.azxAqh6vmhgK2dzR",
  "zohk-rune-of-homecoming":
  "Compendium.pf2e-playtest-data.impossible-playtest-runes.Item.dy2PWy8R42gxpnzt",
  "atryl-rune-of-fire":
  "Compendium.pf2e-playtest-data.impossible-playtest-runes.Item.Lfqa0rjjccvUNaey", // Replace with actual ID
  "ranshu-rune-of-thunder":
  "Compendium.pf2e-playtest-data.impossible-playtest-runes.Item.MRB4WtV1MgPTjGID", // Replace with actual ID
};

const RUNE_CHECK_LIST = Object.values(RUNES);

/**
 * Handles Specific Runes detailed above
 * @export
 * @param {{rune: Item, target: {
 *      type: string, item?: string, token?: string, actor?: string, location?: string
 * }, srcToken: string, invocation: string}} { rune, target, srcToken, invocation }
 * @return {undefined}
 */
export function handleSpecificRunes({ rune, target, srcToken, invocation }) {
  if (!RUNE_CHECK_LIST.includes(rune?.sourceId)) return;
  const tokenSource = canvas.tokens.get(srcToken);
  const tokenTarget = canvas.tokens.get(target.token) ||
  canvas.tokens.placeables.find((t) => t.actor.id === target.actor);
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
      slug: game.pf2e.system.sluggify(
        `[${localize("effect.types.invoked")}] ${rune.name}`
      ),
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

    case RUNES["atryl-rune-of-fire"]:
      // Play Fire invocation animation
      playFireInvokeAnimation(tokenTarget || tokenSource);

      game.pf2eRunesmithAssistant.socket.executeAsGM("createEffect", {
        targetID: target.token,
        tokenID: srcToken,
        effectData,
      });
      break;

    case RUNES["ranshu-rune-of-thunder"]:
      // Play Thunder invocation animation
      playThunderInvokeAnimation(tokenTarget || tokenSource);

      game.pf2eRunesmithAssistant.socket.executeAsGM("createEffect", {
        targetID: target.token,
        tokenID: srcToken,
        effectData,
      });
      break;

    case RUNES["zohk-rune-of-homecoming"]:
      Dialog.confirm({
        title: `${localize("message.invoke.rune")} ${rune.name}`,
                     content: localize("dialog.invoke.failed-or-willing"),
                     yes: (html) => {
                       new Sequence({
                         moduleName: game.modules.get(MODULE_ID).title,
                                    softFail: true,
                       })
                       //TP 1
                       .crosshair("mvmnt")
                       .gridHighlight()
                       .location(tokenSource, {
                         showRange: true,
                         displayRangePoly: true,
                         limitMaxRange: 5,
                         wallBehavior:
                         Sequencer.Crosshair.PLACEMENT_RESTRICTIONS.LINE_OF_SIGHT,
                       })
                       .distance(Math.max(tokenTarget.document.width - 1, 0) * 5)
                       .snapPosition(
                         CONST.GRID_SNAPPING_MODES.CENTER |
                         CONST.GRID_SNAPPING_MODES.VERTEX
                       )
                       .icon(tokenTarget.document.texture.src)
                       //invisible
                       .animation()
                       .on(tokenTarget)
                       .opacity(0)
                       .fadeOut(200)
                       .waitUntilFinished(-150)
                       // Sound
                       .sound()
                       .file("graphics-sfx.scifi.teleport.01")
                       .volume(0.5)
                       //TP Effect
                       .effect()
                       .file("jb2a.teleport.01.yellow")
                       .atLocation(tokenTarget, { cacheLocation: true })
                       .scaleToObject(4)
                       .waitUntilFinished(-500)
                       // Movement Effect
                       .effect()
                       .file("jb2a.ranged.03.instant.01.yellow")
                       .atLocation(tokenTarget, { cacheLocation: true })
                       .stretchTo("mvmnt")
                       .scale({ x: 1, y: 0.5 })
                       .waitUntilFinished(-1000)
                       //Movement Animation
                       .animation()
                       .on(tokenTarget)
                       .teleportTo("mvmnt") //, { relativeToCenter: true })
      .snapToGrid()
      .waitUntilFinished(10)
      // Movement Result
      .effect()
      .file("jb2a.teleport.01.yellow")
      .atLocation("mvmnt")
      .scaleToObject(4)
      .waitUntilFinished(-200)
      .animation()
      .on(tokenTarget)
      .opacity(1)
      .fadeIn(200)
      .play({ preload: true });
                     },
                     no: (html) => {
                       /* do something or return value */
                     },
      });
      break;
  }
}

// Animation functions for Fire Invoke
function playFireInvokeAnimation(target) {
  new Sequence({
    moduleName: game.modules.get(MODULE_ID).title,
               softFail: true,
  })
  .effect()
  .file("animated-spell-effects-cartoon.fire.15")
  .atLocation(target)
  .scale(0.3)

  .effect()
  .file("jb2a.magic_signs.rune.02.complete.01.orange")
  .atLocation(target)
  .scale(0.3)

  .effect()
  .file("blfx.spell.template.circle.explosion6.fire_flames_particles.1.color5")
  .atLocation(target)
  .playbackRate(1)
  .scale(0.3)

  .sound()
  .file("psfx.casting.fire.001")

  .play({ preload: true });
}

// Animation functions for Thunder Invoke
function playThunderInvokeAnimation(target) {
  new Sequence({
    moduleName: game.modules.get(MODULE_ID).title,
               softFail: true,
  })
  .effect()
  .file("jb2a.lightning_strike.blue")
  .atLocation(target)
  .scale(3)

  .effect()
  .file("jb2a.magic_signs.rune.02.complete.03.blue")
  .atLocation(target)
  .scale(0.3)

  .effect()
  .file("animated-spell-effects-cartoon.electricity.23")
  .atLocation(target)
  .playbackRate(1)
  .scale(0.3)

  .sound()
  .file("graphics-sfx.magic.lightning.impact.thunder.01.02")

  .play({ preload: true });
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
