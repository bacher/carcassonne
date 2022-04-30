import { last } from 'lodash';

import {
  GameState,
  Player,
  Point,
  Zone,
  Building,
  InGameCard,
  SideType,
  Peasant,
} from '../data/types';
import {
  cellIdToCoords,
  getCellId,
  getQuadrant,
  getQuadrantDirection,
  getSideDirection,
  PossibleTurn,
} from './logic';
import { playerColors } from '../data/const';

export const CARD_SIZE = 50;

const GRID_GAP = 1;

const CELL_SIZE = CARD_SIZE + GRID_GAP;

type Size = {
  width: number;
  height: number;
};

const TOWN_STYLE = '#9b673c';

const FIELD_STYLE = '#9cffad';

const GRID_SIZE = 25;

export function render(
  ctx: CanvasRenderingContext2D,
  gameState: GameState,
  {
    size,
    viewport,
    hoverCellId,
    activeTurn,
  }: {
    size: Size;
    viewport: Point;
    hoverCellId: number | undefined;
    activeTurn: PossibleTurn | undefined;
  },
) {
  ctx.clearRect(0, 0, size.width, size.height);

  ctx.save();

  const offset = {
    x: size.width / 2 + viewport.x,
    y: size.height / 2 + viewport.y,
  };

  drawGrid(ctx, { size, offset });

  ctx.translate(offset.x, offset.y);
  for (const zone of gameState.zones.values() as unknown as Zone[]) {
    const topLeft = {
      x: zone.coords.col * CELL_SIZE,
      y: zone.coords.row * CELL_SIZE,
    };

    const peasant = zone.peasant
      ? {
          peasant: zone.peasant,
          player: gameState.players[zone.peasant.playerIndex],
        }
      : undefined;

    drawCard(ctx, {
      topLeft,
      card: zone.card,
      peasant,
    });
  }

  for (const potentialCellId of Array.from(gameState.potentialZones.values())) {
    const coords = cellIdToCoords(potentialCellId);

    const topLeft = {
      x: coords.col * CELL_SIZE,
      y: coords.row * CELL_SIZE,
    };

    drawRect(ctx, topLeft, { width: CARD_SIZE, height: CARD_SIZE }, '#cdf');
  }

  if (activeTurn) {
    const { col, row } = activeTurn.coords;
    const topLeft = {
      x: col * CELL_SIZE,
      y: row * CELL_SIZE,
    };

    drawCard(ctx, {
      topLeft,
      card: activeTurn.card,
      peasant: activeTurn.peasantPlace
        ? {
            player: gameState.players[gameState.activePlayerIndex],
            peasant: {
              playerIndex: gameState.activePlayerIndex,
              place: activeTurn.peasantPlace,
            },
          }
        : undefined,
    });
    drawRect(
      ctx,
      topLeft,
      { width: CARD_SIZE, height: CARD_SIZE },
      'rgba(255,255,255,0.5)',
    );
  }

  if (hoverCellId) {
    const { col, row } = cellIdToCoords(hoverCellId);
    const topLeft = {
      x: col * CELL_SIZE,
      y: row * CELL_SIZE,
    };

    if (!gameState.zones.has(hoverCellId)) {
      const nextCard = last(gameState.cardPool);

      let fillColor: string;

      if (nextCard) {
        drawCard(ctx, { topLeft, card: nextCard });

        if (gameState.potentialZones.has(hoverCellId)) {
          fillColor = 'rgba(255,255,255,0.2)';
        } else {
          fillColor = 'rgba(255,255,255,0.6)';
        }
      } else {
        fillColor = 'rgba(255,0,0,0.1)';
      }

      drawRect(
        ctx,
        topLeft,
        { width: CARD_SIZE, height: CARD_SIZE },
        fillColor,
      );
    }
  }

  ctx.restore();
}

export function drawCard(
  ctx: CanvasRenderingContext2D,
  {
    topLeft = { x: 0, y: 0 },
    card,
    peasant,
  }: {
    topLeft?: Point;
    card: InGameCard;
    peasant?: {
      peasant: Peasant;
      player: Player;
    };
  },
): void {
  const { sides, unions } = card;

  const center = {
    x: topLeft.x + CARD_SIZE / 2,
    y: topLeft.y + CARD_SIZE / 2,
  };

  drawRect(ctx, topLeft, { width: CARD_SIZE, height: CARD_SIZE }, FIELD_STYLE);

  // Draw roads
  for (const union of unions) {
    if (union.unionSideType === SideType.ROAD) {
      if (union.unionSides.length === 1) {
        const side = union.unionSides[0];

        drawLine(
          ctx,
          getSideCenter(topLeft, side),
          getSideOffsetCenter(topLeft, side, CARD_SIZE / 3),
          '#000',
        );
      } else if (union.unionSides.length === 2) {
        const [side1, side2] = union.unionSides;
        const roadStart = getSideCenter(topLeft, side1);
        const roadEnd = getSideCenter(topLeft, side2);

        if (side1 % 2 === side2 % 2) {
          drawLine(ctx, roadStart, roadEnd, '#000');
        } else {
          const arcCenter = {
            x: roadStart.x !== center.x ? roadStart.x : roadEnd.x,
            y: roadStart.y !== center.y ? roadStart.y : roadEnd.y,
          };

          ctx.save();
          ctx.beginPath();
          ctx.rect(topLeft.x, topLeft.y, CARD_SIZE, CARD_SIZE);
          ctx.clip();

          ctx.beginPath();
          ctx.arc(arcCenter.x, arcCenter.y, CARD_SIZE / 2, 0, 2 * Math.PI);
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#000';
          ctx.stroke();
          ctx.restore();
        }
      } else {
        throw new Error();
      }
    }
  }

  const roadsCount = sides.filter((side) => side === SideType.ROAD).length;
  if (roadsCount >= 3) {
    drawCircle(
      ctx,
      { x: topLeft.x + CARD_SIZE / 2, y: topLeft.y + CARD_SIZE / 2 },
      CARD_SIZE / 6,
      '#aaa',
    );
  }

  // Draw towns
  for (const union of unions) {
    if (union.unionSideType === SideType.TOWN) {
      switch (union.unionSides.length) {
        case 1: {
          const side = union.unionSides[0];
          const [p1, p2] = getSideLine(topLeft, side);
          const outerCenter = getSideOffsetCenter(topLeft, side);
          drawPolygon(ctx, [p1, p2, outerCenter], TOWN_STYLE);
          break;
        }
        case 2: {
          const [side1, side2] = union.unionSides;

          if (side1 % 2 === side2 % 2) {
            for (const side of union.unionSides) {
              const [p1, p2] = getSideLine(topLeft, side);
              drawPolygon(
                ctx,
                [
                  p1,
                  p2,
                  getSideOffsetCenter(topLeft, side, (3 / 4) * CARD_SIZE),
                ],
                TOWN_STYLE,
              );
            }
          } else {
            const polygon = [];
            for (const side of union.unionSides) {
              polygon.push(...getSideLine(topLeft, side));
            }
            drawPolygon(ctx, polygon, TOWN_STYLE);
          }
          break;
        }
        case 3: {
          const polygon = [];

          for (let i = 0; i < sides.length; i += 1) {
            const side = sides[i];
            const [p1, p2] = getSideLine(topLeft, i);

            if (side === SideType.TOWN) {
              polygon.push(p1, p2);
            } else {
              polygon.push(
                p1,
                getSideOffsetCenter(topLeft, i, CARD_SIZE / 3),
                p2,
              );
            }
          }

          drawPolygon(ctx, polygon, TOWN_STYLE);
          break;
        }
        case 4:
          drawRect(
            ctx,
            topLeft,
            { width: CARD_SIZE, height: CARD_SIZE },
            TOWN_STYLE,
          );
          break;
        default:
          throw new Error();
      }
    }
  }

  if (card.isPrimeTown) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const townUnion = card.unions.find(
      (union) => union.unionSideType === SideType.TOWN,
    )!;

    let townCenter;

    if (townUnion.unionSides.length === 2) {
      const [side1, side2] = townUnion.unionSides;
      const roadDirection = getQuadrantDirection(getQuadrant(side1, side2));
      townCenter = {
        x: center.x + roadDirection.x * CARD_SIZE * 0.2,
        y: center.y + roadDirection.y * CARD_SIZE * 0.2,
      };
    } else {
      townCenter = center;
    }

    drawShield(ctx, townCenter);
  }

  if (card.building === Building.Monastery) {
    drawText(ctx, center, 'M', '#000');
  }

  // Draw Peasants
  if (peasant) {
    let position: Point;

    if (peasant.peasant.place.type === 'CENTER') {
      position = center;
    } else {
      const union = card.unions[peasant.peasant.place.unionIndex];
      if (union.unionSides.length === 1) {
        const dir = getSideDirection(union.unionSides[0]);
        position = {
          x: center.x + dir.x * CARD_SIZE * 0.4,
          y: center.y + dir.y * CARD_SIZE * 0.4,
        };
      } else if (union.unionSides.length === 2) {
        const [side1, side2] = union.unionSides;
        const dir = getQuadrantDirection(getQuadrant(side1, side2));
        position = {
          x: center.x + dir.x * CARD_SIZE * 0.148,
          y: center.y + dir.y * CARD_SIZE * 0.148,
        };
      } else {
        position = center;
      }
    }

    drawCircle(ctx, position, 5, playerColors[peasant.player.color]);
  }
}

function drawShield(ctx: CanvasRenderingContext2D, { x, y }: Point): void {
  ctx.beginPath();
  ctx.moveTo(x - CARD_SIZE / 5, y - CARD_SIZE / 6);
  ctx.lineTo(x + CARD_SIZE / 5, y - CARD_SIZE / 6);
  ctx.lineTo(x, y + CARD_SIZE / 5);
  ctx.closePath();
  ctx.fillStyle = '#4b85e8';
  ctx.fill();
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
        { x: x + CARD_SIZE, y: y + CARD_SIZE },
        { x, y: y + CARD_SIZE },
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
  offset = CARD_SIZE / 4,
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
  color: string,
): void {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
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
  color: string,
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
  color: string,
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
  color: string,
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
  color: string,
): void {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(text, x, y);
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  { size, offset }: { size: Size; offset: Point },
): void {
  ctx.save();
  ctx.translate(offset.x - 0.5, offset.y - 0.5);
  ctx.beginPath();
  for (let i = -GRID_SIZE; i < GRID_SIZE; i += 1) {
    ctx.moveTo(i * CELL_SIZE, -GRID_SIZE * CELL_SIZE);
    ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
  }
  for (let j = -GRID_SIZE; j < GRID_SIZE; j += 1) {
    ctx.moveTo(-GRID_SIZE * CELL_SIZE, j * CELL_SIZE);
    ctx.lineTo(GRID_SIZE * CELL_SIZE, j * CELL_SIZE);
  }
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = '#333';
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = '#fff';
  ctx.fillStyle = '#444';
  ctx.lineWidth = 5;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '12px sans-serif';
  for (let i = -GRID_SIZE; i < GRID_SIZE; i += 1) {
    const label = `${i}`;
    const x = i * CELL_SIZE + CARD_SIZE / 2 + offset.x;
    const y1 = 10;
    const y2 = size.height - y1;

    ctx.strokeText(label, x, y1, CARD_SIZE);
    ctx.fillText(label, x, y1, CARD_SIZE);
    ctx.strokeText(label, x, y2, CARD_SIZE);
    ctx.fillText(label, x, y2, CARD_SIZE);
  }
  for (let j = -GRID_SIZE; j < GRID_SIZE; j += 1) {
    const label = `${j}`;
    const y = j * CELL_SIZE + CARD_SIZE / 2 + offset.y;
    const x1 = 10;
    const x2 = size.width - x1;

    ctx.strokeText(label, x1, y, CARD_SIZE);
    ctx.fillText(label, x1, y, CARD_SIZE);
    ctx.strokeText(label, x2, y, CARD_SIZE);
    ctx.fillText(label, x2, y, CARD_SIZE);
  }
  ctx.restore();
}

export function getCellByPoint(
  { size, viewport }: { size: Size; viewport: Point },
  { x, y }: Point,
): number {
  const innerX = x - viewport.x - size.width / 2;
  const innerY = y - viewport.y - size.height / 2;

  const col = Math.floor(innerX / CELL_SIZE);
  const row = Math.floor(innerY / CELL_SIZE);

  return getCellId({ col, row });
}
