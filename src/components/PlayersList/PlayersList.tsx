import cn from 'classnames';

import { Player, playerColors } from '../../data/types';

import styles from './PlayersList.module.css';

type Props = {
  players: Player[];
  activePlayerIndex: number;
  onDoTurnClick: (playerIndex: number) => void;
};

export function PlayersList({
  players,
  activePlayerIndex,
  onDoTurnClick,
}: Props) {
  return (
    <div className={styles.root}>
      {players.map((player, i) => (
        <div
          key={i}
          className={cn(styles.player, {
            [styles.playerActive]: i === activePlayerIndex,
          })}
        >
          <div className={styles.playerTopLine}>
            <span
              className={styles.playerColor}
              style={{ backgroundColor: playerColors[player.color] }}
            />
            <span>{player.name}</span>
          </div>
          <div className={styles.playerStats}>
            <span>Score: {player.score}</span>
            <span>Peasants: {player.peasantsCount}</span>
          </div>
          <div className={styles.playerActions}>
            <button
              type="button"
              disabled={i !== activePlayerIndex}
              onClick={(event) => {
                event.preventDefault();
                onDoTurnClick(activePlayerIndex);
              }}
            >
              Make turn
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}