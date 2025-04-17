export async function runeAppliedMessage({ actor, token, rune, target, type, action }) {
    await ChatMessage.create({
      author: game.user.id,
      content: applyMessageHelper({ rune, target, type }),
      speaker: ChatMessage.getSpeaker({
        actor: actor,
        token: token,
      }),
      flavor: await getMessageFlavor({
        traits:
          type === "etch"
            ? ["exploration"]
            : ["concentrate", "magical", "manipulate", "runesmith"],
        name:
          type === "etch"
            ? `Etch Rune`
            : `Trace Rune ${action === "2" ? " (30 ft.)" : ""}`,
        glyph: type === "etch" ? "" : action,
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
    let message = `${type === "etch" ? "Etched" : "Traced"} `;
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
        }</b>'s <b>${target.object}</b></u>`;
      }
    }
    return message;
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
  