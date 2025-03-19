export class DiscordManager {
    constructor() {
        this.connected = false;
        this.startTimestamp = null;
        this.rpc = null;
        this.clientId = '1351722811718373447';
        this.guessHistory = [];
        this.currentMode = null;
    }

    async initialize() {
        try {
            // Add Discord embed meta tags
            this.addDiscordMetaTags();

            // Initialize Discord RPC
            const { Client } = await import('discord-rpc');
            this.rpc = new Client({ transport: 'ipc' });

            try {
                await this.rpc.login({ clientId: this.clientId });
                this.connected = true;
                this.startTimestamp = Date.now();
                this.setDefaultActivity();
                console.log('Discord RPC connected');
            } catch (error) {
                console.warn('Discord RPC login failed:', error);
                this.connected = false;
            }
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

    setDefaultActivity() {
        if (!this.connected) return;

        this.rpc.setActivity({
            details: 'In Menu',
            state: 'Choosing Game Mode',
            largeImageKey: 'faustdle',
            largeImageText: 'Faustdle',
            startTimestamp: this.startTimestamp,
            instance: false
        });
    }

    updateGameActivity(mode, guessCount) {
        if (!this.connected) return;

        this.currentMode = mode;
        const modeText = this.getModeText(mode);
        const guessText = this.getGuessText(guessCount);
        const emojiGrid = this.generateEmojiGrid();

        this.rpc.setActivity({
            details: `Playing ${modeText}`,
            state: guessText,
            largeImageKey: 'faustdle',
            largeImageText: 'Faustdle',
            smallImageKey: mode.toLowerCase(),
            smallImageText: modeText,
            startTimestamp: this.startTimestamp,
            instance: false,
            buttons: [
                { label: 'Play Faustdle', url: 'https://faustdle.com' }
            ]
        });
    }

    updateStreakActivity(mode, streak) {
        if (!this.connected) return;

        this.currentMode = mode;
        const modeText = this.getModeText(mode);

        this.rpc.setActivity({
            details: `${modeText} Streak Mode`,
            state: `Current Streak: ${streak}`,
            largeImageKey: 'faustdle',
            largeImageText: 'Faustdle',
            smallImageKey: 'streak',
            smallImageText: `${streak} Streak`,
            startTimestamp: this.startTimestamp,
            instance: false,
            buttons: [
                { label: 'Play Faustdle', url: 'https://faustdle.com' }
            ]
        });
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
        this.updateGameActivity(this.currentMode, this.guessHistory.length);
    }

    clearGuesses() {
        this.guessHistory = [];
    }

    disconnect() {
        if (this.connected && this.rpc) {
            this.rpc.destroy();
            this.connected = false;
            this.rpc = null;
            this.startTimestamp = null;
            this.guessHistory = [];
            this.currentMode = null;
        }
    }
}