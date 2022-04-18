import React, { useEffect, useRef } from 'react';

import { render } from '../../utils/render';
import { startGameCardId } from '../../data/cards';
import { GameState, Orientation, Zone } from '../../data/types';
import styles from './GameBoard.module.css';

export function GameBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext('2d')!;

    const gameState: GameState = {
      zones: [
        {
          cardId: startGameCardId,
          orientation: Orientation.NORTH,
          coordinates: [0, 0],
        },
        ...Array.from({ length: 17 }).map(
          (v, i): Zone => ({
            cardId: i + 1,
            orientation: Orientation.NORTH,
            coordinates: [(i + 1) % 6, Math.floor((i + 1) / 6)],
          })
        ),
      ],
    };
    console.log('gameState', gameState);

    render(ctx, gameState);
  }, []);

  return (
    <div>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        width={800}
        height={600}
      />
    </div>
  );
}
