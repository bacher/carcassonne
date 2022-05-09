import React, { useEffect, useMemo, useRef, useState } from 'react';
import { last } from 'lodash';
import cn from 'classnames';

import { getCellByPoint, render } from '../../utils/render';
import {
  GameState,
  MenuPlayer,
  Player,
  Point,
  Zone,
  PeasantPlace,
  InGameCard,
  CellCoords,
  CellId,
} from '../../data/types';
import styles from './GameBoard.module.css';
import {
  canBePlaced,
  cellIdToCoords,
  fitNextCard,
  generateCardPool,
  getActivePlayer,
  getAroundCells,
  getFreeUnionsForCard,
  getPossibleTurns,
  instantiateCard,
  makeCellCoordsByCoords,
  PossibleTurn,
  putCardInGame,
} from '../../utils/logic';
import { CardPool } from '../CardPool';
import { PlayersList } from '../PlayersList';
import { cards, cardsById } from '../../data/cards';
import { useForceUpdate } from '../../hooks/useForceUpdate';
import { useStateRef } from '../../hooks/useStateRef';
import { NextCard } from '../NextCard';
import { PutPeasant } from '../PutPeasant';
import { GameStats } from '../GameStats';
import { PossibleTurns } from '../PossibleTurns';
import { loadData, saveData } from '../../utils/localStorage';
import { shouldExists } from '../../utils/helpers';
import { useWindowEvent } from '../../hooks/useWindowEvent';

const SCHEMA_REV = 1;
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
        meta: {
          turnNumber: 0,
          placedByPlayerIndex: undefined,
        },
      },
    ];
  });
}

type Props = {
  gameSetup: {
    gameId: string;
    players: MenuPlayer[];
  };
};

const enum MouseState {
  HOVERING,
  DRAGGING,
}

type Effects = {
  hoverCellId: number | undefined;
};

type GameStateSnapshot = {
  schemaRev: number;
  gameId: string;
  cardPool: InGameCard[];
  players: Player[];
  activePlayerIndex: number;
  zones: [number, Zone][];
  potentialZones: number[];
};

type Size = {
  width: number;
  height: number;
};

export function GameBoard({ gameSetup }: Props) {
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
  const [viewportSize, setViewportSize] = useStateRef<Size>({
    width: 0,
    height: 0,
  });

  function syncViewportSize() {
    const canvas = shouldExists(canvasRef.current);

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (
      viewportSize.current.width !== width ||
      viewportSize.current.height !== height
    ) {
      setViewportSize({ width, height });

      canvas.width = width;
      canvas.height = height;
      renderBoard();
    }
  }

  const gameState = useMemo<GameState>(() => {
    if (ENABLE_LOADING) {
      const state = loadGameState();

      if (state && state.gameId === gameSetup.gameId) {
        return state;
      }
    }

    const { initialCard, cardPool } = generateCardPool();

    return {
      gameId: gameSetup.gameId,
      zones: new Map<CellId, Zone>([
        [
          initialCoords.cellId,
          {
            card: initialCard,
            coords: initialCoords,
            peasant: undefined,
            meta: {
              turnNumber: 0,
              placedByPlayerIndex: undefined,
            },
          },
        ],
        ...getAllCards(),
      ]),
      potentialZones: new Set(
        getAroundCells({ col: 0, row: 0 }).map((coords) => coords.cellId),
      ),
      cardPool,
      activePlayerIndex: 0,
      players: gameSetup.players.map((menuPlayer, index) => ({
        ...menuPlayer,
        playerIndex: index,
        peasantsCount: 7,
        score: 0,
      })),
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

  const [possibleTurns, setPossibleTurns] = useState<PossibleTurn[]>([]);
  const [isShowPossibleTurns, setIsShowPossibleTurns] = useState(false);
  const [activeTurn, setActiveTurn] = useStateRef<PossibleTurn | undefined>(
    undefined,
  );

  useEffect(syncViewportSize, [isShowPossibleTurns, isShowCardPool]);
  useWindowEvent('resize', syncViewportSize);

  useEffect(actualizeHoverCell, [isNextCardHoverRef.current]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).gameState = gameState;

  const nextCard = last(gameState.cardPool);

  function renderBoard() {
    const canvas = canvasRef.current;

    if (!canvas || viewportSize.current.width === 0) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const ctx = canvas!.getContext('2d')!;

    render(ctx, gameState, {
      size: viewportSize.current,
      viewport: viewport.pos,
      hoverCellId: effects.hoverCellId,
      activeTurn: activeTurn.current ?? undefined,
    });

    if (ENABLE_LOADING) {
      window.setTimeout(() => {
        saveGameState();
      }, 0);
    }
  }

  useEffect(renderBoard, [gameState]);

  function saveGameState(gameName?: string) {
    const gameStateSnapshot: GameStateSnapshot = {
      ...gameState,
      schemaRev: SCHEMA_REV,
      zones: Array.from(gameState.zones.entries()),
      potentialZones: Array.from(gameState.potentialZones.values()),
    };

    saveData<GameStateSnapshot>(
      `gameState[${gameName ?? '_autosave'}]`,
      SCHEMA_REV,
      gameStateSnapshot,
    );
  }

  function loadGameState(gameName?: string): GameState | undefined {
    const state = loadData<GameStateSnapshot>(
      `gameState[${gameName ?? '_autosave'}]`,
      SCHEMA_REV,
    );

    if (!state) {
      return undefined;
    }

    try {
      return {
        gameId: state.gameId,
        cardPool: state.cardPool,
        players: state.players,
        activePlayerIndex: state.activePlayerIndex,
        zones: new Map(state.zones),
        potentialZones: new Set(state.potentialZones),
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }

    return undefined;
  }

  function actualizeHoverCell() {
    const { width, height } = viewportSize.current;

    const { x, y } = mousePos;

    let hoverCell: number | undefined;

    if (
      !isNextCardHoverRef.current &&
      x >= 0 &&
      x < width &&
      y >= 0 &&
      y < height
    ) {
      hoverCell = getCellByPoint(
        { size: { width, height }, viewport: viewport.pos },
        { x, y },
      );
    }

    if (effects.hoverCellId !== hoverCell) {
      effects.hoverCellId = hoverCell;
      renderBoard();
    }
  }

  function applyDragMove(event: MouseEvent): void {
    const deltaX = event.screenX - dragStartPos.x;
    const deltaY = event.screenY - dragStartPos.y;
    viewport.pos.x += deltaX;
    dragStartPos.x += deltaX;
    viewport.pos.y += deltaY;
    dragStartPos.y += deltaY;
  }

  useEffect(() => {
    if (
      !putPeasantState &&
      (isMouseDown ||
        mouseState === MouseState.DRAGGING ||
        mouseState === MouseState.HOVERING)
    ) {
      const onMouseMove = (event: MouseEvent) => {
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
          applyDragMove(event);
          renderBoard();
        } else {
          actualizeHoverCell();
        }
      };

      const onMouseUp = (event: MouseEvent) => {
        mousePos.x = event.pageX;
        mousePos.y = event.pageY;

        setMouseDown(false);

        if (mouseState === MouseState.DRAGGING) {
          applyDragMove(event);
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
                setPossibleTurns([]);
                setActiveTurn(undefined);

                forceUpdate();
                renderBoard();
              };

              if (!player.peasantsCount) {
                completePutting(undefined);
                return;
              }

              const allowedUnions = getFreeUnionsForCard(
                gameState,
                card,
                coords,
              );

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
      };

      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('mouseup', onMouseUp, { passive: true });

      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [mouseState, isMouseDown, Boolean(putPeasantState)]);

  function loadGame(gameName?: string) {
    const state = loadGameState(gameName);
    if (!state || state.gameId !== gameSetup.gameId) {
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
  }

  return (
    <div className={styles.root}>
      <div className={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={0}
          height={0}
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
      <div className={cn(styles.column, styles.players)}>
        <GameStats gameState={gameState} />
        <PlayersList
          players={gameState.players}
          activePlayerIndex={gameState.activePlayerIndex}
          onDoTurnClick={() => {
            /* eslint-disable no-console */
            console.time('find place');
            const turn = fitNextCard(gameState);
            console.timeEnd('find place');
            /* eslint-disable no-console */

            if (turn) {
              putCardInGame(gameState, turn);
              setPossibleTurns([]);
              setActiveTurn(undefined);
            } else if (window.confirm("Can't be placed, try next?")) {
              gameState.cardPool.pop();
            }

            renderBoard();
            forceUpdate();
          }}
          onGetPossibleTurnsClick={() => {
            const turns = getPossibleTurns(gameState);

            setPossibleTurns(turns);
            setIsShowPossibleTurns(true);

            if (turns.length === 0) {
              window.alert('No turns available');
            }
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

              if (!window.confirm('Are you sure?')) {
                return;
              }

              loadGame();
            }}
          >
            Load
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();

              const gameName = window.prompt('Enter load game name')?.trim();
              if (!gameName) {
                return;
              }
              loadGame(gameName);
            }}
          >
            Load ...
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

              const gameName = window.prompt('Enter load game name')?.trim();

              if (gameName) {
                saveGameState(gameName);
              }
            }}
          >
            Save as ...
          </button>
        </div>
      </div>
      {isShowCardPool && (
        <div className={styles.column}>
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
      {isShowPossibleTurns && (
        <div className={cn(styles.column, styles.wide)}>
          <PossibleTurns
            possibleTurns={possibleTurns}
            onTurnApply={(turn) => {
              putCardInGame(gameState, turn);
              setPossibleTurns([]);
              setActiveTurn(undefined);
              renderBoard();
              forceUpdate();
            }}
            onTurnHover={(turn) => {
              setActiveTurn(turn);
              renderBoard();
            }}
            onHideClick={() => {
              setIsShowPossibleTurns(false);
            }}
          />
        </div>
      )}
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
