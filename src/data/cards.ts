import { CardTypeId } from './types';

export const enum Building {
  Monastery = 1,
}

export const enum SideType {
  TOWN,
  ROAD,
}

type CardBase = {
  sides: [
    SideType | undefined,
    SideType | undefined,
    SideType | undefined,
    SideType | undefined,
  ];
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
  unions: UnionObject[];
};

const cardsPartial: CardTypeInfoPartial[] = [
  {
    id: 'card:1',
    sides: [SideType.TOWN, SideType.ROAD, undefined, SideType.ROAD],
    connects: [0, 1, 0, 1],
    initialInDeckCount: 4,
  },
  {
    id: 'card:2',
    sides: [undefined, SideType.ROAD, undefined, SideType.ROAD],
    connects: [0, 1, 0, 1],
    initialInDeckCount: 8,
  },
  {
    id: 'card:3',
    sides: [SideType.ROAD, SideType.ROAD, undefined, undefined],
    connects: [1, 1, 0, 0],
    initialInDeckCount: 9,
  },
  {
    id: 'card:4',
    sides: [undefined, SideType.ROAD, SideType.ROAD, SideType.ROAD],
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
    sides: [SideType.TOWN, undefined, undefined, undefined],
    connects: [0, 0, 0, 0],
    initialInDeckCount: 5,
  },
  {
    id: 'card:8',
    sides: [SideType.TOWN, undefined, SideType.TOWN, undefined],
    connects: [0, 0, 0, 0],
    initialInDeckCount: 3,
  },
  {
    id: 'card:9',
    sides: [SideType.TOWN, SideType.ROAD, SideType.ROAD, undefined],
    connects: [0, 1, 1, 0],
    initialInDeckCount: 3,
  },
  {
    id: 'card:10',
    sides: [SideType.TOWN, undefined, SideType.ROAD, SideType.ROAD],
    connects: [0, 0, 1, 1],
    initialInDeckCount: 3,
  },
  {
    id: 'card:11',
    sides: [SideType.TOWN, SideType.TOWN, undefined, undefined],
    connects: [0, 0, 0, 0],
    initialInDeckCount: 2,
  },
  {
    id: 'card:12',
    sides: [SideType.TOWN, SideType.TOWN, undefined, undefined],
    connects: [1, 1, 0, 0],
    initialInDeckCount: 3,
  },
  {
    id: 'card:13',
    sides: [SideType.TOWN, SideType.TOWN, undefined, undefined],
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
    sides: [undefined, SideType.TOWN, undefined, SideType.TOWN],
    connects: [0, 1, 0, 1],
    initialInDeckCount: 1,
  },
  {
    id: 'card:17',
    sides: [undefined, SideType.TOWN, undefined, SideType.TOWN],
    connects: [0, 1, 0, 1],
    initialInDeckCount: 2,
    isPrimeTown: true,
  },
  {
    id: 'card:18',
    sides: [undefined, SideType.TOWN, SideType.TOWN, SideType.TOWN],
    connects: [0, 1, 1, 1],
    initialInDeckCount: 3,
  },
  {
    id: 'card:19',
    sides: [undefined, SideType.TOWN, SideType.TOWN, SideType.TOWN],
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
    sides: [undefined, undefined, undefined, undefined],
    building: Building.Monastery,
    connects: [0, 0, 0, 0],
    initialInDeckCount: 4,
  },
  {
    id: 'card:24',
    sides: [SideType.ROAD, undefined, undefined, undefined],
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
  unionSides: Side[];
  unionSideType: SideType.TOWN | SideType.ROAD;
};

function calcUnions(card: CardTypeInfoPartial): UnionObject[] {
  if (card.connects.length !== 4) {
    throw new Error();
  }

  const alone: UnionObject[] = [];
  const unions = new Map<number, UnionObject>();

  for (let i = 0; i < 4; i++) {
    const sideType = card.sides[i];

    if (sideType === undefined) {
      continue;
    }

    const unionId = card.connects[i];

    if (unionId === 0) {
      alone.push({
        unionSideType: sideType,
        unionSides: [i],
      });
      continue;
    }

    const unionObject = unions.get(unionId);

    if (unionObject) {
      unionObject.unionSides.push(i);
    } else {
      unions.set(unionId, {
        unionSideType: sideType,
        unionSides: [i],
      });
    }
  }

  const allUnions = [...alone, ...Array.from(unions.values())];

  allUnions.sort((a, b) => a.unionSides[0] - b.unionSides[0]);

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
