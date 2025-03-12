export class UIManager {
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

    showGameOver(message, character, seed, isStreak = false, streakCount = 0) {
        document.getElementById('game-play').classList.add('hidden');
        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('game-over-message').textContent = message;
        document.getElementById('correct-character').textContent = character;
        
        // Always remove any existing streak counter first
        this.removeStreakCounter();
        
        const seedContainer = document.getElementById('game-seed-container');
        if (isStreak) {
            seedContainer.classList.add('hidden');
            this.addStreakCounter(streakCount);
        } else {
            seedContainer.classList.remove('hidden');
            document.getElementById('game-seed').textContent = seed;
        }
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