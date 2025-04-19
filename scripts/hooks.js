import { EMPTY_RUNE_ART } from "./const.js";
import { dispelRune, invokeRune } from "./invokeRuneDialog.js";
import { targetDescription } from "./messageHelpers.js";
import { getMaxEtchedRunes, hasFeat, isRunesmith } from "./misc.js";
import { MODULE_ID } from "./module.js";

export function setupHooks() {
  Hooks.on("preDeleteItem", async (effect, _misc, _userID) => {
    if (!game.user.isGM) return;
    if (effect.type !== "effect") return;

    const srcFlag = effect?.system?.flags?.[MODULE_ID]?.source;
    if (!srcFlag?.id) return;

    const { id, actorUUID, type } = srcFlag;
    const actor = await fromUuid(actorUUID);
    const flags = actor.getFlag(MODULE_ID, "runes");
    const rune = flags?.[type]?.find((r) => r.id === id);
    if (rune) {
      await actor.setFlag(
        MODULE_ID,
        "runes",
        flags?.[type]?.filter((r) => r.id !== id)
      );
    }
  });

  Hooks.on("renderCharacterSheetPF2e", async (_sheet, html, character) => {
    const actor = _sheet.actor;
    if (
      character.owner &&
      (isRunesmith(actor) || hasFeat(actor, "runesmith-dedication"))
    ) {
      console.log({ _sheet, html, character });

      const actor = _sheet.actor;

      const runes = actor.getFlag(MODULE_ID, "runes");
      const etched = runes?.etched ?? [];
      const traced = runes?.traced ?? [];

      const unique_rune_ids = [
        ...new Set([
          ...etched.map((e) => e.rune.id),
          ...traced.map((t) => t.rune.id),
        ]),
      ];
      const rollData = actor.getRollData();

      const enrichedPromises = unique_rune_ids.map(async (id) => {
        const r = actor.items.get(id);
        const enriched = await TextEditor.enrichHTML(r.description, {
          rollData,
          async: true,
        });
        return [id, enriched.replaceAll('"', "'")];
      });
      const enrichedPairs = await Promise.all(enrichedPromises);
      const enrichedDescriptions = Object.fromEntries(enrichedPairs);

      console.log(runes);

      const MAX_ETCHED = getMaxEtchedRunes(actor);

      // Build Etched Runes section (with placeholders)
      let etchedHtml = `
  <div class="runes-section etched-runes">
    <label><strong>Etched Runes</strong></label>
    <div class="runes-row">
      ${etched
        .map(
          (r) => `<img
                      src="${r.rune.img}" 
                      data-tooltip="${runeTooltip(r, enrichedDescriptions[r.rune.id])}" 
                      data-tooltip-direction="UP" 
                      class="rune-img"
                      data-rune-id="${r.id}"
                      data-rune-type="etched"
                      style="width:32px;height:32px;margin:2px;">`
        )
        .join("")}
      ${Array.from({ length: MAX_ETCHED - etched.length })
        .map(
          () => `<img
                    src="${EMPTY_RUNE_ART}"
                    title="Empty Rune Slot"
                    class="rune-img placeholder"
                    style="width:32px;height:32px;opacity:0.3;margin:2px;"
                  >`
        )
        .join("")}
    </div>
  </div>
`;

      // Build Traced Runes section (no placeholders, wraps)
      let tracedHtml = `
  <div class="runes-section traced-runes">
    <label><strong>Traced Runes</strong></label>
    <div class="runes-row" style="flex-wrap:wrap;">
      ${traced
        .map(
          (r) => `
        <img src="${r.rune.img}" 
          data-tooltip="${runeTooltip(r, enrichedDescriptions[r.rune.id])}" 
          data-tooltip-direction="UP" 
          class="rune-img"
          data-rune-id="${r.id}"
          data-rune-type="traced"
          style="width:32px;height:32px;margin:2px;">
      `
        )
        .join("")}
    </div>
  </div>
`;

      let buttonsHtml = `
  <div class="runes-buttons" style="margin-top:1em; display: flex; gap: 1em; justify-content: flex-end;">
    <button type="button" class="invoke-runes-btn"><i class='fa-solid fa-hand-holding-magic'></i> Invoke Menu</button>
    <button type="button" class="etch-trace-btn"><i class='fa-solid fa-pencil'></i> Etch or Trace Menu</button>
  </div>
`;

      // Combine sections with a horizontal line
      let fieldsetHtml = `
  <fieldset class="runes-fieldset" style="margin-top:1em;">
  <h4>Rune Management</h4>
    ${etchedHtml}
    <hr>
    ${tracedHtml}
    ${buttonsHtml}
  </fieldset>
`;

      const strikesList = html.find(".sheet-body .strikes-list");
      strikesList.after(fieldsetHtml);

      const runesFieldset = html.find(".runes-fieldset");

      // Rune image click: open dialog to invoke
      runesFieldset
        .find(".rune-img:not(.placeholder)")
        .on("click", async function (event) {
          const runeID = event.target.dataset.runeId;
          const runeType = event.target.dataset.runeType;
          const runeData = runes[runeType].find((r) => r.id === runeID);
          const content = await TextEditor.enrichHTML(
            `<p>Do you want to invoke this rune?</p>
                                              <strong>${
                                                runeData.rune.link
                                              }</strong> on <i>${targetDescription(
              runeData.target
            )}</i>?<hr>
                                              <fieldset>${
                                                enrichedDescriptions[
                                                  runeData.rune.id
                                                ]
                                              }</fieldset>`,
            {
              rollData,
              async: true,
            }
          );

          new Dialog({
            title: "Invoke Rune",
            content,
            buttons: {
              yes: {
                label: `<span class="pf2-icon">1</span> Invoke`,
                callback: () => {
                  invokeRune({ act: actor, runeID, type: runeType });
                },
                icon: '<i class="fa-solid fa-hand-holding-magic"></i>',
              },
              no: {
                label: "Cancel",
              },
            },
          }).render(true);
        });

      // Rune image right click: open dialog to dispel
      runesFieldset
        .find(".rune-img:not(.placeholder)")
        .on("contextmenu", async function (event) {
          const runeID = event.target.dataset.runeId;
          const runeType = event.target.dataset.runeType;
          const runeData = runes[runeType].find((r) => r.id === runeID);
          const content = await TextEditor.enrichHTML(
            `<p>Do you want to dispel (remove) this rune?</p><strong>
                                              <strong>${
                                                runeData.rune.link
                                              }</strong> on <i>${targetDescription(
              runeData.target
            )}</i>?<hr>
                                              <fieldset>${
                                                enrichedDescriptions[
                                                  runeData.rune.id
                                                ]
                                              }</fieldset>`,
            {
              rollData,
              async: true,
            }
          );

          new Dialog({
            title: "Dispel Rune",
            content,
            buttons: {
              yes: {
                label: "Dispel",
                callback: () => {
                  dispelRune({ act: actor, runeID, type: runeType });
                  ui.notifications.info(`Dispelled ${runeData.rune.name}!`);
                },
                icon: '<i class="fa-solid fa-trash"></i>',
              },
              no: {
                label: "Cancel",
              },
            },
          }).render(true);
        });

      // Rune image hover: highlight token
      runesFieldset.find(".rune-img:not(.placeholder)").hover(
        function (event) {
          const runeID = event.target.dataset.runeId;
          const runeType = event.target.dataset.runeType;
          const runeData = runes[runeType].find((r) => r.id === runeID);
          const target = runeData.target;
          if (target.type === "person" && target.token) {
            const token =
              canvas.tokens.get(target.token) ||
              canvas.tokens.placeables.find((t) => t.actor.id === target.actor);
            if (token) {
              token._onHoverIn(event); // highlight token
            }
          }
        },
        function (event) {
          // Remove highlight when mouse leaves
          const runeID = event.target.dataset.runeId;
          const runeType = event.target.dataset.runeType;
          const runeData = runes[runeType].find((r) => r.id === runeID);
          const target = runeData.target;
          if (target.type === "person" && target.token) {
            const token =
              canvas.tokens.get(target.token) ||
              canvas.tokens.placeables.find((t) => t.actor.id === target.actor);
            if (token) {
              token._onHoverOut(event); // remove highlight
            }
          }
        }
      );

      runesFieldset.find(".invoke-runes-btn").on("click", () => {
        game.pf2eRunesmithAssistant.dialog.openInvoke();
      });
      runesFieldset.find(".etch-trace-btn").on("click", () => {
        game.pf2eRunesmithAssistant.dialog.openEtchTrace();
      });

      function runeTooltip(runeFlag, enrichedDesc) {
        return `<b>${runeFlag.rune.name}</b><p><i>on ${targetDescription(
          runeFlag.target
        )}</i></p><hr>${enrichedDesc}<hr>
  <p><b>Invoke Rune: </b><span class='reference'>${game.i18n.localize(
    "CONTROLS.LeftClick"
  )}</span></p>
  <p><b>Dispel Rune: </b><span class='reference'>${game.i18n.localize(
    "CONTROLS.RightClick"
  )}</span></p>
  <p><b>Highlight Affected Token: </b><span class='reference'>Hover</span></p>`;
      }
    }
  });
}
