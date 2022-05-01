import type { GameState } from '../../data/types';
import styles from './GameStats.module.css';
import { getCurrentTurnNumber } from '../../utils/logic';

type Props = {
  gameState: GameState;
};

export function GameStats({ gameState }: Props) {
  const turn = getCurrentTurnNumber(gameState);
  const round = Math.floor(turn / gameState.players.length);

  return (
    <div className={styles.root}>
      <div>Round #{round + 1}</div>
      <div>Turn #{turn}</div>
    </div>
  );
}
