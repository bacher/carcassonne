import React, { useEffect, useMemo, useRef, useState } from 'react';

import { render } from '../../utils/render';
import { GameState, Zone } from '../../data/types';
import styles from './GameBoard.module.css';
import {
  CellCoords,
  CellId,
  fitNextCard,
  generateCardPool,
  getAroundCellIds,
  getCellId,
  instantiateCard,
  rotateCard,
} from '../../utils/logic';
import { cards, cardsById } from '../../data/cards';

const WIDTH = 800;
const HEIGHT = 600;
const SHOW_ALL_CARDS = false;

const initialCoords: CellCoords = {
  col: 0,
  row: 0,
};

function getAllCards(globalRotation: number): [CellId, Zone][] {
  if (!SHOW_ALL_CARDS) {
    return [];
  }

  return cards.map((cardInfo, i): [CellId, Zone] => {
    const coordinates = {
      col: i % 6,
      row: Math.floor(i / 6),
    };

    const card = instantiateCard(cardsById[cardInfo.id], false);
    for (let i = 0; i < globalRotation; i++) {
      rotateCard(card);
    }

    return [
      getCellId(coordinates),
      {
        cardTypeId: cardInfo.id,
        card,
        coordinates,
      },
    ];
  });
}

export function GameBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [globalRotation, setGlobalRotation] = useState(0);
  const gameState = useMemo<GameState>(() => {
    const { initialCard, cardPool } = generateCardPool();

    return {
      zones: new Map<CellId, Zone>([
        [
          getCellId(initialCoords),
          {
            cardTypeId: initialCard.cardTypeId,
            card: initialCard,
            coordinates: initialCoords,
          },
        ],
        ...getAllCards(globalRotation % 4),
      ]),
      potentialZones: new Set(getAroundCellIds({ col: 0, row: 0 })),
      cardPool,
    };
  }, [globalRotation]);

  function renderBoard() {
    const ctx = canvasRef.current!.getContext('2d')!;
    render(ctx, gameState, { width: WIDTH, height: HEIGHT });
    console.log(gameState);
  }

  useEffect(renderBoard, [gameState]);

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

            console.time('find place');
            fitNextCard(gameState);
            console.timeEnd('find place');
            renderBoard();
          }}
        >
          Put Card
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            setGlobalRotation(globalRotation + 1);
          }}
        >
          Rotate
        </button>
      </div>
    </div>
  );
}
