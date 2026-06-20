const Profile = {
  getAll() {
    return Storage.get(Storage.KEYS.PROFILE) || null;
  },

  get() {
    const current = this.getAll();
    if (current && current.name && !current.agendaName) {
      current.agendaName = 'Minha Agenda';
      Storage.set(Storage.KEYS.PROFILE, current);
    }
    return current;
  },

  ensureDefault() {
    const current = this.get();
    if (current && current.name) return current;

    const suggestedAvatar = 'U';
    const name = prompt('Qual é o seu nome?') || 'Visitante';
    const avatarInput = prompt('Avatar opcional (1 letra ou emoji):', suggestedAvatar);
    const agendaNameInput = prompt('Qual nome você quer dar para sua agenda?', 'Minha Agenda');
    const profile = {
      name: name.trim() || 'Visitante',
      avatar: avatarInput ? avatarInput.trim() : suggestedAvatar,
      agendaName: agendaNameInput ? agendaNameInput.trim() : 'Minha Agenda'
    };

    Storage.set(Storage.KEYS.PROFILE, profile);
    return profile;
  },

  update(data) {
    const cur = this.ensureDefault();
    const next = {
      ...cur,
      name: (data && data.name ? String(data.name) : cur.name),
      avatar: (data && data.avatar ? String(data.avatar) : cur.avatar),
      agendaName: (data && data.agendaName ? String(data.agendaName) : cur.agendaName || 'Minha Agenda')
    };
    Storage.set(Storage.KEYS.PROFILE, next);
    return next;
  }
};

