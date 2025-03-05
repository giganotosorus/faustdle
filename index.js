import { names, arcs, haki } from './data/characters.js';
import { compareTraits } from './utils/gameLogic.js';

class GameApp {
    constructor() {
        this.chosenCharacter = null;
        this.currentSeed = null;
        this.guessHistory = [];
        this.gameMode = null;
        this.guessDistribution = new Array(10).fill(0);
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

    updateGuessDistribution() {
        const container = document.getElementById('guess-distribution');
        container.innerHTML = '';
        
        const maxGuesses = Math.max(...this.guessDistribution);
        
        this.guessDistribution.forEach((count, index) => {
            if (index === 0) return; // Skip index 0
            
            const bar = document.createElement('div');
            bar.className = 'guess-bar';
            
            const label = document.createElement('div');
            label.className = 'guess-label';
            label.textContent = index;
            
            const countElement = document.createElement('div');
            countElement.className = 'guess-count';
            countElement.textContent = count;
            countElement.style.width = `${(count / maxGuesses) * 100}%`;
            
            bar.appendChild(label);
            bar.appendChild(countElement);
            container.appendChild(bar);
        });
    }

    skipGame() {
        if (this.gameMode === 'daily') return;
        
        document.getElementById('game-play').classList.add('hidden');
        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('game-over-message').textContent = 'Game skipped!';
        document.getElementById('correct-character').textContent = this.chosenCharacter.name;
        document.getElementById('game-seed').textContent = this.currentSeed;
        document.getElementById('emoji-grid').textContent = this.generateEmojiGrid();
        this.updateGuessDistribution();
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
            this.guessDistribution[this.guessHistory.length]++;
            
            document.getElementById('game-play').classList.add('hidden');
            document.getElementById('game-over').classList.remove('hidden');
            document.getElementById('game-over-message').textContent = 'Congratulations! You found the correct character!';
            document.getElementById('correct-character').textContent = this.chosenCharacter.name;
            document.getElementById('game-seed').textContent = this.currentSeed;
            document.getElementById('emoji-grid').textContent = this.generateEmojiGrid();
            this.updateGuessDistribution();
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
        document.getElementById('guess-distribution').innerHTML = '';
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
        
        do {
            const index = Math.floor(Math.random() * characterNames.length);
            selectedName = characterNames[index];
            selectedTraits = names[selectedName];
        } while (!this.isValidCharacterForMode(selectedTraits[9], mode));
        
        return { name: selectedName, traits: selectedTraits };
    }

    isValidCharacterForMode(difficulty, mode) {
        switch(mode) {
            case 'normal':
                return difficulty !== 'h' && difficulty !== 'f';
            case 'hard':
                return difficulty === 'h';
            case 'filler':
                return difficulty === 'f';
            default:
                return difficulty !== 'h' && difficulty !== 'f';
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