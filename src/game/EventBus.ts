import { Events } from 'phaser';

/** The only bridge between Phaser scenes and React components. */
export const EventBus = new Events.EventEmitter();
