import React, { useEffect, useMemo, useRef } from 'react';

import { render } from '../../utils/render';
import { GameState, Orientation } from '../../data/types';
import { cards, cardsById, startGameCardId } from '../../data/cards';
import styles from './GameBoard.module.css';
import { fitNextCard, getAroundCellIds, getCellId } from '../../utils/logic';

const WIDTH = 800;
const HEIGHT = 600;

export function GameBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameState = useMemo<GameState>(
    () => ({
      zones: new Map([
        [
          getCellId(0, 0),
          {
            cardId: startGameCardId,
            rotatedCard: cardsById[startGameCardId],
            orientation: Orientation.NORTH,
            coordinates: { col: 0, row: 0 },
          },
          // ...cards.map(
          //   (card, i): Zone => ({
          //     cardId: card.id,
          //     orientation: Orientation.NORTH,
          //     coordinates: [i % 6, Math.floor(i / 6)],
          //   })
          // ),
        ],
      ]),
      potentialZones: new Set(getAroundCellIds({ col: 0, row: 0 })),
      cardPool: ['card:5', 'card:6', 'card:10'],
    }),
    []
  );

  function renderBoard() {
    const ctx = canvasRef.current!.getContext('2d')!;
    render(ctx, gameState, { width: WIDTH, height: HEIGHT });
    console.log(gameState);
  }

  useEffect(renderBoard, []);

  return (
    <div className={styles.root}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        width={WIDTH}
        height={HEIGHT}
      />
      <div>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();

            fitNextCard(gameState);
            renderBoard();
          }}
        >
          Put Card
        </button>
      </div>
    </div>
  );
}
