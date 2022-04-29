import type { GameState } from '../../data/types';
import styles from './GameStats.module.css';

type Props = {
  gameState: GameState;
};

export function GameStats({ gameState }: Props) {
  const turn = 71 - gameState.cardPool.length;
  const round = Math.floor(turn / gameState.players.length);

  return (
    <div className={styles.root}>
      <div>Round #{round + 1}</div>
      <div>Turn #{turn + 1}</div>
    </div>
  );
}
