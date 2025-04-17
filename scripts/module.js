import { setupAPI } from "./api.js";
import { setupSocket } from "./socket.js";

export const MODULE_ID = "pf2e-runesmith-assistant";

Hooks.once("init", async function () {});

Hooks.once("setup", function () {
  if (!setupSocket())
    console.error(
      "Error: Unable to set up socket lib for PF2e Runesmith Assistant"
    );
});

Hooks.once("ready", async function () {
  setupAPI();
  Hooks.on("renderCharacterSheetPF2e", (_sheet, html, character) => {
    const actor = _sheet.actor;
    if (
      character.owner &&
      (isRunesmith(actor) || hasFeat(actor, "runesmith-dedication"))
    ) {
      // Set Traced and Etched Runes
      if (!actor.getFlag(MODULE_ID, "runes"))
        actor.setFlag(MODULE_ID, "runes", {});

      //Inventoru Stuff
      // const inventoryList = html.find(
      //   ".sheet-body .inventory-list.directory-list.inventory-pane"
      // );

      // const runeButtonRegion = $(
      //   `<div class="rune-button-region actor.sheet" style="display:flex; margin-bottom:1em;"></div>`
      // );

      // //TODO Fix me
      // const manageRuneButton = $(
      //   `<button type="button" class="manage-implements-button">${game.i18n.localize(
      //     "pf2e-thaum-vuln.manageImplements.manageImplementsButton"
      //   )}</button>`
      // );
      // //TODO Fix me
      // const clearRuneButton = $(
      //   `<button type="button" class="clear-implements-button">${game.i18n.localize(
      //     "pf2e-thaum-vuln.manageImplements.clearImplementsButton"
      //   )}</button>`
      // );
      // //TODO Fix me
      // inventoryList.append(
      //   `<header>
      // <h3 class="item-name">${game.i18n.localize(
      //   "pf2e-thaum-vuln.manageImplements.implementHeader"
      // )}</h3></header>

      // `
      // );
      // runeButtonRegion.append(manageRuneButton);
      // runeButtonRegion.append(clearRuneButton);
      // inventoryList.append(runeButtonRegion);
      // $(manageRuneButton).click({ actor }, function (event) {
      //   console.log({event})
      //   //manageImplements(event);
      // });
      // $(clearRuneButton).click({ actor }, function (event) {
      //   console.log({event})
      //   //clearImplements(event);
      // });

      //EV Target Management

      const strikesList = html.find(".sheet-body .strikes-list"); // html.find(".sheet-body .option-toggles");
      const manageRunesSection = $(
        `<fieldset class="actor.sheet" style="display:flex;flex-direction:column;border:1px solid;border-radius:5px;padding:5px;"><legend>${game.i18n.localize(
          "pf2e-runesmith-automation.ui.header"
        )}</legend></fieldset>`
      );
      const runesActive = $(
        `<label for="EVActive">${game.i18n.localize(
          "pf2e-thaum-vuln.targetManagement.evActive"
        )} </label>`
      );
      const runesActiveLabel = $(`<span style="flex-direction:row;"></span>`);
      const runesModeLabel = $(
        `<label for="EVMode">${game.i18n.localize(
          "pf2e-thaum-vuln.targetManagement.evMode"
        )} </label>`
      );
      const runesTargetBtn = $(
        `<button type="button" class="target-primary-btn">${game.i18n.localize(
          "pf2e-thaum-vuln.targetManagement.evPrimaryTargetButton"
        )}</button>`
      );
      const runes = actor.getFlag(MODULE_ID, "runes");
      if (
        runes?.traced?.runes?.length > 0 ||
        runes?.etched?.runes?.length > 0
      ) {
        const EVMode = actor.getFlag("pf2e-thaum-vuln", "EVMode");
        let words;
        if (EVMode) {
          words = EVMode.split("-");
          for (let i = 0; i < words.length; i++) {
            words[i] = words[i][0].toUpperCase() + words[i].substr(1);
          }
          runesModeLabel.append(words.join(" "));
        }

        $(runesTargetBtn).click({ actor: a }, function () {
          targetEVPrimaryTarget(a);
        });
        runesActiveLabel.append(
          runesActive,
          $(
            `<span name="EVActive" style="color:#00c000;">${game.i18n.localize(
              "pf2e-thaum-vuln.targetManagement.active"
            )}</span>`
          )
        );
        manageRunesSection.append(runesActiveLabel);
        manageRunesSection.append(runesModeLabel);
        if (
          canvas.scene.tokens.filter(
            (token) =>
              token.actor?.uuid ===
              actor.getFlag("pf2e-thaum-vuln", "primaryEVTarget")
          ).length != 0
        ) {
          manageRunesSection.append(runesTargetBtn);
        } else {
          manageRunesSection.append(
            $(
              `<span style="text-align:center;color:#ff4040;">${game.i18n.localize(
                "pf2e-thaum-vuln.targetManagement.notOnScene"
              )}</span>`
            )
          );
        }
      } else {
        runesActiveLabel.append(
          runesActive,
          $(
            `<span name="EVActive" style="color:#ff4040;">${game.i18n.localize(
              "pf2e-thaum-vuln.targetManagement.inactive"
            )}</span>`
          )
        );
        manageRunesSection.append(runesActiveLabel);
      }

      manageRunesSection.insertAfter(strikesList);
    }
  });
});

const dataStructRunes = {
  traced: [
    {
      target: "",
      rune: "",
    },
  ],
  etched: [
    {
      target: "",
      rune: "",
    },
  ],
};

// Does the actor have the feat, searching by slug
function hasFeat(actor, slug) {
  return actor.itemTypes.feat.some((feat) => feat.slug === slug);
}

// Is the actor a runesmith
function isRunesmith(actor) {
  return (
    actor &&
    (actor.class?.slug === "runesmith" ||
      actor.rollOptions.all["class:runesmith"])
  );
}
