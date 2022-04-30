import { InGameCard } from './cards';
import { CellCoords } from '../utils/logic';
import { PeasantPlace } from '../components/PutPeasant';

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

export type Peasant = {
  playerIndex: number;
  place: PeasantPlace;
};

export type Zone = {
  card: InGameCard;
  coords: CellCoords;
  peasant: Peasant | undefined;
};

export type Zones = Map<number, Zone>;

export type GameState = {
  gameId: string;
  activePlayerIndex: number;
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

export type MenuPlayer = {
  name: string;
  isBot: boolean;
  color: Color;
};

export type Player = MenuPlayer & {
  score: number;
  peasantsCount: number;
  playerIndex: number;
};
