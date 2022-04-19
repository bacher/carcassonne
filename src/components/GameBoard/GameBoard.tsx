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
import { CardPool } from '../CardPool';
import { cards, cardsById } from '../../data/cards';
import { useForceUpdate } from '../../hooks/useForceUpdate';

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
  const [isDragging, setDragging] = useState(false);
  const [isShowCardPool, setShowCardPool] = useState(false);
  const dragStartPos = useMemo(() => ({ x: 0, y: 0 }), []);
  const viewport = useMemo(() => ({ pos: { x: 0, y: 0 } }), []);
  const forceUpdate = useForceUpdate();
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

  console.log(gameState);

  function renderBoard() {
    const ctx = canvasRef.current!.getContext('2d')!;
    render(ctx, gameState, {
      size: { width: WIDTH, height: HEIGHT },
      viewport: viewport.pos,
    });
  }

  useEffect(renderBoard, [gameState]);

  useEffect(() => {
    function onMouseMove(event: MouseEvent) {
      viewport.pos.x = event.screenX - dragStartPos.x;
      viewport.pos.y = event.screenY - dragStartPos.y;
      renderBoard();
    }

    function onMouseUp(event: MouseEvent) {
      viewport.pos.x = event.screenX - dragStartPos.x;
      viewport.pos.y = event.screenY - dragStartPos.y;
      renderBoard();
      setDragging(false);
    }

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('mouseup', onMouseUp, { passive: true });

      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div className={styles.root}>
      <div
        onMouseDown={(event) => {
          event.preventDefault();
          dragStartPos.x = event.screenX;
          dragStartPos.y = event.screenY;
          setDragging(true);
        }}
      >
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={WIDTH}
          height={HEIGHT}
        />
      </div>
      <div className={styles.buttons}>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();

            console.time('find place');
            const success = fitNextCard(gameState);
            console.timeEnd('find place');

            if (!success) {
              if (window.confirm("Can't be placed, try next?")) {
                gameState.cardPool.pop();
              }
              return;
            }

            renderBoard();
            forceUpdate();
            console.log(gameState);
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
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            setShowCardPool(true);
          }}
        >
          Choose next card
        </button>
      </div>
      {isShowCardPool && (
        <div>
          <CardPool cardPool={gameState.cardPool} onChoose={card => {
            const index = gameState.cardPool.indexOf(card);
            if (index === -1) {
              throw new Error();
            }

            const pool = Array.from(gameState.cardPool);
            pool.splice(index, 1);
            pool.push(card);
            gameState.cardPool = pool;
            forceUpdate();
            renderBoard();
          }}/>
        </div>
      )}
    </div>
  );
}
