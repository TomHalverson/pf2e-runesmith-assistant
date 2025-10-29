import { runeAppliedMessage } from "./messageHelpers.js";
import {
  getEffects,
  getMaxEtchedRunes,
  getYourToken,
  localize,
} from "./misc.js";
import { MODULE_ID } from "./module.js";
import { getAllowedTokenName, getTokenImage } from "./targetDialog.js";

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

  let res = await pickDialog({ runes: runeData, actor, token, options });
}

/**
 * Format traits for display
 */
function formatTraits(traits) {
  if (!traits || traits.length === 0) return '';
  
  return traits
    .map(trait => {
      // Try to get localized label from PF2e config
      const label = CONFIG.PF2E?.actionTraits?.[trait] || 
                    CONFIG.PF2E?.featTraits?.[trait] || 
                    CONFIG.PF2E?.spellTraits?.[trait] ||
                    // Fallback: capitalize first letter of slug
                    trait.charAt(0).toUpperCase() + trait.slice(1);
      return `<span class="trait-tag trait-${trait}">${label}</span>`;
    })
    .join(' ');
}

async function pickDialog({ runes, actor, token, options }) {
  // Build vertical list of runes
  let rune_content = `<div class="rune-list-vertical">`;
  
  for (let rune of runes) {
    const traitsHtml = formatTraits(rune.traits);
    
    rune_content += `
      <label class="rune-row-vertical" data-tooltip='${rune.enriched_desc}' data-tooltip-direction="LEFT">
        <input type="radio" name="rune-selection" value="${rune.id}" style="display: none;">
        <div class="rune-row-content">
          <img src="${rune.img}" class="rune-icon-vertical">
          <div class="rune-info-vertical">
            <div class="rune-name-vertical">${rune.name}</div>
            ${traitsHtml ? `<div class="rune-traits-vertical">${traitsHtml}</div>` : ''}
          </div>
          <i class="fas fa-check-circle rune-check-icon"></i>
        </div>
      </label>`;
  }
  rune_content += `</div>`;

  let content = `
    <style>
      /* Scoped styles for this dialog */
      .runesmith-picker-vertical .rune-list-vertical {
        display: flex;
        flex-direction: column;
        gap: 6px;
        max-height: 450px;
        overflow-y: auto;
        padding: 4px;
      }
      
      .runesmith-picker-vertical .rune-row-vertical {
        display: block;
        cursor: pointer;
        margin: 0;
        padding: 0;
      }
      
      .runesmith-picker-vertical .rune-row-content {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px;
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid transparent;
        border-radius: 4px;
        transition: all 0.2s ease;
      }
      
      .runesmith-picker-vertical .rune-row-vertical:hover .rune-row-content {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(234, 74, 114, 0.5);
      }
      
      .runesmith-picker-vertical .rune-row-vertical.selected .rune-row-content {
        background: rgba(234, 74, 114, 0.2);
        border-color: rgb(234, 74, 114);
      }
      
      .runesmith-picker-vertical .rune-icon-vertical {
        width: 40px !important;
        height: 40px !important;
        min-width: 40px;
        min-height: 40px;
        max-width: 40px;
        max-height: 40px;
        flex-shrink: 0;
        border-radius: 3px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        object-fit: cover;
      }
      
      .runesmith-picker-vertical .rune-info-vertical {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      
      .runesmith-picker-vertical .rune-name-vertical {
        font-size: 0.95em;
        font-weight: 600;
        color: #fff;
        line-height: 1.2;
        word-wrap: break-word;
      }
      
      .runesmith-picker-vertical .rune-traits-vertical {
        display: flex;
        flex-wrap: wrap;
        gap: 3px;
        line-height: 1;
      }
      
      .runesmith-picker-vertical .trait-tag {
        font-size: 0.7em;
        padding: 2px 5px;
        background: rgba(0, 0, 0, 0.4);
        border-radius: 2px;
        color: #ccc;
        text-transform: capitalize;
        white-space: nowrap;
      }
      
      .runesmith-picker-vertical .rune-check-icon {
        color: rgb(234, 74, 114);
        font-size: 1.3em;
        opacity: 0;
        transition: opacity 0.2s ease;
        flex-shrink: 0;
        margin-left: auto;
      }
      
      .runesmith-picker-vertical .rune-row-vertical.selected .rune-check-icon {
        opacity: 1;
      }
      
      .runesmith-picker-vertical .rune-list-vertical::-webkit-scrollbar {
        width: 6px;
      }
      
      .runesmith-picker-vertical .rune-list-vertical::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
      }
      
      .runesmith-picker-vertical .rune-list-vertical::-webkit-scrollbar-thumb {
        background: rgba(234, 74, 114, 0.6);
        border-radius: 3px;
      }
      
      .runesmith-picker-vertical .rune-list-vertical::-webkit-scrollbar-thumb:hover {
        background: rgba(234, 74, 114, 0.8);
      }
    </style>
    <form class="runesmith-picker-vertical">
      ${rune_content}
    </form>
  `;

  let image = new Promise((resolve) => {
    const buttons = [];

    if (!options?.traceOnly && !options?.engravingStrikeOnly) {
      buttons.push({
        action: "etch",
        label: localize("keywords.etch"),
        callback: async (event, button, dialog) => {
          const html = dialog.element || dialog;
          let itemId = $(html).find("input[type='radio'][name='rune-selection']:checked").val();
          if (!itemId) {
            ui.notifications.warn("Please select a rune first");
            return;
          }
          addRune(
            runes.find((s) => s.id === itemId),
            { actor, token, type: "etched" }
          );
          resolve(itemId);
        },
        icon: "fa-solid fa-hammer-crash",
      });
    }

    if (!options?.etchOnly && !options?.engravingStrikeOnly) {
      buttons.push(
        {
          label: `${localize("keywords.trace")}`,
          action: "trace",
          callback: async (event, button, dialog) => {
            const html = dialog.element || dialog;
            let itemId = $(html).find("input[type='radio'][name='rune-selection']:checked").val();
            if (!itemId) {
              ui.notifications.warn("Please select a rune first");
              return;
            }
            addRune(
              runes.find((s) => s.id === itemId),
              { actor, token, type: "traced", action: "1" }
            );
            resolve(itemId);
          },
          icon: "fa-solid fa-pencil",
        },
        {
          label: `${localize("keywords.trace")} (30 ft)`,
          action: "trace2",
          callback: async (event, button, dialog) => {
            const html = dialog.element || dialog;
            let itemId = $(html).find("input[type='radio'][name='rune-selection']:checked").val();
            if (!itemId) {
              ui.notifications.warn("Please select a rune first");
              return;
            }
            addRune(
              runes.find((s) => s.id === itemId),
              { actor, token, type: "traced", action: "2" }
            );
            resolve(itemId);
          },
          icon: "fa-solid fa-pencil",
        }
      );
    }

    // Add Engraving Strike button
    if (!options?.etchOnly && !options?.traceOnly) {
      buttons.push({
        label: localize("keywords.engravingStrike"),
        action: "engravingStrike",
        callback: async (event, button, dialog) => {
          const html = dialog.element || dialog;
          let itemId = $(html).find("input[type='radio'][name='rune-selection']:checked").val();
          if (!itemId) {
            ui.notifications.warn("Please select a rune first");
            return;
          }
          await performEngravingStrike(
            runes.find((s) => s.id === itemId),
            { actor, token }
          );
          resolve(itemId);
        },
        icon: "fa-solid fa-sword",
      });
    }

    foundry.applications.api.DialogV2.wait({
      window: {
        title: localize("dialog.etch-trace.title"),
        controls: [
          {
            action: "kofi",
            label: "Support Dev",
            icon: "fa-solid fa-mug-hot fa-beat-fade",
            onClick: () => window.open("https://ko-fi.com/chasarooni", "_blank"),
          },
        ],
        icon: "fas fa-stamp",
      },
      content,
      buttons,
      render: (_event, app) => {
        const html = app.element ? app.element : app;
        
        // Handle row clicks to select radio
        $(html).find(".rune-row-vertical").on("click", function(e) {
          if (e.target.tagName !== 'INPUT') {
            $(html).find(".rune-row-vertical").removeClass("selected");
            $(this).addClass("selected");
            $(this).find("input[type='radio']").prop("checked", true);
          }
        });

        // Attach right-click listener for free etching
        $(html).find(".rune-row-vertical").on("contextmenu", async function (event) {
          event.preventDefault();
          const runeId = $(this).find("input[type=radio]").val();
          const runeObj = runes.find((s) => s.id === runeId);
          await addRune(runeObj, {
            actor,
            token,
            type: "etched",
            free: true,
          });
          ui.notifications.info(`Free etched: ${runeObj.name}`);
          resolve(runeId);
        });
      },
      position: { width: 500, height: 550 },
    });
  });
  return image;
}

/**
 * Performs an Engraving Strike - makes a melee strike and traces a rune on hit
 */
async function performEngravingStrike(rune, { actor, token }) {
  // Check for equipped melee weapons
  const meleeWeapons = actor.itemTypes.weapon.filter(w => 
    w.isEquipped && w.isMelee
  );

  if (meleeWeapons.length === 0) {
    ui.notifications.error("You must have an equipped melee weapon to use Engraving Strike");
    return;
  }

  // Select weapon
  let selectedWeapon;
  if (meleeWeapons.length === 1) {
    selectedWeapon = meleeWeapons[0];
  } else {
    // Show weapon selection dialog
    let weaponContent = `
      <form>
        <div class="form-group">
          <label><strong>Select a melee weapon:</strong></label>
          <select name="weaponId" style="width: 100%; margin-top: 8px;">
            ${meleeWeapons.map(w => 
              `<option value="${w.id}">${w.name}</option>`
            ).join('')}
          </select>
        </div>
      </form>
    `;

    const weaponId = await foundry.applications.api.DialogV2.wait({
      window: {
        title: "Engraving Strike: Select Weapon",
        icon: "fas fa-sword",
      },
      content: weaponContent,
      buttons: [
        {
          action: "select",
          label: "Select",
          icon: "fas fa-check",
          callback: (event, button, dialog) => {
            const html = dialog.element;
            return html.querySelector('select[name="weaponId"]').value;
          }
        },
        {
          action: "cancel",
          label: "Cancel",
          icon: "fas fa-times",
        }
      ],
      position: { width: 400 },
    });

    if (!weaponId) return;
    selectedWeapon = meleeWeapons.find(w => w.id === weaponId);
  }

  // Check if we have a target
  const currentTargets = Array.from(game.user.targets);
  if (currentTargets.length === 0) {
    ui.notifications.warn("Please target a token for your Engraving Strike");
    return;
  }

  // Make the strike roll
  try {
    const strikeAction = selectedWeapon;
    
    // Post the strike to chat
    await strikeAction.toMessage(null, { rollMode: game.settings.get("core", "rollMode") });

    // Ask if the strike hit
    const hitResult = await foundry.applications.api.DialogV2.wait({
      window: {
        title: "Engraving Strike Result",
        icon: "fas fa-dice-d20",
      },
      content: `
        <div style="text-align: center; padding: 20px;">
          <h3>Did your strike with ${selectedWeapon.name} hit?</h3>
          <p>If the strike was successful, the rune <strong>${rune.name}</strong> will be traced on the target.</p>
        </div>
      `,
      buttons: [
        {
          action: "hit",
          label: "Hit - Trace Rune",
          icon: "fas fa-check-circle",
          callback: () => true
        },
        {
          action: "miss",
          label: "Miss - No Trace",
          icon: "fas fa-times-circle",
          callback: () => false
        }
      ],
      position: { width: 450 },
    });

    if (hitResult) {
      // Strike hit - trace the rune on the targets
      const targets = currentTargets.map(targetToken => ({
        type: 'person',
        token: targetToken.id,
        actor: targetToken.actor?.id,
        location: 'actor',
        personName: getAllowedTokenName(targetToken),
        img: getTokenImage(targetToken),
        item: null,
        objectName: null
      }));

      // Process each target
      for (const target of targets) {
        let runes = actor.getFlag(MODULE_ID, "runes");
        const id = foundry.utils.randomID();

        runes.traced.push({
          rune,
          target,
          id,
        });

        game.pf2eRunesmithAssistant.socket.executeAsGM("createTraceEffect", {
          rune,
          target,
          tokenID: token.id,
          id,
          type: "traced",
        });
        
        await actor.setFlag(MODULE_ID, "runes", runes);
        await runeAppliedMessage({ 
          actor, 
          token, 
          rune, 
          target, 
          type: "traced", 
          action: "1",
          engravingStrike: true 
        });
      }

      ui.notifications.info(`Engraving Strike successful! Traced ${rune.name} on target(s)`);
    } else {
      ui.notifications.info("Strike missed - no rune traced");
    }
  } catch (error) {
    console.error("Engraving Strike error:", error);
    ui.notifications.error("Error performing Engraving Strike");
  }
}

/**
 * Adds a rune (etch or trace)
 */
async function addRune(
  rune,
  { actor, token, type = "etched", action = 0, free }
) {
  // Skip target dialog and use currently targeted tokens
  const currentTargets = Array.from(game.user.targets);

  if (currentTargets.length === 0) {
    ui.notifications.warn("Please target at least one token before etching/tracing a rune.");
    return;
  }

  // Convert current targets to the expected format
  const targets = currentTargets.map(targetToken => ({
    type: 'person',
    token: targetToken.id,
    actor: targetToken.actor?.id,
    location: 'actor',
    personName: getAllowedTokenName(targetToken),
    img: getTokenImage(targetToken),
    item: null,
    objectName: null
  }));

  // Process each target
  for (const target of targets) {
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
}