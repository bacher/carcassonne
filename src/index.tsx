import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';
import { GameBoard } from './components/GameBoard';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <GameBoard />
  </React.StrictMode>
);
