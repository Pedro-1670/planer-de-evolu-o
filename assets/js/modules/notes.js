const Notes = {
  getAll() {
    return Storage.get(Storage.KEYS.NOTES) || [];
  },

  saveAll(notes) {
    Storage.set(Storage.KEYS.NOTES, notes);
  },

  getById(id) {
    return this.getAll().find(n => n.id === id);
  },

  create(data) {
    const notes = this.getAll();
    const newNote = {
      id: 'note_' + Date.now(),
      title: data.title,
      content: data.content || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    notes.unshift(newNote);
    this.saveAll(notes);
    return newNote;
  },

  update(id, data) {
    const notes = this.getAll();
    const index = notes.findIndex(n => n.id === id);
    if (index === -1) return null;
    notes[index] = { ...notes[index], ...data, updatedAt: new Date().toISOString() };
    this.saveAll(notes);
    return notes[index];
  },

  delete(id) {
    const notes = this.getAll().filter(n => n.id !== id);
    this.saveAll(notes);
  },

  render() {
    const container = document.getElementById('notesGrid');
    const notes = this.getAll();

    if (notes.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <p class="empty-title">Nenhuma nota</p>
          <p class="empty-text">Escreva sua primeira nota</p>
        </div>
      `;
      return;
    }

    container.innerHTML = notes.map(note => {
      const preview = note.content.length > 120 ? note.content.substring(0, 120) + '...' : note.content;
      const date = new Date(note.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      return `
        <div class="note-card" onclick="App.viewNote('${note.id}')">
          <div class="note-card-actions">
            <button class="task-action-btn" onclick="event.stopPropagation(); App.editNote('${note.id}')" title="Editar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="task-action-btn delete" onclick="event.stopPropagation(); App.confirmDeleteNote('${note.id}')" title="Excluir">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
          <div class="note-card-title">${UI.escapeHtml(note.title)}</div>
          <div class="note-card-preview">${UI.escapeHtml(preview) || '<em style="color:var(--text-muted)">Sem conteúdo</em>'}</div>
          <div class="note-card-date">${date}</div>
        </div>
      `;
    }).join('');
  }
};
