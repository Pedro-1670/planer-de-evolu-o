const Themes = {
  themes: [
    {
      id: 'midnight',
      name: 'Midnight',
      colors: ['#0a0a0b', '#161619', '#6366f1', '#6366f1']
    },
    {
      id: 'ocean',
      name: 'Ocean',
      colors: ['#0b1426', '#131f3a', '#3b82f6', '#3b82f6']
    },
    {
      id: 'sage',
      name: 'Sage',
      colors: ['#f7f8f5', '#ffffff', '#6b8f71', '#6b8f71']
    },
    {
      id: 'lavender',
      name: 'Lavender',
      colors: ['#f8f7fc', '#ffffff', '#8b5cf6', '#8b5cf6']
    },
    {
      id: 'sand',
      name: 'Sand',
      colors: ['#faf8f4', '#ffffff', '#d97706', '#d97706']
    }
  ],

  getCurrent() {
    return Storage.get(Storage.KEYS.THEME) || 'midnight';
  },

  set(themeId) {
    Storage.set(Storage.KEYS.THEME, themeId);
    document.documentElement.setAttribute('data-theme', themeId);
    this.render();
  },

  render() {
    const container = document.getElementById('themeGrid');
    const current = this.getCurrent();

    container.innerHTML = this.themes.map(theme => `
      <div class="theme-option ${theme.id === current ? 'active' : ''}" 
           onclick="Themes.set('${theme.id}')">
        <div class="theme-preview" style="background: linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})">
          <div style="width:16px;height:16px;border-radius:50%;background:${theme.colors[2]};margin:12px;"></div>
        </div>
        <div class="theme-name">${theme.name}</div>
      </div>
    `).join('');
  }
};
