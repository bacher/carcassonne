import { useEffect, useRef, useState } from 'react';

import { Building, InGameCard } from '../../data/cards';
import { drawCard } from '../../utils/render';

import styles from './PutPeasant.module.css';

type Props = {
  card: InGameCard;
};

type PeasantProps = {
  index: number;
  isSelected: boolean;
  onSelect: (peasant: number) => void;
};

function PeasantRadio({ index, isSelected, onSelect }: PeasantProps) {
  return (
    <label className={styles.label} data-index={index}>
      <input
        key={index}
        type="radio"
        name="peasant"
        checked={isSelected}
        className={styles.peasant}
        onChange={() => onSelect(index)}
      />
    </label>
  );
}

export function PutPeasant({ card }: Props) {
  const [peasant, setPeasant] = useState<number | undefined>();
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
          {Array.from({ length: 8 }).map((value, index) => (
            <PeasantRadio
              index={index}
              isSelected={peasant === index}
              onSelect={setPeasant}
            />
          ))}
          {card.building === Building.Monastery && (
            <label className={styles.label}>
              <input
                type="radio"
                name="peasant"
                checked={peasant === 8}
                className={styles.peasant}
                data-index={8}
                onChange={() => setPeasant(8)}
              />
            </label>
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
      </div>
    </div>
  );
}
