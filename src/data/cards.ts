export const enum Building {
  Monastery = 1,
}

export const enum SideType {
  GROUND,
  TOWN,
  ROAD,
}

export type CardType = {
  id: number;
  sides: [SideType, SideType, SideType, SideType];
  connects: [number, number, number, number];
  road?: number[];
  building?: Building;
};

export const cards: CardType[] = [
  {
    id: 1,
    sides: [SideType.ROAD, SideType.ROAD, SideType.GROUND, SideType.GROUND],
    connects: [1, 1, 0, 0],
  },
  {
    id: 2,
    sides: [SideType.GROUND, SideType.ROAD, SideType.GROUND, SideType.ROAD],
    connects: [0, 1, 0, 1],
  },
  {
    id: 3,
    sides: [SideType.ROAD, SideType.ROAD, SideType.ROAD, SideType.GROUND],
    connects: [0, 0, 0, 0],
  },
  {
    id: 4,
    sides: [SideType.GROUND, SideType.GROUND, SideType.GROUND, SideType.GROUND],
    building: Building.Monastery,
    connects: [0, 0, 0, 0],
  },
  {
    id: 5,
    sides: [SideType.ROAD, SideType.GROUND, SideType.GROUND, SideType.GROUND],
    building: Building.Monastery,
    connects: [0, 0, 0, 0],
  },
  {
    id: 6,
    sides: [SideType.TOWN, SideType.GROUND, SideType.GROUND, SideType.GROUND],
    connects: [0, 0, 0, 0],
  },
  {
    id: 7,
    sides: [SideType.TOWN, SideType.GROUND, SideType.TOWN, SideType.GROUND],
    connects: [0, 0, 0, 0],
  },
  {
    id: 8,
    sides: [SideType.TOWN, SideType.ROAD, SideType.ROAD, SideType.ROAD],
    connects: [0, 0, 0, 0],
  },
  {
    id: 9,
    sides: [SideType.ROAD, SideType.ROAD, SideType.ROAD, SideType.GROUND],
    connects: [0, 0, 0, 0],
  },
  {
    id: 10,
    sides: [SideType.TOWN, SideType.TOWN, SideType.TOWN, SideType.GROUND],
    connects: [1, 1, 1, 0],
  },
  {
    id: 11,
    sides: [SideType.TOWN, SideType.TOWN, SideType.ROAD, SideType.ROAD],
    connects: [1, 1, 2, 2],
  },
  {
    id: 12,
    sides: [SideType.TOWN, SideType.TOWN, SideType.GROUND, SideType.GROUND],
    connects: [1, 1, 0, 0],
  },
  {
    id: 13,
    sides: [SideType.GROUND, SideType.TOWN, SideType.GROUND, SideType.TOWN],
    connects: [0, 0, 0, 0],
  },
  {
    id: 14,
    sides: [SideType.TOWN, SideType.TOWN, SideType.TOWN, SideType.ROAD],
    connects: [1, 1, 1, 0],
  },
  {
    id: 15,
    sides: [SideType.ROAD, SideType.ROAD, SideType.ROAD, SideType.ROAD],
    connects: [0, 0, 0, 0],
  },
  {
    id: 16,
    sides: [SideType.TOWN, SideType.GROUND, SideType.ROAD, SideType.ROAD],
    connects: [0, 0, 1, 1],
  },
  {
    id: 17,
    sides: [SideType.TOWN, SideType.ROAD, SideType.ROAD, SideType.GROUND],
    connects: [0, 1, 1, 0],
  },
  {
    id: 18,
    sides: [SideType.TOWN, SideType.ROAD, SideType.GROUND, SideType.ROAD],
    connects: [0, 1, 0, 1],
  },
];

const startGameCardId = 18;
