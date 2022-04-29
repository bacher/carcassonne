import React, { useEffect, useMemo, useRef, useState } from 'react';
import { last } from 'lodash';

import { getCellByPoint, render } from '../../utils/render';
import { GameState, Player, Point, Zone } from '../../data/types';
import styles from './GameBoard.module.css';
import {
  canBePlaced,
  CellCoords,
  CellId,
  cellIdToCoords,
  fitNextCard,
  generateCardPool,
  getActivePlayer,
  getAroundCells,
  getFreeUnionsForCard,
  instantiateCard,
  makeCellCoordsByCoords,
  putCardInGame,
} from '../../utils/logic';
import { CardPool } from '../CardPool';
import { PlayersList } from '../PlayersList';
import { cards, cardsById, InGameCard } from '../../data/cards';
import { useForceUpdate } from '../../hooks/useForceUpdate';
import { useStateRef } from '../../hooks/useStateRef';
import { NextCard } from '../NextCard';
import { PeasantPlace, PutPeasant } from '../PutPeasant';

const WIDTH = 800;
const HEIGHT = 600;
const SHOW_ALL_CARDS = false;
const ENABLE_LOADING = false;

const initialCoords: CellCoords = makeCellCoordsByCoords({
  col: 0,
  row: 0,
});

function getAllCards(): [CellId, Zone][] {
  if (!SHOW_ALL_CARDS) {
    return [];
  }

  return cards.map((cardInfo, i): [CellId, Zone] => {
    const coordinates = makeCellCoordsByCoords({
      col: i % 6,
      row: Math.floor(i / 6),
    });

    const card = instantiateCard(cardsById[cardInfo.id]);

    return [
      coordinates.cellId,
      {
        card,
        coords: coordinates,
        peasant: undefined,
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
  const [isNextCardHoverRef, setNextCardHover] = useStateRef(false);
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
          initialCoords.cellId,
          {
            card: initialCard,
            coords: initialCoords,
            peasant: undefined,
          },
        ],
        ...getAllCards(),
      ]),
      potentialZones: new Set(
        getAroundCells({ col: 0, row: 0 }).map((coords) => coords.cellId),
      ),
      cardPool,
      activePlayerIndex: 0,
      players: game.players,
    };
  }, []);

  const [putPeasantState, setPutPeasantState] = useState<
    | {
        card: InGameCard;
        allowedUnions: number[];
        resolveCallback: (
          results:
            | { type: 'OK'; peasantPlace: PeasantPlace | undefined }
            | { type: 'CANCEL' },
        ) => void;
      }
    | undefined
  >();
  // >();

  useEffect(actualizeHoverCell, [isNextCardHoverRef.current]);

  // @ts-ignore
  window.gameState = gameState;

  const nextCard = last(gameState.cardPool);

  function renderBoard() {
    const ctx = canvasRef.current!.getContext('2d')!;
    render(ctx, gameState, {
      size: { width: WIDTH, height: HEIGHT },
      viewport: viewport.pos,
      hoverCellId: effects.hoverCellId,
    });

    if (ENABLE_LOADING) {
      window.setTimeout(() => {
        saveGameState();
      }, 0);
    }
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
        activePlayerIndex: state.activePlayerIndex,
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

    if (
      !isNextCardHoverRef.current &&
      x >= 0 &&
      x < WIDTH &&
      y >= 0 &&
      y < HEIGHT
    ) {
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
            const coords = cellIdToCoords(cellId);

            if (!canBePlaced(gameState.zones, card, coords)) {
              window.alert("Can't be placed here");
              return;
            }

            const player = getActivePlayer(gameState);

            const completePutting = (
              peasantPlace: PeasantPlace | undefined,
            ) => {
              putCardInGame(gameState, {
                card,
                coords,
                peasantPlace,
              });

              forceUpdate();
              renderBoard();
            };

            if (!player.peasantsCount) {
              completePutting(undefined);
              return;
            }

            const allowedUnions = getFreeUnionsForCard(gameState, card, coords);

            console.log('allowedUnions:', card, allowedUnions);

            setPutPeasantState({
              card,
              allowedUnions,
              resolveCallback: (results) => {
                setPutPeasantState(undefined);

                if (results.type === 'CANCEL') {
                  return;
                }

                completePutting(results.peasantPlace);
              },
            });
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
      <div className={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={WIDTH}
          height={HEIGHT}
          onMouseDown={(event) => {
            if (event.button !== 0) {
              return;
            }

            event.preventDefault();
            dragStartPos.x = event.screenX;
            dragStartPos.y = event.screenY;
            setMouseDown(true);
          }}
        />
        {nextCard && (
          <NextCard
            card={nextCard}
            onHoverChange={setNextCardHover}
            onChange={() => {
              renderBoard();
              forceUpdate();
            }}
          />
        )}
      </div>
      <div className={styles.rightPanel}>
        <PlayersList
          players={gameState.players}
          activePlayerIndex={gameState.activePlayerIndex}
          onDoTurnClick={() => {
            console.time('find place');
            const fitResult = fitNextCard(gameState);
            console.timeEnd('find place');

            if (fitResult) {
              putCardInGame(gameState, {
                card: fitResult.card,
                coords: fitResult.coords,
                peasantPlace: fitResult.peasantPlace,
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
              setShowCardPool(!isShowCardPool);
            }}
          >
            {isShowCardPool ? 'Hide all cards' : 'Show all cards'}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              saveGameState();
            }}
          >
            Save
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();

              if (!window.confirm('Are you sure?')) {
                return;
              }

              const state = loadGameState();
              if (!state || state.gameId !== game.gameId) {
                window.alert('No saved game');
                return;
              }

              gameState.cardPool = state.cardPool;
              gameState.players = state.players;
              gameState.zones = state.zones;
              gameState.potentialZones = state.potentialZones;
              gameState.activePlayerIndex = state.activePlayerIndex;

              renderBoard();
              forceUpdate();
            }}
          >
            Load
          </button>
        </div>
        {isShowCardPool && (
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
        )}
      </div>
      {putPeasantState && (
        <PutPeasant
          card={putPeasantState.card}
          allowedUnions={putPeasantState.allowedUnions}
          onChoose={(peasantPlace) =>
            putPeasantState.resolveCallback({ type: 'OK', peasantPlace })
          }
          onCancel={() => putPeasantState.resolveCallback({ type: 'CANCEL' })}
        />
      )}
    </div>
  );
}
