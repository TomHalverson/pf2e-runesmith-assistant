const MODULE_ID = "pf2e-runesmith-automation";

Hooks.once("init", async function () {});

Hooks.once("ready", async function () {
  Hooks.on("renderCharacterSheetPF2e", (_sheet, html, character) => {
    const actor = _sheet.actor;
    if (
      character.owner &&
      (isRunesmith(actor) || hasFeat(actor, "runesmith-dedication"))
    ) {
      // Set Traced and Etched Runes
      if (!actor.getFlag(MODULE_ID, "runes")) actor.setFlag(MODULE_ID, "runes", {});
    }
    const inventoryList = html.find(
      ".sheet-body .inventory-list.directory-list.inventory-pane"
    );

    const runeButtonRegion = $(
      `<div class="rune-button-region actor.sheet" style="display:flex; margin-bottom:1em;"></div>`
    );

    //TODO Fix me
    const manageRuneButton = $(
      `<button type="button" class="manage-implements-button">${game.i18n.localize(
        "pf2e-thaum-vuln.manageImplements.manageImplementsButton"
      )}</button>`
    );
    //TODO Fix me
    const clearRuneButton = $(
      `<button type="button" class="clear-implements-button">${game.i18n.localize(
        "pf2e-thaum-vuln.manageImplements.clearImplementsButton"
      )}</button>`
    );
    //TODO Fix me
    inventoryList.append(
      `<header>
    <h3 class="item-name">${game.i18n.localize(
      "pf2e-thaum-vuln.manageImplements.implementHeader"
    )}</h3></header>
    
    `
    );
    runeButtonRegion.append(manageRuneButton);
    runeButtonRegion.append(clearRuneButton);
    inventoryList.append(runeButtonRegion);
    $(manageRuneButton).click({ actor }, function (event) {
      console.log({event})
      //manageImplements(event);
    });
    $(clearRuneButton).click({ actor }, function (event) {
      console.log({event})
      //clearImplements(event);
    });
  });
});

const dataStructRunes = {
  traced: {
    runes: [
      {
        target: "",
        rune: "",
      },
    ],
  },
  etched: {
    max: 2,
    runes: [
      {
        target: "",
        rune: "",
      },
    ],
  },
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
