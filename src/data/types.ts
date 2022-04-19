import { InGameCard } from './cards';
import { CellCoords } from '../utils/logic';

export type CardTypeId = `card:${string}`;

export type Point = {
  x: number;
  y: number;
};

export type Zone = {
  cardTypeId: CardTypeId;
  card: InGameCard;
  coordinates: CellCoords;
};

export type GameState = {
  gameId: string;
  activePlayer: number;
  zones: Map<number, Zone>;
  potentialZones: Set<number>;
  cardPool: InGameCard[];
  players: Player[];
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
  score: number;
  peasantsCount: number;
};
