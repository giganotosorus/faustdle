import { names, arcs, haki } from './data/characters.js';
import { compareTraits } from './utils/gameLogic.js';

class GameApp {
    constructor() {
        this.chosenCharacter = null;
        this.currentSeed = null;
        this.guessHistory = [];
        this.setupEventListeners();
        console.log('GameApp initialized');
    }

    setupEventListeners() {
        console.log('Setting up event listeners');
        
        // Game mode buttons
        const normalModeButton = document.getElementById('normal-mode');
        const hardModeButton = document.getElementById('hard-mode');
        const dailyModeButton = document.getElementById('daily-mode');
        const seedStartButton = document.getElementById('seed-start');
        const guessButton = document.getElementById('guess-button');
        const playAgainButton = document.getElementById('play-again');

        if (normalModeButton) {
            normalModeButton.addEventListener('click', () => {
                console.log('Normal mode button clicked');
                this.startGame(false);
            });
        } else {
            console.log('Normal mode button not found');
        }

        if (hardModeButton) {
            hardModeButton.addEventListener('click', () => {
                console.log('Hard mode button clicked');
                this.startGame(true);
            });
        } else {
            console.log('Hard mode button not found');
        }

        if (dailyModeButton) {
            dailyModeButton.addEventListener('click', () => {
                console.log('Daily mode button clicked');
                this.startDailyGame();
            });
        } else {
            console.log('Daily mode button not found');
        }

        if (seedStartButton) {
            seedStartButton.addEventListener('click', () => {
                console.log('Seed start button clicked');
                this.startGameWithSeed();
            });
        } else {
            console.log('Seed start button not found');
        }

        if (guessButton) {
            guessButton.addEventListener('click', () => {
                console.log('Guess button clicked');
                this.makeGuess();
            });
        } else {
            console.log('Guess button not found');
        }

        if (playAgainButton) {
            playAgainButton.addEventListener('click', () => {
                console.log('Play again button clicked');
                this.resetGame();
            });
        } else {
            console.log('Play again button not found');
        }

        // Setup guess input enter key
        const guessInput = document.getElementById('guess-input');
        if (guessInput) {
            guessInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('Enter key pressed in guess input');
                    this.makeGuess();
                }
            });
        } else {
            console.log('Guess input not found');
        }

        // Setup seed input enter key
        const seedInput = document.getElementById('seed-input');
        if (seedInput) {
            seedInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('Enter key pressed in seed input');
                    this.startGameWithSeed();
                }
            });
        } else {
            console.log('Seed input not found');
        }
    }

    getDailySeed() {
        const date = new Date();
        return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
    }

    startDailyGame() {
        console.log('Starting daily game');
        this.currentSeed = this.getDailySeed();
        document.getElementById('game-setup').classList.add('hidden');
        document.getElementById('game-play').classList.remove('hidden');
        this.chosenCharacter = this.selectRandomCharacter(false, this.currentSeed);
    }

    startGameWithSeed() {
        console.log('Starting game with seed');
        const seedInput = document.getElementById('seed-input');
        if (!seedInput.value) {
            alert('Please enter a seed value');
            return;
        }
        this.currentSeed = seedInput.value;
        document.getElementById('game-setup').classList.add('hidden');
        document.getElementById('game-play').classList.remove('hidden');
        this.chosenCharacter = this.selectRandomCharacter(false, this.currentSeed);
    }

    startGame(hardMode) {
        console.log('Starting game', hardMode ? 'in hard mode' : '');
        this.currentSeed = Math.floor(Math.random() * 1000000).toString();
        document.getElementById('game-setup').classList.add('hidden');
        document.getElementById('game-play').classList.remove('hidden');
        this.chosenCharacter = this.selectRandomCharacter(hardMode, this.currentSeed);
    }

    generateEmojiGrid() {
        let grid = '';
        [...this.guessHistory].reverse().forEach(guess => {
            guess.forEach(result => {
                if (result.match) {
                    grid += '\ud83d\udfe9';
                } else if (result.direction === 'up') {
                    grid += '\u2b06\ufe0f';
                } else if (result.direction === 'down') {
                    grid += '\u2b07\ufe0f';
                } else {
                    grid += '\ud83d\udfe5';
                }
            });
            grid += '\\n';
        });
        return grid;
    }

    makeGuess() {
        console.log('Making guess');
        const guessInput = document.getElementById('guess-input');
        const guess = guessInput.value.toLowerCase();
        
        if (!names[guess]) {
            alert('Invalid name, try again.');
            return;
        }
        
        if (guess === this.chosenCharacter.name) {
            const results = compareTraits(names[guess], this.chosenCharacter.traits);
            this.guessHistory.push(results);
            
            document.getElementById('game-play').classList.add('hidden');
            document.getElementById('game-over').classList.remove('hidden');
            document.getElementById('game-seed').textContent = this.currentSeed;
            document.getElementById('emoji-grid').textContent = this.generateEmojiGrid();
            return;
        }
        
        const results = compareTraits(names[guess], this.chosenCharacter.traits);
        this.guessHistory.push(results);
        this.displayResultsUI(guess, results);
        guessInput.value = '';
    }

    resetGame() {
        console.log('Resetting game');
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('game-setup').classList.remove('hidden');
        document.getElementById('seed-input').value = '';
        document.getElementById('results-table').querySelector('tbody').innerHTML = '';
        document.getElementById('emoji-grid').textContent = '';
        this.chosenCharacter = null;
        this.currentSeed = null;
        this.guessHistory = [];
    }

    selectRandomCharacter(hardMode, seed) {
        console.log('Selecting random character', hardMode ? 'in hard mode' : '', 'with seed', seed);
        Math.seedrandom(seed);
        const characterNames = Object.keys(names);
        let selectedName;
        let selectedTraits;
        
        do {
            const index = Math.floor(Math.random() * characterNames.length);
            selectedName = characterNames[index];
            selectedTraits = names[selectedName];
        } while (!hardMode && selectedTraits[9] === 'h');
        
        return { name: selectedName, traits: selectedTraits };
    }

    displayResultsUI(guessName, results) {
        console.log('Displaying results for guess', guessName);
        const tbody = document.getElementById('results-table').querySelector('tbody');
        const row = document.createElement('tr');
        
        const nameCell = document.createElement('td');
        nameCell.textContent = guessName;
        row.appendChild(nameCell);
        
        results.forEach(result => {
            const cell = document.createElement('td');
            cell.textContent = result.text;
            
            if (result.match) {
                cell.classList.add('match');
            } else if (result.direction) {
                cell.classList.add('error', `hint-${result.direction}`);
            } else {
                cell.classList.add('error');
            }
            
            row.appendChild(cell);
        });
        
        tbody.insertBefore(row, tbody.firstChild);
    }

    setupAutocomplete() {
        const guessInput = document.getElementById('guess-input');
        const autocompleteList = document.createElement('ul');
        autocompleteList.className = 'autocomplete-list';
        guessInput.parentNode.appendChild(autocompleteList);

        guessInput.addEventListener('input', (e) => {
            const input = e.target.value.toLowerCase();
            autocompleteList.innerHTML = '';
            
            if (input.length >= 2) {
                const matches = Object.keys(names).filter(name => 
                    name.toLowerCase().startsWith(input)
                );
                
                matches.forEach(match => {
                    const li = document.createElement('li');
                    li.textContent = match;
                    li.addEventListener('click', () => {
                        guessInput.value = match;
                        autocompleteList.innerHTML = '';
                    });
                    autocompleteList.appendChild(li);
                });
            }
        });

        document.addEventListener('click', (e) => {
            if (!guessInput.contains(e.target)) {
                autocompleteList.innerHTML = '';
            }
        });
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    const game = new GameApp();
    game.setupAutocomplete();
});