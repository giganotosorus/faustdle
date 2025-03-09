import { names, arcs, haki } from './data/characters.js';
import { compareTraits } from './utils/gameLogic.js';
import { APConnection } from './src/components/APConnection.js';
import { apClient } from './src/archipelago/client.js';

/**
 * Main game application class that handles all game logic and UI interactions
 */
class GameApp {
    /**
     * Initializes the game application
     * Sets up initial state and event listeners
     */
    constructor() {
        // Core game state
        this.chosenCharacter = null;
        this.currentSeed = null;
        this.guessHistory = [];
        this.gameMode = null;
        this.startTime = null;
        this.elapsedTimeInterval = null;
        
        // Set up death link event listener
        document.addEventListener('death_link_triggered', (event) => {
            this.handleDeathLink(`Death Link from ${event.detail.source}`);
        });

        this.initializeAP();
        this.updateDailyCountdown();
        this.setupEventListeners();
        console.log('GameApp initialized');
    }

    /**
     * Finds the exact character name regardless of case
     * @param {string} input - User input name
     * @returns {string|null} Exact character name or null if not found
     */
    findCharacterName(input) {
        const lowerInput = input.toLowerCase();
        const exactName = Object.keys(names).find(name => 
            name.toLowerCase() === lowerInput
        );
        return exactName || null;
    }

    /**
     * Initializes Archipelago connection and sets up related event handlers
     */
    initializeAP() {
        const seedGenerator = document.querySelector('.seed-generator');
        if (seedGenerator) {
            new APConnection(seedGenerator);
        }

        // Handle AP connection requests
        document.addEventListener('ap-connect-request', async (event) => {
            const { address, port, slot, password, deathLink } = event.detail;
            const success = await apClient.connect(address, port, slot, password, deathLink);
            
            if (success) {
                alert('Connected to Archipelago!');
                this.updateGameModesVisibility(true);
                this.setupAPHints();
            } else {
                alert('Failed to connect to Archipelago. Please check your connection details.');
            }
        });

        // Set up AP client event listeners
        apClient.on('connected', () => {
            this.updateGameModesVisibility(true);
        });

        apClient.on('disconnected', () => {
            this.updateGameModesVisibility(false);
        });

        apClient.on('connection_error', () => {
            alert('Connection to Archipelago failed. The server might be unavailable.');
        });

        apClient.on('server_error', (error) => {
            alert(`Archipelago server error: ${error.text || 'Unknown error'}`);
        });

        // Handle death link events
        document.addEventListener('death_link_received', (event) => {
            const { source, forceSkip } = event.detail;
            if (forceSkip) {
                this.skipGame(true);
            }
        });
    }

    /**
     * Updates UI visibility based on AP connection status
     * @param {boolean} isConnected - Whether connected to AP server
     */
    updateGameModesVisibility(isConnected) {
        const dailyModeButton = document.getElementById('daily-mode');
        const seedSection = document.getElementById('seed-section');
        const archipelagoToggle = document.getElementById('archipelago-toggle');
        const connectedButton = document.getElementById('ap-connect-button');

        if (isConnected) {
            dailyModeButton.style.display = 'none';
            seedSection.style.display = 'none';
            archipelagoToggle.style.display = 'none';
            
            connectedButton.style.display = 'block';
            connectedButton.textContent = 'Connected to AP';
            connectedButton.classList.add('connected');
        } else {
            dailyModeButton.style.display = 'block';
            seedSection.style.display = 'block';
            archipelagoToggle.style.display = 'block';
            
            connectedButton.style.display = 'block';
            connectedButton.textContent = 'Connect to Archipelago';
            connectedButton.classList.remove('connected');
        }
    }

    /**
     * Sets up the hints display container for Archipelago integration
     */
    setupAPHints() {
        let hintsContainer = document.getElementById('ap-hints');
        if (!hintsContainer) {
            hintsContainer = document.createElement('div');
            hintsContainer.id = 'ap-hints';
            hintsContainer.className = 'ap-hints-container';
            document.querySelector('.container').appendChild(hintsContainer);
        }

        apClient.addListener('hintsUpdated', (hints) => {
            hintsContainer.innerHTML = '';
            hints.forEach(hint => {
                const hintElement = document.createElement('div');
                hintElement.className = 'ap-hint';
                if (hint.flags > 0) {
                    hintElement.classList.add('progression');
                }
                hintElement.textContent = this.formatHint(hint);
                hintsContainer.appendChild(hintElement);
            });
        });
    }

    /**
     * Formats a hint message for display
     * @param {Object} hint - Hint object containing player and guess information
     * @returns {string} Formatted hint message
     */
    formatHint(hint) {
        if (!hint) return 'Invalid hint';
        
        let text = `Hint from ${this.getPlayerName(hint.player)}: `;
        
        if (hint.guess) {
            text += `Guessed ${hint.guess}`;
            if (hint.result) {
                text += ` (${hint.result})`;
            }
        } else {
            text += 'Made a guess';
        }
        
        return text;
    }

    /**
     * Gets player name from player ID
     * @param {string|number} playerId - Player ID to look up
     * @returns {string} Player name or "Unknown Player" if not found
     */
    getPlayerName(playerId) {
        const player = apClient.players.get(playerId?.toString());
        return player?.name || 'Unknown Player';
    }

    /**
     * Gets the current daily challenge number
     * @returns {number} Number of days since March 4, 2025
     */
    getDailyChallengeNumber() {
        const startDate = new Date('2025-03-04');
        const today = new Date();
        const diffTime = Math.abs(today - startDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1; // Add 1 to start from Day 1
    }

    /**
     * Updates the countdown timer for daily mode
     */
    updateDailyCountdown() {
        const updateTimer = () => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setUTCHours(24, 0, 0, 0);
            const timeLeft = tomorrow - now;

            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            const countdownTimer = document.getElementById('countdown-timer');
            const resultCountdownTimer = document.getElementById('result-countdown-timer');
            
            const timerText = `${hours}h ${minutes}m ${seconds}s`;
            if (countdownTimer) {
                countdownTimer.textContent = timerText;
            }
            if (resultCountdownTimer) {
                resultCountdownTimer.textContent = timerText;
            }
        };

        updateTimer();
        setInterval(updateTimer, 1000);
    }

    /**
     * Sets up all event listeners for game controls
     */
    setupEventListeners() {
        // Game mode buttons
        const normalModeButton = document.getElementById('normal-mode');
        const hardModeButton = document.getElementById('hard-mode');
        const fillerModeButton = document.getElementById('filler-mode');
        const dailyModeButton = document.getElementById('daily-mode');
        const seedStartButton = document.getElementById('seed-start');
        const guessButton = document.getElementById('guess-button');
        const skipButton = document.getElementById('skip-button');
        const playAgainButton = document.getElementById('play-again');
        const generateSeedButton = document.getElementById('generate-seed');
        const generateSeedForCharacterButton = document.getElementById('generate-seed-for-character');
        const useGeneratedSeedButton = document.getElementById('use-generated-seed');
        const backToMainButton = document.getElementById('back-to-main');

        // Set up click handlers for all buttons
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

        if (generateSeedButton) {
            generateSeedButton.addEventListener('click', () => {
                console.log('Generate seed button clicked');
                document.getElementById('game-setup').classList.add('hidden');
                document.getElementById('seed-generator').classList.remove('hidden');
                this.setupCharacterAutocomplete();
            });
        }

        if (generateSeedForCharacterButton) {
            generateSeedForCharacterButton.addEventListener('click', () => {
                this.generateSeedForCharacter();
            });
        }

        if (useGeneratedSeedButton) {
            useGeneratedSeedButton.addEventListener('click', () => {
                const generatedSeed = document.getElementById('seed-result').textContent;
                document.getElementById('seed-generator').classList.add('hidden');
                document.getElementById('game-setup').classList.remove('hidden');
                document.getElementById('seed-input').value = generatedSeed;
            });
        }

        if (backToMainButton) {
            backToMainButton.addEventListener('click', () => {
                document.getElementById('seed-generator').classList.add('hidden');
                document.getElementById('game-setup').classList.remove('hidden');
                document.getElementById('character-input').value = '';
                document.getElementById('generated-seed').classList.add('hidden');
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

        // Setup enter key handlers
        const guessInput = document.getElementById('guess-input');
        if (guessInput) {
            guessInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('Enter key pressed in guess input');
                    this.makeGuess();
                }
            });
        }

        const seedInput = document.getElementById('seed-input');
        if (seedInput) {
            seedInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('Enter key pressed in seed input');
                    this.startGameWithSeed();
                }
            });
        }

        const characterInput = document.getElementById('character-input');
        if (characterInput) {
            characterInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('Enter key pressed in character input');
                    this.generateSeedForCharacter();
                }
            });
        }
    }

    /**
     * Processes a guess attempt
     */
    makeGuess() {
        console.log('Making guess');
        const guessInput = document.getElementById('guess-input');
        const guessValue = guessInput.value;
        
        const exactName = this.findCharacterName(guessValue);
        if (!exactName) {
            alert('Invalid name, try again.');
            return;
        }
        
        const results = compareTraits(names[exactName], this.chosenCharacter.traits);
        this.displayResultsUI(exactName, results);
        this.guessHistory.push(results);
        
        if (apClient.isConnected()) {
            apClient.submitGuess(exactName, {
                correct: exactName === this.chosenCharacter.name,
                matches: results.filter(r => r.match).length,
                total: results.length
            });

            // Check for death link condition (more than 8 guesses)
            if (apClient.isDeathLinkEnabled() && this.guessHistory.length > 8) {
                apClient.sendDeathLink('Too many guesses');
                this.handleDeathLink('Too many guesses');
                return;
            }
        }

        if (exactName === this.chosenCharacter.name) {
            this.handleCorrectGuess();
        }
        
        guessInput.value = '';
    }

    /**
     * Handles skipping the current game
     * @param {boolean} [isDeathLink=false] - Whether skip was triggered by death link
     */
    skipGame(isDeathLink = false) {
        if (!this.chosenCharacter || this.gameMode === 'daily') return;
        
        this.stopElapsedTimer();
        document.getElementById('game-play').classList.add('hidden');
        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('game-over-message').textContent = isDeathLink ? 
            'Game Over - Death Link forced skip!' : 
            'Game skipped!';
        document.getElementById('correct-character').textContent = this.chosenCharacter.name;
        document.getElementById('game-seed').textContent = this.currentSeed;
        document.getElementById('emoji-grid').textContent = this.generateEmojiGrid();
        this.copyResultsTable();

        // Only send death link if it wasn't triggered by one
        if (!isDeathLink && apClient.isConnected() && apClient.isDeathLinkEnabled()) {
            apClient.sendDeathLink('Skipped game');
        }
    }

    /**
     * Handles death link event
     * @param {string} reason - Reason for death link trigger
     */
    handleDeathLink(reason) {
        this.stopElapsedTimer();
        document.getElementById('game-play').classList.add('hidden');
        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('game-over-message').textContent = `Game Over - Death Link: ${reason}`;
        document.getElementById('correct-character').textContent = this.chosenCharacter.name;
        document.getElementById('game-seed').textContent = this.currentSeed;
        document.getElementById('emoji-grid').textContent = this.generateEmojiGrid();
        this.copyResultsTable();
    }

    /**
     * Starts a new game with specified mode
     * @param {string} mode - Game mode ('normal', 'hard', or 'filler')
     */
    startGame(mode) {
        console.log('Starting game in mode:', mode);
        this.gameMode = mode;
        this.currentSeed = Math.random().toString(36).substring(2, 15);
        document.getElementById('game-setup').classList.add('hidden');
        document.getElementById('game-play').classList.remove('hidden');
        document.getElementById('skip-button').classList.remove('hidden');
        this.chosenCharacter = this.selectRandomCharacter(mode, this.currentSeed);
        this.startElapsedTimer();
        
        if (apClient.isConnected()) {
            apClient.setGameMode(mode);
        }
    }

    /**
     * Selects a random character based on mode and seed
     * @param {string} mode - Game mode
     * @param {string} seed - Random seed
     * @returns {Object|null} Selected character object or null if error
     */
    selectRandomCharacter(mode, seed) {
        console.log('Selecting random character in mode:', mode);
        try {
            const rng = new Math.seedrandom(seed);
            const characterNames = Object.keys(names);
            let selectedName;
            let selectedTraits;
            let attempts = 0;
            const maxAttempts = 1000;
            
            do {
                const index = Math.floor(rng() * characterNames.length);
                selectedName = characterNames[index];
                selectedTraits = names[selectedName];
                attempts++;
                
                if (attempts >= maxAttempts) {
                    throw new Error('Could not find a valid character for the selected mode');
                }
            } while (!this.isValidCharacterForMode(selectedTraits[9], mode));
            
            return { name: selectedName, traits: selectedTraits };
        } catch (error) {
            console.warn('Error selecting random character:', error);
            alert('Error: Could not find a valid character. Please try again.');
            this.resetGame();
            return null;
        }
    }

    /**
     * Checks if a character is valid for the selected game mode
     * @param {string} difficulty - Character difficulty rating
     * @param {string} mode - Game mode
     * @returns {boolean} Whether character is valid for mode
     */
    isValidCharacterForMode(difficulty, mode) {
        switch(mode) {
            case 'normal':
                return difficulty === 'E';
            case 'hard':
                return difficulty === 'E' || difficulty === 'H';
            case 'filler':
                return true;
            default:
                return difficulty === 'E';
        }
    }

    /**
     * Starts a daily challenge game
     */
    startDailyGame() {
        console.log('Starting daily game');
        this.gameMode = 'daily';
        this.currentSeed = this.getDailySeed();
        document.getElementById('game-setup').classList.add('hidden');
        document.getElementById('game-play').classList.remove('hidden');
        document.getElementById('skip-button').classList.add('hidden');
        this.chosenCharacter = this.selectRandomCharacter('normal', this.currentSeed);
        this.startElapsedTimer();
    }

    /**
     * Generates seed for daily challenge
     * @returns {string} Generated seed based on current date
     */
    getDailySeed() {
        const date = new Date();
        return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
    }

    /**
     * Starts game with user-provided seed
     */
    startGameWithSeed() {
        console.log('Starting game with seed');
        const seedInput = document.getElementById('seed-input');
        if (!seedInput.value) {
            alert('Please enter a seed value');
            return;
        }

        // Easter egg: Check for "imu" seed
        if (seedInput.value.toLowerCase() === 'imu') {
            // Reload the page
            window.location.reload();
            return;
        }

        this.gameMode = 'filler';
        this.currentSeed = seedInput.value;
        document.getElementById('game-setup').classList.add('hidden');
        document.getElementById('game-play').classList.remove('hidden');
        document.getElementById('skip-button').classList.remove('hidden');
        this.chosenCharacter = this.selectRandomCharacter('filler', this.currentSeed);
        this.startElapsedTimer();
    }

    /**
     * Generates a seed for a specific character
     */
    generateSeedForCharacter() {
        try {
            const characterInput = document.getElementById('character-input');
            const exactName = this.findCharacterName(characterInput.value);
            
            if (!exactName) {
                alert('Invalid character name, please try again.');
                return;
            }

            // Generate a unique seed for this character
            const characterSeed = this.generateUniqueSeedForCharacter(exactName);
            
            if (characterSeed) {
                document.getElementById('seed-result').textContent = characterSeed;
                document.getElementById('generated-seed').classList.remove('hidden');
            } else {
                alert('Could not generate a valid seed for this character. Please try a different character.');
            }
        } catch (error) {
            console.warn('Error generating seed:', error);
            alert('An error occurred while generating the seed. Please try again.');
        }
    }

    /**
     * Generates a unique seed that will select a specific character
     * @param {string} character - Target character name
     * @returns {string|null} Generated seed or null if failed
     */
    generateUniqueSeedForCharacter(character) {
        let attempts = 0;
        const maxAttempts = 1000;
        
        while (attempts < maxAttempts) {
            try {
                const seed = Math.random().toString(36).substring(2, 15);
                const rng = new Math.seedrandom(seed);
                const characterNames = Object.keys(names);
                const index = Math.floor(rng() * characterNames.length);
                const selectedName = characterNames[index];
                
                // Check if the selected character matches the desired character
                if (selectedName === character) {
                    // Verify that the character would actually be selectable in some mode
                    const difficulty = names[character][9];
                    if (difficulty === 'E' || difficulty === 'H' || difficulty === 'F') {
                        return seed;
                    }
                }
                
                attempts++;
            } catch (error) {
                console.warn('Error in seed generation attempt:', error);
                attempts++;
            }
        }
        
        return null;
    }

    /**
     * Sets up autocomplete for character input
     */
    setupCharacterAutocomplete() {
        const characterInput = document.getElementById('character-input');
        const autocompleteList = document.createElement('ul');
        autocompleteList.className = 'autocomplete-list';
        characterInput.parentNode.appendChild(autocompleteList);

        characterInput.addEventListener('input', (e) => {
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
                        characterInput.value = match;
                        autocompleteList.innerHTML = '';
                    });
                    autocompleteList.appendChild(li);
                });
            }
        });

        document.addEventListener('click', (e) => {
            if (!characterInput.contains(e.target)) {
                autocompleteList.innerHTML = '';
            }
        });
    }

    /**
     * Sets up autocomplete for guess input
     */
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

    /**
     * Starts the elapsed time counter
     */
    startElapsedTimer() {
        this.startTime = Date.now();
        const elapsedTimer = document.getElementById('elapsed-timer');
        
        if (this.elapsedTimeInterval) {
            clearInterval(this.elapsedTimeInterval);
        }

        this.elapsedTimeInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            elapsedTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    /**
     * Stops the elapsed time counter
     */
    stopElapsedTimer() {
        if (this.elapsedTimeInterval) {
            clearInterval(this.elapsedTimeInterval);
            this.elapsedTimeInterval = null;
        }

        if (this.startTime) {
            const elapsed = Date.now() - this.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            document.getElementById('final-time').textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    /**
     * Handles a correct guess
     */
    handleCorrectGuess() {
        this.stopElapsedTimer();
        document.getElementById('game-play').classList.add('hidden');
        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('game-over-message').textContent = 'Congratulations! You found the correct character!';
        document.getElementById('correct-character').textContent = this.chosenCharacter.name;
        
        const gameSeedContainer = document.getElementById('game-seed-container');
        if (this.gameMode === 'daily') {
            gameSeedContainer.classList.add('hidden');
            document.getElementById('daily-result-countdown').classList.remove('hidden');
            const dailyNumber = this.getDailyChallengeNumber();
            document.getElementById('game-over-message').textContent = 
                `Congratulations!`;
            
            // Add the daily number above the emoji grid
            const emojiGrid = document.getElementById('emoji-grid');
            const dailyText = document.createElement('div');
            dailyText.className = 'daily-number';
            dailyText.textContent = `Faustdle Day #${dailyNumber}`;
            emojiGrid.parentNode.insertBefore(dailyText, emojiGrid);
        } else {
            gameSeedContainer.classList.remove('hidden');
            document.getElementById('game-seed').textContent = this.currentSeed;
        }
        
        document.getElementById('emoji-grid').textContent = this.generateEmojiGrid();
        this.copyResultsTable();
    }

    /**
     * Resets the game state
     */
    resetGame() {
        console.log('Resetting game');
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('game-setup').classList.remove('hidden');
        document.getElementById('seed-input').value = '';
        document.getElementById('results-table').querySelector('tbody').innerHTML = '';
        document.getElementById('results-table-final').querySelector('tbody').innerHTML = '';
        document.getElementById('emoji-grid').textContent = '';
        document.getElementById('elapsed-timer').textContent = '0:00';
        document.getElementById('daily-result-countdown').classList.add('hidden');
        document.getElementById('game-seed-container').classList.remove('hidden');
        
        // Remove the daily number text if it exists
        const dailyNumber = document.querySelector('.daily-number');
        if (dailyNumber) {
            dailyNumber.remove();
        }
        
        this.chosenCharacter = null;
        this.currentSeed = null;
        this.guessHistory = [];
        this.gameMode = null;
        this.startTime = null;
        if (this.elapsedTimeInterval) {
            clearInterval(this.elapsedTimeInterval);
            this.elapsedTimeInterval = null;
        }
    }

    /**
     * Displays results in the UI
     * @param {string} guessName - Name of guessed character
     * @param {Array} results - Array of comparison results
     */
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

    /**
     * Generates emoji grid representation of guess history
     * @returns {string} Emoji grid string
     */
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

    /**
     * Copies results table to final results display
     */
    copyResultsTable() {
        const originalTable = document.getElementById('results-table');
        const finalTable = document.getElementById('results-table-final');
        const tbody = finalTable.querySelector('tbody');
        tbody.innerHTML = originalTable.querySelector('tbody').innerHTML;
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    const game = new GameApp();
    game.setupAutocomplete();
});