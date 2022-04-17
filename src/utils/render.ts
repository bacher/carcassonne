type GameState = {};

export function render(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.beginPath();
  ctx.rect(0, 0, 100, 100);
  ctx.fillStyle = '#000';
  ctx.closePath();
  ctx.fill();
}
