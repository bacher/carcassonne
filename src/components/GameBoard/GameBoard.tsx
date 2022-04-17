import React, { useEffect, useRef } from 'react';

import { render } from '../../utils/render';
import styles from './GameBoard.module.css';

export function GameBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext('2d')!;

    render(ctx, {});
  }, []);

  return (
    <div>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        width={800}
        height={800}
      ></canvas>
    </div>
  );
}
