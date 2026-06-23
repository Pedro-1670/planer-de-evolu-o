const Templates = {
  KEYS: {
    TEMPLATES: 'personalos_templates'
  },

  getAll() {
    return Storage.get(this.KEYS.TEMPLATES) || [];
  },

  getById(id) {
    return this.getAll().find(t => t.id === id);
  },

  create(data) {
    const templates = this.getAll();
    const newTemplate = {
      id: 'tpl_' + Date.now(),
      name: data.name || '',
      description: data.description || '',
      tasks: (data.tasks || '').split('\n').map(t => t.trim()).filter(t => t.length > 0),
      createdAt: new Date().toISOString()
    };
    templates.unshift(newTemplate);
    Storage.set(this.KEYS.TEMPLATES, templates);
    return newTemplate;
  },

  update(id, data) {
    const templates = this.getAll();
    const index = templates.findIndex(t => t.id === id);
    if (index === -1) return null;
    const taskList = typeof data.tasks === 'string' 
      ? data.tasks.split('\n').map(t => t.trim()).filter(t => t.length > 0)
      : data.tasks;
    templates[index] = {
      ...templates[index],
      name: data.name || templates[index].name,
      description: data.description || templates[index].description,
      tasks: taskList
    };
    Storage.set(this.KEYS.TEMPLATES, templates);
    return templates[index];
  },

  delete(id) {
    const templates = this.getAll().filter(t => t.id !== id);
    Storage.set(this.KEYS.TEMPLATES, templates);
  },

  applyToScope(templateId, scope) {
    const template = this.getById(templateId);
    if (!template) return;

    const categories = Categories.getAll();
    const defaultCat = categories[0] || { id: null, name: '', color: '#6b7280', icon: '📁' };

    template.tasks.forEach(taskTitle => {
      Tasks.create({
        title: taskTitle,
        categoryId: defaultCat.id,
        category: defaultCat.name,
        scope: scope,
        period: scope === 'semanal' ? 'weekly' : scope === 'mensal' ? 'monthly' : 'daily',
        priority: 'media',
        recurrence: 'once'
      });
    });
  },

  render() {
    const container = document.getElementById('templatesGrid');
    const templates = this.getAll();

    if (templates.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <p class="empty-title">Nenhum template</p>
          <p class="empty-text">Crie seu primeiro template de rotina</p>
        </div>
      `;
      return;
    }

    container.innerHTML = templates.map(tpl => `
      <div class="template-card">
        <div class="template-actions">
          <button class="task-action-btn" onclick="event.stopPropagation(); App.openTemplateModal('${tpl.id}')" title="Editar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="task-action-btn delete" onclick="event.stopPropagation(); App.confirmDeleteTemplate('${tpl.id}')" title="Excluir">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
        <h3 class="template-name">${UI.escapeHtml(tpl.name)}</h3>
        ${tpl.description ? `<p class="template-desc">${UI.escapeHtml(tpl.description)}</p>` : ''}
        <p class="template-count">${tpl.tasks.length} tarefa${tpl.tasks.length !== 1 ? 's' : ''}</p>
        <div class="template-apply">
          <button class="btn btn-secondary btn-sm" onclick="Templates.applyToScope('${tpl.id}', 'diario')">Aplicar no Diário</button>
          <button class="btn btn-secondary btn-sm" onclick="Templates.applyToScope('${tpl.id}', 'semanal')">Semanal</button>
          <button class="btn btn-secondary btn-sm" onclick="Templates.applyToScope('${tpl.id}', 'mensal')">Mensal</button>
        </div>
      </div>
    `).join('');
  }
};
