import { CardId } from './types';

export const enum Building {
  Monastery = 1,
}

export const enum SideType {
  GROUND,
  TOWN,
  ROAD,
}

type CardInfoPartial = {
  id: CardId;
  sides: [SideType, SideType, SideType, SideType];
  connects: [number, number, number, number];
  building?: Building;
};

export type CardInfo = CardInfoPartial & {
  maxOrientation: number;
};

export const cards: CardInfoPartial[] = [
  {
    id: 'card:1',
    sides: [SideType.TOWN, SideType.ROAD, SideType.GROUND, SideType.ROAD],
    connects: [0, 1, 0, 1],
  },
  {
    id: 'card:2',
    sides: [SideType.GROUND, SideType.ROAD, SideType.GROUND, SideType.ROAD],
    connects: [0, 1, 0, 1],
  },
  {
    id: 'card:3',
    sides: [SideType.ROAD, SideType.ROAD, SideType.GROUND, SideType.GROUND],
    connects: [1, 1, 0, 0],
  },
  {
    id: 'card:4',
    sides: [SideType.GROUND, SideType.ROAD, SideType.ROAD, SideType.ROAD],
    connects: [0, 0, 0, 0],
  },
  {
    id: 'card:5',
    sides: [SideType.TOWN, SideType.ROAD, SideType.ROAD, SideType.ROAD],
    connects: [0, 0, 0, 0],
  },
  {
    id: 'card:6',
    sides: [SideType.ROAD, SideType.ROAD, SideType.ROAD, SideType.ROAD],
    connects: [0, 0, 0, 0],
  },
  {
    id: 'card:7',
    sides: [SideType.TOWN, SideType.GROUND, SideType.ROAD, SideType.ROAD],
    connects: [0, 0, 1, 1],
  },
  {
    id: 'card:8',
    sides: [SideType.TOWN, SideType.ROAD, SideType.ROAD, SideType.GROUND],
    connects: [0, 1, 1, 0],
  },
  {
    id: 'card:9',
    sides: [SideType.TOWN, SideType.GROUND, SideType.GROUND, SideType.GROUND],
    connects: [0, 0, 0, 0],
  },
  {
    id: 'card:10',
    sides: [SideType.TOWN, SideType.GROUND, SideType.TOWN, SideType.GROUND],
    connects: [0, 0, 0, 0],
  },
  {
    id: 'card:11',
    sides: [SideType.TOWN, SideType.TOWN, SideType.GROUND, SideType.GROUND],
    connects: [1, 1, 0, 0],
  },
  {
    id: 'card:12',
    sides: [SideType.TOWN, SideType.TOWN, SideType.ROAD, SideType.ROAD],
    connects: [1, 1, 2, 2],
  },
  {
    id: 'card:13',
    sides: [SideType.TOWN, SideType.GROUND, SideType.TOWN, SideType.GROUND],
    connects: [1, 0, 1, 0],
  },
  {
    id: 'card:14',
    sides: [SideType.GROUND, SideType.TOWN, SideType.TOWN, SideType.TOWN],
    connects: [0, 1, 1, 1],
  },
  {
    id: 'card:15',
    sides: [SideType.ROAD, SideType.TOWN, SideType.TOWN, SideType.TOWN],
    connects: [0, 1, 1, 1],
  },
  {
    id: 'card:16',
    sides: [SideType.TOWN, SideType.TOWN, SideType.TOWN, SideType.TOWN],
    connects: [1, 1, 1, 1],
  },
  {
    id: 'card:17',
    sides: [SideType.GROUND, SideType.GROUND, SideType.GROUND, SideType.GROUND],
    building: Building.Monastery,
    connects: [0, 0, 0, 0],
  },
  {
    id: 'card:18',
    sides: [SideType.ROAD, SideType.GROUND, SideType.GROUND, SideType.GROUND],
    building: Building.Monastery,
    connects: [0, 0, 0, 0],
  },
];

export const cardsById = cards.reduce((acc, card) => {
  let maxOrientation = 4;

  if (
    card.sides[0] === card.sides[1] &&
    card.sides[0] === card.sides[2] &&
    card.sides[0] === card.sides[3] &&
    card.connects[0] === card.connects[1] &&
    card.connects[0] === card.connects[2] &&
    card.connects[0] === card.connects[3]
  ) {
    maxOrientation = 1;
  }

  if (
    card.sides[0] === card.sides[2] &&
    card.sides[1] === card.sides[3] &&
    card.connects[0] === card.connects[2] &&
    card.connects[1] === card.connects[3]
  ) {
    maxOrientation = 2;
  }

  acc[card.id] = { ...card, maxOrientation };
  return acc;
}, {} as Record<CardId, CardInfo>);

export const startGameCardId = cards[0].id;
