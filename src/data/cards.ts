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
  isPrimeTown?: boolean;
};

export type CardTypeInfo = CardTypeInfoPartial & {
  maxOrientation: number;
  unions: UnionObject[];
};

export const enum Side {
  UP,
  RIGHT,
  DOWN,
  LEFT,
}

export type InGameCard = CardBase & {
  cardTypeId: CardTypeId;
  isPrimeTown: boolean;
  unions: { union: Side[] }[];
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
    initialInDeckCount: 3,
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
  },
  {
    id: 'card:12',
    sides: [SideType.TOWN, SideType.TOWN, SideType.GROUND, SideType.GROUND],
    connects: [1, 1, 0, 0],
    initialInDeckCount: 3,
  },
  {
    id: 'card:13',
    sides: [SideType.TOWN, SideType.TOWN, SideType.GROUND, SideType.GROUND],
    connects: [1, 1, 0, 0],
    initialInDeckCount: 2,
    isPrimeTown: true,
  },
  {
    id: 'card:14',
    sides: [SideType.TOWN, SideType.TOWN, SideType.ROAD, SideType.ROAD],
    connects: [1, 1, 2, 2],
    initialInDeckCount: 3,
  },
  {
    id: 'card:15',
    sides: [SideType.TOWN, SideType.TOWN, SideType.ROAD, SideType.ROAD],
    connects: [1, 1, 2, 2],
    initialInDeckCount: 2,
    isPrimeTown: true,
  },
  {
    id: 'card:16',
    sides: [SideType.GROUND, SideType.TOWN, SideType.GROUND, SideType.TOWN],
    connects: [0, 1, 0, 1],
    initialInDeckCount: 1,
  },
  {
    id: 'card:17',
    sides: [SideType.GROUND, SideType.TOWN, SideType.GROUND, SideType.TOWN],
    connects: [0, 1, 0, 1],
    initialInDeckCount: 2,
    isPrimeTown: true,
  },
  {
    id: 'card:18',
    sides: [SideType.GROUND, SideType.TOWN, SideType.TOWN, SideType.TOWN],
    connects: [0, 1, 1, 1],
    initialInDeckCount: 3,
  },
  {
    id: 'card:19',
    sides: [SideType.GROUND, SideType.TOWN, SideType.TOWN, SideType.TOWN],
    connects: [0, 1, 1, 1],
    initialInDeckCount: 1,
    isPrimeTown: true,
  },
  {
    id: 'card:20',
    sides: [SideType.ROAD, SideType.TOWN, SideType.TOWN, SideType.TOWN],
    connects: [0, 1, 1, 1],
    initialInDeckCount: 1,
  },
  {
    id: 'card:21',
    sides: [SideType.ROAD, SideType.TOWN, SideType.TOWN, SideType.TOWN],
    connects: [0, 1, 1, 1],
    initialInDeckCount: 2,
    isPrimeTown: true,
  },
  {
    id: 'card:22',
    sides: [SideType.TOWN, SideType.TOWN, SideType.TOWN, SideType.TOWN],
    connects: [1, 1, 1, 1],
    initialInDeckCount: 1,
    isPrimeTown: true,
  },
  {
    id: 'card:23',
    sides: [SideType.GROUND, SideType.GROUND, SideType.GROUND, SideType.GROUND],
    building: Building.Monastery,
    connects: [0, 0, 0, 0],
    initialInDeckCount: 4,
  },
  {
    id: 'card:24',
    sides: [SideType.ROAD, SideType.GROUND, SideType.GROUND, SideType.GROUND],
    building: Building.Monastery,
    connects: [0, 0, 0, 0],
    initialInDeckCount: 2,
  },
];

export const cards: CardTypeInfo[] = cardsPartial.map((card) => {
  return {
    ...card,
    maxOrientation: calMaxOrientation(card),
    unions: calcUnions(card),
  };
});

function calMaxOrientation(card: CardTypeInfoPartial): number {
  if (
    card.sides[0] === card.sides[1] &&
    card.sides[0] === card.sides[2] &&
    card.sides[0] === card.sides[3] &&
    card.connects[0] === card.connects[1] &&
    card.connects[0] === card.connects[2] &&
    card.connects[0] === card.connects[3]
  ) {
    return 1;
  }

  if (
    card.sides[0] === card.sides[2] &&
    card.sides[1] === card.sides[3] &&
    card.connects[0] === card.connects[2] &&
    card.connects[1] === card.connects[3]
  ) {
    return 2;
  }

  return 4;
}

type UnionObject = {
  union: Side[];
};

function calcUnions(card: CardTypeInfoPartial): UnionObject[] {
  if (card.connects.length !== 4) {
    throw new Error();
  }

  const alone: UnionObject[] = [];
  const unions = new Map<number, UnionObject>();

  for (let i = 0; i < 4; i++) {
    const unionId = card.connects[i];

    if (unionId === 0) {
      alone.push({ union: [i] });
      continue;
    }

    const unionObject = unions.get(unionId);

    if (unionObject) {
      unionObject.union.push(i);
    } else {
      unions.set(unionId, { union: [i] });
    }
  }

  const allUnions = [...alone, ...Array.from(unions.values())];

  allUnions.sort((a, b) => a.union[0] - b.union[0]);

  return allUnions;
}

export const cardsById = cards.reduce((acc, card) => {
  acc[card.id] = card;
  return acc;
}, {} as Record<CardTypeId, CardTypeInfo>);

console.log(
  'Total desk size:',
  cards.reduce((acc, card) => acc + card.initialInDeckCount, 0),
);
