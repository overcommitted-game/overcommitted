import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class Office extends Scene {
  constructor() {
    super('Office');
  }

  create(): void {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2, 'Overcommitted', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    EventBus.emit('current-scene-ready', this);
  }
}
