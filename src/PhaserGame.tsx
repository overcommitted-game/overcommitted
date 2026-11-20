import { useLayoutEffect } from 'react';
import { startGame } from './game/main';

const CONTAINER_ID = 'game-container';

/** Mounts the Phaser game once and destroys it on unmount (StrictMode mounts twice in dev). */
export function PhaserGame() {
  useLayoutEffect(() => {
    const game = startGame(CONTAINER_ID);
    return () => {
      game.destroy(true);
    };
  }, []);

  return <div id={CONTAINER_ID} />;
}
