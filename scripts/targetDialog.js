export function showDynamicTargetForm() {
  const formData = {
    type: null,
    item: null,
    token: null,
    actor: null,
    location: null,
  };

  return new Promise((resolve) => {
    new Dialog(
      {
        title: "Complete Workflow Form",
        content: `
          <style>
            .form-section { margin-bottom: 20px; }
            .option-row { display: flex; gap: 10px; margin: 10px 0; }
            .option-button {
              padding: 10px 20px;
              border: 1px solid #999;
              border-radius: 3px;
              cursor: pointer;
              flex: 1;
              text-align: center;
            }
            .option-button.active {
              background: #FFD700;
              border-color: #FFD700;
              font-weight: bold;
            }
            .token-selector {
              display: flex;
              gap: 10px;
              flex-wrap: wrap;
              max-height: 200px;
              overflow-y: auto;
              margin: 10px 0;
            }
            .token-card {
              text-align: center;
              cursor: pointer;
              border: 2px solid transparent;
              padding: 5px;
              border-radius: 3px;
            }
            .token-card.selected {
              border-color: #FFD700;
              background: rgba(255,215,0,0.1);
            }
            .token-card img {
              width: 60px;
              height: 60px;
              border-radius: 3px;
            }
            .hidden { display: none; }
          </style>
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
  
          <div class="form-section hidden" id="token-section">
            <h3>Select Token</h3>
            <div class="token-selector" id="token-list"></div>
          </div>
  
          <div class="form-section hidden" id="location-section">
            <h3>Item Location</h3>
            <div class="option-row">
              <div class="option-button" data-location="actor">On Person</div>
              <div class="option-button" data-location="item">On Item</div>
            </div>
          </div>
  
          <div class="form-section hidden" id="item-name-section">
            <h3>Item Name</h3>
            <input type="text" id="itemNameInput" placeholder="Enter item name">
          </div>
        `,
        buttons: {
          submit: {
            icon: '<i class="fas fa-check"></i>',
            label: "Submit",
            callback: (html) => {
              // Gather final data
              resolve(formData);
            },
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Cancel",
          },
        },
        render: (html) => {
          // Type selection
          html.find("#type-section .option-button").click((ev) => {
            formData.type = ev.currentTarget.dataset.type;
            html.find("#type-section .option-button").removeClass("active");
            ev.currentTarget.classList.add("active");

            // Show appropriate sections
            if (formData.type === "object") {
              html.find("#object-section").removeClass("hidden");
              html.find("#token-section").addClass("hidden");
            } else {
              html.find("#object-section").addClass("hidden");
              html.find("#token-section").removeClass("hidden");
              loadTokens(html);
            }
          });

          // Object name input
          html.find("#objectName").change((ev) => {
            formData.object = ev.target.value;
          });

          // Location selection
          html.find("#location-section .option-button").click((ev) => {
            formData.location = ev.currentTarget.dataset.location;
            html.find("#location-section .option-button").removeClass("active");
            ev.currentTarget.classList.add("active");

            if (formData.location === "item") {
              html.find("#item-name-section").removeClass("hidden");
            } else {
              html.find("#item-name-section").addClass("hidden");
            }
          });

          // Item name input
          html.find("#itemNameInput").change((ev) => {
            formData.item = ev.target.value;
          });
        },
      },
      { width: 600, height: "auto" }
    ).render(true);

    function loadTokens(html) {
      let availableTokens = [];
      availableTokens = [
        ...game.canvas.tokens.controlled,
        ...game.user.targets.toObject(),
      ];
      const tokenList = html.find("#token-list");
      tokenList.empty();

      availableTokens.forEach((token) => {
        tokenList.append(`
            <div class="token-card" data-token-id="${token.id}">
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
        formData.img = getTokenImage(token);
        html.find(".token-card").removeClass("selected");
        ev.currentTarget.classList.add("selected");
        html.find("#location-section").removeClass("hidden");
      });
    }
  });
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
