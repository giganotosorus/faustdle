import { names, arcs, haki } from './data/characters.js';
import { compareTraits } from './utils/gameLogic.js';

class GameApp {
    constructor() {
        this.chosenCharacter = null;
        this.currentSeed = null;
        this.guessHistory = [];
        this.gameMode = null;
        this.setupEventListeners();
        console.log('GameApp initialized');
    }

    setupEventListeners() {
        console.log('Setting up event listeners');
        
        // Game mode buttons
        const normalModeButton = document.getElementById('normal-mode');
        const hardModeButton = document.getElementById('hard-mode');
        const fillerModeButton = document.getElementById('filler-mode');
        const dailyModeButton = document.getElementById('daily-mode');
        const seedStartButton = document.getElementById('seed-start');
        const guessButton = document.getElementById('guess-button');
        const skipButton = document.getElementById('skip-button');
        const playAgainButton = document.getElementById('play-again');

        if (normalModeButton) {
            normalModeButton.addEventListener('click', () => {
                console.log('Normal mode button clicked');
                this.startGame('normal');
            });
        }

        if (hardModeButton) {
            hardModeButton.addEventListener('click', () => {
                console.log('Hard mode button clicked');
                this.startGame('hard');
            });
        }

        if (fillerModeButton) {
            fillerModeButton.addEventListener('click', () => {
                console.log('Filler mode button clicked');
                this.startGame('filler');
            });
        }

        if (dailyModeButton) {
            dailyModeButton.addEventListener('click', () => {
                console.log('Daily mode button clicked');
                this.startDailyGame();
            });
        }

        if (seedStartButton) {
            seedStartButton.addEventListener('click', () => {
                console.log('Seed start button clicked');
                this.startGameWithSeed();
            });
        }

        if (guessButton) {
            guessButton.addEventListener('click', () => {
                console.log('Guess button clicked');
                this.makeGuess();
            });
        }

        if (skipButton) {
            skipButton.addEventListener('click', () => {
                console.log('Skip button clicked');
                this.skipGame();
            });
        }

        if (playAgainButton) {
            playAgainButton.addEventListener('click', () => {
                console.log('Play again button clicked');
                this.resetGame();
            });
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
        }
    }

    getDailySeed() {
        const date = new Date();
        return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
    }

    startDailyGame() {
        console.log('Starting daily game');
        this.gameMode = 'daily';
        this.currentSeed = this.getDailySeed();
        document.getElementById('game-setup').classList.add('hidden');
        document.getElementById('game-play').classList.remove('hidden');
        document.getElementById('skip-button').classList.add('hidden');
        this.chosenCharacter = this.selectRandomCharacter('normal', this.currentSeed);
    }

    startGameWithSeed() {
        console.log('Starting game with seed');
        const seedInput = document.getElementById('seed-input');
        if (!seedInput.value) {
            alert('Please enter a seed value');
            return;
        }
        this.gameMode = 'normal';
        this.currentSeed = seedInput.value;
        document.getElementById('game-setup').classList.add('hidden');
        document.getElementById('game-play').classList.remove('hidden');
        document.getElementById('skip-button').classList.remove('hidden');
        this.chosenCharacter = this.selectRandomCharacter('normal', this.currentSeed);
    }

    startGame(mode) {
        console.log('Starting game in mode:', mode);
        this.gameMode = mode;
        this.currentSeed = Math.floor(Math.random() * 1000000).toString();
        document.getElementById('game-setup').classList.add('hidden');
        document.getElementById('game-play').classList.remove('hidden');
        document.getElementById('skip-button').classList.remove('hidden');
        this.chosenCharacter = this.selectRandomCharacter(mode, this.currentSeed);
    }

    generateEmojiGrid() {
        return [...this.guessHistory].reverse().map(guess => {
            return guess.map(result => {
                if (result.match) {
                    return '🟩'; // Green square emoji
                } else if (result.direction === 'up') {
                    return '⬆️'; // Up arrow emoji
                } else if (result.direction === 'down') {
                    return '⬇️'; // Down arrow emoji
                } else {
                    return '🟥'; // Red square emoji
                }
            }).join('');
        }).join('\n');
    }

    copyResultsTable() {
        const originalTable = document.getElementById('results-table');
        const finalTable = document.getElementById('results-table-final');
        const tbody = finalTable.querySelector('tbody');
        tbody.innerHTML = originalTable.querySelector('tbody').innerHTML;
    }

    skipGame() {
        if (this.gameMode === 'daily') return;
        
        document.getElementById('game-play').classList.add('hidden');
        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('game-over-message').textContent = 'Game skipped!';
        document.getElementById('correct-character').textContent = this.chosenCharacter.name;
        document.getElementById('game-seed').textContent = this.currentSeed;
        document.getElementById('emoji-grid').textContent = this.generateEmojiGrid();
        this.copyResultsTable();
    }

    makeGuess() {
        console.log('Making guess');
        const guessInput = document.getElementById('guess-input');
        const guess = guessInput.value;
        
        if (!names[guess]) {
            alert('Invalid name, try again.');
            return;
        }
        
        if (guess === this.chosenCharacter.name) {
            const results = compareTraits(names[guess], this.chosenCharacter.traits);
            this.guessHistory.push(results);
            
            document.getElementById('game-play').classList.add('hidden');
            document.getElementById('game-over').classList.remove('hidden');
            document.getElementById('game-over-message').textContent = 'Congratulations! You found the correct character!';
            document.getElementById('correct-character').textContent = this.chosenCharacter.name;
            document.getElementById('game-seed').textContent = this.currentSeed;
            document.getElementById('emoji-grid').textContent = this.generateEmojiGrid();
            this.copyResultsTable();
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
        document.getElementById('results-table-final').querySelector('tbody').innerHTML = '';
        document.getElementById('emoji-grid').textContent = '';
        this.chosenCharacter = null;
        this.currentSeed = null;
        this.guessHistory = [];
        this.gameMode = null;
    }

    selectRandomCharacter(mode, seed) {
        console.log('Selecting random character in mode:', mode);
        Math.seedrandom(seed);
        const characterNames = Object.keys(names);
        let selectedName;
        let selectedTraits;
        let attempts = 0;
        const maxAttempts = 1000; // Prevent infinite loop
        
        do {
            const index = Math.floor(Math.random() * characterNames.length);
            selectedName = characterNames[index];
            selectedTraits = names[selectedName];
            attempts++;
            
            if (attempts >= maxAttempts) {
                console.error('Could not find a valid character for the selected mode');
                alert('Error: Could not find a valid character. Please try again.');
                this.resetGame();
                return null;
            }
        } while (!this.isValidCharacterForMode(selectedTraits[9], mode));
        
        return { name: selectedName, traits: selectedTraits };
    }

    isValidCharacterForMode(difficulty, mode) {
        switch(mode) {
            case 'normal':
                // Normal mode: only normal characters (no hard or filler)
                return difficulty === 'e';
            case 'hard':
                // Hard mode: normal and hard characters (no filler)
                return difficulty === 'e' || difficulty === 'h';
            case 'filler':
                // Filler mode: all characters allowed
                return true;
            default:
                // Default to normal mode behavior
                return difficulty === 'e';
        }
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
            const input = e.target.value;
            autocompleteList.innerHTML = '';
            
            if (input.length >= 2) {
                const matches = Object.keys(names).filter(name => 
                    name.toLowerCase().startsWith(input.toLowerCase())
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