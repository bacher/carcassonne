import { useEffect, useRef } from 'react';

import type { InGameCard } from '../../data/types';
import { drawCard } from '../../utils/render';
import { rotateCard } from '../../utils/logic';
import styles from './NextCard.module.css';

type Props = {
  card: InGameCard;
  onHoverChange: (isHover: boolean) => void;
  onChange: () => void;
};

export function NextCard({ card, onHoverChange, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    drawCard(canvasRef.current!.getContext('2d')!, {
      card,
    });
  }, [card, card.sides]);

  return (
    <div
      className={styles.root}
      onMouseEnter={() => {
        onHoverChange(true);
      }}
      onMouseLeave={() => {
        onHoverChange(false);
      }}
    >
      <canvas ref={canvasRef} width={50} height={50} />
      <div className={styles.controls}>
        <button
          className={styles.rotateButton}
          type="button"
          onClick={(event) => {
            event.preventDefault();
            rotateCard(card);
            rotateCard(card);
            rotateCard(card);
            onChange();
          }}
        >
          ⟲
        </button>
        <button
          className={styles.rotateButton}
          type="button"
          onClick={(event) => {
            event.preventDefault();
            rotateCard(card);
            onChange();
          }}
        >
          ⟳
        </button>
      </div>
    </div>
  );
}
