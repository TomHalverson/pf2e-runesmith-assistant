export function setupHooks() {
  Hooks.on("preDeleteItem", async (effect, _misc, _userID) => {
    if (!game.user.isGM) return;
    if (effect.type !== "effect") return;
    //TODO find a way to track this back to the original token/actor
    // Expirey causes the toggle to also expire
  });
}
