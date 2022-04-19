import { useState } from 'react';

import { playerColors } from '../../data/types';
import styles from './MainMenu.module.css';

type Player = {
  name: string;
  isBot: boolean;
};

type Props = {
  onStartPlay: (game: { players: Player[] }) => void;
};

export function MainMenu({ onStartPlay }: Props) {
  const [players, setPlayers] = useState<Player[]>([
    {
      name: 'Player 1',
      isBot: false,
    },
  ]);

  function updatePlayer(player: Player, update: Partial<Player>) {
    setPlayers(
      players.map((p) => {
        if (p === player) {
          return {
            ...p,
            ...update,
          };
        }
        return p;
      }),
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.form}>
        <div className={styles.players}>
          {players.map((player, index) => (
            <div key={index} className={styles.player}>
              <div className={styles.playerInfo}>
                <span
                  className={styles.playerColor}
                  style={{ backgroundColor: playerColors[index] }}
                />
                <input
                  className={styles.playerName}
                  value={player.name}
                  onChange={(event) => {
                    updatePlayer(player, { name: event.target.value });
                  }}
                />
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    setPlayers(players.filter((p) => p !== player));
                  }}
                >
                  x
                </button>
              </div>
              <div className={styles.line}>
                <form>
                  <label>
                    <input
                      type="radio"
                      name="playerType"
                      value="player"
                      checked={!player.isBot}
                      onChange={() => {
                        updatePlayer(player, { isBot: false });
                      }}
                    />
                    player
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="playerType"
                      value="bot"
                      checked={player.isBot}
                      onChange={() => {
                        updatePlayer(player, { isBot: true });
                      }}
                    />
                    bot
                  </label>
                </form>
              </div>
            </div>
          ))}
          {players.length < 5 && (
            <div className={styles.addPlayerBlock}>
              <button
                type="button"
                className={styles.addPlayer}
                onClick={(event) => {
                  event.preventDefault();
                  setPlayers([
                    ...players,
                    {
                      name: `Bot ${
                        players.filter((player) => player.isBot).length + 1
                      }`,
                      isBot: true,
                    },
                  ]);
                }}
              >
                Add player
              </button>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            disabled={players.length === 0}
            className={styles.startGame}
            onClick={(event) => {
              event.preventDefault();

              onStartPlay({
                players: players.map(({ name, isBot }, index) => ({
                  name,
                  isBot,
                  color: index,
                  score: 0,
                  peasantsCount: 7,
                })),
              });
            }}
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
}
