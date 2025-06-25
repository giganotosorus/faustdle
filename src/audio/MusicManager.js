/**
 * Manages background music playbook for the Faustdle game using local audio files.
 */
export class MusicManager {
    constructor() {
        this.currentAudio = null;
        this.isPlaying = false;
        this.isMuted = false;
        this.volume = 30; // Default volume (30%)
        this.currentTrackIndex = 0;
        this.audioFiles = [
            '/src/audio/audio files/If You Live.mp3',
            '/src/audio/audio files/The Best Oden Shop in the World!.mp3',
            '/src/audio/audio files/Luffy\'s Fierce Attack!.mp3',
            '/src/audio/audio files/I\'m Going to be the Pirate King!.mp3',
            '/src/audio/audio files/Luffy vs. Ratchet, Round 1.mp3',
            '/src/audio/audio files/Woonan and the Stone Storage Room.mp3',
            '/src/audio/audio files/Luffy vs. Ratchet, Round 2.mp3',
            '/src/audio/audio files/Karakuri Defense System, Activate!.mp3',
            '/src/audio/audio files/Karakuri Castle, Transform!.mp3',
            '/src/audio/audio files/The 3 Towers.mp3',
            '/src/audio/audio files/Rampage! Zoro and Franky.mp3',
            '/src/audio/audio files/Straw Hat Pirates, Initiate Counterattack!.mp3',
            '/src/audio/audio files/Gear Fourth.mp3',
            '/src/audio/audio files/My Peak.mp3',
            '/src/audio/audio files/He Who Can Not Forgive, Fight!.mp3',
            '/src/audio/audio files/One Piece Unlimited Cruise 1 - Title Menu.mp3',
            '/src/audio/audio files/Cornered.mp3',
            '/src/audio/audio files/Bad Guy.mp3',
            '/src/audio/audio files/Resort Island.mp3',
            '/src/audio/audio files/Baron Omatsuri Appears.mp3',
            '/src/audio/audio files/Run!.mp3',
            '/src/audio/audio files/Luffy\'s Pace.mp3',
            '/src/audio/audio files/The Operation Begins ~The Village is Destroyed~.mp3',
            '/src/audio/audio files/Desperate Situation.mp3',
            '/src/audio/audio files/Rubber Bazooka!!.mp3',
            '/src/audio/audio files/One Piece Odyssey OST - Generic Theme 4.mp3',
            '/src/audio/audio files/ONE PIECE WORLD SEEKER - Steel City.mp3',
            '/src/audio/audio files/Giant Stronghold, Launching!!.mp3',
            '/src/audio/audio files/I\'m Here With You Too.mp3',
            '/src/audio/audio files/ONE PIECE WORLD SEEKER - Sapphire Island.mp3',
            '/src/audio/audio files/One Piece Unlimited Cruise 1 - The Thousand Sunny.mp3',
            '/src/audio/audio files/To the Grand Line!.mp3',
            '/src/audio/audio files/A Serious Duel!.mp3',
            '/src/audio/audio files/One Piece Odyssey OST - Usopp Factory.mp3',
            '/src/audio/audio files/One Piece Odyssey OST - Camp Theme.mp3',
            '/src/audio/audio files/Luffy.mp3',
            '/src/audio/audio files/One Piece Pirate Warriors 4 OST - Germa 66.mp3',
            '/src/audio/audio files/One Piece Pirate Warriors 4 OST- Main Theme.mp3',
            '/src/audio/audio files/OVER THE TOP (instrumental).mp3',
            '/src/audio/audio files/One Piece Unlimited Cruise 1 - Cave Isle.mp3',
            '/src/audio/audio files/ONE PIECE WORLD SEEKER - Decisive Battle.mp3',
            '/src/audio/audio files/One Piece Dragon Dream Map theme extended.mp3'
        ];
        this.shuffledPlaylist = [];
        this.playlistIndex = 0;
        this.isEnabled = this.getStoredPreference();
        this.isLooping = true;
        this.isMinimized = this.getMinimizedPreference();
        this.isShuffled = true; // Always use shuffle mode
        
        // Initialize shuffled playlist
        this.createShuffledPlaylist();
    }

    /**
     * Creates a shuffled playlist from all available tracks
     */
    createShuffledPlaylist() {
        // Create array of indices
        this.shuffledPlaylist = Array.from({ length: this.audioFiles.length }, (_, i) => i);
        
        // Fisher-Yates shuffle algorithm
        for (let i = this.shuffledPlaylist.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shuffledPlaylist[i], this.shuffledPlaylist[j]] = [this.shuffledPlaylist[j], this.shuffledPlaylist[i]];
        }
        
        this.playlistIndex = 0;
        console.log('Created shuffled playlist with', this.shuffledPlaylist.length, 'tracks');
    }

    /**
     * Gets the current track index from the shuffled playlist
     */
    getCurrentTrackIndex() {
        return this.shuffledPlaylist[this.playlistIndex];
    }

    /**
     * Gets the current track filename for display
     */
    getCurrentTrackName() {
        const trackIndex = this.getCurrentTrackIndex();
        const fullPath = this.audioFiles[trackIndex];
        const filename = fullPath.split('/').pop().replace('.mp3', '');
        return filename;
    }

    /**
     * Gets the stored music preference from localStorage
     * @returns {boolean} Whether music is enabled
     */
    getStoredPreference() {
        const stored = localStorage.getItem('faustdle-music-enabled');
        return stored !== null ? JSON.parse(stored) : true; // Default to enabled
    }

    /**
     * Gets the stored minimized preference from localStorage
     * @returns {boolean} Whether music player is minimized
     */
    getMinimizedPreference() {
        const stored = localStorage.getItem('faustdle-music-minimized');
        return stored !== null ? JSON.parse(stored) : false; // Default to expanded
    }

    /**
     * Stores the music preference in localStorage
     * @param {boolean} enabled - Whether music should be enabled
     */
    setStoredPreference(enabled) {
        localStorage.setItem('faustdle-music-enabled', JSON.stringify(enabled));
        this.isEnabled = enabled;
    }

    /**
     * Stores the minimized preference in localStorage
     * @param {boolean} minimized - Whether music player should be minimized
     */
    setMinimizedPreference(minimized) {
        localStorage.setItem('faustdle-music-minimized', JSON.stringify(minimized));
        this.isMinimized = minimized;
    }

    /**
     * Initializes the music system and creates UI controls
     */
    async initialize() {
        this.createMusicControls();
        
        if (this.isEnabled) {
            this.updateTrackInfo(`🎵 Click Play to start`);
        }
    }

    /**
     * Creates the music control UI elements
     */
    createMusicControls() {
        // Remove existing controls if they exist
        const existingControls = document.getElementById('music-controls');
        if (existingControls) {
            existingControls.remove();
        }

        // Create music controls container
        const controlsContainer = document.createElement('div');
        controlsContainer.id = 'music-controls';
        controlsContainer.className = `music-controls ${this.isMinimized ? 'minimized' : ''}`;
        
        if (this.isMinimized) {
            // Minimized state - just show the expand button
            const expandButton = document.createElement('button');
            expandButton.id = 'music-minimize';
            expandButton.className = 'btn btn-music-minimize';
            expandButton.innerHTML = '🎵';
            expandButton.title = 'Expand music player';
            expandButton.onclick = () => this.toggleMinimize();
            
            controlsContainer.appendChild(expandButton);
        } else {
            // Expanded state - show all controls
            
            // Control buttons row (including minimize button)
            const buttonRow = document.createElement('div');
            buttonRow.className = 'button-row';
            
            // Minimize button
            const minimizeButton = document.createElement('button');
            minimizeButton.id = 'music-minimize';
            minimizeButton.className = 'btn btn-music-small';
            minimizeButton.innerHTML = '−';
            minimizeButton.title = 'Minimize music player';
            minimizeButton.onclick = () => this.toggleMinimize();
            
            // Previous track button
            const prevButton = document.createElement('button');
            prevButton.id = 'prev-track';
            prevButton.className = 'btn btn-music-small';
            prevButton.innerHTML = '⏮️';
            prevButton.title = 'Previous track';
            prevButton.onclick = () => this.previousTrack();
            
            // Play/Pause button
            const playPauseButton = document.createElement('button');
            playPauseButton.id = 'play-pause';
            playPauseButton.className = 'btn btn-music-small';
            playPauseButton.innerHTML = this.isPlaying ? '⏸️' : '▶️';
            playPauseButton.title = 'Play/Pause';
            playPauseButton.onclick = () => this.togglePlayPause();
            
            // Next track button
            const nextButton = document.createElement('button');
            nextButton.id = 'next-track';
            nextButton.className = 'btn btn-music-small';
            nextButton.innerHTML = '⏭️';
            nextButton.title = 'Next track';
            nextButton.onclick = () => this.nextTrack();
            
            // Volume control
            const volumeContainer = document.createElement('div');
            volumeContainer.className = 'volume-control';
            
            const volumeLabel = document.createElement('span');
            volumeLabel.textContent = '🔊';
            volumeLabel.className = 'volume-label';
            
            const volumeSlider = document.createElement('input');
            volumeSlider.type = 'range';
            volumeSlider.id = 'volume-slider';
            volumeSlider.min = '0';
            volumeSlider.max = '100';
            volumeSlider.value = this.volume;
            volumeSlider.className = 'volume-slider';
            volumeSlider.oninput = (e) => this.setVolume(parseInt(e.target.value));
            
            // Track info display
            const trackInfo = document.createElement('div');
            trackInfo.id = 'track-info';
            trackInfo.className = 'track-info';
            trackInfo.textContent = this.isEnabled ? `🎵 ${this.audioFiles.length} tracks ready` : 'Music disabled';
            
            // Assemble the UI
            buttonRow.appendChild(minimizeButton);
            buttonRow.appendChild(prevButton);
            buttonRow.appendChild(playPauseButton);
            buttonRow.appendChild(nextButton);
            
            volumeContainer.appendChild(volumeLabel);
            volumeContainer.appendChild(volumeSlider);
            
            controlsContainer.appendChild(buttonRow);
            controlsContainer.appendChild(volumeContainer);
            controlsContainer.appendChild(trackInfo);
        }
        
        // Add to page
        document.body.appendChild(controlsContainer);
    }

    /**
     * Toggles the minimize state of the music player
     */
    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        this.setMinimizedPreference(this.isMinimized);
        
        // Recreate the controls with the new state
        this.createMusicControls();
    }

    /**
     * Creates and configures an audio element
     */
    createAudioElement() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.removeEventListener('ended', this.handleTrackEnd.bind(this));
            this.currentAudio.removeEventListener('error', this.handleAudioError.bind(this));
        }

        this.currentAudio = new Audio();
        this.currentAudio.volume = this.volume / 100;
        this.currentAudio.preload = 'auto';
        
        // Add event listeners
        this.currentAudio.addEventListener('ended', this.handleTrackEnd.bind(this));
        this.currentAudio.addEventListener('error', this.handleAudioError.bind(this));
        this.currentAudio.addEventListener('loadstart', () => {
            this.updateTrackInfo('Loading...');
        });
        this.currentAudio.addEventListener('canplay', () => {
            const trackName = this.getCurrentTrackName();
            this.updateTrackInfo(`♪ ${trackName.substring(0, 30)}${trackName.length > 30 ? '...' : ''} ♪`);
        });
        
        return this.currentAudio;
    }

    /**
     * Handles when a track ends
     */
    handleTrackEnd() {
        if (this.isLooping) {
            this.nextTrack();
        } else {
            this.stopMusic();
        }
    }

    /**
     * Handles audio loading errors
     */
    handleAudioError(event) {
        console.error('Audio error:', event);
        this.updateTrackInfo('Error - trying next...');
        setTimeout(() => this.nextTrack(), 1000);
    }

    /**
     * Sets the volume level
     * @param {number} volume - Volume level (0-100)
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(100, volume));
        
        if (this.currentAudio) {
            this.currentAudio.volume = this.volume / 100;
        }
        
        localStorage.setItem('faustdle-music-volume', this.volume.toString());
    }

    /**
     * Stops the current music
     */
    stopMusic() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }
        
        this.isPlaying = false;
        this.updateTrackInfo('Stopped');
        
        // Update play/pause button
        const playPauseButton = document.getElementById('play-pause');
        if (playPauseButton) {
            playPauseButton.innerHTML = '▶️';
        }
    }

    /**
     * Updates the track info display
     * @param {string} info - Information to display
     */
    updateTrackInfo(info) {
        const trackInfo = document.getElementById('track-info');
        if (trackInfo) {
            trackInfo.textContent = info;
        }
        console.log('Track info:', info);
    }

    /**
     * Skips to the next track in the shuffled playlist
     */
    nextTrack() {
        // Move to next track in shuffled playlist
        this.playlistIndex = (this.playlistIndex + 1) % this.shuffledPlaylist.length;
        
        // If we've reached the end of the playlist, create a new shuffle
        if (this.playlistIndex === 0) {
            this.createShuffledPlaylist();
            console.log('Reshuffled playlist for continuous playback');
        }
        
        // If we were playing, start the new track
        if (this.isPlaying) {
            this.playCurrentTrack();
        } else {
            const trackName = this.getCurrentTrackName();
            this.updateTrackInfo(`Next: ${trackName.substring(0, 25)}${trackName.length > 25 ? '...' : ''}`);
        }
    }

    /**
     * Goes to the previous track in the shuffled playlist
     */
    previousTrack() {
        // Move to previous track in shuffled playlist
        this.playlistIndex = (this.playlistIndex - 1 + this.shuffledPlaylist.length) % this.shuffledPlaylist.length;
        
        // If we were playing, start the new track
        if (this.isPlaying) {
            this.playCurrentTrack();
        } else {
            const trackName = this.getCurrentTrackName();
            this.updateTrackInfo(`Prev: ${trackName.substring(0, 25)}${trackName.length > 25 ? '...' : ''}`);
        }
    }

    /**
     * Plays the current track from the shuffled playlist
     */
    async playCurrentTrack() {
        try {
            this.createAudioElement();
            const trackIndex = this.getCurrentTrackIndex();
            this.currentAudio.src = this.audioFiles[trackIndex];
            
            this.updateTrackInfo('Loading...');
            
            await this.currentAudio.play();
            this.isPlaying = true;
            
            // Update play/pause button
            const playPauseButton = document.getElementById('play-pause');
            if (playPauseButton) {
                playPauseButton.innerHTML = '⏸️';
            }
            
        } catch (error) {
            console.error('Failed to play track:', error);
            this.updateTrackInfo('Failed - trying next...');
            setTimeout(() => this.nextTrack(), 1000);
        }
    }

    /**
     * Toggles play/pause
     */
    async togglePlayPause() {
        const playPauseButton = document.getElementById('play-pause');
        
        try {
            if (this.isPlaying && this.currentAudio) {
                // Currently playing, so pause
                this.currentAudio.pause();
                this.isPlaying = false;
                playPauseButton.innerHTML = '▶️';
                this.updateTrackInfo('Paused');
            } else {
                // Not playing, so start
                const trackIndex = this.getCurrentTrackIndex();
                if (!this.currentAudio || this.currentAudio.src !== this.audioFiles[trackIndex]) {
                    await this.playCurrentTrack();
                } else {
                    // Resume existing track
                    await this.currentAudio.play();
                    this.isPlaying = true;
                    playPauseButton.innerHTML = '⏸️';
                    const trackName = this.getCurrentTrackName();
                    this.updateTrackInfo(`♪ ${trackName.substring(0, 30)}${trackName.length > 30 ? '...' : ''} ♪`);
                }
            }
        } catch (error) {
            console.error('Failed to toggle play/pause:', error);
            this.updateTrackInfo('Error - try again');
        }
    }

    /**
     * Cleans up the music manager
     */
    destroy() {
        this.stopMusic();
        
        // Clean up audio element
        if (this.currentAudio) {
            this.currentAudio.removeEventListener('ended', this.handleTrackEnd.bind(this));
            this.currentAudio.removeEventListener('error', this.handleAudioError.bind(this));
            this.currentAudio = null;
        }
        
        // Remove controls
        const controls = document.getElementById('music-controls');
        if (controls) {
            controls.remove();
        }
    }
}