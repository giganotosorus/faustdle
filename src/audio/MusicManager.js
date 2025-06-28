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
            '/audio/audio files/If You Live.mp3',
            '/audio/audio files/The Best Oden Shop in the World!.mp3',
            '/audio/audio files/Luffys Fierce Attack!.mp3',
            '/audio/audio files/Im Going to be the Pirate King!.mp3',
            '/audio/audio files/Luffy vs. Ratchet, Round 1.mp3',
            '/audio/audio files/Woonan and the Stone Storage Room.mp3',
            '/audio/audio files/Luffy vs. Ratchet, Round 2.mp3',
            '/audio/audio files/Karakuri Defense System, Activate!.mp3',
            '/audio/audio files/Karakuri Castle, Transform!.mp3',
            '/audio/audio files/The 3 Towers.mp3',
            '/audio/audio files/Rampage! Zoro and Franky.mp3',
            '/audio/audio files/Straw Hat Pirates, Initiate Counterattack!.mp3',
            '/audio/audio files/Gear Fourth.mp3',
            '/audio/audio files/My Peak.mp3',
            '/audio/audio files/He Who Can Not Forgive, Fight!.mp3',
            '/audio/audio files/One Piece Unlimited Cruise 1 - Title Menu.mp3',
            '/audio/audio files/Cornered.mp3',
            '/audio/audio files/Bad Guy.mp3',
            '/audio/audio files/Resort Island.mp3',
            '/audio/audio files/Baron Omatsuri Appears.mp3',
            '/audio/audio files/Run!.mp3',
            '/audio/audio files/Luffys Pace.mp3',
            '/audio/audio files/The Operation Begins ~The Village is Destroyed~.mp3',
            '/audio/audio files/Desperate Situation.mp3',
            '/audio/audio files/Rubber Bazooka!!.mp3',
            '/audio/audio files/One Piece Odyssey OST - Generic Theme 4.mp3',
            '/audio/audio files/ONE PIECE WORLD SEEKER - Steel City.mp3',
            '/audio/audio files/Giant Stronghold, Launching!!.mp3',
            '/audio/audio files/Im Here With You Too.mp3',
            '/audio/audio files/ONE PIECE WORLD SEEKER - Sapphire Island.mp3',
            '/audio/audio files/One Piece Unlimited Cruise 1 - The Thousand Sunny.mp3',
            '/audio/audio files/To the Grand Line!.mp3',
            '/audio/audio files/A Serious Duel!.mp3',
            '/audio/audio files/One Piece Odyssey OST - Usopp Factory.mp3',
            '/audio/audio files/One Piece Odyssey OST - Camp Theme.mp3',
            '/audio/audio files/Luffy.mp3',
            '/audio/audio files/One Piece Pirate Warriors 4 OST - Germa 66.mp3',
            '/audio/audio files/One Piece Pirate Warriors 4 OST- Main Theme.mp3',
            '/audio/audio files/OVER THE TOP (instrumental).mp3',
            '/audio/audio files/One Piece Unlimited Cruise 1 - Cave Isle.mp3',
            '/audio/audio files/ONE PIECE WORLD SEEKER - Decisive Battle.mp3',
            '/audio/audio files/One Piece Dragon Dream Map theme extended.mp3'
        ];
        
        // Display names for tracks that have apostrophes removed from file names
        this.displayNames = {
            '/audio/audio files/Luffys Fierce Attack!.mp3': "Luffy's Fierce Attack!",
            '/audio/audio files/Im Going to be the Pirate King!.mp3': "I'm Going to be the Pirate King!",
            '/audio/audio files/Luffys Pace.mp3': "Luffy's Pace",
            '/audio/audio files/Im Here With You Too.mp3': "I'm Here With You Too"
        };
        
        // Easter egg tracks mapping
        this.easterEggTracks = {
            'slushbucket': '/audio/easter egg audio/slushbucket.mp3',
            'xtra3678': '/audio/easter egg audio/xtra3678.mp3',
            'boomdacow': '/audio/easter egg audio/boomdacow.mp3'
        };
        
        this.shuffledPlaylist = [];
        this.playlistIndex = 0;
        this.isEnabled = this.getStoredPreference();
        this.isLooping = true;
        this.isShuffled = true; // Always use shuffle mode
        this.isEasterEggMode = false; // Track if we're in easter egg mode
        this.currentEasterEggTrack = null; // Current easter egg track
        this.isMinimized = this.getMinimizedPreference();
        this.isVisible = false; // Start hidden by default
        
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
        if (this.isEasterEggMode) {
            return -1; // Special value for easter egg mode
        }
        return this.shuffledPlaylist[this.playlistIndex];
    }

    /**
     * Gets the current track filename for display
     */
    getCurrentTrackName() {
        if (this.isEasterEggMode && this.currentEasterEggTrack) {
            return `🎵 ${this.currentEasterEggTrack}`;
        }
        
        const trackIndex = this.getCurrentTrackIndex();
        const fullPath = this.audioFiles[trackIndex];
        
        // Check if this track has a custom display name
        if (this.displayNames[fullPath]) {
            return this.displayNames[fullPath];
        }
        
        // Otherwise use the filename without extension
        const filename = fullPath.split('/').pop().replace('.mp3', '');
        return filename;
    }

    /**
     * Checks if a seed is the test seed to show music player
     * @param {string} seed - The seed to check
     * @returns {boolean} True if it's the test seed
     */
    isTestSeed(seed) {
        return seed.toLowerCase() === 'test';
    }

    /**
     * Shows the music player (for testing purposes)
     */
    showMusicPlayer() {
        this.isVisible = true;
        this.createMusicControls();
        console.log('Music player is now visible for testing');
        alert('Music player is now visible for testing!');
    }

    /**
     * Hides the music player
     */
    hideMusicPlayer() {
        this.isVisible = false;
        const controls = document.getElementById('music-controls');
        if (controls) {
            controls.remove();
        }
        console.log('Music player is now hidden');
    }

    /**
     * Checks if a seed is an easter egg track name
     * @param {string} seed - The seed to check
     * @returns {boolean} True if it's an easter egg track
     */
    isEasterEggSeed(seed) {
        return this.easterEggTracks.hasOwnProperty(seed.toLowerCase());
    }

    /**
     * Activates easter egg mode with a specific track
     * @param {string} trackName - Name of the easter egg track
     */
    activateEasterEggMode(trackName) {
        const lowerTrackName = trackName.toLowerCase();
        if (!this.easterEggTracks[lowerTrackName]) {
            console.warn('Easter egg track not found:', trackName);
            return false;
        }

        this.isEasterEggMode = true;
        this.currentEasterEggTrack = trackName;
        
        // Stop current music and start easter egg track
        this.stopMusic();
        this.playEasterEggTrack();
        
        // Update UI to reflect easter egg mode
        this.updateEasterEggUI();
        
        console.log('Activated easter egg mode with track:', trackName);
        return true;
    }

    /**
     * Deactivates easter egg mode and returns to normal playlist
     */
    deactivateEasterEggMode() {
        this.isEasterEggMode = false;
        this.currentEasterEggTrack = null;
        
        // Stop current music
        this.stopMusic();
        
        // Recreate normal UI if visible
        if (this.isVisible) {
            this.createMusicControls();
        }
        
        console.log('Deactivated easter egg mode');
    }

    /**
     * Plays the current easter egg track
     */
    async playEasterEggTrack() {
        if (!this.isEasterEggMode || !this.currentEasterEggTrack) return;

        try {
            this.createAudioElement();
            const trackPath = this.easterEggTracks[this.currentEasterEggTrack.toLowerCase()];
            this.currentAudio.src = trackPath;
            this.currentAudio.loop = true; // Loop the easter egg track
            
            this.updateTrackInfo('Loading easter egg...');
            
            await this.currentAudio.play();
            this.isPlaying = true;
            
            // Update play/pause button
            const playPauseButton = document.getElementById('play-pause');
            if (playPauseButton) {
                playPauseButton.innerHTML = '⏸️';
            }
            
        } catch (error) {
            console.error('Failed to play easter egg track:', error);
            this.updateTrackInfo('Failed to load easter egg');
        }
    }

    /**
     * Updates the UI for easter egg mode
     */
    updateEasterEggUI() {
        // Only create controls if music player is visible
        if (!this.isVisible) return;
        
        // Recreate controls with easter egg styling
        this.createMusicControls();
        
        // Add special styling to indicate easter egg mode
        const controls = document.getElementById('music-controls');
        if (controls && !this.isMinimized) {
            controls.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.9) 0%, rgba(255, 193, 7, 0.95) 100%)';
            controls.style.border = '2px solid gold';
            controls.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.5)';
        }
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
        // Don't create controls by default - they're hidden until test seed is used
        console.log('Music system initialized (hidden)');
    }

    /**
     * Creates the music control UI elements
     */
    createMusicControls() {
        // Don't create controls if not visible
        if (!this.isVisible) return;
        
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
            expandButton.innerHTML = this.isEasterEggMode ? '🎵' : '🎵';
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
            
            // Previous track button (disabled in easter egg mode)
            const prevButton = document.createElement('button');
            prevButton.id = 'prev-track';
            prevButton.className = 'btn btn-music-small';
            prevButton.innerHTML = '⏮️';
            prevButton.title = 'Previous track';
            prevButton.disabled = this.isEasterEggMode;
            prevButton.onclick = () => this.previousTrack();
            
            // Play/Pause button
            const playPauseButton = document.createElement('button');
            playPauseButton.id = 'play-pause';
            playPauseButton.className = 'btn btn-music-small';
            playPauseButton.innerHTML = this.isPlaying ? '⏸️' : '▶️';
            playPauseButton.title = 'Play/Pause';
            playPauseButton.onclick = () => this.togglePlayPause();
            
            // Next track button (disabled in easter egg mode)
            const nextButton = document.createElement('button');
            nextButton.id = 'next-track';
            nextButton.className = 'btn btn-music-small';
            nextButton.innerHTML = '⏭️';
            nextButton.title = 'Next track';
            nextButton.disabled = this.isEasterEggMode;
            nextButton.onclick = () => this.nextTrack();
            
            // Exit easter egg mode button (only shown in easter egg mode)
            if (this.isEasterEggMode) {
                const exitButton = document.createElement('button');
                exitButton.id = 'exit-easter-egg';
                exitButton.className = 'btn btn-music-small';
                exitButton.innerHTML = 'X';
                exitButton.title = 'Exit secret mode';
                exitButton.onclick = () => this.deactivateEasterEggMode();
                buttonRow.appendChild(exitButton);
            }
            
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
            
            if (this.isEasterEggMode) {
                trackInfo.textContent = `🎵 Playing: ${this.currentEasterEggTrack}`;
            } else {
                trackInfo.textContent = this.isEnabled ? `🎵 ${this.audioFiles.length} tracks ready` : 'Music disabled';
            }
            
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
        
        // Reapply easter egg styling if needed
        if (this.isEasterEggMode && !this.isMinimized) {
            this.updateEasterEggUI();
        }
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
        this.currentAudio.crossOrigin = 'anonymous'; // Add CORS support
        
        // Add event listeners
        this.currentAudio.addEventListener('ended', this.handleTrackEnd.bind(this));
        this.currentAudio.addEventListener('error', this.handleAudioError.bind(this));
        this.currentAudio.addEventListener('loadstart', () => {
            this.updateTrackInfo('Loading...');
        });
        this.currentAudio.addEventListener('canplay', () => {
            if (this.isEasterEggMode) {
                this.updateTrackInfo(`🎵 Playing: ${this.currentEasterEggTrack}`);
            } else {
                const trackName = this.getCurrentTrackName();
                this.updateTrackInfo(`♪ ${trackName.substring(0, 30)}${trackName.length > 30 ? '...' : ''} ♪`);
            }
        });
        
        return this.currentAudio;
    }

    /**
     * Handles when a track ends
     */
    handleTrackEnd() {
        if (this.isEasterEggMode) {
            // Easter egg tracks should loop automatically, but just in case
            this.playEasterEggTrack();
        } else if (this.isLooping) {
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
        console.error('Audio error details:', {
            error: event.target?.error,
            src: event.target?.src,
            networkState: event.target?.networkState,
            readyState: event.target?.readyState
        });
        
        if (this.isEasterEggMode) {
            this.updateTrackInfo('Easter egg error - exiting...');
            setTimeout(() => this.deactivateEasterEggMode(), 2000);
        } else {
            this.updateTrackInfo('Error - trying next...');
            setTimeout(() => this.nextTrack(), 1000);
        }
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
        
        if (this.isEasterEggMode) {
            this.updateTrackInfo(`🎵 ${this.currentEasterEggTrack} stopped`);
        } else {
            this.updateTrackInfo('Stopped');
        }
        
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
     * Skips to the next track in the shuffled playlist (disabled in easter egg mode)
     */
    nextTrack() {
        if (this.isEasterEggMode) return;
        
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
     * Goes to the previous track in the shuffled playlist (disabled in easter egg mode)
     */
    previousTrack() {
        if (this.isEasterEggMode) return;
        
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
        if (this.isEasterEggMode) {
            await this.playEasterEggTrack();
            return;
        }
        
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
            console.error('Track details:', {
                trackIndex: this.getCurrentTrackIndex(),
                src: this.audioFiles[this.getCurrentTrackIndex()],
                error: error.message
            });
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
                
                if (this.isEasterEggMode) {
                    this.updateTrackInfo(`🎵 ${this.currentEasterEggTrack} paused`);
                } else {
                    this.updateTrackInfo('Paused');
                }
            } else {
                // Not playing, so start
                if (this.isEasterEggMode) {
                    await this.playEasterEggTrack();
                } else {
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