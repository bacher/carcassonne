import type { GameState } from '../data/types';
import { Building, cardsById, SideType } from '../data/cards';
import { rotateCardInfo } from './logic';

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

export function render(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.save();
  ctx.translate(400, 300);

  drawGrid(ctx);

  for (const zone of state.zones) {
    const topLeft = {
      x: zone.coordinates[0] * CELL_SIZE,
      y: zone.coordinates[1] * CELL_SIZE,
    };

    const center = {
      x: topLeft.x + CARD_SIZE / 2,
      y: topLeft.y + CARD_SIZE / 2,
    };

    const cardInfo = cardsById[zone.cardId];

    if (!cardInfo) {
      throw Error();
    }

    const rotatedCardInfo = rotateCardInfo(cardInfo, zone.orientation);
    const { sides } = rotatedCardInfo;

    drawRect(
      ctx,
      topLeft,
      { width: CARD_SIZE, height: CARD_SIZE },
      FIELD_STYLE
    );

    // for (let i = 0; i < sides.length; i++) {
    //   const side = sides[i];
    //   const [p1, p2] = getSideLine(topLeft, i);
    //
    //   switch (side) {
    //     case SideType.GROUND:
    //     case SideType.ROAD: {
    //       drawLine(ctx, p1, p2, '#0f0');
    //     }
    //   }
    // }

    // Draw roads and fields
    for (let i = 0; i < sides.length; i++) {
      const side = sides[i];

      switch (side) {
        case SideType.GROUND:
        case SideType.ROAD: {
          if (side === SideType.ROAD) {
            const roadStart = getSideCenter(topLeft, i);
            const connect = rotatedCardInfo.connects[i];

            if (connect) {
              for (let j = i + 1; j < rotatedCardInfo.connects.length; j++) {
                if (i !== j && connect === rotatedCardInfo.connects[j]) {
                  drawLine(ctx, roadStart, getSideCenter(topLeft, j), '#000');
                }
              }
            } else {
              drawLine(ctx, roadStart, getSideInnerCenter(topLeft, i), '#000');
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
      drawRect(
        ctx,
        topLeft,
        { width: CARD_SIZE, height: CARD_SIZE },
        TOWN_STYLE
      );
    } else if (townsCount === 3) {
      const polygon = [];

      for (let i = 0; i < sides.length; i++) {
        const side = sides[i];

        const [p1, p2] = getSideLine(topLeft, i);

        if (side === SideType.TOWN) {
          polygon.push(p1, p2);
        } else {
          polygon.push(p1, getSideInnerCenter(topLeft, i), p2);
        }
      }

      drawPolygon(ctx, polygon, TOWN_STYLE);
    } else {
      for (let i = 0; i < sides.length; i++) {
        const side = sides[i];
        const [p1, p2] = getSideLine(topLeft, i);

        if (side === SideType.TOWN) {
          const outerCenter = getSideOuterCenter(topLeft, i);
          drawPolygon(ctx, [p1, p2, outerCenter], TOWN_STYLE);
        }
      }
    }

    if (cardInfo.building === Building.Monastery) {
      drawText(ctx, center, 'M', '#000');
    }
  }

  ctx.restore();
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

function getSideInnerCenter(topLeft: Point, side: number): Point {
  const { x, y } = topLeft;

  switch (side) {
    case 0:
      return { x: x + CARD_SIZE / 2, y: y + CARD_SIZE / 3 };
    case 1:
      return { x: x + (2 / 3) * CARD_SIZE, y: y + CARD_SIZE / 2 };
    case 2:
      return { x: x + CARD_SIZE / 2, y: y + (2 / 3) * CARD_SIZE };
    case 3:
      return { x: x + CARD_SIZE / 3, y: y + CARD_SIZE / 2 };
    default:
      throw new Error();
  }
}

function getSideOuterCenter(topLeft: Point, side: number): Point {
  const { x, y } = topLeft;

  const shift = CARD_SIZE / 4;

  switch (side) {
    case 0:
      return { x: x + CARD_SIZE / 2, y: y + shift };
    case 1:
      return { x: x + CARD_SIZE - shift, y: y + CARD_SIZE / 2 };
    case 2:
      return { x: x + CARD_SIZE / 2, y: y + CARD_SIZE - shift };
    case 3:
      return { x: x + shift, y: y + CARD_SIZE / 2 };
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
