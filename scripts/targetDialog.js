// Handlebars template for the dialog content
const TEMPLATE = `
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

      // Apply styles directly via JavaScript
      const applyStyles = () => {
        // Style the token selector container
        const tokenSelector = $(html).find('.token-selector');
        tokenSelector.css({
          'display': 'flex',
          'gap': '8px',
          'flex-wrap': 'wrap',
          'max-height': '180px',
          'overflow-y': 'auto',
          'margin': '10px 0',
          'padding': '5px',
          'background': 'rgba(0, 0, 0, 0.1)',
          'border-radius': '4px'
        });

        // Style token cards
        const tokenCards = $(html).find('.token-card');
        tokenCards.css({
          'position': 'relative',
          'cursor': 'pointer',
          'text-align': 'center',
          'border': '2px solid transparent',
          'padding': '4px',
          'border-radius': '4px',
          'max-width': '70px',
          'min-width': '70px',
          'flex-shrink': '0',
          'background': 'rgba(255, 255, 255, 0.05)'
        });

        // Style token images - THIS IS THE KEY FIX
        const tokenImages = $(html).find('.token-card img');
        tokenImages.css({
          'width': '45px',
          'height': '45px',
          'border-radius': '3px',
          'object-fit': 'cover',
          'display': 'block',
          'margin': '0 auto 3px auto',
          'border': '1px solid rgba(255, 255, 255, 0.2)'
        });

        // Style token names
        const tokenNames = $(html).find('.token-card div');
        tokenNames.css({
          'font-size': '10px',
          'line-height': '1.1',
          'word-wrap': 'break-word',
          'max-width': '65px',
          'margin': '0 auto',
          'overflow': 'hidden',
          'text-overflow': 'ellipsis',
          'white-space': 'nowrap'
        });

        // Style selected token cards
        const selectedCards = $(html).find('.token-card.selected');
        selectedCards.css({
          'border-color': 'rgb(234, 74, 114)',
          'background': 'rgba(234, 74, 114, 0.2)'
        });

        // Remove old checkmarks first
        $(html).find('.token-checkmark').remove();

        // Add checkmark for selected tokens
        selectedCards.each(function() {
          $(this).append('<div class="token-checkmark" style="position: absolute; top: 1px; right: 1px; background: #4CAF50; color: white; border-radius: 50%; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; z-index: 100; line-height: 1;">✓</div>');
        });

        // Style other elements
        $(html).find('.option-button').css({
          'padding': '6px 12px',
          'border': '1px solid #999',
          'border-radius': '3px',
          'cursor': 'pointer',
          'flex': '1',
          'text-align': 'center',
          'font-size': '12px',
          'background': 'rgba(255, 255, 255, 0.1)'
        });

        $(html).find('.option-button.active').css({
          'background': 'rgba(234, 74, 114, 0.5)',
          'border-color': 'rgb(234, 74, 114)',
          'font-weight': 'bold'
        });

        $(html).find('.option-row').css({
          'display': 'flex',
          'gap': '10px',
          'margin': '8px 0'
        });

        $(html).find('.form-section').css({
          'margin-bottom': '15px'
        });

        $(html).find('.selected-count').css({
          'text-align': 'center',
          'font-style': 'italic',
          'color': '#999',
          'margin-top': '6px',
          'font-size': '11px'
        });

        $(html).find('h3').css({
          'margin': '0 0 8px 0',
          'font-size': '14px'
        });

        $(html).find('input[type="text"]').css({
          'width': '100%',
          'padding': '4px 8px',
          'border': '1px solid #999',
          'border-radius': '3px',
          'background': 'rgba(255, 255, 255, 0.1)'
        });
      };

      // Apply styles immediately and after any updates
      applyStyles();

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
        // Reapply styles after content update
        setTimeout(applyStyles, 10);
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