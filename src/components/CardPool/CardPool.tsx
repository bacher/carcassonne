import { useMemo, useState } from 'react';
import type { InGameCard } from '../../data/cards';
import { Building, cards, SideType } from '../../data/cards';
import { CardTypeId } from '../../data/types';
import { drawCard } from '../../utils/render';

import styles from './CardPool.module.css';

type Props = {
  cardPool: InGameCard[];
  onChoose: (card: InGameCard)=>void;
};

type GroupedItem = {
  card: InGameCard;
  count: number;
  onRef: (el: HTMLCanvasElement | null) => void;
};

export function CardPool({ cardPool,onChoose }: Props) {
  const [filters, setFilters] = useState({
    roads: true,
    towns: true,
    monastery: true,
  });

  const groupedCards = useMemo<GroupedItem[]>(() => {
    const store: Record<CardTypeId, GroupedItem> = {};

    for (const card of cardPool) {
      if (store[card.cardTypeId]) {
        store[card.cardTypeId].count++;
      } else {
        store[card.cardTypeId] = {
          card,
          count: 1,
          onRef: (el) => {
            if (el) {
              const ctx = el.getContext('2d')!;
              drawCard(ctx, { topLeft: { x: 0, y: 0 }, card });
            }
          },
        };
      }
    }

    const list = Array.from(Object.values(store));

    list.sort(
      (a, b) =>
        cards.findIndex((card) => card.id === a.card.cardTypeId) -
        cards.findIndex((card) => card.id === b.card.cardTypeId)
    );

    return list;
  }, [cardPool, cardPool.length]);

  const filteredList = useMemo(
    () =>
      groupedCards.filter((item) => {
        if (!filters.towns && item.card.sides.includes(SideType.TOWN)) {
          return false;
        }

        if (item.card.building === Building.Monastery) {
          return filters.monastery;
        }

        return item.card.sides.some(
          (side) =>
            (filters.roads && side === SideType.ROAD) ||
            (filters.towns && side === SideType.TOWN)
        );
      }),
    [groupedCards, filters.roads, filters.towns, filters.monastery]
  );

  return (
    <div className={styles.root}>
      <div className={styles.filters}>
        <label className={styles.label}>
          <input
            type="checkbox"
            checked={filters.roads}
            onChange={(event) => {
              setFilters({
                ...filters,
                roads: event.target.checked,
              });
            }}
          />
          Roads
        </label>
        <label className={styles.label}>
          <input
            type="checkbox"
            checked={filters.towns}
            onChange={(event) => {
              setFilters({
                ...filters,
                towns: event.target.checked,
              });
            }}
          />
          Towns
        </label>
        <label className={styles.label}>
          <input
            type="checkbox"
            checked={filters.monastery}
            onChange={(event) => {
              setFilters({
                ...filters,
                monastery: event.target.checked,
              });
            }}
          />
          Monastery
        </label>
      </div>
      <div className={styles.cards}>
        {filteredList.map((item) => (
          <div key={item.card.cardTypeId} onClick={event => {
            event.preventDefault();
            onChoose(item.card);
          }}>
            <canvas
              ref={item.onRef}
              width={50}
              height={50}
              className={styles.itemCanvas}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
