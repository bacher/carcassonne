import { CardTypeId } from './types';

export const enum Building {
  Monastery = 1,
}

export const enum SideType {
  GROUND,
  TOWN,
  ROAD,
}

type CardBase = {
  sides: [SideType, SideType, SideType, SideType];
  connects: [number, number, number, number];
  building?: Building;
};

type CardTypeInfoPartial = CardBase & {
  id: CardTypeId;
  initialInDeckCount: number;
  primeTownCount?: number;
};

export type CardTypeInfo = CardTypeInfoPartial & {
  maxOrientation: number;
};

export type InGameCard = CardBase & {
  cardTypeId: CardTypeId;
  isPrimeTown: boolean;
};

const cardsPartial: CardTypeInfoPartial[] = [
  {
    id: 'card:1',
    sides: [SideType.TOWN, SideType.ROAD, SideType.GROUND, SideType.ROAD],
    connects: [0, 1, 0, 1],
    initialInDeckCount: 4,
  },
  {
    id: 'card:2',
    sides: [SideType.GROUND, SideType.ROAD, SideType.GROUND, SideType.ROAD],
    connects: [0, 1, 0, 1],
    initialInDeckCount: 8,
  },
  {
    id: 'card:3',
    sides: [SideType.ROAD, SideType.ROAD, SideType.GROUND, SideType.GROUND],
    connects: [1, 1, 0, 0],
    initialInDeckCount: 9,
  },
  {
    id: 'card:4',
    sides: [SideType.GROUND, SideType.ROAD, SideType.ROAD, SideType.ROAD],
    connects: [0, 0, 0, 0],
    initialInDeckCount: 4,
  },
  {
    id: 'card:5',
    sides: [SideType.TOWN, SideType.ROAD, SideType.ROAD, SideType.ROAD],
    connects: [0, 0, 0, 0],
    initialInDeckCount: 3,
  },
  {
    id: 'card:6',
    sides: [SideType.ROAD, SideType.ROAD, SideType.ROAD, SideType.ROAD],
    connects: [0, 0, 0, 0],
    initialInDeckCount: 1,
  },
  {
    id: 'card:7',
    sides: [SideType.TOWN, SideType.GROUND, SideType.GROUND, SideType.GROUND],
    connects: [0, 0, 0, 0],
    initialInDeckCount: 5,
  },
  {
    id: 'card:8',
    sides: [SideType.TOWN, SideType.GROUND, SideType.TOWN, SideType.GROUND],
    connects: [0, 0, 0, 0],
    initialInDeckCount: 3,
  },
  {
    id: 'card:9',
    sides: [SideType.TOWN, SideType.ROAD, SideType.ROAD, SideType.GROUND],
    connects: [0, 1, 1, 0],
    initialInDeckCount: 2,
  },
  {
    id: 'card:10',
    sides: [SideType.TOWN, SideType.GROUND, SideType.ROAD, SideType.ROAD],
    connects: [0, 0, 1, 1],
    initialInDeckCount: 3,
  },
  {
    id: 'card:11',
    sides: [SideType.TOWN, SideType.TOWN, SideType.GROUND, SideType.GROUND],
    connects: [0, 0, 0, 0],
    initialInDeckCount: 2,
    primeTownCount: 0,
  },
  {
    id: 'card:12',
    sides: [SideType.TOWN, SideType.TOWN, SideType.GROUND, SideType.GROUND],
    connects: [1, 1, 0, 0],
    initialInDeckCount: 6,
    primeTownCount: 2,
  },
  {
    id: 'card:13',
    sides: [SideType.TOWN, SideType.TOWN, SideType.ROAD, SideType.ROAD],
    connects: [1, 1, 2, 2],
    initialInDeckCount: 5,
    primeTownCount: 2,
  },
  {
    id: 'card:14',
    sides: [SideType.TOWN, SideType.GROUND, SideType.TOWN, SideType.GROUND],
    connects: [1, 0, 1, 0],
    initialInDeckCount: 3,
    primeTownCount: 2,
  },
  {
    id: 'card:15',
    sides: [SideType.GROUND, SideType.TOWN, SideType.TOWN, SideType.TOWN],
    connects: [0, 1, 1, 1],
    initialInDeckCount: 4,
    primeTownCount: 1,
  },
  {
    id: 'card:16',
    sides: [SideType.ROAD, SideType.TOWN, SideType.TOWN, SideType.TOWN],
    connects: [0, 1, 1, 1],
    initialInDeckCount: 3,
    primeTownCount: 2,
  },
  {
    id: 'card:17',
    sides: [SideType.TOWN, SideType.TOWN, SideType.TOWN, SideType.TOWN],
    connects: [1, 1, 1, 1],
    initialInDeckCount: 1,
    primeTownCount: 1,
  },
  {
    id: 'card:18',
    sides: [SideType.GROUND, SideType.GROUND, SideType.GROUND, SideType.GROUND],
    building: Building.Monastery,
    connects: [0, 0, 0, 0],
    initialInDeckCount: 4,
  },
  {
    id: 'card:19',
    sides: [SideType.ROAD, SideType.GROUND, SideType.GROUND, SideType.GROUND],
    building: Building.Monastery,
    connects: [0, 0, 0, 0],
    initialInDeckCount: 2,
  },
];

export const cards: CardTypeInfo[] = cardsPartial.map((card) => {
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

  return { ...card, maxOrientation };
});

export const cardsById = cards.reduce((acc, card) => {
  acc[card.id] = card;
  return acc;
}, {} as Record<CardTypeId, CardTypeInfo>);

console.log(
  'Total desk size:',
  cards.reduce((acc, card) => acc + card.initialInDeckCount, 0)
);
