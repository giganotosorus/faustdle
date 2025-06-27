/**
 * Discord Proxy Utility for handling Supabase requests in Discord activities
 * Routes requests through Discord's proxy to bypass CSP restrictions
 */
export class DiscordProxy {
    constructor(discordSDK) {
        this.discordSDK = discordSDK;
        this.isDiscordActivity = window.location.href.includes('discordsays.com');
        this.discordAppId = '1351722811718373447';
    }

    /**
     * Make a proxied request through Discord's proxy system
     */
    async fetch(url, options = {}) {
        if (!this.isDiscordActivity || !this.discordSDK) {
            // Not in Discord, use regular fetch
            return fetch(url, options);
        }

        try {
            console.log('Making proxied request to:', url);
            
            // Use Discord SDK's fetch method if available
            if (this.discordSDK.commands && this.discordSDK.commands.fetch) {
                console.log('Using Discord SDK fetch');
                return await this.discordSDK.commands.fetch(url, options);
            }
            
            // Fallback: try to use the proxy URL format
            const proxyUrl = this.getProxyUrl(url);
            console.log('Using proxy URL:', proxyUrl);
            
            const response = await fetch(proxyUrl, {
                ...options,
                headers: {
                    ...options.headers,
                    'X-Discord-Proxy': 'true'
                }
            });

            console.log('Proxy response:', response.status, response.statusText);
            return response;
        } catch (error) {
            console.error('Discord proxy request failed:', error);
            
            // Last resort: try direct fetch (will likely fail due to CSP)
            console.warn('Attempting direct fetch as fallback');
            return fetch(url, options);
        }
    }

    /**
     * Convert a regular URL to a Discord proxy URL
     * Discord proxy format: https://[app-id].discordsays.com/.proxy/[base64-encoded-url]
     */
    getProxyUrl(originalUrl) {
        try {
            // Remove protocol and encode the URL
            const urlWithoutProtocol = originalUrl.replace(/^https?:\/\//, '');
            const encodedUrl = btoa(urlWithoutProtocol);
            return `https://${this.discordAppId}.discordsays.com/.proxy/${encodedUrl}`;
        } catch (error) {
            console.error('Failed to create proxy URL:', error);
            return originalUrl;
        }
    }

    /**
     * Check if we're in a Discord activity environment
     */
    isInDiscord() {
        return this.isDiscordActivity;
    }
}