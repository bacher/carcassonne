export const enum Orientation {
  NORTH = 1,
  EAST,
  SOUTH,
  WEST,
}

export type Zone = {
  cardId: number;
  coordinates: [number, number];
  orientation: Orientation;
};

export type GameState = {
  zones: Zone[];
};
