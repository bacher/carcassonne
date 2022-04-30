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
      console.error(error);
    }

    return undefined;
  }, [gameId]);

  if (game) {
    return <GameBoard gameSetup={game} />;
  }

  return (
    <MainMenu
      onStartPlay={(game) => {
        const gameId = `game${Math.floor(Math.random() * 10000)}`;

        const gameSetup = {
          ...game,
          gameId,
        };

        saveData<GamePresetSnapshot>(`game[${gameId}]`, SCHEMA_REV, gameSetup);
        window.location.hash = `#${gameId}`;
        setGameId(gameId);
      }}
    />
  );
}
