import * as fs from '@tauri-apps/plugin-fs';
import { resolveResource } from '@tauri-apps/api/path';

export interface ThemeInfo {
    name: string;
    author?: string;
    version?: string;
    description?: string;
    filename: string;
}

export class ThemeManager {
    private static instance: ThemeManager | null = null;
    private currentTheme: string = 'default';
    private availableThemes: ThemeInfo[] = [];
    private currentThemeLink: HTMLLinkElement | null = null;
    private readonly STORAGE_KEY = 'outliner-theme-preference';
    private readonly THEMES_PATH = '/assets/themes/';
    private readonly THEMES_DIR = 'assets/themes';
    public readonly THEMES = [
        'default.css',
        'dark.css'
    ]

    private constructor() {}

    public static getInstance(): ThemeManager {
        if (!ThemeManager.instance) {
            ThemeManager.instance = new ThemeManager();
        }
        return ThemeManager.instance;
    }

    public async init(): Promise<void> {
        try {
            await this.discoverAvailableThemes();
            const savedTheme = this.loadThemePreference();
            await this.loadTheme(savedTheme || 'default');
            console.log(`Theme system initialized with theme: ${this.currentTheme}`);
        } catch (error) {
            console.error('Theme initialization failed, using fallback:', error);
            // Even if discovery fails, try to load default theme
            this.availableThemes = [{
                name: 'Default Theme',
                filename: 'default.css',
                description: 'The original color scheme'
            }];
            await this.loadTheme('default');
        }
    }

    public async loadTheme(themeName: string): Promise<void> {
        try {
            const themeInfo = this.availableThemes.find(t => 
                t.filename.replace('.css', '') === themeName
            );
            
            if (!themeInfo) {
                console.warn(`Theme "${themeName}" not found, falling back to default`);
                await this.loadThemeCSS('default.css');
                this.currentTheme = 'default';
                return;
            }

            await this.loadThemeCSS(themeInfo.filename);
            this.currentTheme = themeName;
            this.persistThemePreference(themeName);
        } catch (error) {
            console.error(`Failed to load theme "${themeName}":`, error);
            if (themeName !== 'default') {
                await this.loadTheme('default');
            }
        }
    }

    public async switchTheme(themeName: string): Promise<void> {
        this.removeCurrentTheme();
        await this.loadTheme(themeName);
    }

    public getCurrentTheme(): string {
        return this.currentTheme;
    }

    public getAvailableThemes(): ThemeInfo[] {
        return [...this.availableThemes];
    }

    public async refreshThemeList(): Promise<ThemeInfo[]> {
        await this.discoverAvailableThemes();
        return this.getAvailableThemes();
    }

    private async loadThemeCSS(filename: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // Remove any existing theme link first
            this.removeCurrentTheme();
            
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = `${this.THEMES_PATH}${filename}`;
            link.id = 'theme-stylesheet';
            
            link.onload = () => {
                this.currentThemeLink = link;
                console.log(`Theme CSS loaded successfully: ${filename}`);
                resolve();
            };
            
            link.onerror = (error) => {
                console.error(`Failed to load theme CSS: ${filename}`, error);
                document.head.removeChild(link);
                reject(new Error(`Failed to load theme CSS: ${filename}`));
            };
            
            document.head.appendChild(link);
        });
    }

    private removeCurrentTheme(): void {
        if (this.currentThemeLink) {
            this.currentThemeLink.remove();
            this.currentThemeLink = null;
        }
    }

    private parseThemeMetadata(cssContent: string): ThemeInfo {
        const metadataRegex = /\/\*\s*([\s\S]*?)\s*\*\//;
        const match = cssContent.match(metadataRegex);
        
        const metadata: Partial<ThemeInfo> = {
            filename: ''
        };
        
        if (match && match[1]) {
            const lines = match[1].split('\n');
            
            for (const line of lines) {
                const [key, ...valueParts] = line.split(':');
                if (key && valueParts.length > 0) {
                    const trimmedKey = key.trim().toLowerCase();
                    const value = valueParts.join(':').trim();
                    
                    switch (trimmedKey) {
                        case 'name':
                            metadata.name = value;
                            break;
                        case 'author':
                            metadata.author = value;
                            break;
                        case 'version':
                            metadata.version = value;
                            break;
                        case 'description':
                            metadata.description = value;
                            break;
                    }
                }
            }
        }
        
        if (!metadata.name) {
            const filename = metadata.filename || 'unknown';
            metadata.name = filename.replace('.css', '').replace(/-/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }
        
        return metadata as ThemeInfo;
    }

    private async discoverAvailableThemes(): Promise<ThemeInfo[]> {
        try {
            let themeFiles: string[] = [];
            
            // Try to use Tauri's file system API first
            try {
                const themesPath = await resolveResource(this.THEMES_DIR);
                const entries = await fs.readDir(themesPath);
                
                // Filter for CSS files
                themeFiles = entries
                    .filter(entry => !entry.isDirectory && entry.name?.endsWith('.css'))
                    .map(entry => entry.name as string);
                
                console.log('Discovered theme files via Tauri:', themeFiles);
            } catch (tauriError) {
                // Fallback to fetching known themes if Tauri file system isn't available
                // This handles both development mode and web-only contexts
                console.log('Tauri file system not available, using fallback method');
                themeFiles = await this.discoverThemesViaFetch();
            }
            
            const themes: ThemeInfo[] = [];
            
            for (const filename of themeFiles) {
                try {
                    let cssContent: string;
                    
                    // Try to read via Tauri first
                    try {
                        const cssPath = await resolveResource(`${this.THEMES_DIR}/${filename}`);
                        cssContent = await fs.readTextFile(cssPath);
                    } catch {
                        // Fallback to fetch if Tauri read fails
                        const response = await fetch(`${this.THEMES_PATH}${filename}`);
                        if (!response.ok) {
                            throw new Error(`Failed to fetch theme: ${filename}`);
                        }
                        cssContent = await response.text();
                    }
                    
                    const themeInfo = this.parseThemeMetadata(cssContent);
                    themeInfo.filename = filename;
                    
                    themes.push(themeInfo);
                } catch (error) {
                    console.warn(`Failed to parse theme ${filename}:`, error);
                    themes.push({
                        name: filename.replace('.css', '').replace(/-/g, ' ')
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' '),
                        filename: filename
                    });
                }
            }
            
            if (themes.length === 0) {
                themes.push({
                    name: 'Default Theme',
                    filename: 'default.css',
                    description: 'The original color scheme'
                });
            }
            
            this.availableThemes = themes;
            return themes;
        } catch (error) {
            console.error('Failed to discover themes:', error);
            this.availableThemes = [{
                name: 'Default Theme',
                filename: 'default.css',
                description: 'The original color scheme'
            }];
            return this.availableThemes;
        }
    }

    private async discoverThemesViaFetch(): Promise<string[]> {
        const availableThemes: string[] = [];
        
        for (const theme of this.THEMES) {
            try {
                const response = await fetch(`${this.THEMES_PATH}${theme}`, { method: 'HEAD' });
                if (response.ok) {
                    availableThemes.push(theme);
                }
            } catch {
                // Theme doesn't exist, skip it
            }
        }
        
        return availableThemes.length > 0 ? availableThemes : ['default.css'];
    }

    private persistThemePreference(themeName: string): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, themeName);
        } catch (error) {
            console.warn('Failed to save theme preference:', error);
        }
    }

    private loadThemePreference(): string | null {
        try {
            return localStorage.getItem(this.STORAGE_KEY);
        } catch (error) {
            console.warn('Failed to load theme preference:', error);
            return null;
        }
    }
}
