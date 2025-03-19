export class DiscordManager {
    constructor() {
        this.connected = false;
        this.startTimestamp = null;
        this.activityInterval = null;
    }

    async initialize() {
        try {
            // Add Discord presence meta tags
            this.addDiscordMetaTags();
            this.connected = true;
            this.startTimestamp = Date.now();
            console.log('Discord presence initialized');
            this.setDefaultActivity();
        } catch (error) {
            console.warn('Discord presence failed to initialize:', error);
            this.connected = false;
        }
    }

    addDiscordMetaTags() {
        // Add Discord embed meta tags
        const metaTags = {
            'og:title': 'Faustdle',
            'og:description': 'One Piece Character Guessing Game',
            'og:image': 'https://faustdle.com/Faustdle-3-4-2025.png',
            'og:url': 'https://faustdle.com',
            'discord:application:id': '1351722811718373447'
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
        document.title = 'Faustdle - Main Menu';
    }

    updateGameActivity(mode, guessCount) {
        if (!this.connected) return;

        const modeText = {
            normal: 'Normal Mode',
            hard: 'Hard Mode',
            filler: 'Filler Mode',
            daily: 'Daily Challenge'
        }[mode] || 'Playing';

        const status = guessCount ? `Guesses: ${guessCount}` : 'Starting game...';
        document.title = `Faustdle - ${modeText} - ${status}`;
    }

    updateStreakActivity(mode, streak) {
        if (!this.connected) return;

        const modeText = {
            normal: 'Normal Mode',
            hard: 'Hard Mode',
            filler: 'Filler Mode'
        }[mode] || 'Playing';

        document.title = `Faustdle - Streak Mode ${modeText} - Streak: ${streak}`;
    }

    disconnect() {
        if (this.connected) {
            document.title = 'Faustdle';
            this.connected = false;
        }
    }
}