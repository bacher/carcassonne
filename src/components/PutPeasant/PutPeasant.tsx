import { useEffect, useRef, useState } from 'react';

import { Building, InGameCard } from '../../data/cards';
import { drawCard } from '../../utils/render';
import {
  getQuadrant,
  getQuadrantDirection,
  getSideDirection,
} from '../../utils/logic';

import styles from './PutPeasant.module.css';

type PeasantProps = {
  pos: { x: number; y: number };
  isSelected: boolean;
  onSelect: () => void;
};

function PeasantRadio({ pos, isSelected, onSelect }: PeasantProps) {
  return (
    <label
      className={styles.label}
      style={{
        left: `${100 * pos.x}%`,
        top: `${100 * pos.y}%`,
      }}
    >
      <input
        type="radio"
        name="peasant"
        checked={isSelected}
        className={styles.peasant}
        onChange={() => onSelect()}
      />
    </label>
  );
}

export type PeasantPlace =
  | {
      type: 'CENTER';
    }
  | {
      type: 'UNION';
      unionIndex: number;
    };

const OFFSET = 0.148;

type Props = {
  card: InGameCard;
  allowedUnions: number[];
  onChoose: (placeIndex: PeasantPlace | undefined) => void;
  onCancel: () => void;
};

export function PutPeasant({ card, allowedUnions, onChoose, onCancel }: Props) {
  const [peasant, setPeasant] = useState<PeasantPlace | undefined>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.save();
    ctx.scale(6, 6);
    drawCard(ctx, {
      card,
    });
    ctx.restore();
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.modal}>
        <div className={styles.canvasWrapper}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            width={300}
            height={300}
          />
          {card.unions.map(({ unionSides }, unionIndex) => {
            if (!allowedUnions.includes(unionIndex)) {
              return undefined;
            }

            let pos: { x: number; y: number };

            switch (unionSides.length) {
              case 1: {
                const dir = getSideDirection(unionSides[0]);
                pos = {
                  x: 0.5 + dir.x * 0.4,
                  y: 0.5 + dir.y * 0.4,
                };
                break;
              }
              case 2: {
                const [side1, side2] = unionSides;
                const center = getQuadrantDirection(getQuadrant(side1, side2));
                pos = {
                  x: 0.5 + center.x * OFFSET,
                  y: 0.5 + center.y * OFFSET,
                };
                break;
              }
              default:
                pos = { x: 0.5, y: 0.5 };
            }

            return (
              <PeasantRadio
                key={unionIndex}
                pos={pos}
                isSelected={Boolean(
                  peasant &&
                    peasant.type === 'UNION' &&
                    unionIndex === peasant.unionIndex,
                )}
                onSelect={() =>
                  setPeasant({
                    type: 'UNION',
                    unionIndex,
                  })
                }
              />
            );
          })}
          {card.building === Building.Monastery && (
            <PeasantRadio
              pos={{ x: 0.5, y: 0.5 }}
              isSelected={Boolean(peasant && peasant.type === 'CENTER')}
              onSelect={() => setPeasant({ type: 'CENTER' })}
            />
          )}
        </div>
        <label className={styles.nobodyLabel}>
          <input
            type="radio"
            name="peasant"
            checked={peasant === undefined}
            className={styles.nobody}
            onChange={() => setPeasant(undefined)}
          />{' '}
          Nobody
        </label>
        <div className={styles.footer}>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              onChoose(peasant);
            }}
          >
            Ok
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              onCancel();
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
