import { GameApp } from './src/game/GameApp.js';

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    const game = new GameApp();
});