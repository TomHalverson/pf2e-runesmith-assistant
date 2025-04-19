## 0.2.0 - Beta
- `Features`
  - `Character Sheet, Rune Management`
    - Allows you to see applied runes in your character sheet on the `Actions -> Encounter` tab
    - Allows for easy management of runes
      - Left Click - Invoke
      - Right Click - Dispel
    - Adds easy access to the `Invoke Runes` Menu and the `Etch & Trace Menu` as buttons
  - `Hover Highlighting`
    - Adds token Highlighting when hovering applied `Etched` or `Traced` runes
    - This works both in the character sheet rune management, but also in the `Invoke Runes` menu

## 0.1.0 - Alpha

- Alpha release cause I figured it is in a usable enough state atm
- `Features`
  - `Etch & Trace Runes`
    - Use the `Etch and Trace Runes` macro to etch and trace runes
    - You must have runesmith runes in your character's inventory
    - Options for applying them to characters are based on who you have targeted
    - The text boxes for `object` and `item` are entirely flavor to just keep track of things
    - Note this will apply a dynamically generated effect to the appropriate actor as well as apply an interior effects of this item to that actor using `grantedItem` rule elements
    - Doing either action sends the appropriate action to chat
  - `Invoke Runes`
    - Use the `Invoke Runes` runes macro to invoke and dispel runes
    - You must have runes that have been `etched` or `traced`
    - `Dispel` - Just an option in the settings to get rid of a rune without invoking it for debug purposes
      - Removes any relevant rune effects
    - `Invoke`
      - Will send a message to chat marking invocation (it grabs the part of the text after Invocation an grabs any relevant traits)
      - Removes any relevant rune effects
  - `Rune Effect Removal`
    - Removing any rune effects will also remove them from the applied runes list (IE the Etched and Traced runes)
  - `Rune Repertoire`
    - Added a container called `Rune Repertoire` to compendium, it only exists just so it's easier to sort runes out of the way
  - `Known Broken`
    - Some of the styling for the dialog affects chat messsages
    - The `Character Sheet` action UI section is just placeholders borrowed from `PF2e Exploit Vulnerability`
