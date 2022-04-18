import { CardInfo, cardsById } from '../data/cards';
import { GameState, Orientation, Zone } from '../data/types';

export function rotateCardInfo(
  cardInfo: CardInfo,
  orientation: Orientation
): CardInfo {
  if (orientation === Orientation.NORTH) {
    return cardInfo;
  }

  switch (orientation) {
    case Orientation.EAST:
      return {
        ...cardInfo,
        sides: [
          cardInfo.sides[3],
          cardInfo.sides[0],
          cardInfo.sides[1],
          cardInfo.sides[2],
        ],
        connects: [
          cardInfo.connects[3],
          cardInfo.connects[0],
          cardInfo.connects[1],
          cardInfo.connects[2],
        ],
      };
    case Orientation.SOUTH:
      return {
        ...cardInfo,
        sides: [
          cardInfo.sides[2],
          cardInfo.sides[3],
          cardInfo.sides[0],
          cardInfo.sides[1],
        ],
        connects: [
          cardInfo.connects[2],
          cardInfo.connects[3],
          cardInfo.connects[0],
          cardInfo.connects[1],
        ],
      };
    case Orientation.WEST:
      return {
        ...cardInfo,
        sides: [
          cardInfo.sides[1],
          cardInfo.sides[2],
          cardInfo.sides[3],
          cardInfo.sides[0],
        ],
        connects: [
          cardInfo.connects[1],
          cardInfo.connects[2],
          cardInfo.connects[3],
          cardInfo.connects[0],
        ],
      };
  }
}

type CellId = number;

export type CellCoords = {
  col: number;
  row: number;
};

export function getAroundCellIds({
  col,
  row,
}: {
  col: number;
  row: number;
}): CellId[] {
  return [
    getCellId(col, row - 1),
    getCellId(col + 1, row),
    getCellId(col, row + 1),
    getCellId(col - 1, row),
  ];
}

// @ts-ignore
window.getAroundCellIds = getAroundCellIds;
// @ts-ignore
window.getCellId = getCellId;
// @ts-ignore
window.cellIdToCoords = cellIdToCoords;

const BOUND = 2 ** 12;
const HALF_BOUND = BOUND / 2;

export function getCellId(col: number, row: number): CellId {
  return ((row + HALF_BOUND) << 12) + col + HALF_BOUND;
}

export function cellIdToCoords(cellId: CellId): CellCoords {
  return {
    row: (cellId >> 12) - HALF_BOUND,
    col: (cellId & 0x0fff) - HALF_BOUND,
  };
}

export function putCard(gameState: GameState, card: Zone): void {
  const cellId = getCellId(card.coordinates.col, card.coordinates.row);

  gameState.potentialZones.delete(cellId);

  gameState.zones.set(cellId, card);

  const around = getAroundCellIds(card.coordinates);
  for (const cellId of around) {
    if (!gameState.zones.has(cellId)) {
      gameState.potentialZones.add(cellId);
    }
  }
}

export function fitNextCard(gameState: GameState) {
  const nextCard = gameState.cardPool[gameState.cardPool.length - 1];

  if (!nextCard) {
    window.alert('Empty pool');
    throw new Error();
  }

  const nextCardInfo = cardsById[nextCard];

  const cells = Array.from(gameState.potentialZones.values()).map(
    cellIdToCoords
  );

  for (let i = 0; i < nextCardInfo.maxOrientation; i++) {
    const cardInfo = rotateCardInfo(nextCardInfo, i);

    for (const cell of cells) {
      const [northId, eastId, southId, westId] = getAroundCellIds(cell);
      const northCard = gameState.zones.get(northId);
      const eastCard = gameState.zones.get(eastId);
      const southCard = gameState.zones.get(southId);
      const westCard = gameState.zones.get(westId);

      if (
        (!northCard || cardInfo.sides[0] === northCard.rotatedCard.sides[2]) &&
        (!eastCard || cardInfo.sides[1] === eastCard.rotatedCard.sides[3]) &&
        (!southCard || cardInfo.sides[2] === southCard.rotatedCard.sides[0]) &&
        (!westCard || cardInfo.sides[3] === westCard.rotatedCard.sides[1])
      ) {
        putCard(gameState, {
          cardId: nextCardInfo.id,
          rotatedCard: cardInfo,
          orientation: i,
          coordinates: cell,
        });
        gameState.cardPool.pop();
        return;
      }
    }
  }

  window.alert("Can't find the place");
}
