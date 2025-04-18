import { runeInvokedMessage, targetDescription } from "./messageHelpers.js";
import { getMaxEtchedRunes, getYourToken } from "./misc.js";
import { MODULE_ID } from "./module.js";

export async function invokeRuneDialog() {
  const token = getYourToken();
  const res = await pickDialog({ token });
  console.log({ res });

  if (res?.action === "dispel") {
    dispelRune({ token, runeID: res.id, type: res.type });
  } else if (res?.action === "invoke") {
    invokeRune({ token, runeID: res.id, type: res.type });
  }
}

async function pickDialog({ token }) {
  // Placeholder art for empty rune slots
  const EMPTY_RUNE_ART = "icons/svg/d6-grey.svg"; // Replace with your preferred placeholder art

  // Get rune flags
  const flags = token?.actor?.getFlag(MODULE_ID, "runes");
  const etched = flags?.etched ?? [];
  const traced = flags?.traced ?? [];
  if (etched.length === 0 && traced.length === 0) {
    ui.notifications.error("You have no runes applied");
    return;
  }
  const MAX_ETCHED = getMaxEtchedRunes(token.actor);

  // Helper to render etched runes as selectable, with names below
  function renderEtchedRunes(runes, max, label) {
    let html = `<div class="rune-section"><div class="rune-label">${label}</div><div class="form-group">`;
    for (let i = 0; i < max; i++) {
      let runeData = runes[i];
      let rune = runeData?.rune;
      if (rune) {
        html += `<label class="rune-label" data-tooltip="<i>Applied to ${targetDescription(
          runeData.target
        )}</i><hr>${
          rune.enriched_desc.replaceAll('"', "'") ?? rune.name
        }" data-tooltip-direction="UP">
                            <input type="radio" name="etched" value="${
                              runeData?.id
                            }">
                            <img src="${
                              rune.img
                            }" style="width:50px;height:50px;">
                            <span class="rune-name">${rune.name}</span>
                         </label>`;
      } else {
        html += `<span class="rune-icon temp" data-tooltip="Empty Rune Slot" data-tooltip-direction="UP">
                            <img src="${EMPTY_RUNE_ART}" style="width:50px;height:50px;opacity:0.3;">
                            <span class="rune-name" style="opacity:0.5;">Empty</span>
                         </span>`;
      }
    }
    html += `</div></div>`;
    return html;
  }

  // Helper to render traced runes in a grid/list
  function renderTracedRunes(runes, label) {
    let html = `<div class="rune-section"><div class="rune-label">${label}</div><div class="form-group">`;
    for (let runeData of runes) {
      let rune = runeData?.rune;
      html += `<label class="radio-label" data-tooltip="<i>Applied to ${targetDescription(
        runeData.target
      )}</i><hr>${rune.enriched_desc.replaceAll(
        '"',
        "'"
      )}" data-tooltip-direction="UP">
                        <input type="radio" name="song" value="${runeData?.id}">
                        <img src="${
                          rune.img
                        }" style="border:0px; width: 50px; height:50px;">
                        <span class="rune-name">${rune.name}</span>
                    </label>`;
    }
    html += `</div></div>`;
    return html;
  }

  // Compose dialog content
  let content = `
    <style>
        .rune-section { margin-bottom: 10px; }
        .rune-label { font-weight: bold; margin-bottom: 4px; }
        .form-group { display: flex; flex-wrap: wrap; gap: 10px; }
        .rune-label, .radio-label { display: flex; flex-direction: column; align-items: center; min-width: 80px; background: rgba(255,255,255,0.1); border-radius: 6px; padding: 5px; }
        .rune-label input, .radio-label input { display: none; }
        .rune-label img, .radio-label img { width: 50px; height: 50px; margin-bottom: 6px; }
        .rune-name { font-size: 0.9em; margin-top: 2px; word-break: break-word; }
        .rune-icon { display: flex; flex-direction: column; align-items: center; min-width: 80px; }
        .rune-icon.temp img { opacity: 0.3; }
        [name="etched"]:checked + img, [name="song"]:checked + img { outline: 2px solid #f00; }
        hr { margin: 16px 0; }
    </style>
    <form class="songpicker">
        ${renderEtchedRunes(etched, MAX_ETCHED, "Etched Runes")}
        <hr>
        ${renderTracedRunes(traced, "Traced Runes")}
    </form>
    `;

  // Show dialog
  return new Promise((resolve) => {
    new Dialog({
      title: "Rune List",
      content,
      buttons: {
        Invoke: {
          label: `<span class="pf2-icon">1</span> Invoke`,
          callback: async (html) => {
            // Check both radio groups for selection
            let etchedId = $(
              "input[type='radio'][name='etched']:checked"
            ).val();
            let tracedId = $("input[type='radio'][name='song']:checked").val();
            let itemId = etchedId || tracedId;
            const type = etchedId ? "etched" : "traced";
            if (itemId) resolve({ id: itemId, type, action: "invoke" });
          },
          icon: '<i class="fa-solid fa-hand-holding-magic"></i>',
        },
        Dispel: {
          label: `Dispel`,
          callback: async (html) => {
            let etchedId = $(
              "input[type='radio'][name='etched']:checked"
            ).val();
            let tracedId = $("input[type='radio'][name='song']:checked").val();
            let itemId = etchedId || tracedId;
            const type = etchedId ? "etched" : "traced";
            if (itemId) resolve({ id: itemId, type, action: "dispel" });
          },
          icon: '<i class="fa-solid fa-trash"></i>',
        },
      },
    }).render(true, { width: 700 });
  });
}

async function dispelRune({ token, runeID, type }) {
  const actor = token?.actor;
  const flag = actor?.getFlag(MODULE_ID, "runes");
  const { target } = flag[type].find((r) => r.id === runeID);
  flag[type] = flag?.[type]?.filter((r) => r.id !== runeID);
  await actor.setFlag(MODULE_ID, "runes", flag);
  socketlib.modules
    .get(MODULE_ID)
    .executeAsGM("deleteEffect", { id: runeID, target, srcToken: token });
}

async function invokeRune({ token, runeID, type }) {
  const actor = token?.actor;
  const flag = actor?.getFlag(MODULE_ID, "runes");
  console.log({ flag, token, runeID, type });
  const flagData = flag?.[type]?.find((r) => r.id === runeID);
  const target = flagData.target;
  console.log({ flagData });
  const rune = await fromUuid(flagData.rune.uuid);
  const invocation = getInvocation(rune.description);

  const traits = [
    ...new Set([
      "invocation",
      "magical",
      "runesmith",
      ...rune.traits.toObject(),
      ...invocation.traits,
    ]),
  ];

  flag[type] = flag?.[type]?.filter((r) => r.id !== runeID);
  await actor.setFlag(MODULE_ID, "runes", flag);

  await runeInvokedMessage({
    token,
    actor,
    rune,
    target,
    traits,
    invocation: invocation.desc,
  });

  socketlib.modules
    .get(MODULE_ID)
    .executeAsGM("deleteEffect", { id: runeID, target, srcToken: token });
}

//const INVOCATION_REGEX = /<p><strong>Invocation<\/strong>[\s\S]*/;
const STRICT_INVOCATION_REGEX =
  /<strong>Invocation<\/strong>(?:\s*\([^)]+\))?\s*([\s\S]*)/;
const INVOCATION_TRAITS_REGEX = /<strong>Invocation<\/strong>\s*\(([^)]*)\)/;
function getInvocation(description) {
  console.log({ test: description.match(STRICT_INVOCATION_REGEX) });
  const desc = description.match(STRICT_INVOCATION_REGEX)?.[1];
  const traits =
    description
      .match(INVOCATION_TRAITS_REGEX)?.[1]
      ?.split(",")
      ?.map((t) => t.trim()) ?? [];
  return { desc: desc ? `<p>${desc}` : description, traits };
}
