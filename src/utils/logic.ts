import { shuffle } from 'lodash';

import { cards, cardsById, CardTypeInfo, InGameCard } from '../data/cards';
import { GameState, Zone, Zones } from '../data/types';

export function instantiateCard(card: CardTypeInfo): InGameCard {
  return {
    cardTypeId: card.id,
    sides: card.sides,
    connects: card.connects,
    building: card.building,
    isPrimeTown: Boolean(card.isPrimeTown),
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
  cellId: CellId;
  col: number;
  row: number;
};

export function makeCellCoordsByCellId(cellId: CellId): CellCoords {
  return {
    ...cellIdToCoords(cellId),
    cellId,
  };
}

export function makeCellCoordsByCoords(coords: {
  col: number;
  row: number;
}): CellCoords {
  return {
    ...coords,
    cellId: getCellId(coords),
  };
}

export function getAroundCells({
  col,
  row,
}: {
  col: number;
  row: number;
}): CellCoords[] {
  return [
    makeCellCoordsByCoords({ col, row: row - 1 }),
    makeCellCoordsByCoords({ col: col + 1, row }),
    makeCellCoordsByCoords({ col, row: row + 1 }),
    makeCellCoordsByCoords({ col: col - 1, row }),
  ];
}

const BOUND = 2 ** 12;
const HALF_BOUND = BOUND / 2;

export function getCellId({ col, row }: { col: number; row: number }): CellId {
  return ((row + HALF_BOUND) << 12) + col + HALF_BOUND;
}

export function cellIdToCoords(cellId: CellId): CellCoords {
  return {
    cellId,
    row: (cellId >> 12) - HALF_BOUND,
    col: (cellId & 0x0fff) - HALF_BOUND,
  };
}

export function putCardInGame(
  gameState: GameState,
  card: InGameCard,
  coords: CellCoords,
): void {
  const zone: Zone = {
    card,
    cardTypeId: card.cardTypeId,
    coords,
  };

  const cellId = zone.coords.cellId;

  gameState.potentialZones.delete(cellId);

  gameState.zones.set(cellId, zone);

  const around = getAroundCells(zone.coords);
  for (const cell of around) {
    if (!gameState.zones.has(cell.cellId)) {
      gameState.potentialZones.add(cell.cellId);
    }
  }

  gameState.cardPool.pop();
  gameState.activePlayer =
    (gameState.activePlayer + 1) % gameState.players.length;

  checkCompletion(gameState, cellId);
}

function checkCompletion(gameState: GameState, cellId: CellId): void {
  const zone = gameState.zones.get(cellId)!;
  const { northZone, westZone, southZone, eastZone } = getAroundZones(
    gameState.zones,
    zone.coords,
  );
}

export function canBePlaced(
  zones: Zones,
  card: InGameCard,
  coords: CellCoords,
): boolean {
  const { northZone, westZone, southZone, eastZone } = getAroundZones(
    zones,
    coords,
  );

  return (
    (!northZone || card.sides[0] === northZone.card.sides[2]) &&
    (!eastZone || card.sides[1] === eastZone.card.sides[3]) &&
    (!southZone || card.sides[2] === southZone.card.sides[0]) &&
    (!westZone || card.sides[3] === westZone.card.sides[1])
  );
}

function getAroundZones(zones: Zones, coords: CellCoords) {
  const [north, east, south, west] = getAroundCells(coords);

  return {
    northZone: zones.get(north.cellId),
    eastZone: zones.get(east.cellId),
    southZone: zones.get(south.cellId),
    westZone: zones.get(west.cellId),
  };
}

export function fitNextCard(gameState: GameState):
  | {
      card: InGameCard;
      coords: CellCoords;
    }
  | undefined {
  const currentCard = gameState.cardPool[gameState.cardPool.length - 1];

  if (!currentCard) {
    window.alert('Empty pool');
    throw new Error();
  }

  const cardInfo = cardsById[currentCard.cardTypeId];

  const cellsCoords = Array.from(gameState.potentialZones.values()).map(
    cellIdToCoords,
  );

  for (let i = 0; i < cardInfo.maxOrientation; i++) {
    for (const cellCoords of cellsCoords) {
      if (canBePlaced(gameState.zones, currentCard, cellCoords)) {
        return {
          card: currentCard,
          coords: cellCoords,
        };
      }
    }

    rotateCard(currentCard);
  }

  return undefined;
}

export function generateCardPool(): {
  initialCard: InGameCard;
  cardPool: InGameCard[];
} {
  const pool: InGameCard[] = [];

  for (const card of Array.from(cards)) {
    for (let i = 0; i < card.initialInDeckCount; i++) {
      pool.push(instantiateCard(card));
    }
  }

  const [initialCard, ...cardPool] = pool;

  return {
    initialCard,
    cardPool: shuffle(cardPool),
  };
}
