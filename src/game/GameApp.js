import { names } from '../data/characters.js';
import { compareTraits } from '../utils/gameLogic.js';
import { APConnection } from '../components/APConnection.js';
import { apClient } from '../archipelago/client.js';
import { AutocompleteManager } from './AutocompleteManager.js';
import { CharacterSelector } from './CharacterSelector.js';
import { TimerManager } from './TimerManager.js';
import { UIManager } from './UIManager.js';
import { ResultsManager } from './ResultsManager.js';
import { createClient } from '@supabase/supabase-js';
import { LeaderboardManager } from './LeaderboardManager.js';

/**
 * Main game application class that manages the core game logic, state, and interactions.
 * Coordinates between different managers and handles game flow.
 */
export default class GameApp {
    /**
     * Initializes the game application and sets up all necessary components.
     * Creates manager instances, establishes database connection, and sets up event listeners.
     */
    constructor() {
        // Initialize core game state variables
        this.chosenCharacter = null;      // Currently selected character for the game
        this.currentSeed = null;          // Current game seed
        this.guessHistory = [];           // Array of player guesses and their results
        this.gameMode = null;             // Current game mode (normal, hard, filler, daily)
        this.startTime = null;            // Game start timestamp
        this.elapsedTimeInterval = null;   // Timer interval reference
        this.streakCount = 0;             // Current streak in streak mode
        this.isStreakMode = false;        // Whether streak mode is active
        this.selectedStreakMode = 'normal'; // Selected difficulty for streak mode
        
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('Supabase configuration missing. Please check your environment variables.');
            return;
        }

        // Initialize Supabase client for database operations
        this.supabase = createClient(supabaseUrl, supabaseKey);

        // Initialize game component managers
        this.autocomplete = new AutocompleteManager();    // Handles character name suggestions
        this.characterSelector = new CharacterSelector(); // Manages character selection logic
        this.timer = new TimerManager();                 // Handles game timing
        this.ui = new UIManager(this.supabase);          // Manages UI updates and display
        this.results = new ResultsManager();             // Handles game results display
        this.leaderboardManager = new LeaderboardManager(this.supabase); // Manages leaderboard functionality
        this.leaderboardManager.createLeaderboardDialog();
        
        // Set up death link event listener for Archipelago integration
        document.addEventListener('death_link_triggered', (event) => {
            this.handleDeathLink(`Death Link from ${event.detail.source}`);
        });

        // Initialize Archipelago connection and UI components
        this.initializeAP();
        this.ui.updateDailyCountdown();
        this.setupEventListeners();
        this.setupAutocomplete();
        console.log('GameApp initialized');
    }

    getDailyChallengeCache() {
        const cache = localStorage.getItem('dailyChallenge');
        if (!cache) return null;
        
        try {
            const data = JSON.parse(cache);
            const today = new Date().toISOString().split('T')[0];
            
            // Check if cache is from today
            if (data.date === today) {
                return data;
            }
            
            // Clear expired cache
            localStorage.removeItem('dailyChallenge');
            return null;
        } catch (error) {
            console.error('Error parsing daily challenge cache:', error);
            return null;
        }
    }

    saveDailyChallengeCache(data) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const cacheData = {
                date: today,
                ...data
            };
            localStorage.setItem('dailyChallenge', JSON.stringify(cacheData));
        } catch (error) {
            console.error('Error saving daily challenge cache:', error);
        }
    }

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

        // Add leaderboard button to other dialog
        const otherButtons = document.querySelector('.other-buttons');
        const leaderboardButton = document.createElement('button');
        leaderboardButton.id = 'leaderboard-button';
        leaderboardButton.className = 'btn btn-leaderboard';
        leaderboardButton.textContent = 'Leaderboard';
        leaderboardButton.addEventListener('click', () => {
            document.getElementById('other-dialog').classList.add('hidden');
            const leaderboardDialog = document.getElementById('leaderboard-dialog');
            leaderboardDialog.classList.remove('hidden');
            // Load normal mode leaderboard by default
            this.leaderboardManager.loadLeaderboard('normal');
        });
        otherButtons.insertBefore(leaderboardButton, otherButtons.querySelector('#other-cancel'));

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

    startStreakMode() {
        this.isStreakMode = true;
        this.streakCount = 0;
        this.ui.toggleStreakModeUI(true);
        this.startGame(this.selectedStreakMode);
    }

    startGame(mode) {
        this.gameMode = mode;
        window.gameMode = mode; // Reset game mode
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
        this.guessHistory.push({ name: exactName, results }); // Store name with results
        
        const isCorrectGuess = exactName === this.chosenCharacter.name;
        
        // Check for streak mode loss condition based on game mode
        const maxGuesses = this.gameMode === 'normal' ? 6 : 8;
        if (this.isStreakMode && this.guessHistory.length >= maxGuesses && !isCorrectGuess) {
            this.handleStreakLoss();
            return;
        }
        
        if (apClient.isConnected()) {
            apClient.submitGuess(exactName, {
                correct: isCorrectGuess,
                matches: results.filter(r => r.match).length,
                total: results.length
            });

            if (apClient.isDeathLinkEnabled() && this.guessHistory.length > maxGuesses) {
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

    skipGame(isDeathLink = false) {
        if (!this.chosenCharacter) return;
        
        this.timer.stopTimer();
        document.getElementById('game-play').classList.add('hidden');
        document.getElementById('game-over').classList.remove('hidden');
        
        // Show appropriate message and character name
        document.getElementById('game-over-message').textContent = isDeathLink ? 
            'Game Over - Death Link forced skip!' : 
            'Game skipped!';
        document.getElementById('correct-character').textContent = this.chosenCharacter.name;
        
        // Show seed for non-daily modes
        const seedContainer = document.getElementById('game-seed-container');
        if (this.gameMode === 'daily') {
            seedContainer.classList.add('hidden');
        } else {
            seedContainer.classList.remove('hidden');
            document.getElementById('game-seed').textContent = this.currentSeed;
        }

        // Update emoji grid and results table
        document.getElementById('emoji-grid').textContent = this.results.generateEmojiGrid(this.guessHistory.map(g => g.results));
        this.results.copyResultsTable();

        // Remove any daily elements that might be showing
        this.ui.removeDailyElements();

        // Only send death link if it wasn't triggered by one
        if (!isDeathLink && apClient.isConnected() && apClient.isDeathLinkEnabled()) {
            apClient.sendDeathLink('Skipped game');
        }

        if (this.isStreakMode) {
            this.handleStreakLoss();
        }
    }

    handleDeathLink(reason) {
        this.skipGame(true);
    }

    async handleCorrectGuess() {
        this.timer.stopTimer();
        
        if (this.gameMode === 'daily') {
            const today = new Date().toISOString().split('T')[0];
            const dailyNumber = this.ui.getDailyChallengeNumber();
            
            try {
                // Increment player count first
                await this.supabase.rpc('increment_daily_players', {
                    challenge_date: today
                });

                // Fetch updated count
                const { data } = await this.supabase
                    .from('daily_players')
                    .select('player_count')
                    .eq('date', today)
                    .single();

                if (data) {
                    this.currentDailyCount = data.player_count;
                }

                // Show game over first with the daily title
                this.ui.showGameOver(
                    `Congratulations! You completed Daily Challenge #${dailyNumber}!`,
                    this.chosenCharacter.name
                );

                // Then update the player count display
                if (this.currentDailyCount) {
                    this.ui.updateDailyPlayerCount(this.currentDailyCount);
                }

                // Cache the daily challenge completion after successful increment
                this.saveDailyChallengeCache({
                    completed: true,
                    character: this.chosenCharacter.name,
                    guessHistory: this.guessHistory,
                    playerCount: this.currentDailyCount
                });
            } catch (error) {
                console.error('Error updating daily player count:', error);
                // Still show game over even if count update fails
                this.ui.showGameOver(
                    `Congratulations! You completed Daily Challenge #${dailyNumber}!`,
                    this.chosenCharacter.name
                );
            }
        } else if (this.isStreakMode) {
            this.streakCount++;
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
        
        document.getElementById('emoji-grid').textContent = this.results.generateEmojiGrid(this.guessHistory.map(g => g.results));
        this.results.copyResultsTable();
    }

    handleStreakLoss() {
        this.timer.stopTimer();
        const finalStreak = this.streakCount;
        this.ui.showGameOver(
            `Game Over! Your streak ends at ${finalStreak}!`,
            this.chosenCharacter.name,
            this.currentSeed,
            true,
            finalStreak
        );
        document.getElementById('emoji-grid').textContent = this.results.generateEmojiGrid(this.guessHistory.map(g => g.results));
        this.results.copyResultsTable();

        // Show name prompt for leaderboard entry
        if (finalStreak > 0) {
            this.leaderboardManager.showNamePrompt(finalStreak, this.selectedStreakMode);
        }

        this.isStreakMode = false;
        this.streakCount = 0;
    }

    resetGame() {
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('game-setup').classList.remove('hidden');
        this.results.clearResults();
        this.timer.reset();
        
        // Always clear guess history and reset game mode
        this.guessHistory = [];
        window.gameMode = null;
        
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
        window.gameMode = 'filler';
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

    async startDailyGame() {
        // Check if daily challenge is already completed
        const cache = this.getDailyChallengeCache();
        if (cache?.completed) {
            // Show cached results
            this.gameMode = 'daily';
            window.gameMode = 'daily';
            document.getElementById('game-setup').classList.add('hidden');
            document.getElementById('game-over').classList.remove('hidden');
            
            // Display cached results
            this.ui.showGameOver(
                `You've already completed today's challenge!`,
                cache.character
            );
            
            // Restore guess history and display results
            this.guessHistory = cache.guessHistory;
            document.getElementById('emoji-grid').textContent = this.results.generateEmojiGrid(this.guessHistory.map(g => g.results));
            this.results.displayCachedResults(cache.guessHistory);
            
            if (cache.playerCount) {
                this.ui.updateDailyPlayerCount(cache.playerCount);
            }
            
            return;
        }

        this.gameMode = 'daily';
        window.gameMode = 'daily';
        this.currentSeed = this.getDailySeed();
        document.getElementById('game-setup').classList.add('hidden');
        document.getElementById('game-play').classList.remove('hidden');
        document.getElementById('skip-button').classList.add('hidden');
        
        try {
            this.chosenCharacter = this.characterSelector.selectRandomCharacter('normal', this.currentSeed);
            this.timer.startTimer();

            // Get current daily player count
            const today = new Date().toISOString().split('T')[0];
            const { data } = await this.supabase
                .from('daily_players')
                .select('player_count')
                .eq('date', today)
                .single();

            if (data) {
                this.currentDailyCount = data.player_count;
            }
        } catch (error) {
            console.error('Error starting daily game:', error);
            alert('Error: Could not start daily game. Please try again.');
            this.resetGame();
        }
    }

    getDailySeed() {
        const date = new Date();
        return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
    }
}