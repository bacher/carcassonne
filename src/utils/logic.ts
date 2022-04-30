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
  UnionIndex,
} from '../data/cards';
import {
  GameObjectType,
  GameState,
  Player,
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

function rotateCardImmutable(card: InGameCard): InGameCard {
  const rotatedCard = { ...card };
  rotateCard(rotatedCard);
  return rotatedCard;
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
    coords,
    peasant:
      peasantPlace !== undefined
        ? {
            playerIndex: gameState.activePlayerIndex,
            place: peasantPlace,
          }
        : undefined,
  };

  if (peasantPlace !== undefined) {
    const player = getActivePlayer(gameState);
    player.peasantsCount -= 1;

    if (player.peasantsCount < 0) {
      throw new Error();
    }
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
  gameState.activePlayerIndex =
    (gameState.activePlayerIndex + 1) % gameState.players.length;

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

function getZoneUnionOwnerPlayerIndex(
  zone: Zone,
  union: Union,
): PlayerIndex | undefined {
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

  for (const union of unions) {
    const { unionSides } = union;
    const neighbors = getNeighbors(unionSides, coords);

    const stopBarrier = new Set(
      unionSides.map((side) => `${coords.cellId}:${side}`),
    );

    const zones: CompletionZone[] = [
      {
        zone,
        ownerPlayerIndex: getZoneUnionOwnerPlayerIndex(zone, union),
      },
    ];

    let isUnionFailed = false;

    for (const { side, coords } of neighbors) {
      const nextZone = gameState.zones.get(coords.cellId);

      if (!nextZone) {
        isUnionFailed = true;
        break;
      }

      if (stopBarrier.has(`${nextZone.coords.cellId}:${counterSide[side]}`)) {
        continue;
      }

      const result = checkCompletionExtend(
        gameState,
        nextZone,
        counterSide[side],
        stopBarrier,
        zones,
      );

      if (!result) {
        isUnionFailed = true;
        break;
      }
    }

    if (!isUnionFailed) {
      results.push({
        zones,
      });
    }
  }

  return results;
}

export function getFreeUnionsForCard(
  gameState: GameState,
  card: InGameCard,
  coords: CellCoords,
): number[] {
  const freeUnions: number[] = [];

  for (let unionIndex = 0; unionIndex < card.unions.length; unionIndex++) {
    const union = card.unions[unionIndex];
    const { unionSides } = union;
    const neighbors = getNeighbors(unionSides, coords);

    const stopBarrier = new Set(
      unionSides.map((side) => `${coords.cellId}:${side}`),
    );

    let isUnionFailed = false;

    for (const { side, coords } of neighbors) {
      const nextZone = gameState.zones.get(coords.cellId);

      if (!nextZone) {
        continue;
      }

      if (stopBarrier.has(`${nextZone.coords.cellId}:${counterSide[side]}`)) {
        continue;
      }

      const isCheckSuccess = checkFreeUnionExtend(
        gameState,
        nextZone,
        counterSide[side],
        stopBarrier,
      );

      if (!isCheckSuccess) {
        isUnionFailed = true;
        break;
      }
    }

    if (!isUnionFailed) {
      freeUnions.push(unionIndex);
    }
  }

  return freeUnions;
}

type GetUniformResult = CheckUnionResults & {
  unionIndex: UnionIndex;
};

export function getUnionsForCard(
  gameState: GameState,
  card: InGameCard,
  coords: CellCoords,
): GetUniformResult[] {
  const unions: GetUniformResult[] = [];

  for (let unionIndex = 0; unionIndex < card.unions.length; unionIndex++) {
    const union = card.unions[unionIndex];
    const { unionSides } = union;
    const neighbors = getNeighbors(unionSides, coords);

    const stopBarrier = new Set(
      unionSides.map((side) => `${coords.cellId}:${side}`),
    );

    const unionResults: CheckUnionResults = {
      scorePerZones: new Map([[coords.cellId, getZoneUnionScore(card, union)]]),
      peasants: [],
    };

    for (const { side, coords } of neighbors) {
      const nextZone = gameState.zones.get(coords.cellId);

      if (
        nextZone &&
        !stopBarrier.has(`${nextZone.coords.cellId}:${counterSide[side]}`)
      ) {
        const results = checkUnionExtend(
          gameState,
          nextZone,
          counterSide[side],
          stopBarrier,
        );

        mergeCheckUnionResults(unionResults, results);
      }
    }

    unions.push({
      ...unionResults,
      unionIndex,
    });
  }

  return unions;
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
  stopBarrier: Set<string>,
  zones: CompletionZone[],
  allowIncomplete?: boolean,
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
    ownerPlayerIndex: getZoneUnionOwnerPlayerIndex(zone, union),
  });

  if (sides.length === 0) {
    return true;
  }

  const neighbors = getNeighbors(sides, zone.coords);

  for (const { side, coords } of neighbors) {
    const nextZone = gameState.zones.get(coords.cellId);

    if (!nextZone) {
      if (allowIncomplete) {
        continue;
      } else {
        return false;
      }
    }

    if (!stopBarrier.has(`${nextZone.coords.cellId}:${counterSide[side]}`)) {
      const results = checkCompletionExtend(
        gameState,
        nextZone,
        counterSide[side],
        stopBarrier,
        zones,
      );

      if (!results) {
        if (!allowIncomplete) {
          return false;
        }
      }
    }
  }

  return true;
}

function checkFreeUnionExtend(
  gameState: GameState,
  zone: Zone,
  comeFrom: number,
  stopBarrier: Set<string>,
): boolean {
  const sides = [];
  const union = zone.card.unions.find((union) =>
    union.unionSides.includes(comeFrom),
  )!;

  if (getZoneUnionOwnerPlayerIndex(zone, union) !== undefined) {
    return false;
  }

  for (const side of union.unionSides) {
    if (side !== comeFrom) {
      sides.push(side);
      stopBarrier.add(`${zone.coords.cellId}:${side}`);
    }
  }

  if (sides.length === 0) {
    return true;
  }

  const neighbors = getNeighbors(sides, zone.coords);

  for (const { side, coords } of neighbors) {
    const nextZone = gameState.zones.get(coords.cellId);

    if (!nextZone) {
      continue;
    }

    if (!stopBarrier.has(`${nextZone.coords.cellId}:${counterSide[side]}`)) {
      const isCheckSuccess = checkFreeUnionExtend(
        gameState,
        nextZone,
        counterSide[side],
        stopBarrier,
      );

      if (!isCheckSuccess) {
        return false;
      }
    }
  }

  return true;
}

type PlayerPeasant = {
  playerIndex: PlayerIndex;
  peasantsCount: number;
};

function mergeZoneScore(
  zones: Map<CellId, UnionScore>,
  addZones: Map<CellId, UnionScore>,
): void {
  for (const [cellId, zoneScore] of Array.from(addZones.entries())) {
    const alreadyScore = zones.get(cellId);
    if (
      alreadyScore &&
      (alreadyScore.complete !== zoneScore.complete ||
        alreadyScore.incomplete !== zoneScore.incomplete)
    ) {
      console.warn(
        `Zone ${cellId} score doesn't equals ${alreadyScore} !== ${zoneScore}`,
      );
    }
    zones.set(cellId, zoneScore);
  }
}

function mergePlayerPeasants(
  peasants: PlayerPeasant[],
  addPeasants: PlayerPeasant[],
): void {
  for (const peasantPlayer of addPeasants) {
    const player = peasants.find(
      ({ playerIndex }) => playerIndex === peasantPlayer.playerIndex,
    );

    if (player) {
      player.peasantsCount += peasantPlayer.peasantsCount;
    } else {
      peasants.push(peasantPlayer);
    }
  }
}

type CheckUnionResults = {
  scorePerZones: Map<CellId, UnionScore>;
  peasants: PlayerPeasant[];
};

function mergeCheckUnionResults(
  results: CheckUnionResults,
  addResults: CheckUnionResults,
): void {
  mergeZoneScore(results.scorePerZones, addResults.scorePerZones);
  mergePlayerPeasants(results.peasants, addResults.peasants);
}

export type UnionScore = {
  complete: number;
  incomplete: number;
};

function getZoneUnionScore(card: InGameCard, union: Union): UnionScore {
  switch (union.unionSideType) {
    case SideType.TOWN:
      if (card.isPrimeTown) {
        return {
          complete: 4,
          incomplete: 2,
        };
      }
      return {
        complete: 2,
        incomplete: 1,
      };
    case SideType.ROAD:
      return {
        complete: 1,
        incomplete: 1,
      };
    default:
      throw new Error();
  }
}

function checkUnionExtend(
  gameState: GameState,
  zone: Zone,
  comeFrom: number,
  stopBarrier: Set<string>,
): CheckUnionResults {
  const sides = [];
  const union = zone.card.unions.find((union) =>
    union.unionSides.includes(comeFrom),
  )!;

  const results: CheckUnionResults = {
    scorePerZones: new Map([
      [zone.coords.cellId, getZoneUnionScore(zone.card, union)],
    ]),
    peasants: [],
  };

  const peasantPlayerIndex = getZoneUnionOwnerPlayerIndex(zone, union);

  if (peasantPlayerIndex !== undefined) {
    mergePlayerPeasants(results.peasants, [
      {
        playerIndex: peasantPlayerIndex,
        peasantsCount: 1,
      },
    ]);
  }

  for (const side of union.unionSides) {
    if (side !== comeFrom) {
      sides.push(side);
      stopBarrier.add(`${zone.coords.cellId}:${side}`);
    }
  }

  if (sides.length > 0) {
    const neighbors = getNeighbors(sides, zone.coords);

    for (const { side, coords } of neighbors) {
      const nextZone = gameState.zones.get(coords.cellId);

      if (
        nextZone &&
        !stopBarrier.has(`${nextZone.coords.cellId}:${counterSide[side]}`)
      ) {
        const addResults = checkUnionExtend(
          gameState,
          nextZone,
          counterSide[side],
          stopBarrier,
        );

        mergeCheckUnionResults(results, addResults);
      }
    }
  }

  return results;
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

export type PossibleTurn = {
  card: InGameCard;
  coords: CellCoords;
  score: UnionScore;
  peasantPlace: PeasantPlace | undefined;
};

export function getPossibleTurns(gameState: GameState): PossibleTurn[] {
  let currentCard = gameState.cardPool[gameState.cardPool.length - 1];

  if (!currentCard) {
    window.alert('Empty pool');
    throw new Error();
  }

  const cardInfo = cardsById[currentCard.cardTypeId];

  const cellsCoords = Array.from(gameState.potentialZones.values()).map(
    cellIdToCoords,
  );

  const possibleTurns: PossibleTurn[] = [];

  for (let i = 0; i < cardInfo.maxOrientation; i++) {
    for (const cellCoords of cellsCoords) {
      if (canBePlaced(gameState.zones, currentCard, cellCoords)) {
        for (const { score, peasantPlace } of getTurnScores(
          gameState,
          currentCard,
          cellCoords,
        )) {
          possibleTurns.push({
            card: currentCard,
            coords: cellCoords,
            score,
            peasantPlace,
          });
        }
      }
    }

    currentCard = rotateCardImmutable(currentCard);
  }

  if (possibleTurns.length > 1) {
    possibleTurns.sort(
      (a, b) =>
        Math.round((b.score.complete + b.score.incomplete) * 100) -
        Math.round((a.score.complete + a.score.incomplete) * 100),
    );
  }

  return possibleTurns;
}

export function fitNextCard(gameState: GameState): PossibleTurn | undefined {
  const possibleTurns = getPossibleTurns(gameState);

  if (possibleTurns.length === 0) {
    return undefined;
  }

  const maxScore = possibleTurns[0].score;
  possibleTurns.filter((turn) => turn.score === maxScore);

  return getRandomItem(possibleTurns);
}

function getRandomItem<T>(items: T[]): T {
  if (items.length === 0) {
    throw new Error();
  }
  if (items.length === 1) {
    return items[0];
  }

  return items[Math.floor(Math.random() * items.length)];
}

export function getActivePlayer(gameState: GameState): Player {
  const player = gameState.players[gameState.activePlayerIndex];

  if (!player) {
    throw new Error();
  }

  return player;
}

function makeZeroScore(): UnionScore {
  return {
    complete: 0,
    incomplete: 0,
  };
}

function sumUnionScore(scores: UnionScore[]): UnionScore {
  const sum = makeZeroScore();

  for (const score of scores) {
    sum.complete += score.complete;
    sum.incomplete += score.incomplete;
  }

  return sum;
}

function amplifyScore(score: UnionScore, amplifier: number): UnionScore {
  return {
    complete: score.complete * amplifier,
    incomplete: score.incomplete * amplifier,
  };
}

function addAbsoluteScore(score: UnionScore, add: number): UnionScore {
  return {
    complete: score.complete + add,
    incomplete: score.incomplete + add,
  };
}

function addUnionScore(score: UnionScore, add: UnionScore): UnionScore {
  return {
    complete: score.complete + add.complete,
    incomplete: score.incomplete + add.incomplete,
  };
}

type Turn = {
  score: UnionScore;
  peasantPlace: PeasantPlace | undefined;
};

type ZScore = { zoneScore: UnionScore; unionScore: UnionScore };

function getTurnScores(
  gameState: GameState,
  card: InGameCard,
  coords: CellCoords,
): Turn[] {
  const player = getActivePlayer(gameState);
  const unions = getUnionsForCard(gameState, card, coords);
  const aroundZones = getAroundSquareZones(gameState, coords);

  const turns: Turn[] = [];
  const scorePerUnion = new Map<UnionIndex, ZScore>();

  for (const union of unions) {
    const unionScore = sumUnionScore(Array.from(union.scorePerZones.values()));
    const zoneScore = getZoneUnionScore(card, card.unions[union.unionIndex]);

    if (union.peasants.length > 0) {
      const maxPeasantsCount = union.peasants.sort(
        (a, b) => b.peasantsCount - a.peasantsCount,
      )[0].peasantsCount;

      const winPlayerIndexes = union.peasants
        .filter(({ peasantsCount }) => peasantsCount === maxPeasantsCount)
        .map(({ playerIndex }) => playerIndex);

      if (winPlayerIndexes.includes(player.playerIndex)) {
        // TODO: Calculate proper amplifier
        scorePerUnion.set(union.unionIndex, {
          unionScore,
          zoneScore: amplifyScore(zoneScore, 1 / winPlayerIndexes.length),
        });
      } else {
        // TODO: Calculate proper amplifier
        scorePerUnion.set(union.unionIndex, {
          unionScore,
          zoneScore: amplifyScore(zoneScore, -0.8),
        });
      }
    } else {
      scorePerUnion.set(union.unionIndex, {
        unionScore,
        // TODO: Calculate proper amplifier
        zoneScore: addAbsoluteScore(amplifyScore(zoneScore, -1), 1),
      });
    }
  }

  const noPeasantScore = sumUnionScore(
    Array.from(scorePerUnion.values()).map((score) => score.zoneScore),
  );

  turns.push({
    score: noPeasantScore,
    peasantPlace: undefined,
  });

  if (player.peasantsCount > 0) {
    for (const union of unions) {
      if (union.peasants.length === 0) {
        const otherScores = Array.from(scorePerUnion.entries())
          .filter(([unionIndex]) => unionIndex !== union.unionIndex)
          .map(([, score]) => score.zoneScore);

        turns.push({
          score: sumUnionScore([
            ...otherScores,
            addAbsoluteScore(
              sumUnionScore(Array.from(union.scorePerZones.values())),
              // -1.5 because of using peasant
              -1.5,
            ),
          ]),
          peasantPlace: {
            type: 'UNION',
            unionIndex: union.unionIndex,
          },
        });
      }
    }

    if (card.building === Building.Monastery) {
      turns.push({
        // 1.5 fee because of losing peasant
        score: addAbsoluteScore(
          noPeasantScore,
          Math.min(5, 1 + aroundZones.length) - 1.5,
        ),
        peasantPlace: {
          type: 'CENTER',
        },
      });
    }
  }

  const monasteryBonus = calculateMonasteryBonus(
    gameState,
    aroundZones,
    player,
  );

  if (monasteryBonus) {
    for (const turn of turns) {
      turn.score = addUnionScore(turn.score, monasteryBonus);
    }
  }

  return turns;
}

function calculateMonasteryBonus(
  gameState: GameState,
  aroundZones: Zone[],
  player: Player,
): UnionScore | undefined {
  const scores: UnionScore[] = [];

  for (const zone of aroundZones) {
    if (zone.card.building === Building.Monastery) {
      if (zone.peasant && zone.peasant.place.type === 'CENTER') {
        let points = 0;

        if (zone.peasant.playerIndex === player.playerIndex) {
          points = 1;
        } else {
          const alreadyAroundZones =
            getAroundSquareZones(gameState, zone.coords).length + 1;

          if (alreadyAroundZones === 8) {
            points = -5;
          } else if (alreadyAroundZones === 7) {
            points = -3;
          } else if (alreadyAroundZones === 6) {
            points = -2;
          } else {
            points = -0.5;
          }
        }

        scores.push({
          complete: points,
          incomplete: points,
        });
      }
    }
  }

  if (scores.length === 0) {
    return undefined;
  }

  return sumUnionScore(scores);
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

export function getSideDirection(side: Side): Point {
  switch (side) {
    case Side.UP:
      return { x: 0, y: -1 };
    case Side.RIGHT:
      return { x: 1, y: 0 };
    case Side.DOWN:
      return { x: 0, y: 1 };
    case Side.LEFT:
      return { x: -1, y: 0 };
  }
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
