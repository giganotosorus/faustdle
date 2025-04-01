import { BleachGame } from './src/game/BleachGame.js';

// Initialize the Bleachdle game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Bleachdle initialized');
    new BleachGame();
});