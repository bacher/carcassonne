import { shuffle } from 'lodash';

import {
  cards,
  cardsById,
  CardTypeInfo,
  InGameCard,
  SideType,
} from '../data/cards';
import { GameState, PlayerIndex, Zone, Zones } from '../data/types';

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
  {
    card,
    coords,
    peasantPlace,
  }: {
    card: InGameCard;
    coords: CellCoords;
    peasantPlace: number | undefined;
  },
): void {
  const { cellId } = coords;
  const zone: Zone = {
    card,
    cardTypeId: card.cardTypeId,
    coords,
    playerIndex: gameState.activePlayer,
    peasantPlace,
  };

  if (peasantPlace !== undefined) {
    gameState.players[gameState.activePlayer].peasantsCount -= 1;
  }

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

  checkCompletion(gameState, zone);
}

function checkCompletion(gameState: GameState, zone: Zone): void {
  const towns = checkCompletionPartial(gameState, zone, SideType.TOWN);

  for (const town of towns) {
    const townCellIds = new Set<number>();
    const playerPeasants = new Map<PlayerIndex, number>();
    let maxPeasants = 0;
    let totalScore = 0;

    for (const { zone, ownPlayerIndex } of town.zones) {
      const { cellId } = zone.coords;

      if (ownPlayerIndex !== undefined) {
        const peasants = (playerPeasants.get(ownPlayerIndex) ?? 0) + 1;

        if (peasants > maxPeasants) {
          maxPeasants = peasants;
        }

        playerPeasants.set(ownPlayerIndex, peasants);
      }

      if (!townCellIds.has(cellId)) {
        totalScore += zone.card.isPrimeTown ? 4 : 2;
        townCellIds.add(cellId);
      }
    }

    for (const [playerIndex, count] of Array.from(playerPeasants.entries())) {
      if (count === maxPeasants) {
        console.log(`Give Player[${playerIndex}] ${totalScore} points.`);
        gameState.players[playerIndex].score += totalScore;
      }
      gameState.players[playerIndex].peasantsCount += count;
    }
  }

  const roads = checkCompletionPartial(gameState, zone, SideType.ROAD);
}

const counterSide = [2, 3, 0, 1];

function getNeighbors(
  sides: number[],
  coords: CellCoords,
): { side: number; coords: CellCoords }[] {
  return sides.map((side) => {
    switch (side) {
      case 0:
        return {
          side,
          coords: makeCellCoordsByCoords({
            col: coords.col,
            row: coords.row - 1,
          }),
        };
      case 1:
        return {
          side,
          coords: makeCellCoordsByCoords({
            col: coords.col + 1,
            row: coords.row,
          }),
        };
      case 2:
        return {
          side,
          coords: makeCellCoordsByCoords({
            col: coords.col,
            row: coords.row + 1,
          }),
        };
      case 3:
        return {
          side,
          coords: makeCellCoordsByCoords({
            col: coords.col - 1,
            row: coords.row,
          }),
        };
      default:
        throw new Error();
    }
  });
}

function getZonePartOwner(
  zone: Zone,
  sides: number[],
): PlayerIndex | undefined {
  return zone.playerIndex !== undefined &&
    zone.peasantPlace !== undefined &&
    sides.includes(zone.peasantPlace)
    ? zone.playerIndex
    : undefined;
}

type CompleteResults = { zones: CompletionZone[] }[];

type CompletionZone = {
  zone: Zone;
  ownPlayerIndex: PlayerIndex | undefined;
};

function checkCompletionPartial(
  gameState: GameState,
  zone: Zone,
  sideType: SideType.TOWN | SideType.ROAD,
): CompleteResults {
  const results: CompleteResults = [];

  const { card, coords } = zone;
  const groups: { sides: number[]; zoneUnionId: number }[] = [];

  for (let i = 0; i < 4; i++) {
    if (card.sides[i] === sideType) {
      const zoneUnionId = card.connects[i];

      const group =
        zoneUnionId !== 0 &&
        groups.find((group) => group.zoneUnionId === zoneUnionId);

      if (group) {
        group.sides.push(i);
      } else {
        groups.push({
          sides: [i],
          zoneUnionId,
        });
      }
    }
  }

  nextgroup: for (const group of groups) {
    const neighbors = getNeighbors(group.sides, coords);

    const stopBarrier = new Set(
      group.sides.map((side) => `${coords.cellId}:${side}`),
    );

    const zones: CompletionZone[] = [
      {
        zone,
        ownPlayerIndex: getZonePartOwner(zone, group.sides),
      },
    ];

    for (const { side, coords } of neighbors) {
      const nextZone = gameState.zones.get(coords.cellId);

      if (!nextZone) {
        continue nextgroup;
      }

      if (stopBarrier.has(`${nextZone.coords.cellId}:${counterSide[side]}`)) {
        continue;
      }

      const result = checkCompletionExtend(
        gameState,
        nextZone,
        counterSide[side],
        sideType,
        stopBarrier,
        zones,
      );

      if (!result) {
        continue nextgroup;
      }
    }

    results.push({
      zones,
    });
    console.log('COMPLETED! ==>', zones);
  }

  console.log('CHECKING DONE');
  return results;
}

function checkCompletionExtend(
  gameState: GameState,
  zone: Zone,
  comeFrom: number,
  sideType: SideType.TOWN | SideType.ROAD,
  stopBarrier: Set<string>,
  zones: CompletionZone[],
): boolean {
  const sides = [];
  const unionId = zone.card.connects[comeFrom];

  if (unionId !== 0) {
    for (let i = 0; i < 4; i++) {
      if (i !== comeFrom && zone.card.connects[i] === unionId) {
        sides.push(i);
        stopBarrier.add(`${zone.coords.cellId}:${i}`);
      }
    }
  }

  zones.push({
    zone,
    ownPlayerIndex: getZonePartOwner(zone, [comeFrom, ...sides]),
  });

  if (sides.length === 0) {
    return true;
  }

  const neighbors = getNeighbors(sides, zone.coords);

  for (const { side, coords } of neighbors) {
    const nextZone = gameState.zones.get(coords.cellId);

    if (!nextZone) {
      return false;
    }

    if (!stopBarrier.has(`${nextZone.coords.cellId}:${counterSide[side]}`)) {
      const results = checkCompletionExtend(
        gameState,
        nextZone,
        counterSide[side],
        sideType,
        stopBarrier,
        zones,
      );

      if (!results) {
        return false;
      }
    }
  }

  return true;
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
