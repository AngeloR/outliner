import { Modal } from '../lib/modal';
import { ThemeManager, ThemeInfo } from '../lib/theme-manager';

export class ThemeSelectorModal extends Modal {
  private themeManager: ThemeManager;
  private themes: ThemeInfo[];
  private currentTheme: string;

  constructor() {
    super({
      title: 'Select Theme',
      keyboardContext: 'theme-selector',
      escapeExitable: true
    });

    this.themeManager = ThemeManager.getInstance();
    this.themes = this.themeManager.getAvailableThemes();
    this.currentTheme = this.themeManager.getCurrentTheme();
  }

  renderModalContent(): string {
    return `
      <div class="theme-selector">
        <div class="theme-list">
          ${this.renderThemeList()}
        </div>
        <div class="theme-actions">
          <button id="apply-theme" class="primary">Apply</button>
          <button id="cancel-theme">Cancel</button>
        </div>
      </div>
    `;
  }

  private renderThemeList(): string {
    return this.themes.map(theme => {
      const isActive = theme.filename.replace('.css', '') === this.currentTheme;
      return `
        <div class="theme-item ${isActive ? 'active' : ''}" data-theme="${theme.filename.replace('.css', '')}">
          <div class="theme-info">
            <div class="theme-name">${theme.name}</div>
            ${theme.author ? `<div class="theme-author">by ${theme.author}</div>` : ''}
            ${theme.description ? `<div class="theme-description">${theme.description}</div>` : ''}
            ${theme.version ? `<div class="theme-version">v${theme.version}</div>` : ''}
          </div>
          <div class="theme-selection">
            <input type="radio" 
                   name="theme-selection" 
                   value="${theme.filename.replace('.css', '')}" 
                   ${isActive ? 'checked' : ''}>
          </div>
        </div>
      `;
    }).join('');
  }

  show() {
    super.show();
    this.bindEventListeners();
  }

  private bindEventListeners() {
    // Handle theme item clicks
    const themeItems = document.querySelectorAll('.theme-item');
    themeItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const themeName = target.dataset.theme;
        
        // Update radio button
        const radio = target.querySelector('input[type="radio"]') as HTMLInputElement;
        if (radio) {
          radio.checked = true;
        }

        // Update active state
        document.querySelectorAll('.theme-item').forEach(el => el.classList.remove('active'));
        target.classList.add('active');
      });
    });

    // Handle Apply button
    const applyBtn = document.getElementById('apply-theme');
    if (applyBtn) {
      applyBtn.addEventListener('click', async () => {
        const selectedRadio = document.querySelector('input[name="theme-selection"]:checked') as HTMLInputElement;
        if (selectedRadio) {
          const themeName = selectedRadio.value;
          try {
            await this.themeManager.switchTheme(themeName);
            this.currentTheme = themeName;
            this.emit('theme-changed', [themeName]);
            this.remove();
          } catch (error) {
            console.error('Failed to apply theme:', error);
            // Could show an error message here
          }
        }
      });
    }

    // Handle Cancel button
    const cancelBtn = document.getElementById('cancel-theme');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.remove();
      });
    }
  }

  async refreshThemeList() {
    this.themes = await this.themeManager.refreshThemeList();
    this.updateRender();
    this.bindEventListeners();
  }
}

export function openThemeSelector(): ThemeSelectorModal {
  const modal = new ThemeSelectorModal();
  modal.show();
  return modal;
}