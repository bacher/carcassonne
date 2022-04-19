import React, { useEffect, useMemo, useRef, useState } from 'react';

import { getCellByPoint, render } from '../../utils/render';
import { GameState, Player, Point, Zone } from '../../data/types';
import styles from './GameBoard.module.css';
import {
  CellCoords,
  CellId,
  cellIdToCoords,
  fitNextCard,
  generateCardPool,
  getAroundCellIds,
  getCellId,
  instantiateCard,
  putCardInGame,
  rotateCard,
} from '../../utils/logic';
import { CardPool } from '../CardPool';
import { PlayersList } from '../PlayersList';
import { cards, cardsById } from '../../data/cards';
import { useForceUpdate } from '../../hooks/useForceUpdate';

const WIDTH = 800;
const HEIGHT = 600;
const SHOW_ALL_CARDS = false;
const ENABLE_LOADING = false;

const initialCoords: CellCoords = {
  col: 0,
  row: 0,
};

function getAllCards(): [CellId, Zone][] {
  if (!SHOW_ALL_CARDS) {
    return [];
  }

  return cards.map((cardInfo, i): [CellId, Zone] => {
    const coordinates = {
      col: i % 6,
      row: Math.floor(i / 6),
    };

    const card = instantiateCard(cardsById[cardInfo.id], false);

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

type Props = {
  game: {
    gameId: string;
    players: Player[];
  };
};

const enum MouseState {
  NONE,
  HOVERING,
  DRAGGING,
}

type Effects = {
  hoverCellId: number | undefined;
};

export function GameBoard({ game }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mouseState, setMouseState] = useState<MouseState>(MouseState.HOVERING);
  const [isShowCardPool, setShowCardPool] = useState(false);
  const dragStartPos = useMemo(() => ({ x: 0, y: 0 }), []);
  const viewport = useMemo(() => ({ pos: { x: 0, y: 0 } }), []);
  const forceUpdate = useForceUpdate();
  const mousePos = useMemo<Point>(() => ({ x: -999, y: -999 }), []);
  const [isMouseDown, setMouseDown] = useState(false);
  const effects = useMemo<Effects>(() => ({ hoverCellId: undefined }), []);
  const gameState = useMemo<GameState>(() => {
    if (ENABLE_LOADING) {
      const state = loadGameState();

      if (state && state.gameId === game.gameId) {
        return state;
      }
    }

    const { initialCard, cardPool } = generateCardPool();

    return {
      gameId: game.gameId,
      zones: new Map<CellId, Zone>([
        [
          getCellId(initialCoords),
          {
            cardTypeId: initialCard.cardTypeId,
            card: initialCard,
            coordinates: initialCoords,
          },
        ],
        ...getAllCards(),
      ]),
      potentialZones: new Set(getAroundCellIds({ col: 0, row: 0 })),
      cardPool,
      activePlayer: 0,
      players: game.players,
    };
  }, []);

  console.log(gameState);

  function renderBoard() {
    const ctx = canvasRef.current!.getContext('2d')!;
    render(ctx, gameState, {
      size: { width: WIDTH, height: HEIGHT },
      viewport: viewport.pos,
      hoverCell: effects.hoverCellId,
    });

    window.setTimeout(() => {
      saveGameState();
    }, 0);
  }

  useEffect(renderBoard, [gameState]);

  function saveGameState() {
    localStorage.setItem(
      'gameState',
      JSON.stringify({
        ...gameState,
        zones: Array.from(gameState.zones.entries()),
        potentialZones: Array.from(gameState.potentialZones.values()),
      }),
    );
  }

  function loadGameState(): GameState | undefined {
    const stateJson = localStorage.getItem('gameState');

    if (!stateJson) {
      return undefined;
    }

    try {
      const state = JSON.parse(stateJson);

      return {
        gameId: state.gameId,
        cardPool: state.cardPool,
        players: state.players,
        activePlayer: state.activePlayer,
        zones: new Map(state.zones),
        potentialZones: new Set(state.potentialZones),
      };
    } catch (error) {
      console.error(error);
    }
  }

  function actualizeHoverCell() {
    const { x, y } = mousePos;

    let hoverCell: number | undefined;

    if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
      hoverCell = getCellByPoint(
        { size: { width: WIDTH, height: HEIGHT }, viewport: viewport.pos },
        { x, y },
      );
    }

    if (effects.hoverCellId !== hoverCell) {
      effects.hoverCellId = hoverCell;
      renderBoard();
    }
  }

  useEffect(() => {
    function onMouseMove(event: MouseEvent) {
      if (event.button !== 0) {
        return;
      }

      mousePos.x = event.pageX;
      mousePos.y = event.pageY;

      if (isMouseDown && mouseState !== MouseState.DRAGGING) {
        if (
          Math.abs(event.screenX - dragStartPos.x) +
            Math.abs(event.screenY - dragStartPos.y) >
          3
        ) {
          setMouseState(MouseState.DRAGGING);
        }
      }

      if (mouseState === MouseState.DRAGGING) {
        viewport.pos.x = event.screenX - dragStartPos.x;
        viewport.pos.y = event.screenY - dragStartPos.y;
        renderBoard();
      } else {
        actualizeHoverCell();
      }
    }

    function onMouseUp(event: MouseEvent) {
      mousePos.x = event.pageX;
      mousePos.y = event.pageY;

      setMouseDown(false);

      if (mouseState === MouseState.DRAGGING) {
        viewport.pos.x = event.screenX - dragStartPos.x;
        viewport.pos.y = event.screenY - dragStartPos.y;
        setMouseState(MouseState.HOVERING);
        renderBoard();
      } else {
        actualizeHoverCell();

        const card = gameState.cardPool[gameState.cardPool.length - 1];

        if (effects.hoverCellId && card) {
          const cellId = effects.hoverCellId;

          if (gameState.potentialZones.has(effects.hoverCellId)) {
            putCardInGame(gameState, {
              card,
              cardTypeId: card.cardTypeId,
              coordinates: cellIdToCoords(cellId),
            });

            forceUpdate();
            renderBoard();
          }
        }
      }
    }

    if (
      setMouseDown ||
      mouseState === MouseState.DRAGGING ||
      mouseState === MouseState.HOVERING
    ) {
      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('mouseup', onMouseUp, { passive: true });

      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [mouseState, isMouseDown]);

  return (
    <div className={styles.root}>
      <div
        onMouseDown={(event) => {
          if (event.button !== 0) {
            return;
          }

          event.preventDefault();
          dragStartPos.x = event.screenX;
          dragStartPos.y = event.screenY;
          setMouseDown(true);
        }}
      >
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={WIDTH}
          height={HEIGHT}
        />
      </div>
      <div className={styles.rightPanel}>
        <PlayersList
          players={gameState.players}
          activePlayerIndex={gameState.activePlayer}
          onDoTurnClick={() => {
            console.time('find place');
            const fitResult = fitNextCard(gameState);
            console.timeEnd('find place');

            if (fitResult) {
              putCardInGame(gameState, {
                cardTypeId: fitResult.card.cardTypeId,
                card: fitResult.card,
                coordinates: fitResult.coordinates,
              });
            } else if (window.confirm("Can't be placed, try next?")) {
              gameState.cardPool.pop();
            }

            renderBoard();
            forceUpdate();
            console.log(gameState);
          }}
        />
        <div className={styles.buttons}>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              const nextCard =
                gameState.cardPool[gameState.cardPool.length - 1];

              rotateCard(nextCard);
              renderBoard();
            }}
          >
            Rotate current card
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
            <CardPool
              cardPool={gameState.cardPool}
              onChoose={(card) => {
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
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
