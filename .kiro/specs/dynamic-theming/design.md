# Design Document

## Overview

The dynamic theming system will extract color values from the existing style.css file and create a modular theme architecture. The system will use CSS custom properties (CSS variables) to enable runtime theme switching without page reloads. The architecture will consist of theme definition files, a theme manager service, and a user interface for theme selection.

## Architecture

### Theme Structure
- **Theme Files**: CSS files containing CSS custom property definitions for each theme
- **Base Variables**: Core CSS custom properties that all themes implement
- **Theme Manager**: TypeScript service that handles theme loading and switching
- **Theme UI**: Interface component for theme selection and preview

### File Organization
```
public/assets/themes/
├── base-variables.css    # Base CSS custom properties structure
├── default.css          # Default theme extracted from current colors
└── [future-themes].css  # Additional themes (e.g., dark.css, light.css)

src/lib/
└── theme-manager.ts      # Theme management service

src/modals/
└── theme-selector.ts     # Theme selection modal
```

## Components and Interfaces

### Theme CSS Structure
Each theme CSS file will define the same set of CSS custom properties:
```css
/* Example: default.css */
:root {
  /* Background colors */
  --color-body-background: #eee;
  --color-outliner-background: #fff;
  --color-modal-background: #fff;
  
  /* Text colors */
  --color-primary-text: #222;
  --color-secondary-text: #aaa;
  --color-link: #098bd9;
  --color-link-visited: #b26be4;
  
  /* Interactive states */
  --color-cursor-background: #000;
  --color-cursor-text: #fff;
  --color-selected-background: #000;
  --color-selected-text: #fff;
  
  /* UI elements */
  --color-border: #ddd;
  --color-button-background: #eee;
  --color-button-hover: #f4f4f4;
  
  /* Specialized elements */
  --color-date-header-background: #547883;
  --color-table-header-background: #666;
  --color-strikethrough: #808080;
  --color-code-background: #eee;
}
```

### Theme Metadata Structure
Theme metadata will be embedded in CSS file headers using comments:
```css
/*
name: Default Theme
author: Original Author
version: 1.0.0
description: The original color scheme extracted from style.css
*/

:root {
  /* CSS custom properties... */
}
```

### Theme Metadata Interface
```typescript
interface ThemeInfo {
  name: string;
  author?: string;
  version?: string;
  description?: string;
  filename: string;
}
```

### Theme Manager Service
```typescript
class ThemeManager {
  private currentTheme: string;
  private availableThemes: ThemeInfo[];
  private currentThemeLink: HTMLLinkElement | null;
  
  async loadTheme(themeName: string): Promise<void>
  async switchTheme(themeName: string): Promise<void>
  getCurrentTheme(): string
  getAvailableThemes(): ThemeInfo[]
  private loadThemeCSS(filename: string): Promise<void>
  private removeCurrentTheme(): void
  private parseThemeMetadata(cssContent: string): ThemeInfo
  private discoverAvailableThemes(): Promise<ThemeInfo[]>
  private persistThemePreference(themeName: string): void
  private loadThemePreference(): string
}
```

## Data Models

### Theme Storage
- **Location**: `public/assets/themes/` directory
- **Format**: CSS files with CSS custom property definitions
- **Naming**: `{theme-name}.css` (e.g., `default.css`, `dark.css`)

### Theme Loading Mechanism
- **Dynamic Loading**: Themes loaded by injecting `<link>` elements into document head
- **Theme Switching**: Remove previous theme link and add new theme link
- **CSS Cascade**: Theme CSS custom properties override base styles automatically
- **Metadata Parsing**: Fetch theme CSS files to extract metadata from header comments
- **Theme Discovery**: Scan themes directory for available CSS files and parse their metadata

### Theme Persistence
- **Storage**: localStorage
- **Key**: `outliner-theme-preference`
- **Value**: Theme name string

## Error Handling

### Theme Loading Failures
- **Fallback**: Always fall back to default theme if requested theme fails to load
- **CSS Load Detection**: Monitor link element load/error events
- **User Feedback**: Display error messages for failed theme operations

### Missing Theme Files
- **Detection**: Handle CSS file 404 errors gracefully
- **Recovery**: Provide list of available themes if requested theme is missing
- **Logging**: Log theme-related errors for debugging

### CSS Variable Support
- **Browser Compatibility**: Detect CSS custom property support
- **Graceful Degradation**: Fall back to static CSS if variables not supported
- **Progressive Enhancement**: Enhance experience for modern browsers

## Testing Strategy

### Unit Tests
- **Theme Manager**: Test theme loading, switching, and persistence
- **CSS Loading**: Test dynamic CSS file loading and error handling
- **Theme Detection**: Test available theme discovery

### Integration Tests
- **Theme Switching**: Test complete theme switching workflow
- **UI Integration**: Test theme selector modal functionality
- **Persistence**: Test theme preference saving and loading

### Visual Testing
- **Theme Consistency**: Verify all UI elements update correctly with theme changes
- **Color Contrast**: Ensure accessibility standards are met for all themes
- **Interactive States**: Test hover, selected, and cursor states across themes

### Browser Compatibility
- **CSS Variables**: Test in browsers with and without CSS custom property support
- **Theme Persistence**: Test localStorage functionality across browsers
- **Performance**: Measure theme switching performance impact