import { useMemo, useState } from 'react';
import { MainMenu } from '../MainMenu';
import { GameBoard } from '../GameBoard';
import { MenuPlayer } from '../../data/types';

const SCHEMA_REV = 1;

type SavedGamePreset = {
  schemaRev: number;
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
      const gameJson = window.localStorage.getItem(gameId);
      if (gameJson) {
        const game = JSON.parse(gameJson) as SavedGamePreset;

        if (game.schemaRev === SCHEMA_REV) {
          return game;
        }
      }
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

        localStorage.setItem(
          gameId,
          JSON.stringify({
            ...game,
            schemaRev: SCHEMA_REV,
            gameId,
          }),
        );
        window.location.hash = `#${gameId}`;
        setGameId(gameId);
      }}
    />
  );
}
