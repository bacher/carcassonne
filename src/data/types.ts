export type CellId = number;

export type CellCoords = {
  cellId: CellId;
  col: number;
  row: number;
};

export type CardTypeId = `card:${string}`;

export const enum SideType {
  TOWN = 1,
  ROAD,
}

export const enum Side {
  TOP,
  RIGHT,
  BOTTOM,
  LEFT,
}

export const enum Building {
  Monastery = 1,
}

export type UnionIndex = number;

export type Union = {
  unionSides: Side[];
  unionSideType: SideType.TOWN | SideType.ROAD;
};

export type CardBase = {
  sides: [
    SideType | undefined,
    SideType | undefined,
    SideType | undefined,
    SideType | undefined,
  ];
  connects: [number, number, number, number];
  building?: Building;
};

export type InGameCard = CardBase & {
  cardTypeId: CardTypeId;
  isPrimeTown: boolean;
  unions: Union[];
};

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

export type PeasantPlace =
  | {
      type: 'CENTER';
    }
  | {
      type: 'UNION';
      unionIndex: number;
    };

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
