import Alpine from 'alpinejs';
import collapse from '@alpinejs/collapse';
import { questionEditor, quizRunner } from './learn';

window.Alpine = Alpine;
Alpine.plugin(collapse);

// Searchable institute picker used on student and admin forms.
Alpine.data('institutePicker', (config = {}) => ({
    query: config.initialLabel || '',
    selectedId: config.initialId || '',
    results: [],
    open: false,
    loading: false,
    active: -1,
    boardId: config.boardId || '',
    async search() {
        if (this.query.trim().length < 2) { this.results = []; this.open = false; return; }
        this.loading = true;
        const params = new URLSearchParams({ q: this.query, board: this.boardId || '' });
        try {
            const res = await fetch(`${config.url}?${params}`, { headers: { Accept: 'application/json' } });
            this.results = (await res.json()).data || [];
            this.open = true;
            this.active = this.results.length ? 0 : -1;
        } finally { this.loading = false; }
    },
    choose(item) {
        this.selectedId = item.id;
        this.query = item.label;
        this.open = false;
        this.$dispatch('institute-chosen', item);
    },
    key(e) {
        if (!this.open) return;
        if (e.key === 'ArrowDown') { this.active = Math.min(this.active + 1, this.results.length - 1); e.preventDefault(); }
        if (e.key === 'ArrowUp') { this.active = Math.max(this.active - 1, 0); e.preventDefault(); }
        if (e.key === 'Enter' && this.active >= 0) { this.choose(this.results[this.active]); e.preventDefault(); }
        if (e.key === 'Escape') { this.open = false; }
    },
}));

// Guided subject picker: keeps chosen subject ids, checks the rules live on the server.
Alpine.data('subjectPicker', (config = {}) => ({
    selected: new Set(config.selected || []),
    locked: new Set(config.locked || []),
    result: null,
    checking: false,
    timer: null,
    init() { this.check(); },
    has(id) { return this.selected.has(id); },
    toggle(id) {
        if (this.locked.has(id) || config.readonly) return;
        this.selected.has(id) ? this.selected.delete(id) : this.selected.add(id);
        this.selected = new Set(this.selected);
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.check(), 250);
    },
    get count() { return this.selected.size; },
    async check() {
        if (!config.checkUrl) return;
        this.checking = true;
        try {
            const res = await fetch(config.checkUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]').content },
                body: JSON.stringify({ subject_ids: [...this.selected] }),
            });
            this.result = await res.json();
        } finally { this.checking = false; }
    },
}));

// Image preview for photo / signature uploads.
Alpine.data('imageField', (initial = null) => ({
    preview: initial,
    pick(e) {
        const file = e.target.files[0];
        if (!file) return;
        this.preview = URL.createObjectURL(file);
    },
}));

Alpine.data('questionEditor', questionEditor);
Alpine.data('quizRunner', quizRunner);

Alpine.start();
