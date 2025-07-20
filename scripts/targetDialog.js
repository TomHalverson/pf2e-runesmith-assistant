export function showDynamicTargetForm() {
  const formData = {
    type: null,
    item: null,
    token: null,
    actor: null,
    location: null,
  };

  return foundry.applications.api.DialogV2.wait({
    window: {
      title: "Select Rune Targets",
      controls: [
        {
          action: "kofi",
          label: "Support Dev",
          icon: "fa-solid fa-mug-hot fa-beat-fade",
          onClick: () => window.open("https://ko-fi.com/chasarooni", _blank),
        },
      ],
      icon: "fas fa-bullseye-pointer",
    },
    content: `
          <div class="runesmith-target-dialog">
            <div class="form-section" id="type-section">
              <h3>Target Type</h3>
              <div class="option-row">
                <div class="option-button" data-type="object">Unattended Object</div>
                <div class="option-button" data-type="person">Person</div>
              </div>
            </div>
    
            <div class="form-section hidden" id="object-section">
              <h3>Object Name</h3>
              <input type="text" id="objectName" placeholder="Enter object name">
            </div>
    
            <div class="form-section" id="token-section">
              <h3>Select Token</h3>
              <div class="token-selector" id="token-list"></div>
            </div>
    
            <div class="form-section" id="location-section">
              <h3>Item Location</h3>
              <div class="option-row">
                <div class="option-button active" data-location="actor">On Person</div>
                <div class="option-button" data-location="item">On Item</div>
              </div>
            </div>
    
            <div class="form-section hidden" id="item-name-section">
              <h3>Item Name</h3>
              <input type="text" id="itemNameInput" placeholder="Enter item name">
            </div>
          </div>
        `,
    position: { width: 600 },
    buttons: [
      {
        action: "submit",
        icon: 'fas fa-check',
        label: "Submit",
        callback: (html) => {
          // Gather final data
          return formData;
        },
      },
      {
        action: "cancel",
        icon: 'fas fa-times',
        label: "Cancel",
      },
    ],
    render: (_event, app) => {
      const html = app.element ? app.element : app;
      //Setup new Default
      $(html)
        .find('#type-section .option-button[data-type="person"]')
        .addClass("active");

      $(html).find("#token-section").removeClass("hidden");
      loadTokens($(html));

      // Type selection
      $(html)
        .find("#type-section .option-button")
        .click((ev) => {
          formData.type = ev.currentTarget.dataset.type;
          $(html).find("#type-section .option-button").removeClass("active");
          ev.currentTarget.classList.add("active");

          // Show appropriate sections
          if (formData.type === "object") {
            $(html).find("#object-section").removeClass("hidden");
            $(html).find("#token-section").addClass("hidden");
          } else {
            $(html).find("#object-section").addClass("hidden");
            $(html).find("#token-section").removeClass("hidden");
            loadTokens($(html));
          }
        });

      // Object name input
      $(html)
        .find("#objectName")
        .change((ev) => {
          formData.object = ev.target.value;
        });

      // Location selection
      $(html)
        .find("#location-section .option-button")
        .click((ev) => {
          formData.location = ev.currentTarget.dataset.location;
          $(html)
            .find("#location-section .option-button")
            .removeClass("active");
          ev.currentTarget.classList.add("active");

          if (formData.location === "item") {
            $(html).find("#item-name-section").removeClass("hidden");
          } else {
            $(html).find("#item-name-section").addClass("hidden");
          }
        });

      // Item name input
      $(html)
        .find("#itemNameInput")
        .change((ev) => {
          formData.item = ev.target.value;
        });
    }
  });

  function loadTokens(html) {
    let availableTokens = [];
    availableTokens = [
      ...new Set([
        ...game.canvas.tokens.placeables.filter(
          (t) => t?.actor?.id === game?.user?.character?.id
        ),
        ...game.canvas.tokens.controlled,
        ...game.user.targets.toObject(),
      ]),
    ];
    let preselectedToken = game.user.targets.first();
    if (availableTokens.length === 1) {
      preselectedToken = availableTokens[0];
    }
    formData.token = preselectedToken.id;
    formData.actor = preselectedToken?.actor?.id;
    formData.personName = getAllowedTokenName(preselectedToken);
    formData.img = getTokenImage(preselectedToken?.object || preselectedToken);
    formData.location = "actor";

    const tokenList = html.find("#token-list");
    tokenList.empty();

    availableTokens.forEach((token) => {
      tokenList.append(`
            <div class="token-card ${token.id === preselectedToken.id ? "selected" : ""
        }" data-token-id="${token.id}">
              <img src="${getTokenImage(token)}">
              <div>${token.name}</div>
            </div>
          `);
    });
    // Delegated event handler for tokens
    tokenList.on("click", ".token-card", (ev) => {
      const tokenId = ev.currentTarget.dataset.tokenId;
      const token = availableTokens.find((t) => t.id === tokenId);
      formData.token = tokenId;
      formData.actor = token?.actor?.id;
      formData.personName = getAllowedTokenName(token);
      formData.img = getTokenImage(token?.object || token);
      html.find(".token-card").removeClass("selected");
      ev.currentTarget.classList.add("selected");
      html.find("#location-section").removeClass("hidden");
      if (!formData.location) {
        formData.location = "actor";
        html
          .find('#location-section .option-button[data-location="actor"]')
          .addClass("active");
      }
    });
  }
}

// Helper function remains the same
export function getTokenImage(token) {
  return token.document.ring.enabled
    ? token.document.ring.subject.texture.src || token.document.texture.src
    : token.document.texture.src;
}

export function getAllowedTokenName(token) {
  const isOwner = token?.isOwner;
  const displayMode = token?.document?.displayName;
  const nameVisible =
    (isOwner &&
      [
        CONST.TOKEN_DISPLAY_MODES.CONTROL,
        CONST.TOKEN_DISPLAY_MODES.OWNER,
        CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
      ].includes(displayMode)) ||
    [
      CONST.TOKEN_DISPLAY_MODES.ALWAYS,
      CONST.TOKEN_DISPLAY_MODES.HOVER,
    ].includes(displayMode);
  return nameVisible ? token.name : "Unidentified Creature";
}
