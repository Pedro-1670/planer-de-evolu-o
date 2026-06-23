const Storage = {
  KEYS: {
    TASKS: 'personalos_tasks',
    HISTORY: 'personalos_history',
    CATEGORIES: 'personalos_categories',
    HABITS: 'personalos_habits',
    GOALS: 'personalos_goals',
    NOTES: 'personalos_notes',
    THEME: 'personalos_theme',
    FOCUS: 'personalos_focus',
    PROFILE: 'personalos_profile'
  },

  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Storage get error:', e);
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage set error:', e);
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Storage remove error:', e);
    }
  },

  clear() {
    try {
      Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
    } catch (e) {
      console.error('Storage clear error:', e);
    }
  },
  
  clearHistory() {
    try {
      localStorage.removeItem(this.KEYS.HISTORY);
    } catch (e) {
      console.error('Storage clearHistory error:', e);
    }
  }
};
