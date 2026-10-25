// Study zone: question editor (teachers / students) and the quiz runner (practice and proctored tests).

const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content ?? '';

async function post(url, body) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrf(), 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify(body ?? {}),
        credentials: 'same-origin',
        keepalive: true,
    });
    if (res.status === 419) { location.reload(); throw new Error('expired'); }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
}
window.studyPost = post;

export function questionEditor(cfg) {
    return {
        type: cfg.type || 'single',
        subject: cfg.subject || '',
        topic: cfg.topic || '',
        topics: cfg.topics || {},
        options: cfg.options && cfg.options.length ? cfg.options : [],
        init() {
            if (!this.options.length) this.reset();
            this.$watch('type', (t, old) => {
                if (t === 'single') {
                    let seen = false;
                    this.options.forEach(o => { if (o.correct && !seen) seen = true; else o.correct = false; });
                }
                if (t === 'fill_blank' && old !== 'fill_blank') this.options = this.options.filter(o => o.correct && o.text).concat(this.options.some(o => o.correct && o.text) ? [] : [{ text: '', correct: true }]);
                if (t !== 'fill_blank' && t !== 'true_false' && this.options.length < 4) this.reset(true);
            });
            this.$watch('subject', () => { if (!(this.topics[this.subject] || []).some(t => String(t.id) === this.topic)) this.topic = ''; });
        },
        reset(keep) {
            const base = keep ? this.options.filter(o => o.text) : [];
            const want = this.type === 'fill_blank' ? 1 : 6;
            if (!base.some(o => o.correct) && this.type !== 'fill_blank') base.unshift({ text: '', correct: true });
            while (base.length < want) base.push({ text: '', correct: this.type === 'fill_blank' });
            this.options = base;
        },
        add() { this.options.push({ text: '', correct: this.type === 'fill_blank' }); },
        mark(i, on) {
            if (this.type === 'single') this.options.forEach((o, j) => (o.correct = j === i));
            else this.options[i].correct = on;
        },
    };
}

export function quizRunner(cfg) {
    return {
        questions: cfg.questions,
        mode: cfg.mode,
        idx: 0,
        answers: {},
        typed: {},
        checked: {},
        flagged: {},
        saving: false,
        savedAt: null,
        timeLeft: cfg.secondsLeft,
        warnings: cfg.warnings || 0,
        maxWarnings: cfg.maxWarnings ?? 1,
        warnOpen: false,
        confirmOpen: false,
        ended: false,
        submitting: false,
        offline: false,
        since: Date.now(),
        letters: 'ABCDEFGHIJKL',

        init() {
            this.questions.forEach(q => {
                this.answers[q.id] = Array.isArray(q.answer) ? q.answer.map(String) : [];
                if (q.type === 'fill_blank') this.typed[q.id] = this.answers[q.id][0] || '';
                if (q.checked) this.checked[q.id] = q.checked;
            });
            const firstOpen = this.questions.findIndex(q => !this.answered(q));
            this.idx = firstOpen > 0 ? firstOpen : 0;
            if (this.timeLeft !== null) {
                this.tick = setInterval(() => {
                    this.timeLeft = Math.max(0, this.timeLeft - 1);
                    if (this.timeLeft === 0) { clearInterval(this.tick); this.finish(true); }
                }, 1000);
            }
            if (this.mode === 'test') this.proctor();
            addEventListener('online', () => (this.offline = false));
            addEventListener('offline', () => (this.offline = true));
            addEventListener('keydown', e => {
                if (e.target.matches('input, textarea')) return;
                if (e.key === 'ArrowRight') this.go(this.idx + 1);
                if (e.key === 'ArrowLeft') this.go(this.idx - 1);
            });
        },

        proctor() {
            this.beat = setInterval(() => this.heartbeat(), 15000);
            document.addEventListener('visibilitychange', () => {
                if (this.submitting || this.ended) return;
                if (document.visibilityState === 'hidden') {
                    post(cfg.urls.warn, { what: 'hidden' }).then(r => this.handle(r)).catch(() => {});
                    this.warnings++;
                } else {
                    this.warnOpen = true;
                    this.heartbeat();
                }
            });
            // Closing or reloading the page ends the test.
            addEventListener('beforeunload', e => {
                if (this.submitting || this.ended) return;
                e.preventDefault();
                e.returnValue = '';
            });
            addEventListener('pagehide', () => {
                if (this.submitting || this.ended) return;
                const fd = new FormData();
                fd.append('_token', csrf());
                fd.append('what', 'closed');
                navigator.sendBeacon(cfg.urls.warn, fd);
            });
            history.pushState(null, '', location.href);
            addEventListener('popstate', () => { history.pushState(null, '', location.href); this.warnOpen = true; });
        },

        heartbeat() {
            post(cfg.urls.heartbeat).then(r => {
                this.offline = false;
                if (r.seconds_left !== undefined && r.seconds_left !== null) this.timeLeft = r.seconds_left;
                if (r.warnings !== undefined) this.warnings = r.warnings;
                this.handle(r);
            }).catch(() => (this.offline = true));
        },

        handle(r) {
            if (r && r.ended) {
                this.ended = true;
                location.href = r.redirect;
            }
        },

        get q() { return this.questions[this.idx]; },
        get answeredCount() { return this.questions.filter(q => this.answered(q)).length; },
        answered(q) { return (this.answers[q.id] || []).length > 0; },
        isOn(q, id) { return (this.answers[q.id] || []).includes(String(id)); },
        locked(q) { return !!this.checked[q.id]; },

        go(i) {
            if (i < 0 || i >= this.questions.length || i === this.idx) return;
            this.flushTyped();
            this.idx = i;
            this.since = Date.now();
            this.$nextTick(() => document.getElementById('qtop')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
        },

        choose(q, id) {
            if (this.locked(q)) return;
            id = String(id);
            const cur = this.answers[q.id] || [];
            this.answers[q.id] = q.type === 'multi' ? (cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]) : [id];
            this.save(q);
        },

        typeAnswer(q) {
            if (this.locked(q)) return;
            clearTimeout(this.typeTimer);
            this.answers[q.id] = this.typed[q.id].trim() ? [this.typed[q.id].trim()] : [];
            this.typeTimer = setTimeout(() => this.save(q), 700);
        },
        flushTyped() { if (this.typeTimer) { clearTimeout(this.typeTimer); this.typeTimer = null; this.save(this.q); } },

        async save(q, check = false) {
            const seconds = Math.round((Date.now() - this.since) / 1000);
            this.since = Date.now();
            this.saving = true;
            try {
                const r = await post(cfg.urls.answer, { question_id: q.id, answer: this.answers[q.id], seconds, check });
                this.offline = false;
                this.savedAt = new Date();
                if (r.checked) this.checked[q.id] = r.checked;
                this.handle(r);
                return r;
            } catch (e) {
                this.offline = true;
            } finally {
                this.saving = false;
            }
        },

        async check(q) {
            if (!this.answered(q) || this.locked(q)) return;
            await this.save(q, true);
        },

        optState(q, id) {
            const c = this.checked[q.id];
            if (!c) return {};
            const right = c.right_ids.map(String).includes(String(id));
            return right ? { 'data-right': '' } : (this.isOn(q, id) ? { 'data-wrong': '' } : {});
        },

        clock() {
            if (this.timeLeft === null) return '';
            const t = this.timeLeft, h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
            return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0');
        },

        finish(auto = false) {
            this.flushTyped();
            if (!auto && this.answeredCount < this.questions.length && !this.confirmOpen) { this.confirmOpen = true; return; }
            this.submitting = true;
            clearInterval(this.beat);
            this.$refs.submitForm.submit();
        },
    };
}
