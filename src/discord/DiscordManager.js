export class DiscordManager {
    constructor() {
        this.connected = false;
        this.startTimestamp = null;
        this.sdk = null;
        this.clientId = '1351722811718373447';
        this.guessHistory = [];
        this.currentMode = null;
    }

    async initialize() {
        try {
            // Add Discord embed meta tags
            this.addDiscordMetaTags();

            // Initialize Discord Embedded App SDK
            const { Discord } = await import('@discord/embedded-app-sdk');
            this.sdk = new Discord({
                clientId: this.clientId
            });

            await this.sdk.ready();
            this.connected = true;
            this.startTimestamp = Date.now();
            this.setDefaultActivity();
            console.log('Discord Embedded App SDK connected');
        } catch (error) {
            console.warn('Discord presence failed to initialize:', error);
            this.connected = false;
        }
    }

    addDiscordMetaTags() {
        const metaTags = {
            'og:title': 'Faustdle',
            'og:description': 'One Piece Character Guessing Game',
            'og:image': 'https://faustdle.com/Faustdle-3-4-2025.png',
            'og:url': 'https://faustdle.com',
            'discord:application:id': this.clientId
        };

        Object.entries(metaTags).forEach(([property, content]) => {
            let meta = document.querySelector(`meta[property="${property}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute('property', property);
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', content);
        });
    }

    getElapsedTimeText() {
        if (!this.startTimestamp) return '';
        const elapsed = Date.now() - this.startTimestamp;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    async setDefaultActivity() {
        if (!this.connected || !this.sdk) return;

        try {
            await this.sdk.setActivity({
                details: 'Playing Faustdle',
                state: 'Waiting to start...',
                largeImageKey: 'faustdle',
                largeImageText: 'Faustdle',
                startTimestamp: this.startTimestamp,
                instance: false,
                buttons: [
                    { label: 'Play Faustdle', url: 'https://faustdle.com' }
                ]
            });
        } catch (error) {
            console.warn('Failed to set default activity:', error);
        }
    }

    async updateGameActivity(mode, guessCount) {
        if (!this.connected || !this.sdk) return;

        this.currentMode = mode;
        const modeText = this.getModeText(mode);
        const guessText = this.getGuessText(guessCount);
        const emojiGrid = this.generateEmojiGrid();
        const elapsedTime = this.getElapsedTimeText();

        try {
            await this.sdk.setActivity({
                details: `${modeText} - ${guessText}`,
                state: `Time: ${elapsedTime}`,
                largeImageKey: 'faustdle',
                largeImageText: emojiGrid || 'No guesses yet',
                smallImageKey: mode.toLowerCase(),
                smallImageText: modeText,
                startTimestamp: this.startTimestamp,
                instance: false,
                buttons: [
                    { label: 'Play Faustdle', url: 'https://faustdle.com' }
                ]
            });
        } catch (error) {
            console.warn('Failed to update game activity:', error);
        }
    }

    async updateStreakActivity(mode, streak) {
        if (!this.connected || !this.sdk) return;

        this.currentMode = mode;
        const modeText = this.getModeText(mode);
        const emojiGrid = this.generateEmojiGrid();
        const elapsedTime = this.getElapsedTimeText();

        try {
            await this.sdk.setActivity({
                details: `${modeText} Streak Mode`,
                state: `Streak: ${streak} | Time: ${elapsedTime}`,
                largeImageKey: 'faustdle',
                largeImageText: emojiGrid || 'Starting new streak...',
                smallImageKey: 'streak',
                smallImageText: `${streak} Streak`,
                startTimestamp: this.startTimestamp,
                instance: false,
                buttons: [
                    { label: 'Play Faustdle', url: 'https://faustdle.com' }
                ]
            });
        } catch (error) {
            console.warn('Failed to update streak activity:', error);
        }
    }

    getModeText(mode) {
        switch (mode) {
            case 'normal': return 'Normal Mode';
            case 'hard': return 'Hard Mode';
            case 'filler': return 'Filler Mode';
            case 'daily': return 'Daily Challenge';
            default: return 'Playing Faustdle';
        }
    }

    getGuessText(guessCount) {
        return `Guesses: ${guessCount}`;
    }

    generateEmojiGrid() {
        if (!this.guessHistory.length) return '';
        
        return this.guessHistory.map(guess => {
            return guess.results.map(result => {
                if (result.match) return '🟩';
                if (result.direction === 'up') return '⬆️';
                if (result.direction === 'down') return '⬇️';
                return '🟥';
            }).join('');
        }).join('\n');
    }

    addGuess(guess) {
        this.guessHistory.push(guess);
        if (this.currentMode) {
            this.updateGameActivity(this.currentMode, this.guessHistory.length);
        }
    }

    clearGuesses() {
        this.guessHistory = [];
        this.setDefaultActivity();
    }

    disconnect() {
        if (this.connected && this.sdk) {
            this.sdk.destroy();
        }
        this.connected = false;
        this.sdk = null;
        this.startTimestamp = null;
        this.guessHistory = [];
        this.currentMode = null;
    }
}