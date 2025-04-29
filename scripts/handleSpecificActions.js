import { MODULE_ID } from "./module.js";

export async function chainOfWords() {
  if (game.user.targets.size !== 2) {
    ui.notifications.error("Please target the 2 tokens you wish to chain");
    return;
  }
  const [tokenA, tokenB] = [...game.user.targets];
  const r = new Ray(tokenA.center, tokenB.center);
  const template = await MeasuredTemplateDocument.create(
    {
      x: tokenA.center.x,
      y: tokenA.center.y,
      distance: tokenA.distanceTo(tokenB),
      t: "ray",
      direction: (r.angle * 180) / Math.PI,
      width: 5,
    },
    { parent: canvas.scene }
  );

  new Sequence({ moduleName: game.modules.get(MODULE_ID).title })
    .effect()
    .atLocation(tokenA)
    .file("jb2a.energy_beam.normal.bluepink.03")
    .stretchTo(tokenB)
    // .effect()
    // .atLocation(tokenA)
    // .file("jb2a.icon.runes.blue")
    // .scale(0.25)
    // .stretchTo(target, { tiling: true })
    // .spriteRotation(90)
    .play({ softFail: true, preload: true });
}
