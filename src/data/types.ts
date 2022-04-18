import { CardInfo } from './cards';
import { CellCoords } from '../utils/logic';

export type CardId = `card:${string}`;

export const enum Orientation {
  NORTH,
  EAST,
  SOUTH,
  WEST,
}

export type Zone = {
  cardId: CardId;
  rotatedCard: CardInfo;
  coordinates: CellCoords;
  orientation: Orientation;
};

export type GameState = {
  zones: Map<number, Zone>;
  potentialZones: Set<number>;
  cardPool: CardId[];
};
