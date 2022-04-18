import type { GameState, Zone } from '../data/types';
import { Building, CardInfo, cardsById, SideType } from '../data/cards';

const CARD_SIZE = 50;

const GRID_GAP = 1;

const CELL_SIZE = CARD_SIZE + GRID_GAP;

type Point = {
  x: number;
  y: number;
};

type Size = {
  width: number;
  height: number;
};

const TOWN_STYLE = '#9b673c';

const FIELD_STYLE = '#9cffad';

const GRID_SIZE = 25;

export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  { width, height }: Size
) {
  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.translate(width / 2, height / 2);

  drawGrid(ctx);

  for (const zone of state.zones.values() as unknown as Zone[]) {
    const topLeft = {
      x: zone.coordinates.col * CELL_SIZE,
      y: zone.coordinates.row * CELL_SIZE,
    };

    const rotatedCardInfo = zone.rotatedCard;

    drawCard(ctx, {
      topLeft,
      cardInfo: rotatedCardInfo,
    });
  }

  ctx.restore();

  const lastCard = state.cardPool[state.cardPool.length - 1];

  if (lastCard) {
    ctx.save();
    drawRect(
      ctx,
      { x: width - CARD_SIZE - 30, y: 10 },
      { width: CARD_SIZE + 20, height: CARD_SIZE + 20 },
      '#999'
    );
    drawCard(ctx, {
      topLeft: { x: width - CARD_SIZE - 20, y: 20 },
      cardInfo: cardsById[lastCard],
    });
    ctx.restore();
  }
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  {
    topLeft,
    cardInfo,
  }: {
    topLeft: Point;
    cardInfo: CardInfo;
  }
): void {
  const { sides, connects } = cardInfo;

  const center = {
    x: topLeft.x + CARD_SIZE / 2,
    y: topLeft.y + CARD_SIZE / 2,
  };

  drawRect(ctx, topLeft, { width: CARD_SIZE, height: CARD_SIZE }, FIELD_STYLE);

  // Draw roads and fields
  for (let i = 0; i < sides.length; i++) {
    const side = sides[i];

    switch (side) {
      case SideType.GROUND:
      case SideType.ROAD: {
        if (side === SideType.ROAD) {
          const roadStart = getSideCenter(topLeft, i);
          const connect = connects[i];

          if (connect) {
            for (let j = i + 1; j < connects.length; j++) {
              if (i !== j && connect === connects[j]) {
                drawLine(ctx, roadStart, getSideCenter(topLeft, j), '#000');
              }
            }
          } else {
            drawLine(
              ctx,
              roadStart,
              getSideOffsetCenter(topLeft, i, CARD_SIZE / 3),
              '#000'
            );
          }
        }
        break;
      }
    }
  }

  const roadsCount = sides.filter((side) => side === SideType.ROAD).length;

  if (roadsCount >= 3) {
    drawCircle(
      ctx,
      { x: topLeft.x + CARD_SIZE / 2, y: topLeft.y + CARD_SIZE / 2 },
      CARD_SIZE / 6,
      '#aaa'
    );
  }

  // Draw towns
  const townsCount = sides.filter((side) => side === SideType.TOWN).length;

  if (townsCount === 4) {
    drawRect(ctx, topLeft, { width: CARD_SIZE, height: CARD_SIZE }, TOWN_STYLE);
  } else if (townsCount === 3) {
    const polygon = [];

    for (let i = 0; i < sides.length; i++) {
      const side = sides[i];

      const [p1, p2] = getSideLine(topLeft, i);

      if (side === SideType.TOWN) {
        polygon.push(p1, p2);
      } else {
        polygon.push(p1, getSideOffsetCenter(topLeft, i, CARD_SIZE / 3), p2);
      }
    }

    drawPolygon(ctx, polygon, TOWN_STYLE);
  } else {
    const firstTownSide = sides.indexOf(SideType.TOWN);
    const secondTownSide = sides.indexOf(SideType.TOWN, firstTownSide + 1);

    if (
      townsCount === 2 &&
      connects[firstTownSide] &&
      connects[firstTownSide] === connects[secondTownSide]
    ) {
      if (firstTownSide % 2 === secondTownSide % 2) {
        for (let i = 0; i < sides.length; i++) {
          if (sides[i] === SideType.TOWN) {
            const [p1, p2] = getSideLine(topLeft, i);
            drawPolygon(
              ctx,
              [p1, p2, getSideOffsetCenter(topLeft, i, (3 / 4) * CARD_SIZE)],
              TOWN_STYLE
            );
          }
        }
      } else {
        const polygon = [];
        for (let i = 0; i < sides.length; i++) {
          if (sides[i] === SideType.TOWN) {
            polygon.push(...getSideLine(topLeft, i));
          }
        }
        drawPolygon(ctx, polygon, TOWN_STYLE);
      }
    } else {
      for (let i = 0; i < sides.length; i++) {
        const side = sides[i];
        const [p1, p2] = getSideLine(topLeft, i);

        if (side === SideType.TOWN) {
          const outerCenter = getSideOffsetCenter(topLeft, i);
          drawPolygon(ctx, [p1, p2, outerCenter], TOWN_STYLE);
        }
      }
    }
  }

  if (cardInfo.building === Building.Monastery) {
    drawText(ctx, center, 'M', '#000');
  }
}

function getSideLine({ x, y }: Point, side: number): [Point, Point] {
  switch (side) {
    case 0:
      return [
        { x, y },
        { x: x + CARD_SIZE, y },
      ];
    case 1:
      return [
        { x: x + CARD_SIZE, y },
        { x: x + CARD_SIZE, y: y + CARD_SIZE },
      ];
    case 2:
      return [
        { x, y: y + CARD_SIZE },
        { x: x + CARD_SIZE, y: y + CARD_SIZE },
      ];
    case 3:
      return [
        { x, y: y + CARD_SIZE },
        { x, y },
      ];
    default:
      throw new Error();
  }
}

function getSideCenter(topLeft: Point, side: number): Point {
  const { x, y } = topLeft;

  switch (side) {
    case 0:
      return { x: x + CARD_SIZE / 2, y };
    case 1:
      return { x: x + CARD_SIZE, y: y + CARD_SIZE / 2 };
    case 2:
      return { x: x + CARD_SIZE / 2, y: y + CARD_SIZE };
    case 3:
      return { x, y: y + CARD_SIZE / 2 };
    default:
      throw new Error();
  }
}

function getSideOffsetCenter(
  topLeft: Point,
  side: number,
  offset = CARD_SIZE / 4
): Point {
  const { x, y } = topLeft;

  switch (side) {
    case 0:
      return { x: x + CARD_SIZE / 2, y: y + offset };
    case 1:
      return { x: x + CARD_SIZE - offset, y: y + CARD_SIZE / 2 };
    case 2:
      return { x: x + CARD_SIZE / 2, y: y + CARD_SIZE - offset };
    case 3:
      return { x: x + offset, y: y + CARD_SIZE / 2 };
    default:
      throw new Error();
  }
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string
): void {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawCircle(
  ctx: CanvasRenderingContext2D,
  { x, y }: Point,
  radius: number,
  color: string
): void {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#555';
  ctx.stroke();
  ctx.lineWidth = 1;
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  color: string
): void {
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.closePath();
  ctx.strokeStyle = color;
  ctx.stroke();
}

function drawRect(
  ctx: CanvasRenderingContext2D,
  { x, y }: Point,
  { width, height }: Size,
  color: string
): void {
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawText(
  ctx: CanvasRenderingContext2D,
  { x, y }: Point,
  text: string,
  color: string
): void {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(text, x, y);
}

function drawGrid(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.translate(-0.5, -0.5);
  ctx.beginPath();

  for (let i = -GRID_SIZE; i < GRID_SIZE; i++) {
    ctx.moveTo(i * CELL_SIZE, -GRID_SIZE * CELL_SIZE);
    ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
  }

  for (let j = -GRID_SIZE; j < GRID_SIZE; j++) {
    ctx.moveTo(-GRID_SIZE * CELL_SIZE, j * CELL_SIZE);
    ctx.lineTo(GRID_SIZE * CELL_SIZE, j * CELL_SIZE);
  }

  ctx.lineWidth = 0.5;
  ctx.strokeStyle = '#333';
  ctx.stroke();
  ctx.restore();
}
