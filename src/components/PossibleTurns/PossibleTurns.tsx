import { useMemo } from 'react';
import cn from 'classnames';

import type { PeasantPlace } from '../../data/types';
import type { PossibleTurn } from '../../utils/logic';

import styles from './PossibleTurns.module.css';
import { neverCall } from '../../utils/helpers';

type Props = {
  possibleTurns: PossibleTurn[];
  onTurnHover: (turn: PossibleTurn | undefined) => void;
  onTurnApply: (turn: PossibleTurn) => void;
  onHideClick: () => void;
};

export function PossibleTurns({
  possibleTurns,
  onTurnHover,
  onTurnApply,
  onHideClick,
}: Props) {
  const maxAvgScore = useMemo(() => {
    const first = possibleTurns[0];
    if (!first) {
      return 0;
    }
    const { score } = first;
    return Math.round(((score.complete + score.incomplete) / 2) * 100) / 100;
  }, [possibleTurns]);

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
        neverCall(peasantPlace);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.titleBlock}>
        <span className={styles.title}>Possible turns: </span>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            onHideClick();
          }}
        >
          x
        </button>
      </div>
      <div className={styles.list}>
        {possibleTurns.map((turn, index) => {
          const { score } = turn;

          const c = Math.round(score.complete * 100) / 100;
          const i = Math.round(score.incomplete * 100) / 100;
          const a =
            Math.round(((score.complete + score.incomplete) / 2) * 100) / 100;

          return (
            <button
              key={index}
              type="button"
              className={cn(styles.turnBlock, {
                [styles.best]: a >= maxAvgScore,
              })}
              onMouseEnter={() => onTurnHover(turn)}
              onMouseLeave={() => onTurnHover(undefined)}
              onClick={(event) => {
                event.preventDefault();
                onTurnApply(turn);
              }}
            >
              <div>
                Coords: [{turn.coords.col},{turn.coords.row}]
              </div>
              <div className={styles.score}>
                Score: {c} / {i} (avg: <b>{a}</b>)
              </div>
              {renderPeasant(turn.peasantPlace)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
