import { useMemo, useState } from 'react';
import cn from 'classnames';
import { last } from 'lodash';

import { CardTypeId, SideType, Building, InGameCard } from '../../data/types';
import { cards } from '../../data/cards';
import { drawCard } from '../../utils/render';

import styles from './CardPool.module.css';

type Props = {
  cardPool: InGameCard[];
  onChoose: (card: InGameCard) => void;
};

type GroupedItem = {
  card: InGameCard;
  count: number;
  onRef: (el: HTMLCanvasElement | null) => void;
};

export function CardPool({ cardPool, onChoose }: Props) {
  const [filters, setFilters] = useState({
    roads: true,
    towns: true,
    monastery: true,
  });
  const [isShowCount, setShowCount] = useState(false);

  const nextCard = last(cardPool);

  const groupedCards = useMemo<GroupedItem[]>(() => {
    const store: Record<CardTypeId, GroupedItem> = {};

    for (const card of cardPool) {
      if (store[card.cardTypeId]) {
        store[card.cardTypeId].count += 1;
      } else {
        store[card.cardTypeId] = {
          card,
          count: 1,
          onRef: (el) => {
            if (el) {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              const ctx = el.getContext('2d')!;
              drawCard(ctx, { card });
            }
          },
        };
      }
    }

    const list = Array.from(Object.values(store));

    list.sort(
      (a, b) =>
        cards.findIndex((card) => card.id === a.card.cardTypeId) -
        cards.findIndex((card) => card.id === b.card.cardTypeId),
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
            (filters.towns && side === SideType.TOWN),
        );
      }),
    [groupedCards, filters.roads, filters.towns, filters.monastery],
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
          <button
            key={item.card.cardTypeId}
            type="button"
            className={cn(styles.itemWrapper, {
              [styles.itemWrapperCurrent]:
                nextCard && item.card.cardTypeId === nextCard.cardTypeId,
            })}
            onClick={(event) => {
              event.preventDefault();
              onChoose(item.card);
            }}
          >
            <canvas
              ref={item.onRef}
              width={50}
              height={50}
              className={styles.itemCanvas}
            />
            {isShowCount && (
              <div className={styles.counter}>
                <span className={styles.number}>{item.count}</span>
              </div>
            )}
          </button>
        ))}
      </div>
      <div className={styles.footer}>
        <label className={styles.label}>
          <input
            type="checkbox"
            checked={isShowCount}
            onChange={() => {
              setShowCount(!isShowCount);
            }}
          />
          Display count
        </label>
      </div>
    </div>
  );
}
