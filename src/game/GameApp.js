import { names } from '../data/characters.js';
import { compareTraits } from '../utils/gameLogic.js';
import { APConnection } from '../components/APConnection.js';
import { apClient } from '../archipelago/client.js';
import { AutocompleteManager } from './AutocompleteManager.js';
import { CharacterSelector } from './CharacterSelector.js';
import { TimerManager } from './TimerManager.js';
import { UIManager } from './UIManager.js';
import { ResultsManager } from './ResultsManager.js';

/**
 * Main game application class that handles all game logic and UI interactions
 */
export class GameApp {
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
        this.streakCount = 0;
        this.isStreakMode = false;
        this.selectedStreakMode = 'normal';

        // Initialize managers
        this.autocomplete = new AutocompleteManager();
        this.characterSelector = new CharacterSelector();
        this.timer = new TimerManager();
        this.ui = new UIManager();
        this.results = new ResultsManager();
        
        // Set up death link event listener
        document.addEventListener('death_link_triggered', (event) => {
            this.handleDeathLink(`Death Link from ${event.detail.source}`);
        });

        this.initializeAP();
        this.ui.updateDailyCountdown();
        this.setupEventListeners();
        this.setupAutocomplete();
        console.log('GameApp initialized');
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
        const faqButton = document.getElementById('faq-button');
        const faqBackButton = document.getElementById('faq-back');
        const streakModeButton = document.getElementById('streak-mode');

        // Set up click handlers for all buttons
        if (normalModeButton) {
            normalModeButton.addEventListener('click', () => this.startGame('normal'));
        }

        if (hardModeButton) {
            hardModeButton.addEventListener('click', () => this.startGame('hard'));
        }

        if (fillerModeButton) {
            fillerModeButton.addEventListener('click', () => this.startGame('filler'));
        }

        if (dailyModeButton) {
            dailyModeButton.addEventListener('click', () => this.startDailyGame());
        }

        if (streakModeButton) {
            streakModeButton.addEventListener('click', () => {
                document.getElementById('other-dialog').classList.add('hidden');
                this.showStreakModeDialog();
            });
        }

        // Add event listeners for streak mode selection
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('streak-mode-select')) {
                this.selectedStreakMode = e.target.dataset.mode;
                this.startStreakMode();
                document.getElementById('streak-mode-dialog').classList.add('hidden');
            }
        });

        if (generateSeedButton) {
            generateSeedButton.addEventListener('click', () => {
                document.getElementById('game-setup').classList.add('hidden');
                document.getElementById('seed-generator').classList.remove('hidden');
            });
        }

        if (generateSeedForCharacterButton) {
            generateSeedForCharacterButton.addEventListener('click', () => this.generateSeedForCharacter());
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
            seedStartButton.addEventListener('click', () => this.startGameWithSeed());
        }

        if (guessButton) {
            guessButton.addEventListener('click', () => this.makeGuess());
        }

        if (skipButton) {
            skipButton.addEventListener('click', () => this.skipGame());
        }

        if (playAgainButton) {
            playAgainButton.addEventListener('click', () => this.resetGame());
        }

        if (faqButton) {
            faqButton.addEventListener('click', () => {
                document.getElementById('other-dialog').classList.add('hidden');
                document.getElementById('faq-dialog').classList.remove('hidden');
            });
        }

        if (faqBackButton) {
            faqBackButton.addEventListener('click', () => {
                document.getElementById('faq-dialog').classList.add('hidden');
                document.getElementById('other-dialog').classList.remove('hidden');
            });
        }

        // Setup enter key handlers
        const guessInput = document.getElementById('guess-input');
        if (guessInput) {
            guessInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.makeGuess();
                }
            });
        }

        const seedInput = document.getElementById('seed-input');
        if (seedInput) {
            seedInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.startGameWithSeed();
                }
            });
        }

        const characterInput = document.getElementById('character-input');
        if (characterInput) {
            characterInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.generateSeedForCharacter();
                }
            });
        }
    }

    /**
     * Initializes Archipelago connection
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
    }

    /**
     * Sets up autocomplete for input fields
     */
    setupAutocomplete() {
        const guessInput = document.getElementById('guess-input');
        if (guessInput) {
            this.autocomplete.setupAutocomplete(guessInput);
        }

        const characterInput = document.getElementById('character-input');
        if (characterInput) {
            this.autocomplete.setupAutocomplete(characterInput);
        }
    }

    showStreakModeDialog() {
        let dialog = document.getElementById('streak-mode-dialog');
        if (!dialog) {
            dialog = document.createElement('div');
            dialog.id = 'streak-mode-dialog';
            dialog.className = 'streak-mode-dialog';
            dialog.innerHTML = `
                <div class="streak-mode-content">
                    <h3>Select Streak Mode Difficulty</h3>
                    <div class="streak-mode-buttons">
                        <button class="btn streak-mode-select" data-mode="normal">Normal Mode</button>
                        <button class="btn btn-hard streak-mode-select" data-mode="hard">Hard Mode</button>
                        <button class="btn btn-filler streak-mode-select" data-mode="filler">Filler Mode</button>
                        <button class="btn btn-secondary" id="streak-mode-cancel">Cancel</button>
                    </div>
                </div>
            `;
            document.querySelector('.container').appendChild(dialog);

            // Add cancel button listener
            dialog.querySelector('#streak-mode-cancel').addEventListener('click', () => {
                dialog.classList.add('hidden');
                document.getElementById('other-dialog').classList.remove('hidden');
            });
        }
        dialog.classList.remove('hidden');
    }

    /**
     * Starts streak mode
     */
    startStreakMode() {
        this.isStreakMode = true;
        this.streakCount = 0;
        this.ui.toggleStreakModeUI(true);
        this.startGame(this.selectedStreakMode);
    }

    /**
     * Starts a new game with specified mode
     * @param {string} mode - Game mode ('normal', 'hard', or 'filler')
     */
    startGame(mode) {
        this.gameMode = mode;
        this.currentSeed = Math.random().toString(36).substring(2, 15);
        document.getElementById('game-setup').classList.add('hidden');
        document.getElementById('game-play').classList.remove('hidden');
        document.getElementById('skip-button').classList.remove('hidden');
        
        try {
            this.chosenCharacter = this.characterSelector.selectRandomCharacter(mode, this.currentSeed);
            this.timer.startTimer();
            
            if (apClient.isConnected()) {
                apClient.setGameMode(mode);
            }
        } catch (error) {
            alert('Error: Could not find a valid character. Please try again.');
            this.resetGame();
        }
    }

    /**
     * Makes a guess attempt
     */
    makeGuess() {
        const guessInput = document.getElementById('guess-input');
        const guessValue = guessInput.value;
        
        const exactName = this.characterSelector.findCharacterName(guessValue);
        if (!exactName) {
            alert('Invalid name, try again.');
            return;
        }
        
        const results = compareTraits(names[exactName], this.chosenCharacter.traits);
        this.results.displayResults(exactName, results);
        this.guessHistory.push(results);
        
        const isCorrectGuess = exactName === this.chosenCharacter.name;
        
        // Check for streak mode loss condition - 8 guesses and incorrect
        if (this.isStreakMode && this.guessHistory.length >= 8 && !isCorrectGuess) {
            this.handleStreakLoss();
            return;
        }
        
        if (apClient.isConnected()) {
            apClient.submitGuess(exactName, {
                correct: isCorrectGuess,
                matches: results.filter(r => r.match).length,
                total: results.length
            });

            if (apClient.isDeathLinkEnabled() && this.guessHistory.length > 8) {
                apClient.sendDeathLink('Too many guesses');
                this.handleDeathLink('Too many guesses');
                return;
            }
        }

        if (isCorrectGuess) {
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
        
        this.timer.stopTimer();
        document.getElementById('game-play').classList.add('hidden');
        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('game-over-message').textContent = isDeathLink ? 
            'Game Over - Death Link forced skip!' : 
            'Game skipped!';
        document.getElementById('correct-character').textContent = this.chosenCharacter.name;
        document.getElementById('game-seed').textContent = this.currentSeed;
        document.getElementById('emoji-grid').textContent = this.results.generateEmojiGrid(this.guessHistory);
        this.results.copyResultsTable();

        // Only send death link if it wasn't triggered by one
        if (!isDeathLink && apClient.isConnected() && apClient.isDeathLinkEnabled()) {
            apClient.sendDeathLink('Skipped game');
        }

        if (this.isStreakMode) {
            this.handleStreakLoss();
        }
    }

    /**
     * Handles death link event
     * @param {string} reason - Reason for death link trigger
     */
    handleDeathLink(reason) {
        this.skipGame(true);
    }

    /**
     * Handles a correct guess
     */
    handleCorrectGuess() {
        this.timer.stopTimer();
        if (this.isStreakMode) {
            this.streakCount++; // Increment streak count
            this.ui.showGameOver(
                `Congratulations! Continue your streak! Current streak: ${this.streakCount}`,
                this.chosenCharacter.name,
                this.currentSeed,
                true,
                this.streakCount
            );
        } else {
            this.ui.showGameOver(
                'Congratulations! You found the correct character!',
                this.chosenCharacter.name,
                this.currentSeed
            );
        }
        document.getElementById('emoji-grid').textContent = this.results.generateEmojiGrid(this.guessHistory);
        this.results.copyResultsTable();
    }

    /**
     * Handles streak loss
     */
    handleStreakLoss() {
        this.timer.stopTimer();
        const finalStreak = this.streakCount; // Store the final streak before resetting
        this.ui.showGameOver(
            `Game Over! Your streak ends at ${finalStreak}!`,
            this.chosenCharacter.name,
            this.currentSeed,
            true,
            finalStreak // Pass the final streak count before resetting
        );
        document.getElementById('emoji-grid').textContent = this.results.generateEmojiGrid(this.guessHistory);
        this.results.copyResultsTable();
        this.isStreakMode = false;
        this.streakCount = 0; // Reset streak count after displaying
    }

    /**
     * Resets the game state
     */
    resetGame() {
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('game-setup').classList.remove('hidden');
        this.results.clearResults();
        this.timer.reset();
        
        // Always clear guess history
        this.guessHistory = [];
        
        if (this.isStreakMode) {
            // For streak mode, preserve streak count and start a new round
            const currentStreak = this.streakCount; // Save current streak
            document.getElementById('game-setup').classList.add('hidden'); // Keep game UI visible
            this.startGame(this.selectedStreakMode);
            this.streakCount = currentStreak; // Restore streak count
        } else {
            // Reset everything for non-streak mode
            this.chosenCharacter = null;
            this.currentSeed = null;
            this.gameMode = null;
            this.streakCount = 0;
            this.isStreakMode = false;
            this.ui.toggleStreakModeUI(false);
        }
    }

    /**
     * Generates a seed for a specific character
     */
    generateSeedForCharacter() {
        try {
            const characterInput = document.getElementById('character-input');
            const exactName = this.characterSelector.findCharacterName(characterInput.value);
            
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
                const selectedCharacter = this.characterSelector.selectRandomCharacter('filler', seed);
                
                // Check if the selected character matches the desired character
                if (selectedCharacter.name === character) {
                    // Verify that the character would actually be selectable in some mode
                    const difficulty = selectedCharacter.traits[9];
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
     * Starts game with user-provided seed
     */
    startGameWithSeed() {
        const seedInput = document.getElementById('seed-input');
        if (!seedInput.value) {
            alert('Please enter a seed value');
            return;
        }

        // Easter egg: Check for "imu" seed
        if (seedInput.value.toLowerCase() === 'imu') {
            window.location.reload();
            return;
        }

        this.gameMode = 'filler';
        this.currentSeed = seedInput.value;
        document.getElementById('game-setup').classList.add('hidden');
        document.getElementById('game-play').classList.remove('hidden');
        document.getElementById('skip-button').classList.remove('hidden');
        
        try {
            this.chosenCharacter = this.characterSelector.selectRandomCharacter('filler', this.currentSeed);
            this.timer.startTimer();
        } catch (error) {
            alert('Error: Could not find a valid character. Please try again.');
            this.resetGame();
        }
    }

    /**
     * Starts a daily challenge game
     */
    startDailyGame() {
        this.gameMode = 'daily';
        this.currentSeed = this.getDailySeed();
        document.getElementById('game-setup').classList.add('hidden');
        document.getElementById('game-play').classList.remove('hidden');
        document.getElementById('skip-button').classList.add('hidden');
        
        try {
            this.chosenCharacter = this.characterSelector.selectRandomCharacter('normal', this.currentSeed);
            this.timer.startTimer();
        } catch (error) {
            alert('Error: Could not find a valid character. Please try again.');
            this.resetGame();
        }
    }

    /**
     * Generates seed for daily challenge
     * @returns {string} Generated seed based on current date
     */
    getDailySeed() {
        const date = new Date();
        return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
    }
}