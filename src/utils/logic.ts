import { shuffle } from 'lodash';

import {
  Building,
  cards,
  cardsById,
  CardTypeInfo,
  InGameCard,
  Side,
  SideType,
  Union,
} from '../data/cards';
import {
  GameObjectType,
  GameState,
  PlayerIndex,
  Point,
  Zone,
  Zones,
} from '../data/types';
import { PeasantPlace } from '../components/PutPeasant';

export function instantiateCard(card: CardTypeInfo): InGameCard {
  return {
    cardTypeId: card.id,
    sides: card.sides,
    connects: card.connects,
    building: card.building,
    unions: card.unions,
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
  card.unions = card.unions.map(({ unionSideType, unionSides }) => ({
    unionSideType,
    unionSides: unionSides.map((side) => (side + 1) % 4).sort((a, b) => a - b),
  }));
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

export function getAroundSquareCells({ col, row }: CellCoords): CellCoords[] {
  const cells: CellCoords[] = [];

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      if (x !== 0 || y !== 0) {
        cells.push(
          makeCellCoordsByCoords({
            col: col + x,
            row: row + y,
          }),
        );
      }
    }
  }

  return cells;
}

function getAroundSquareZones(gameState: GameState, cell: CellCoords): Zone[] {
  const zones = [];

  for (const { cellId } of getAroundSquareCells(cell)) {
    const zone = gameState.zones.get(cellId);
    if (zone) {
      zones.push(zone);
    }
  }

  return zones;
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
    peasantPlace: PeasantPlace | undefined;
  },
): void {
  const { cellId } = coords;
  const zone: Zone = {
    card,
    cardTypeId: card.cardTypeId,
    coords,
    peasant: peasantPlace
      ? {
          playerIndex: gameState.activePlayer,
          place: peasantPlace,
        }
      : undefined,
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
  const towns = getCompletedObjects(gameState, zone, SideType.TOWN);
  for (const town of towns) {
    processCompletedObject(gameState, town, GameObjectType.TOWN);
  }

  const roads = getCompletedObjects(gameState, zone, SideType.ROAD);
  for (const road of roads) {
    processCompletedObject(gameState, road, GameObjectType.ROAD);
  }

  const monasteries = getCompletedMonasteries(gameState, zone);
  for (const monastery of monasteries) {
    processCompletedMonastery(gameState, monastery);
  }
}

function processCompletedObject(
  gameState: GameState,
  object: { zones: CompletionZone[] },
  objectType: GameObjectType.ROAD | GameObjectType.TOWN,
) {
  const townCellIds = new Set<number>();
  const playerPeasants = new Map<PlayerIndex, { zones: Zone[] }>();
  let maxPeasants = 0;
  let totalScore = 0;

  for (const { zone, ownerPlayerIndex } of object.zones) {
    const { cellId } = zone.coords;

    if (ownerPlayerIndex !== undefined) {
      let zonesWithPeasant = playerPeasants.get(ownerPlayerIndex);
      if (!zonesWithPeasant) {
        zonesWithPeasant = {
          zones: [],
        };
        playerPeasants.set(ownerPlayerIndex, zonesWithPeasant);
      }

      zonesWithPeasant.zones.push(zone);

      if (zonesWithPeasant.zones.length > maxPeasants) {
        maxPeasants = zonesWithPeasant.zones.length;
      }
    }

    if (!townCellIds.has(cellId)) {
      switch (objectType) {
        case GameObjectType.ROAD:
          totalScore += 1;
          break;
        case GameObjectType.TOWN:
          totalScore += zone.card.isPrimeTown ? 4 : 2;
          break;
        default:
          throw new Error();
      }

      townCellIds.add(cellId);
    }
  }

  for (const [playerIndex, { zones }] of Array.from(playerPeasants.entries())) {
    const player = gameState.players[playerIndex];

    if (zones.length === maxPeasants) {
      console.log(`Give Player[${playerIndex}] ${totalScore} points.`);
      player.score += totalScore;
    }

    for (const zone of zones) {
      zone.peasant = undefined;
      player.peasantsCount++;
    }
  }
}

function processCompletedMonastery(gameState: GameState, zone: Zone): void {
  if (zone.peasant && zone.peasant.place.type === 'CENTER') {
    const player = gameState.players[zone.peasant.playerIndex];

    console.log(`Give Player[${zone.peasant.playerIndex}] 9 points.`);
    player.score += 9;
    player.peasantsCount++;
    zone.peasant = undefined;
  }
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

function getZoneUnionOwner(zone: Zone, union: Union): PlayerIndex | undefined {
  const { card, peasant } = zone;

  if (!peasant) {
    return undefined;
  }
  const { place, playerIndex } = peasant;

  if (place.type !== 'UNION') {
    return undefined;
  }

  if (card.unions.indexOf(union) === place.unionIndex) {
    return playerIndex;
  }

  return undefined;
}

type CompleteResults = { zones: CompletionZone[] }[];

type CompletionZone = {
  zone: Zone;
  ownerPlayerIndex: PlayerIndex | undefined;
};

function getCompletedObjects(
  gameState: GameState,
  zone: Zone,
  sideType: SideType.TOWN | SideType.ROAD,
): CompleteResults {
  const results: CompleteResults = [];

  const { card, coords } = zone;

  const unions = card.unions.filter(
    (union) => union.unionSideType === sideType,
  );

  nextunion: for (const union of unions) {
    const { unionSides } = union;
    const neighbors = getNeighbors(unionSides, coords);

    const stopBarrier = new Set(
      unionSides.map((side) => `${coords.cellId}:${side}`),
    );

    const zones: CompletionZone[] = [
      {
        zone,
        ownerPlayerIndex: getZoneUnionOwner(zone, union),
      },
    ];

    for (const { side, coords } of neighbors) {
      const nextZone = gameState.zones.get(coords.cellId);

      if (!nextZone) {
        continue nextunion;
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
        continue nextunion;
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

function getCompletedMonasteries(gameState: GameState, zone: Zone): Zone[] {
  const completedMonasteries = [];
  const aroundZones = getAroundSquareZones(gameState, zone.coords);

  const zones = [...aroundZones, zone];

  for (const zone of zones) {
    if (
      zone.card.building === Building.Monastery &&
      getAroundSquareZones(gameState, zone.coords).length === 8
    ) {
      completedMonasteries.push(zone);
    }
  }

  return completedMonasteries;
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
  const union = zone.card.unions.find((union) =>
    union.unionSides.includes(comeFrom),
  )!;

  for (const side of union.unionSides) {
    if (side !== comeFrom) {
      sides.push(side);
      stopBarrier.add(`${zone.coords.cellId}:${side}`);
    }
  }

  zones.push({
    zone,
    ownerPlayerIndex: getZoneUnionOwner(zone, union),
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

export const enum Quadrant {
  VERTICAL,
  HORIZONTAL,
  TOP_RIGHT,
  BOTTOM_RIGHT,
  BOTTOM_LEFT,
  TOP_LEFT,
}

export function getQuadrant(side1: Side, side2: Side): Quadrant {
  if (side1 > side2) {
    return getQuadrant(side2, side1);
  }

  if (side1 === 0 && side2 === 2) {
    return Quadrant.VERTICAL;
  }

  if (side1 === 1 && side2 === 3) {
    return Quadrant.HORIZONTAL;
  }

  if (side1 === 0 && side2 === 1) {
    return Quadrant.TOP_RIGHT;
  }
  if (side1 === 0 && side2 === 3) {
    return Quadrant.TOP_LEFT;
  }

  if (side1 === 1 && side2 === 2) {
    return Quadrant.BOTTOM_RIGHT;
  }

  return Quadrant.BOTTOM_LEFT;
}

export function getQuadrantDirection(quadrant: Quadrant): Point {
  switch (quadrant) {
    case Quadrant.TOP_RIGHT:
      return { x: 1, y: -1 };
    case Quadrant.BOTTOM_RIGHT:
      return { x: 1, y: 1 };
    case Quadrant.BOTTOM_LEFT:
      return { x: -1, y: 1 };
    case Quadrant.TOP_LEFT:
      return { x: -1, y: -1 };
    default:
      return {
        x: 0,
        y: 0,
      };
  }
}
