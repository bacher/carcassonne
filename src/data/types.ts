import { InGameCard } from './cards';
import { CellCoords } from '../utils/logic';

export type CardTypeId = `card:${string}`;

export type Zone = {
  cardTypeId: CardTypeId;
  card: InGameCard;
  coordinates: CellCoords;
};

export type GameState = {
  zones: Map<number, Zone>;
  potentialZones: Set<number>;
  cardPool: InGameCard[];
};
