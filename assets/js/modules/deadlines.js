const Deadlines = {
  getAll() {
    return Storage.get(Storage.KEYS.DEADLINES) || [];
  },

  getById(id) {
    const deadlines = this.getAll();
    return deadlines.find(d => d.id === id);
  },

  create(data) {
    const deadlines = this.getAll();
    const newDeadline = {
      id: 'deadline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: data.name,
      categoryId: data.categoryId || null,
      startDate: data.startDate || null,
      endDate: data.endDate,
      notes: data.notes || '',
      status: data.status || 'a_iniciar'
    };
    deadlines.push(newDeadline);
    Storage.set(Storage.KEYS.DEADLINES, deadlines);
    return newDeadline;
  },

  update(id, data) {
    const deadlines = this.getAll();
    const index = deadlines.findIndex(d => d.id === id);
    if (index === -1) return null;
    deadlines[index] = { ...deadlines[index], ...data };
    Storage.set(Storage.KEYS.DEADLINES, deadlines);
    return deadlines[index];
  },

  delete(id) {
    const deadlines = this.getAll().filter(d => d.id !== id);
    Storage.set(Storage.KEYS.DEADLINES, deadlines);
  },

  getDaysRemaining(endDate) {
    if (!endDate) return null;
    const end = new Date(endDate + 'T00:00:00');
    const today = new Date(UI.getToday() + 'T00:00:00');
    const diff = end - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  },

  getStatus(endDate) {
    if (!endDate) return 'none';
    const days = this.getDaysRemaining(endDate);
    if (days < 0) return 'overdue';
    if (days <= 3) return 'warning';
    return 'ontrack';
  },

  render() {
    const container = document.getElementById('deadlinesList');
    const deadlines = this.getAll();
    const categories = Categories.getAll();

    if (deadlines.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect></svg>
          </div>
          <p class="empty-title">Nenhum prazo</p>
          <p class="empty-text">Clique em "Novo Prazo" para começar</p>
        </div>
      `;
      return;
    }

    const sortedDeadlines = [...deadlines].sort((a, b) => {
      if (a.endDate && b.endDate) return a.endDate.localeCompare(b.endDate);
      return 0;
    });

    container.innerHTML = sortedDeadlines.map(dl => {
      const category = categories.find(c => c.id === dl.categoryId);
      const catColor = category ? category.color : '#6366f1';
      const catName = category ? category.name : 'Sem categoria';
      const daysRemaining = this.getDaysRemaining(dl.endDate);
      const status = this.getStatus(dl.endDate);
      const statusLabel = UI.getStatusLabel(dl.status);
      const statusColor = UI.getStatusColor(dl.status);

      let deadlineDisplay = '';
      if (daysRemaining !== null) {
        if (daysRemaining < 0) {
          deadlineDisplay = `🔴 Atrasado (${Math.abs(daysRemaining)} dias)`;
        } else if (daysRemaining === 0) {
          deadlineDisplay = `🔴 Vence hoje`;
        } else if (daysRemaining === 1) {
          deadlineDisplay = `🟡 Vence amanhã`;
        } else if (daysRemaining <= 3) {
          deadlineDisplay = `🟡 Vence em ${daysRemaining} dias`;
        } else {
          deadlineDisplay = `🟢 Vence em ${daysRemaining} dias`;
        }
      }

      return `
        <div class="task-item" data-id="${dl.id}" onclick="App.viewDeadline('${dl.id}')">
          <div class="task-content">
            <div class="task-title">${UI.escapeHtml(dl.name)}</div>
            <div class="task-meta">
              ${category ? `<span class="task-category" style="background:${catColor}20; color:${catColor}">${category.icon} ${UI.escapeHtml(catName)}</span>` : ''}
              <span class="task-category" style="background:${statusColor}20; color:${statusColor}">${UI.escapeHtml(statusLabel)}</span>
              ${dl.endDate ? `<span class="task-due">${deadlineDisplay}</span>` : ''}
            </div>
            ${dl.notes ? `<div class="task-description">${UI.escapeHtml(dl.notes)}</div>` : ''}
          </div>
          <div class="task-actions">
            <button class="task-action-btn" onclick="event.stopPropagation(); App.editDeadline('${dl.id}')" title="Editar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="task-action-btn delete" onclick="event.stopPropagation(); App.confirmDeleteDeadline('${dl.id}')" title="Excluir">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
};