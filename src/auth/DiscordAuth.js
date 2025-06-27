/**
 * Discord Authentication Manager for Supabase integration
 * Handles Discord OAuth flow and Supabase session management
 */
export class DiscordAuth {
    constructor(supabase, discordSDK) {
        this.supabase = supabase;
        this.discordSDK = discordSDK;
        this.user = null;
        this.session = null;
        this.isAuthenticated = false;
        this.isDiscordActivity = window.location.href.includes('discordsays.com');
        
        // Discord OAuth configuration
        this.discordClientId = '1351722811718373447'; // Your Discord app client ID
        this.redirectUri = window.location.origin; // Your site's URL
    }

    /**
     * Initialize Discord authentication
     */
    async initialize() {
        try {
            // Check if we're in Discord environment
            if (!this.discordSDK) {
                console.log('Not in Discord environment, skipping Discord auth');
                return false;
            }

            // Check for existing session
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session) {
                this.session = session;
                this.user = session.user;
                this.isAuthenticated = true;
                console.log('Existing Supabase session found');
                return true;
            }

            // Try to authenticate with Discord
            return await this.authenticateWithDiscord();
        } catch (error) {
            console.error('Discord auth initialization failed:', error);
            return false;
        }
    }

    /**
     * Authenticate user with Discord and create Supabase session
     */
    async authenticateWithDiscord() {
        try {
            // Get Discord user info first
            const discordUser = await this.discordSDK.commands.getUser();
            if (!discordUser) {
                throw new Error('Failed to get Discord user');
            }

            console.log('Discord user obtained:', discordUser.username);

            // In Discord activities, we can't use OAuth redirects due to CSP
            // So we'll create an anonymous session with Discord user data
            if (this.isDiscordActivity) {
                return await this.createAnonymousSession();
            }

            // Try Supabase Discord OAuth for non-Discord environments
            try {
                const { data, error } = await this.supabase.auth.signInWithOAuth({
                    provider: 'discord',
                    options: {
                        redirectTo: this.redirectUri,
                        scopes: 'identify email'
                    }
                });

                if (error) {
                    throw error;
                }

                // This will redirect, so we won't reach here in normal flow
                console.log('Discord OAuth initiated');
                return true;
            } catch (oauthError) {
                console.warn('Discord OAuth failed, trying alternative method:', oauthError);
                
                // Fallback to anonymous session
                return await this.createAnonymousSession();
            }
        } catch (error) {
            console.error('Discord authentication failed:', error);
            
            // Fallback: create anonymous session with Discord user data
            return await this.createAnonymousSession();
        }
    }

    /**
     * Create an anonymous session for Discord users when OAuth fails
     */
    async createAnonymousSession() {
        try {
            const discordUser = await this.discordSDK.commands.getUser();
            
            // Sign in anonymously with Discord user metadata
            const { data, error } = await this.supabase.auth.signInAnonymously({
                options: {
                    data: {
                        discord_id: discordUser.id,
                        discord_username: discordUser.username,
                        discord_discriminator: discordUser.discriminator,
                        discord_global_name: discordUser.global_name,
                        avatar_url: discordUser.avatar ? 
                            `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : 
                            null,
                        provider: 'discord_anonymous'
                    }
                }
            });

            if (error) {
                throw error;
            }

            this.session = data.session;
            this.user = data.user;
            this.isAuthenticated = true;

            console.log('Anonymous session created with Discord data for user:', discordUser.username);
            return true;
        } catch (error) {
            console.error('Failed to create anonymous session:', error);
            return false;
        }
    }

    /**
     * Handle OAuth callback (for when user returns from Discord OAuth)
     */
    async handleOAuthCallback() {
        try {
            const { data, error } = await this.supabase.auth.getSessionFromUrl();
            
            if (error) {
                throw error;
            }

            if (data.session) {
                this.session = data.session;
                this.user = data.session.user;
                this.isAuthenticated = true;
                console.log('OAuth callback successful');
                return true;
            }

            return false;
        } catch (error) {
            console.error('OAuth callback failed:', error);
            return false;
        }
    }

    /**
     * Sign out user
     */
    async signOut() {
        try {
            await this.supabase.auth.signOut();
            this.session = null;
            this.user = null;
            this.isAuthenticated = false;
            console.log('User signed out');
        } catch (error) {
            console.error('Sign out failed:', error);
        }
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * Get current session
     */
    getCurrentSession() {
        return this.session;
    }

    /**
     * Check if user is authenticated
     */
    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    /**
     * Get Discord user info from session metadata
     */
    getDiscordUserInfo() {
        if (this.user?.user_metadata) {
            return {
                discord_id: this.user.user_metadata.discord_id,
                username: this.user.user_metadata.discord_username || this.user.user_metadata.user_name,
                discriminator: this.user.user_metadata.discord_discriminator,
                global_name: this.user.user_metadata.discord_global_name || this.user.user_metadata.full_name,
                avatar_url: this.user.user_metadata.avatar_url
            };
        }
        return null;
    }

    /**
     * Listen for auth state changes
     */
    onAuthStateChange(callback) {
        return this.supabase.auth.onAuthStateChange((event, session) => {
            this.session = session;
            this.user = session?.user || null;
            this.isAuthenticated = !!session;
            callback(event, session);
        });
    }
}