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

export const enum Color {
  RED,
  BLUE,
  YELLOW,
  GREEN,
  BLACK,
}

export const playerColors: Record<number, string> = {
  [Color.RED]: '#f00',
  [Color.BLUE]: '#00f',
  [Color.GREEN]: '#0f0',
  [Color.YELLOW]: '#ff0',
  [Color.BLACK]: '#000',
};

export type Player = {
  name: string;
  isBot: boolean;
  color: Color;
};

export type InitialGame = {
  players: Player[];
};
