import { MODULE_ID } from "./module.js";

/**
 * Gets the effect Link strings from inside
 * @param {string} description Description of the item to extract effects from
 * @returns {string[]} Array of Effect UUIDs
 */
export function getEffects(description) {
  const regex = /@UUID\[([^\]]+)\](?=\{(?:Spell )?Effect: )/g;
  return description.match(regex)?.map((str) => str?.slice(6, -1)) ?? [];
}

/**
 * Gets your selected or Character if you have one set
 * @returns {token} Your selected or owned token
 */
export function getYourToken() {
  return (
    canvas.tokens.controlled?.[0] ||
    canvas.tokens.placeables.find(
      (t) => t?.actor?.id === game?.user?.character?.id
    )
  );
}

/**
 * Get the Max Number of etched runes for an actor
 * @param {Actor} actor Actor to get max etched Runes for
 * @returns {number} Returns the max number of etched runes
 */
export function getMaxEtchedRunes(actor) {
  return 2 + Math.floor((actor.level - 1) / 4);
}

/**
 * Does the actor have the feat, searching by slug
 * @param {Actor} actor Actor
 * @param {string} slug Slug of feat
 * @returns true if has feat
 */
export function hasFeat(actor, slug) {
  return actor.itemTypes.feat.some((feat) => feat.slug === slug);
}

/**
 * Localizes String
 * @param {string} str String to localize
 * @param {Object} options Extra options for localization
 * @returns {string} localized string
 */
export function localize(str, options = {}) {
  return game.i18n.format(`${MODULE_ID}.${str}`, options);
}

/**
 * Is the actor a runesmith
 * @param {Actor} actor Actor
 * @returns true if runesmith
 */
export function isRunesmith(actor) {
  return (
    actor &&
    (actor.class?.slug === "runesmith" ||
      actor.rollOptions.all["class:runesmith"])
  );
}

/**
 * Gets the image source for the token
 * @param {Token} token - The token
 * @returns {string} The image source
 */
export function getTokenImage(token) {
  return token?.ring?.enabled
    ? token?.ring?.subject?.texture ?? token?.texture?.src
    : token?.texture?.src || "icons/svg/cowled.svg";
}
