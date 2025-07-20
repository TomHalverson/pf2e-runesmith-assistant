// Handlebars template for the dialog content
const TEMPLATE = `
<style>
.token-card {
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
}

.token-card.selected::after {
  content: "✓";
  position: absolute;
  top: 4px;
  right: 4px;
  background: #4CAF50;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.selected-count {
  text-align: center;
  font-style: italic;
  color: #666;
  margin-top: 8px;
}

.token-selector small {
  font-weight: normal;
  opacity: 0.7;
}
</style>

<div class="runesmith-target-dialog">
  <div class="form-section" id="type-section">
    <h3>Target Type</h3>
    <div class="option-row">
      <div class="option-button {{#if (eq type 'object')}}active{{/if}}" data-type="object">
        Unattended Object
      </div>
      <div class="option-button {{#if (eq type 'person')}}active{{/if}}" data-type="person">
        Person
      </div>
    </div>
  </div>

  {{#if (eq type 'object')}}
  <div class="form-section" id="object-section">
    <h3>Object Name</h3>
    <input type="text" id="objectName" placeholder="Enter object name" value="{{objectName}}">
  </div>
  {{/if}}

  {{#if (eq type 'person')}}
  <div class="form-section" id="token-section">
    <h3>Select Token(s) <small>(Shift+Click for multiple)</small></h3>
    <div class="token-selector" id="token-list">
      {{#each availableTokens}}
      <div class="token-card {{#if (includes ../selectedTokens this.id)}}selected{{/if}}" 
           data-token-id="{{this.id}}">
        <img src="{{this.img}}">
        <div>{{this.name}}</div>
      </div>
      {{/each}}
    </div>
    {{#if (gt selectedTokens.length 1)}}
    <div class="selected-count">{{selectedTokens.length}} tokens selected</div>
    {{/if}}
  </div>
  {{/if}}

  {{#if (gt selectedTokens.length 0)}}
  <div class="form-section" id="location-section">
    <h3>Item Location</h3>
    <div class="option-row">
      <div class="option-button {{#if (eq location 'actor')}}active{{/if}}" data-location="actor">
        On Person
      </div>
      <div class="option-button {{#if (eq location 'item')}}active{{/if}}" data-location="item">
        On Item
      </div>
    </div>
  </div>
  {{/if}}

  {{#if (eq location 'item')}}
  <div class="form-section" id="item-name-section">
    <h3>Item Name</h3>
    <input type="text" id="itemNameInput" placeholder="Enter item name" value="{{itemName}}">
  </div>
  {{/if}}
</div>
`;

// Register Handlebars helpers if not already registered
if (!Handlebars.helpers.eq) {
  Handlebars.registerHelper('eq', function (a, b) {
    return a === b;
  });
}

if (!Handlebars.helpers.includes) {
  Handlebars.registerHelper('includes', function (array, value) {
    return array?.includes(value);
  });
}

if (!Handlebars.helpers.gt) {
  Handlebars.registerHelper('gt', function (a, b) {
    return a > b;
  });
}

export function showDynamicTargetForm() {
  // Initial form data state
  let formData = {
    type: 'person', // Default to person
    objectName: '',
    selectedTokens: [], // Changed to array for multiple selection
    location: 'actor', // Default location
    itemName: '',
    availableTokens: [],
    // Final output data - will contain arrays for multiple tokens
    tokens: [],
    actors: [],
    personNames: [],
    imgs: [],
    item: null
  };

  // Load available tokens
  function loadAvailableTokens() {
    const tokens = [
      ...new Set([
        ...game.canvas.tokens.placeables.filter(
          (t) => t?.actor?.id === game?.user?.character?.id
        ),
        ...game.canvas.tokens.controlled,
        ...game.user.targets.toObject(),
      ]),
    ];

    formData.availableTokens = tokens.map(token => ({
      id: token.id,
      name: getAllowedTokenName(token),
      img: getTokenImage(token),
      token: token
    }));

    // Auto-select first targeted token or first available
    const targetedTokens = game.user.targets.toObject();
    const preselectedTokens = targetedTokens.length > 0 ? targetedTokens :
      (formData.availableTokens.length === 1 ? [formData.availableTokens[0].token] : []);

    if (preselectedTokens.length > 0) {
      setSelectedTokens(preselectedTokens);
    }
  }

  function setSelectedTokens(tokens) {
    formData.selectedTokens = tokens.map(token => token.id);
    formData.tokens = tokens.map(token => token.id);
    formData.actors = tokens.map(token => token?.actor?.id);
    formData.personNames = tokens.map(token => getAllowedTokenName(token));
    formData.imgs = tokens.map(token => getTokenImage(token?.object || token));
  }

  function toggleTokenSelection(token, isShiftClick) {
    const tokenId = token.id;
    const currentIndex = formData.selectedTokens.indexOf(tokenId);

    if (isShiftClick) {
      // Multi-select mode
      if (currentIndex === -1) {
        // Add to selection
        formData.selectedTokens.push(tokenId);
      } else {
        // Remove from selection
        formData.selectedTokens.splice(currentIndex, 1);
      }
    } else {
      // Single select mode (replace current selection)
      formData.selectedTokens = [tokenId];
    }

    // Update the corresponding data arrays
    const selectedTokenObjects = formData.availableTokens
      .filter(t => formData.selectedTokens.includes(t.id))
      .map(t => t.token);

    setSelectedTokens(selectedTokenObjects);
  }

  function renderTemplate() {
    return Handlebars.compile(TEMPLATE)(formData);
  }

  // Initialize data
  loadAvailableTokens();

  let dialog;

  return foundry.applications.api.DialogV2.wait({
    window: {
      title: "Select Rune Targets",
      controls: [
        {
          action: "kofi",
          label: "Support Dev",
          icon: "fa-solid fa-mug-hot fa-beat-fade",
          onClick: () => window.open("https://ko-fi.com/chasarooni", "_blank"),
        },
      ],
      icon: "fas fa-bullseye-pointer",
    },
    content: renderTemplate(),
    position: { width: 600 },
    buttons: [
      {
        action: "submit",
        icon: 'fas fa-check',
        label: "Submit",
        callback: (html) => {
          // Return an array of objects, each matching the original single token format
          if (formData.type === 'object') {
            // For objects, return single entry with object data
            return [{
              type: formData.type,
              item: formData.itemName || null,
              token: null,
              actor: null,
              location: formData.location,
              personName: null,
              img: null,
              objectName: formData.objectName || null
            }];
          } else {
            // For persons, return one object per selected token
            return formData.tokens.map((tokenId, index) => ({
              type: formData.type,
              item: formData.itemName || null,
              token: tokenId,
              actor: formData.actors[index],
              location: formData.location,
              personName: formData.personNames[index],
              img: formData.imgs[index],
              objectName: null
            }));
          }
        },
      },
      {
        action: "cancel",
        icon: 'fas fa-times',
        label: "Cancel",
        callback: (html) => {
          return null
        }
      },
    ],
    render: (_event, app) => {
      dialog = app;
      const html = app.element ? app.element : app;

      // Type selection handler
      $(html).on('click', '#type-section .option-button', (ev) => {
        const newType = ev.currentTarget.dataset.type;
        if (formData.type !== newType) {
          formData.type = newType;

          // Reset dependent fields when changing type
          if (newType === 'object') {
            formData.selectedTokens = [];
            formData.location = 'actor';
          } else {
            formData.objectName = '';
            loadAvailableTokens(); // Reload tokens when switching to person
          }

          updateDialog();
        }
      });

      // Object name input handler
      $(html).on('input', '#objectName', (ev) => {
        formData.objectName = ev.target.value;
      });

      // Token selection handler with Shift+Click support
      $(html).on('click', '.token-card', (ev) => {
        const tokenId = ev.currentTarget.dataset.tokenId;
        const tokenData = formData.availableTokens.find(t => t.id === tokenId);
        const isShiftClick = ev.shiftKey;

        if (tokenData) {
          toggleTokenSelection(tokenData.token, isShiftClick);
          updateDialog();
        }
      });

      // Location selection handler
      $(html).on('click', '#location-section .option-button', (ev) => {
        const newLocation = ev.currentTarget.dataset.location;
        if (formData.location !== newLocation) {
          formData.location = newLocation;
          updateDialog();
        }
      });

      // Item name input handler
      $(html).on('input', '#itemNameInput', (ev) => {
        formData.itemName = ev.target.value;
      });

      // Function to update dialog content
      function updateDialog() {
        const newContent = renderTemplate();
        $(html).find(".runesmith-target-dialog").html(newContent);
      }
    }
  });
}

// Helper functions remain the same
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