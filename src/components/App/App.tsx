import { useMemo, useState } from 'react';
import { MainMenu } from '../MainMenu';
import { GameBoard } from '../GameBoard';

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
        return JSON.parse(gameJson);
      }
    } catch (error) {
      console.error(error);
    }

    return undefined;
  }, [gameId]);

  if (game) {
    return <GameBoard game={game} />;
  }

  return (
    <MainMenu
      onStartPlay={(game) => {
        const gameId = `game${Math.floor(Math.random() * 10000)}`;

        localStorage.setItem(gameId, JSON.stringify(game));
        window.location.hash = `#${gameId}`;
        setGameId(gameId);
      }}
    />
  );
}
