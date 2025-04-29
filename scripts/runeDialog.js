import { runeAppliedMessage } from "./messageHelpers.js";
import { getEffects, getMaxEtchedRunes, getYourToken } from "./misc.js";
import { MODULE_ID } from "./module.js";
import { showDynamicTargetForm } from "./targetDialog.js";

export async function runeEtchTraceDialog(options = {}) {
  const token = getYourToken();
  const actor = token.actor;
  const runesList = actor.items.contents.filter((it) =>
    it.system?.traits?.value?.includes("rune")
  );
  if (runesList.length === 0) {
    ui.notifications.error("You have no Runes");
    return;
  }

  let runes = actor.getFlag(MODULE_ID, "runes");

  //console.log({ runesList, runes });

  if (!runes || Object.keys(runes).length === 0) {
    actor.setFlag(MODULE_ID, "runes", {
      traced: [],
      etched: [],
    });
  }

  const rollData = actor.getRollData();
  let runeData = (
    await Promise.all(
      runesList.map(async (r) => {
        return {
          name: r.name,
          id: r.id,
          uuid: r.uuid,
          img: r.img,
          link: r.link,
          traits: r.system.traits.value,
          effects: getEffects(r.description),
          enriched_desc: (
            await TextEditor.enrichHTML(r.description, { rollData })
          ).replaceAll("'", '"'),
        };
      })
    )
  ).sort((a, b) => a.name.localeCompare(b.name));
  //console.log({ runeData });

  let res = await pickDialog({ runes: runeData, actor, token, options });
  //console.log({ res });
}

async function pickDialog({ runes, actor, token, options }) {
  let rune_content = ``;

  //Filter for songs
  for (let rune of runes) {
    rune_content += `<label class="radio-label" data-tooltip='${rune.enriched_desc}' data-tooltip-direction="UP">
      <input type="radio" name="song" value="${rune.id}">
      <img src="${rune.img}" style="border:0px; width: 50px; height:50px;">
      ${rune.name}
  </label>`;
  }
  let content = `
  <style>
    .songpicker .form-group {
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        align-items: flex-start;
        gap: 10px; /* Adds space between items */
    }

    .songpicker .radio-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        justify-items: center;
        flex: 1 0 19%; /* Slightly less than 25% to allow for gap */
        min-width: 120px; /* Ensures minimum width for each label */
        margin: 5px 0; /* Vertical margin between rows */
        padding: 5px 5px; /* Padding inside each label */
        box-sizing: border-box;
        background: rgba(255,255,255,0.1); /* Optional: subtle background */
        border-radius: 6px; /* Optional: rounded corners */
    }

    .songpicker .radio-label input {
        display: none;
    }

    .songpicker img {
        border: 0px;
        width: 50px;
        height: 50px;
        flex: 0 0 50px;
        cursor: pointer;
        margin-bottom: 6px;
    }

    /* CHECKED STYLES */
    .songpicker [type=radio]:checked + img {
        outline: 2px solid #f00;
    }
  </style>

  <form class="songpicker">
    <div class="form-group" id="songs">
        ${rune_content}
    </div>
  </form>
  `;

  let image = new Promise((resolve) => {
    let buttons = {};

    if (!options?.traceOnly) {
      buttons.Etch = {
        label: `Etch`,
        callback: async (html) => {
          let itemId = $("input[type='radio'][name='song']:checked").val();
          addRune(
            runes.find((s) => s.id === itemId),
            { actor, token, type: "etched" }
          );
          resolve(itemId);
        },
        icon: '<i class="fa-solid fa-hammer-crash"></i>',
      };
    }

    if (!options?.etchOnly) {
      buttons.Trace = {
        label: `<span class="pf2-icon">1</span> Trace`,
        callback: async (html) => {
          let itemId = $("input[type='radio'][name='song']:checked").val();
          addRune(
            runes.find((s) => s.id === itemId),
            { actor, token, type: "traced", action: "1" }
          );
          resolve(itemId);
        },
        icon: '<i class="fa-solid fa-pencil"></i>',
      };
      buttons.Trace2Action = {
        label: `<span class="pf2-icon">2</span> Trace (30 ft)`,
        callback: async (html) => {
          let itemId = $("input[type='radio'][name='song']:checked").val();
          addRune(
            runes.find((s) => s.id === itemId),
            { actor, token, type: "traced", action: "2" }
          );
          resolve(itemId);
        },
        icon: '<i class="fa-solid fa-pencil"></i>',
      };
    }
    new Dialog({
      title: "Rune List",
      content,
      buttons,
      render: (html) => {
        // Attach right-click listener to rune images
        html.find(".radio-label img").on("contextmenu", async function (event) {
          event.preventDefault();
          const runeId = $(this)
            .closest("label")
            .find("input[type=radio]")
            .val();
          const runeObj = runes.find((s) => s.id === runeId);
          // Call addRune with free: true
          await addRune(runeObj, { actor, token, type: "etched", free: true });
          resolve(runeId); // Optionally resolve the promise
        });
      },
    }).render(true, { width: 700 });
  });
  return image;
}

/**
 *
 */
async function addRune(
  rune,
  { actor, token, type = "etched", action = 0, free }
) {
  const target = await showDynamicTargetForm();
  let runes = actor.getFlag(MODULE_ID, "runes");
  const id = foundry.utils.randomID();

  if (type === "etched") {
    const maxEtchedRunes = getMaxEtchedRunes(token.actor);
    if (runes.etched.filter((r) => !r.free).length >= maxEtchedRunes) {
      runes.etched.pop();
    }
  }

  runes[type].push({
    rune,
    target,
    id,
    ...(free && { free }),
  });

  game.pf2eRunesmithAssistant.socket.executeAsGM("createTraceEffect", {
    rune,
    target,
    tokenID: token.id,
    id,
    type,
  });
  await actor.setFlag(MODULE_ID, "runes", runes);
  await runeAppliedMessage({ actor, token, rune, target, type, action });
}
