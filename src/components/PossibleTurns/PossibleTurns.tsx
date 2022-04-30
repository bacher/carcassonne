import type { PossibleTurn, UnionScore } from '../../utils/logic';
import type { PeasantPlace } from '../PutPeasant';

import styles from './PossibleTurns.module.css';

type Props = {
  possibleTurns: PossibleTurn[];
  onTurnHover: (turn: PossibleTurn | undefined) => void;
  onTurnApply: (turn: PossibleTurn) => void;
};

export function PossibleTurns({
  possibleTurns,
  onTurnHover,
  onTurnApply,
}: Props) {
  function renderScore(score: UnionScore) {
    const c = Math.round(score.complete * 100) / 100;
    const i = Math.round(score.incomplete * 100) / 100;
    const a = Math.round(((score.complete + score.incomplete) / 2) * 100) / 100;

    return (
      <div className={styles.score}>
        Score: {c} / {i} (avg: <b>{a}</b>)
      </div>
    );
  }

  function renderPeasant(peasantPlace: PeasantPlace | undefined) {
    if (!peasantPlace) {
      return <div>No Peasant</div>;
    }

    switch (peasantPlace.type) {
      case 'CENTER':
        return <div>Peasant at center</div>;
      case 'UNION':
        return <div>Peasant at union {peasantPlace.unionIndex}</div>;
      default:
        throw new Error();
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.title}>Possible turns:</div>
      <div className={styles.list}>
        {possibleTurns.map((turn, i) => (
          <button
            key={i}
            type="button"
            className={styles.turnBlock}
            onMouseEnter={() => onTurnHover(turn)}
            onMouseLeave={() => onTurnHover(undefined)}
            onClick={(event) => {
              event.preventDefault();
              onTurnApply(turn);
            }}
          >
            <div>#{i + 1}</div>
            <div>
              Coords: [{turn.coords.col},{turn.coords.row}]
            </div>
            {renderScore(turn.score)}
            {renderPeasant(turn.peasantPlace)}
          </button>
        ))}
      </div>
    </div>
  );
}
