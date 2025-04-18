/**
 *
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
      name:
        type === "etched"
          ? `Etch Rune`
          : `Trace Rune ${action === "2" ? " (30 ft.)" : ""}`,
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
  let message = `${type === "etched" ? "Etched" : "Traced"} `;
  message += rune.link;
  if (target.type === "object") {
    message += ` onto <b><u>${target.object}</u></b>`;
  } else if (target.type === "person") {
    if (target?.location === "actor") {
      message += ` onto <b><u>${
        canvas.tokens.get(target?.token)?.name
      }</u></b>`;
    } else if (target?.location === "item") {
      message += ` onto <u><b>${
        canvas.tokens.get(target?.token)?.name
      }</b>'s <b>${target.item}</b></u>`;
    }
  }
  return message;
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
    )}</i><hr>${enrichedDescription}`,
    speaker: ChatMessage.getSpeaker({
      actor: actor,
      token: token,
    }),
    flavor: await getMessageFlavor({
      traits: traits,
      name: "Invoke Rune",
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
    return target?.object || "an Object";
  } else {
    const token =
      canvas.tokens.get(target.token) ||
      canvas.tokens.placeables.find((t) => t.actor.id === target.actor);
    const name = token?.name ?? target.personName;
    const item = target?.item;
    return `${name}${item ? "'s " : ""}${item ? item : ""}`;
  }
}
