import { useEffect, useRef } from 'react';

import styles from './NextCard.module.css';
import type { InGameCard } from '../../data/cards';
import { drawCard } from '../../utils/render';
import { rotateCard } from '../../utils/logic';

type Props = {
  card: InGameCard;
  onHoverChange: (isHover: boolean) => void;
  onChange: () => void;
};

export function NextCard({ card, onHoverChange, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawCard(canvasRef.current!.getContext('2d')!, {
      topLeft: { x: 0, y: 0 },
      card,
    });
  }, [card, card.sides, card.connects]);

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
