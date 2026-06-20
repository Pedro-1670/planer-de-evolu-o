const Categories = {
  getAll() {
    return Storage.get(Storage.KEYS.CATEGORIES) || [
      { id: 'cat_default_1', name: 'Estudos', color: '#6366f1', icon: '📚' },
      { id: 'cat_default_2', name: 'Trabalho', color: '#3b82f6', icon: '💼' },
      { id: 'cat_default_3', name: 'Saúde', color: '#10b981', icon: '💪' },
      { id: 'cat_default_4', name: 'Casa', color: '#f59e0b', icon: '🏠' },
      { id: 'cat_default_5', name: 'Finanças', color: '#8b5cf6', icon: '💰' }
    ];
  },

  saveAll(categories) {
    Storage.set(Storage.KEYS.CATEGORIES, categories);
  },

  getById(id) {
    return this.getAll().find(c => c.id === id);
  },

  create(data) {
    const categories = this.getAll();
    const newCat = {
      id: 'cat_' + Date.now(),
      name: data.name,
      color: data.color || '#6366f1',
      icon: data.icon || '📁'
    };
    categories.push(newCat);
    this.saveAll(categories);
    return newCat;
  },

  update(id, data) {
    const categories = this.getAll();
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) return null;
    categories[index] = { ...categories[index], ...data };
    this.saveAll(categories);
    return categories[index];
  },

  delete(id) {
    const categories = this.getAll().filter(c => c.id !== id);
    this.saveAll(categories);
  },

  getTaskCount(categoryId) {
    const tasks = Tasks.getAll().map(t => Tasks.normalizeTask(t));
    return tasks.filter(t => (t.categoryId === categoryId || t.category === categoryId) && !t.completed).length;
  },

  render() {
    const container = document.getElementById('categoriesGrid');
    const categories = this.getAll();

    if (categories.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <p class="empty-title">Nenhuma categoria</p>
          <p class="empty-text">Crie sua primeira categoria</p>
        </div>
      `;
      return;
    }

    container.innerHTML = categories.map(cat => {
      const count = this.getTaskCount(cat.id);
      return `
        <div class="category-card" onclick="App.filterByCategory('${cat.id}')">
          <div class="category-actions">
            <button class="task-action-btn" onclick="event.stopPropagation(); App.editCategory('${cat.id}')" title="Editar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="task-action-btn delete" onclick="event.stopPropagation(); App.confirmDeleteCategory('${cat.id}')" title="Excluir">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
          <div class="category-icon">${cat.icon}</div>
          <div class="category-name">${UI.escapeHtml(cat.name)}</div>
          <div class="category-count">${count} tarefa${count !== 1 ? 's' : ''} pendente${count !== 1 ? 's' : ''}</div>
        </div>
      `;
    }).join('');
  }
};
