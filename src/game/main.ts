import { AUTO, Game, Scale } from 'phaser';
import { Office } from './scenes/Office';

export function startGame(parent: string): Game {
  return new Game({
    type: AUTO,
    parent,
    width: 640,
    height: 360,
    pixelArt: true,
    backgroundColor: '#1d1d2b',
    physics: { default: 'arcade' },
    scale: { mode: Scale.FIT, autoCenter: Scale.CENTER_BOTH },
    scene: [Office],
  });
}
