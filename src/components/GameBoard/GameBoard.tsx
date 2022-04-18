import React, { useEffect, useRef } from 'react';

import { render } from '../../utils/render';
import { GameState, Orientation } from '../../data/types';
import { cards, startGameCardId } from '../../data/cards';
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
        // ...cards.map(
        //   (card, i): Zone => ({
        //     cardId: card.id,
        //     orientation: Orientation.NORTH,
        //     coordinates: [i % 6, Math.floor(i / 6)],
        //   })
        // ),
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
