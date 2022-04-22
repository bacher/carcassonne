import { InGameCard } from './cards';
import { CellCoords } from '../utils/logic';

export type CardTypeId = `card:${string}`;

export type Point = {
  x: number;
  y: number;
};

export type PlayerIndex = number;

export const enum GameObjectType {
  ROAD = 1,
  TOWN,
  MONASTERY,
}

export type Zone = {
  cardTypeId: CardTypeId;
  card: InGameCard;
  coords: CellCoords;
  peasant:
    | {
        playerIndex: number;
        place: number;
      }
    | undefined;
};

export type Zones = Map<number, Zone>;

export type GameState = {
  gameId: string;
  activePlayer: number;
  zones: Zones;
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
