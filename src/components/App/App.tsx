import { useMemo, useState } from 'react';

import type { MenuPlayer } from '../../data/types';
import { loadData, saveData } from '../../utils/localStorage';
import { MainMenu } from '../MainMenu';
import { GameBoard } from '../GameBoard';

const SCHEMA_REV = 1;

type GamePresetSnapshot = {
  gameId: string;
  players: MenuPlayer[];
};

export function App() {
  const initialGameId = useMemo<string | undefined>(() => {
    const hash = window.location.hash.replace(/^#/, '');

    const match = hash.match(/^game\d+$/);
    if (!match) {
      return undefined;
    }

    return hash;
  }, []);

  const [gameId, setGameId] = useState(initialGameId);

  const game = useMemo(() => {
    if (!gameId) {
      return undefined;
    }

    try {
      return loadData<GamePresetSnapshot>(`game[${gameId}]`, SCHEMA_REV);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }

    return undefined;
  }, [gameId]);

  if (game) {
    return <GameBoard gameSetup={game} />;
  }

  return (
    <MainMenu
      onStartPlay={(newGame) => {
        const newGameId = `game${Math.floor(Math.random() * 10000)}`;

        const gameSetup = {
          ...newGame,
          gameId: newGameId,
        };

        saveData<GamePresetSnapshot>(
          `game[${newGameId}]`,
          SCHEMA_REV,
          gameSetup,
        );
        window.location.hash = `#${newGameId}`;
        setGameId(newGameId);
      }}
    />
  );
}
