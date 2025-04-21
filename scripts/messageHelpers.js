import { localize } from "./misc.js";
import { getAllowedTokenName } from "./targetDialog.js";

/**
 * Creates a rune Apply Message
 * @param {Object} param Config data
 * @param {Actor} param.actor Actor
 * @param {Token} param.token Token
 * @param {Item} param.rune Rune Item
 * @param {any} param.target Target rune is applied to
 * @param {"etched" | "traced"} param.type Etched or Traced
 * @param {'' | '0' | '1' | '2' | '3' | 'r'} param.action Action cost
 */
export async function runeAppliedMessage({
  actor,
  token,
  rune,
  target,
  type,
  action,
}) {
  const traceDistance =
    action === "2"
      ? ` (${localize("message.apply.traced.ft", { distance: 30 })})`
      : "";
  await ChatMessage.create({
    author: game.user.id,
    content: applyMessageHelper({ rune, target, type }),
    speaker: ChatMessage.getSpeaker({
      actor: actor,
      token: token,
    }),
    flavor: await getMessageFlavor({
      traits:
        type === "etched"
          ? ["exploration"]
          : ["concentrate", "magical", "manipulate", "runesmith"],
      name: localize(`message.apply.${type}.rune`, { distance: traceDistance }),
      glyph: type === "etched" ? "" : action,
    }),
    flags: {
      pf2e: {
        origin: {
          sourceId: actor.id,
          uuid: rune.uuid,
          type: "equipment",
        },
      },
    },
  });
}

function applyMessageHelper({ rune, target, type }) {
  //const action = type === "etched" ? "Etched" : "Traced";
  let targetText = "";

  if (target.type === "object") {
    targetText = ` ${localize("message.apply.onto")} <b><u>${
      target.object
    }</u></b>`;
  } else if (target.type === "person") {
    const tokenName = getAllowedTokenName(canvas.tokens.get(target?.token));
    if (target?.location === "actor") {
      targetText = ` ${localize(
        "message.apply.onto"
      )} <b><u>${tokenName}</u></b>`;
    } else if (target?.location === "item") {
      targetText = ` ${localize(
        "message.apply.onto"
      )} <u><b>${tokenName}</b>${localize("message.apply.'s")} <b>${
        target.item
      }</b></u>`;
    }
  }

  return `${rune.link}${targetText}`;
}

export async function runeInvokedMessage({
  actor,
  token,
  rune,
  target,
  traits,
  invocation,
}) {
  const rollData = actor.getRollData();
  const enrichedDescription = await TextEditor.enrichHTML(invocation, {
    rollData,
  });
  await ChatMessage.create({
    author: game.user.id,
    content: `<b>${rune.link}</b> <i>on ${targetDescription(
      target
    )}</i><hr><fieldset>${enrichedDescription}</fieldset>`,
    speaker: ChatMessage.getSpeaker({
      actor: actor,
      token: token,
    }),
    flavor: await getMessageFlavor({
      traits: traits,
      name: localize("message.invoke.rune"),
      glyph: "1",
    }),
    flags: {
      pf2e: {
        origin: {
          sourceId: actor.id,
          uuid: rune.uuid,
          type: "equipment",
        },
      },
    },
  });
}

async function getMessageFlavor({
  traits = [],
  name = "",
  effect = undefined,
  glyph = "",
}) {
  return await renderTemplate(
    "systems/pf2e/templates/actors/actions/simple/chat-message-flavor.hbs",
    {
      effect: effect,
      glyph: glyph,
      name: name,
      traits: traits.map((trait) => ({
        description: CONFIG.PF2E.traitsDescriptions[trait],
        label: CONFIG.PF2E.actionTraits[trait] ?? trait,
        slug: trait,
      })),
    }
  );
}

export function targetDescription(target) {
  if (target.type === "object") {
    return target?.object || localize("message.target.an-object");
  } else {
    const token =
      canvas.tokens.get(target.token) ||
      canvas.tokens.placeables.find((t) => t.actor.id === target.actor);
    const name = token?.name ?? target.personName;
    const item = target?.item;
    return `${name}${item ? "'s " : ""}${item || ""}`;
  }
}
