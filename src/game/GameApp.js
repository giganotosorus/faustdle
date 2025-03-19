import { names } from '../data/characters.js';
import { compareTraits } from '../utils/gameLogic.js';
import { APConnection } from '../components/APConnection.js';
import { apClient } from '../archipelago/client.js';
import { AutocompleteManager } from './AutocompleteManager.js';
import { CharacterSelector } from './CharacterSelector.js';
import { TimerManager } from './TimerManager.js';
import { UIManager } from './UIManager.js';
import { ResultsManager } from './ResultsManager.js';
import { LeaderboardManager } from './LeaderboardManager.js';
import { DiscordManager } from '../discord/DiscordManager.js';
import seedrandom from 'seedrandom';
import { createClient } from '@supabase/supabase-js';

// Make seedrandom available globally
window.Math.seedrandom = seedrandom;

export default class GameApp {
    constructor() {
        this.chosenCharacter = null;
        this.currentSeed = null;
        this.guessHistory = [];
        this.gameMode = null;
        this.startTime = null;
        this.elapsedTimeInterval = null;
        this.streakCount = 0;
        this.isStreakMode = false;
        this.selectedStreakMode = 'normal';
        this.previousWinner = null;
        
        this.initializeSupabase();
        this.autocomplete = new AutocompleteManager();
        this.characterSelector = new CharacterSelector();
        this.timer = new TimerManager();
        this.ui = new UIManager(this.supabase);
        this.results = new ResultsManager();
        this.leaderboardManager = new LeaderboardManager(this.supabase);
        this.leaderboardManager.createLeaderboardDialog();
        this.discord = new DiscordManager();
        this.discord.initialize().catch(console.error);
        
        document.addEventListener('death_link_triggered', (event) => {
            this.handleDeathLink(`Death Link from ${event.detail.source}`);
        });

        this.initializeAP();
        this.ui.updateDailyCountdown();
        this.setupEventListeners();
        this.setupAutocomplete();
        console.log('GameApp initialized');
    }

    initializeSupabase() {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('Supabase configuration missing. Please check your environment variables.');
            return;
        }

        this.supabase = createClient(supabaseUrl, supabaseKey);
        console.log('Supabase client initialized');
    }

    getDailyChallengeCache() {
        const cache = localStorage.getItem('dailyChallenge');
        if (!cache) return null;
        
        try {
            const data = JSON.parse(cache);
            const today = new Date().toISOString().split('T')[0];
            
            if (data.date === today) {
                return data;
            }
            
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
                completed: data.completed,
                character: data.character,
                guessHistory: data.guessHistory
            };
            localStorage.setItem('dailyChallenge', JSON.stringify(cacheData));
        } catch (error) {
            console.error('Error saving daily challenge cache:', error);
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

            dialog.querySelector('#streak-mode-cancel').addEventListener('click', () => {
                dialog.classList.add('hidden');
            });
        }
        dialog.classList.remove('hidden');
    }

    setupEventListeners() {
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

        const otherButtons = document.querySelector('.other-buttons');
        const leaderboardButton = document.createElement('button');
        leaderboardButton.id = 'leaderboard-button';
        leaderboardButton.className = 'btn btn-leaderboard';
        leaderboardButton.textContent = 'Leaderboard';
        leaderboardButton.addEventListener('click', () => {
            document.getElementById('other-dialog').classList.add('hidden');
            const leaderboardDialog = document.getElementById('leaderboard-dialog');
            leaderboardDialog.classList.remove('hidden');
            this.leaderboardManager.loadLeaderboard('normal');
        });
        otherButtons.insertBefore(leaderboardButton, otherButtons.querySelector('#other-cancel'));

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
                this.showStreakModeDialog();
            });
        }

        if (generateSeedButton) {
            generateSeedButton.addEventListener('click', () => {
                document.getElementById('other-dialog').classList.add('hidden');
                document.getElementById('game-setup').classList.add('hidden');
                document.getElementById('seed-generator').classList.remove('hidden');
            });
        }

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('streak-mode-select')) {
                this.selectedStreakMode = e.target.dataset.mode;
                this.startStreakMode();
                document.getElementById('streak-mode-dialog').classList.add('hidden');
            }
        });

        if (generateSeedForCharacterButton) {
            generateSeedForCharacterButton.addEventListener('click', () => this.generateSeedForCharacter());
        }

        if (useGeneratedSeedButton) {
            useGeneratedSeedButton.addEventListener('click', () => {
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

    startStreakMode() {
        this.isStreakMode = true;
        this.streakCount = 0;
        this.ui.toggleStreakModeUI(true);
        this.startGame(this.selectedStreakMode);
    }

    startGame(mode) {
        this.gameMode = mode;
        window.gameMode = mode;
        this.currentSeed = Math.random().toString(36).substring(2, 15);
        document.getElementById('game-setup').classList.add('hidden');
        document.getElementById('game-play').classList.remove('hidden');
        
        // Only show skip button if not in daily mode
        const skipButton = document.getElementById('skip-button');
        if (skipButton) {
            skipButton.style.display = mode === 'daily' ? 'none' : 'block';
        }
        
        try {
            this.chosenCharacter = this.characterSelector.selectRandomCharacter(mode, this.currentSeed);
            this.timer.startTimer();
            
            // Update Discord presence
            this.discord.updateGameActivity(mode, 0);
            
            if (apClient.isConnected()) {
                apClient.setGameMode(mode);
            }

            if (this.isStreakMode && this.previousWinner) {
                setTimeout(() => {
                    const results = compareTraits(names[this.previousWinner], this.chosenCharacter.traits);
                    this.results.displayResults(this.previousWinner, results);
                    this.guessHistory.push({ name: this.previousWinner, results });
                    // Update Discord presence with guess count
                    this.discord.updateGameActivity(mode, this.guessHistory.length);
                }, 100);
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
        this.guessHistory.push({ name: exactName, results });
        
        // Update Discord presence with new guess
        this.discord.addGuess({ name: exactName, results });
        
        const isCorrectGuess = exactName === this.chosenCharacter.name;
        
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
        if (!this.chosenCharacter || this.gameMode === 'daily') return;
        
        this.timer.stopTimer();
        
        const gamePlayElement = document.getElementById('game-play');
        const gameOverElement = document.getElementById('game-over');
        const gameOverMessageElement = document.getElementById('game-over-message');
        const correctCharacterElement = document.getElementById('correct-character');
        const seedContainer = document.getElementById('game-seed-container');
        const gameSeedElement = document.getElementById('game-seed');
        const emojiGridElement = document.getElementById('emoji-grid');
        
        if (gamePlayElement) gamePlayElement.classList.add('hidden');
        if (gameOverElement) gameOverElement.classList.remove('hidden');
        
        if (gameOverMessageElement) {
            gameOverMessageElement.textContent = isDeathLink ? 
                'Game Over - Death Link forced skip!' : 
                'Game skipped!';
        }
        
        if (correctCharacterElement) {
            correctCharacterElement.textContent = this.chosenCharacter.name;
        }
        
        if (seedContainer && gameSeedElement) {
            if (this.gameMode === 'daily') {
                seedContainer.classList.add('hidden');
            } else {
                seedContainer.classList.remove('hidden');
                gameSeedElement.textContent = this.currentSeed;
            }
        }

        if (emojiGridElement) {
            emojiGridElement.textContent = this.results.generateEmojiGrid(this.guessHistory.map(g => g.results));
        }
        
        this.results.copyResultsTable();
        this.ui.removeDailyElements();

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
        
        if (this.isStreakMode) {
            this.previousWinner = this.chosenCharacter.name;
        }
        
        if (this.gameMode === 'daily') {
            const today = new Date().toISOString().split('T')[0];
            const dailyNumber = this.ui.getDailyChallengeNumber();
            
            try {
                await this.supabase.rpc('increment_daily_players', {
                    challenge_date: today
                });

                const { data } = await this.supabase
                    .from('daily_players')
                    .select('player_count')
                    .eq('date', today)
                    .single();

                if (data) {
                    this.currentDailyCount = data.player_count;
                }

                this.ui.showGameOver(
                    `Congratulations! You completed Daily Challenge #${dailyNumber}!`,
                    this.chosenCharacter.name
                );

                if (this.currentDailyCount) {
                    this.ui.updateDailyPlayerCount(this.currentDailyCount);
                }

                this.saveDailyChallengeCache({
                    completed: true,
                    character: this.chosenCharacter.name,
                    guessHistory: this.guessHistory
                });
            } catch (error) {
                console.error('Error updating daily player count:', error);
                this.ui.showGameOver(
                    `Congratulations! You completed Daily Challenge #${dailyNumber}!`,
                    this.chosenCharacter.name
                );
            }
        } else if (this.isStreakMode) {
            this.streakCount++;
            this.ui.showGameOver(
                `Congratulations! Continue your streak!`,
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

        if (finalStreak > 0) {
            this.leaderboardManager.showNamePrompt(finalStreak, this.selectedStreakMode);
        }

        this.isStreakMode = false;
        this.streakCount = 0;
        this.previousWinner = null;
    }

    resetGame() {
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('game-setup').classList.remove('hidden');
        this.results.clearResults();
        this.timer.reset();
        
        this.guessHistory = [];
        window.gameMode = null;
        
        // Clear Discord guess history
        this.discord.clearGuesses();
        
        if (this.isStreakMode) {
            const currentStreak = this.streakCount;
            document.getElementById('game-setup').classList.add('hidden');
            this.startGame(this.selectedStreakMode);
            this.streakCount = currentStreak;
            // Update Discord presence for streak mode
            this.discord.updateStreakActivity(this.selectedStreakMode, this.streakCount);
        } else {
            this.chosenCharacter = null;
            this.currentSeed = null;
            this.gameMode = null;
            this.streakCount = 0;
            this.isStreakMode = false;
            this.previousWinner = null;
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
        const maxAttempts = 10000;
        
        while (attempts < maxAttempts) {
            try {
                const seed = Math.random().toString(36).substring(2, 15);
                const selectedCharacter = this.characterSelector.selectRandomCharacter('filler', seed);
                
                if (selectedCharacter.name === character) {
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
        const cache = this.getDailyChallengeCache();
        if (cache?.completed) {
            this.gameMode = 'daily';
            window.gameMode = 'daily';
            document.getElementById('game-setup').classList.add('hidden');
            document.getElementById('game-over').classList.remove('hidden');
            
            this.ui.showGameOver(
                `You've already completed today's challenge!`,
                cache.character
            );
            
            this.guessHistory = cache.guessHistory;
            document.getElementById('emoji-grid').textContent = this.results.generateEmojiGrid(this.guessHistory.map(g => g.results));
            this.results.displayCachedResults(cache.guessHistory);
            
            // Get current player count from database
            try {
                const today = new Date().toISOString().split('T')[0];
                const { data } = await this.supabase
                    .from('daily_players')
                    .select('player_count')
                    .eq('date', today)
                    .single();

                if (data) {
                    this.ui.updateDailyPlayerCount(data.player_count);
                }
            } catch (error) {
                console.error('Error fetching daily player count:', error);
            }
            
            return;
        }

        this.gameMode = 'daily';
        window.gameMode = 'daily';
        this.currentSeed = this.getDailySeed();
        document.getElementById('game-setup').classList.add('hidden');
        document.getElementById('game-play').classList.remove('hidden');
        document.getElementById('skip-button').style.display = 'none';
        
        try {
            this.chosenCharacter = this.characterSelector.selectRandomCharacter('normal', this.currentSeed);
            this.timer.startTimer();

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