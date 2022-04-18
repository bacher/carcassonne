import { shuffle } from 'lodash';

import { cards, cardsById, CardTypeInfo, InGameCard } from '../data/cards';
import { GameState, Zone } from '../data/types';

export function instantiateCard(card: CardTypeInfo, isPrimeTown: boolean) {
  return {
    cardTypeId: card.id,
    sides: card.sides,
    connects: card.connects,
    building: card.building,
    isPrimeTown,
  };
}

export function rotateCard(card: InGameCard): void {
  card.sides = [card.sides[3], card.sides[0], card.sides[1], card.sides[2]];
  card.connects = [
    card.connects[3],
    card.connects[0],
    card.connects[1],
    card.connects[2],
  ];
}

export type CellId = number;

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
    getCellId({ col, row: row - 1 }),
    getCellId({ col: col + 1, row }),
    getCellId({ col, row: row + 1 }),
    getCellId({ col: col - 1, row }),
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

export function getCellId({ row, col }: CellCoords): CellId {
  return ((row + HALF_BOUND) << 12) + col + HALF_BOUND;
}

export function cellIdToCoords(cellId: CellId): CellCoords {
  return {
    row: (cellId >> 12) - HALF_BOUND,
    col: (cellId & 0x0fff) - HALF_BOUND,
  };
}

export function putCard(gameState: GameState, card: Zone): void {
  const cellId = getCellId(card.coordinates);

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
  const currentCard = gameState.cardPool[gameState.cardPool.length - 1];

  if (!currentCard) {
    window.alert('Empty pool');
    throw new Error();
  }

  const cardInfo = cardsById[currentCard.cardTypeId];

  const cells = Array.from(gameState.potentialZones.values()).map(
    cellIdToCoords
  );

  for (let i = 0; i < cardInfo.maxOrientation; i++) {
    for (const cell of cells) {
      const [northId, eastId, southId, westId] = getAroundCellIds(cell);
      const northCard = gameState.zones.get(northId);
      const eastCard = gameState.zones.get(eastId);
      const southCard = gameState.zones.get(southId);
      const westCard = gameState.zones.get(westId);

      if (
        (!northCard || currentCard.sides[0] === northCard.card.sides[2]) &&
        (!eastCard || currentCard.sides[1] === eastCard.card.sides[3]) &&
        (!southCard || currentCard.sides[2] === southCard.card.sides[0]) &&
        (!westCard || currentCard.sides[3] === westCard.card.sides[1])
      ) {
        putCard(gameState, {
          cardTypeId: cardInfo.id,
          card: currentCard,
          coordinates: cell,
        });
        gameState.cardPool.pop();
        return;
      }
    }

    rotateCard(currentCard);
  }

  window.alert("Can't find the place");
}

export function generateCardPool(): {
  initialCard: InGameCard;
  cardPool: InGameCard[];
} {
  const pool: InGameCard[] = [];

  for (const card of Array.from(cards)) {
    for (let i = 0; i < card.initialInDeckCount; i++) {
      pool.push(instantiateCard(card, i < (card.primeTownCount ?? 0)));
    }
  }

  const [initialCard, ...cardPool] = pool;

  return {
    initialCard,
    cardPool: shuffle(cardPool),
  };
}
