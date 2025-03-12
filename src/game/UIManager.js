/**
 * Manages all UI-related functionality and updates.
 * Handles display updates, animations, and UI state management.
 */
export class UIManager {
    /**
     * Initializes the UI manager.
     * @param {Object} supabase - Supabase client instance for database operations
     */
    constructor(supabase) {
        this.supabase = supabase;
    }

    toggleStreakModeUI(enabled) {
        const dailyModeButton = document.getElementById('daily-mode');
        const seedSection = document.getElementById('seed-section');
        
        if (enabled) {
            if (dailyModeButton) dailyModeButton.style.display = 'none';
            if (seedSection) seedSection.style.display = 'none';
            document.getElementById('other-dialog').classList.add('hidden');
        } else {
            if (dailyModeButton) dailyModeButton.style.display = 'block';
            if (seedSection) seedSection.style.display = 'block';
        }
    }

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
            if (countdownTimer) countdownTimer.textContent = timerText;
            if (resultCountdownTimer) resultCountdownTimer.textContent = timerText;
        };

        updateTimer();
        setInterval(updateTimer, 1000);
    }

    getDailyChallengeNumber() {
        const startDate = new Date('2025-03-04');
        const today = new Date();
        const diffTime = Math.abs(today - startDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1;
    }

    updateDailyPlayerCount(count) {
        if (window.gameMode !== 'daily') return;

        // Remove any existing count display
        this.removeDailyPlayerCount();

        // Create and add new count display
        const countElement = document.createElement('div');
        countElement.className = 'daily-player-count';
        countElement.textContent = `${count} ${count === 1 ? 'player has' : 'players have'} completed today's challenge`;
        
        const emojiGrid = document.getElementById('emoji-grid');
        if (emojiGrid && emojiGrid.parentNode) {
            emojiGrid.parentNode.insertBefore(countElement, emojiGrid.nextSibling);
        }
    }

    removeDailyPlayerCount() {
        const existingCount = document.querySelector('.daily-player-count');
        if (existingCount) {
            existingCount.remove();
        }
    }

    showGameOver(message, character, seed, isStreak = false, streakCount = 0) {
        document.getElementById('game-play').classList.add('hidden');
        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('game-over-message').textContent = message;
        document.getElementById('correct-character').textContent = character;
        
        this.removeStreakCounter();
        
        const seedContainer = document.getElementById('game-seed-container');
        const emojiGrid = document.getElementById('emoji-grid');
        
        if (isStreak) {
            seedContainer.classList.add('hidden');
            this.addStreakCounter(streakCount);
        } else if (window.gameMode === 'daily') {
            seedContainer.classList.add('hidden');
            // Add daily challenge title above emoji grid
            const dailyTitle = document.createElement('div');
            dailyTitle.className = 'daily-title';
            dailyTitle.textContent = `Faustdle Day #${this.getDailyChallengeNumber()}`;
            if (emojiGrid && emojiGrid.parentNode) {
                emojiGrid.parentNode.insertBefore(dailyTitle, emojiGrid);
            }
        } else {
            seedContainer.classList.remove('hidden');
            document.getElementById('game-seed').textContent = seed;
        }
    }

    removeDailyElements() {
        // Remove daily title if it exists
        const dailyTitle = document.querySelector('.daily-title');
        if (dailyTitle) {
            dailyTitle.remove();
        }
        this.removeDailyPlayerCount();
    }

    removeStreakCounter() {
        const existingStreak = document.querySelector('.streak-count');
        if (existingStreak) {
            existingStreak.remove();
        }
    }

    addStreakCounter(count) {
        const emojiGrid = document.getElementById('emoji-grid');
        const streakText = document.createElement('div');
        streakText.className = 'streak-count';
        streakText.textContent = `Current Streak: ${count}`;
        emojiGrid.parentNode.insertBefore(streakText, emojiGrid);
    }
}

export default UIManager;