/* ===========================
   Detail View Functions (js/detail.js)
   =========================== */

/* ---------- CLIENT DETAIL: shows list of ads/projects ---------- */

function renderAdsList(){
    const list = document.getElementById('adsList');
    if (!list || !currentClientId) return;
    const client = data.clients.find((entry) => entry.id === currentClientId);
    if (!client) return;

    list.innerHTML = '';
    if (!client.ads || client.ads.length === 0) {
        list.innerHTML = '<div class="empty">No ad campaigns logged yet.</div>';
        return;
    }

    const sortedAds = [...client.ads].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    sortedAds.forEach((ad) => {
        const project = data.projects.find((p) => p.id === ad.projectId);
        const latest = ad.statusHistory && ad.statusHistory.length
            ? [...ad.statusHistory].sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))[0]
            : null;

        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.style.cursor = 'pointer';
        item.innerHTML = `
            <div class="ttitle">${escapeHtml(ad.title || 'Untitled ad')}</div>
            <div class="tlink" style="color:var(--muted);">${project ? escapeHtml(project.name) : 'No project assigned'}</div>
            <div class="tdate">${latest ? statusName(latest.statusId) : 'No status logged'}${latest && latest.occurredAt ? ' · ' + latest.occurredAt : ''}</div>
        `;
        item.addEventListener('click', () => openAdDetail(ad.id));
        list.appendChild(item);
    });
}

function setupAddAd(){
    const form = document.getElementById('addAdForm');
    if (!form) return;

    const projectSelect = document.getElementById('ad-project');
    if (projectSelect) {
        projectSelect.innerHTML = '<option value="">No project</option>' +
            data.projects.map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!currentClientId) return;
        const client = data.clients.find((entry) => entry.id === currentClientId);
        if (!client) return;

        const title = document.getElementById('ad-title').value.trim();
        if (!title) return;

        const newAd = {
            id: `ad_${Date.now()}`,
            projectId: document.getElementById('ad-project').value || null,
            title,
            proof: document.getElementById('ad-proof').value.trim(),
            createdAt: new Date().toISOString().slice(0, 10),
            statusHistory: []
        };

        client.ads = client.ads || [];
        client.ads.push(newAd);
        saveData(data);
        event.target.reset();
        renderAdsList();
    });
}

/* ---------- CLIENT CONTACT / KEY DATES (unchanged logic) ---------- */

function renderContact(){
    const contactInfo = document.getElementById('contactInfo');
    if (!contactInfo || !currentClientId) return;
    const client = data.clients.find((entry) => entry.id === currentClientId);
    if (!client) return;

    contactInfo.innerHTML = `
        <div class="datefield"><span>Contact</span><span class="editable-contact" data-field="contact">${escapeHtml(client.contact || '—')}</span></div>
        <div class="datefield"><span>Info</span><span class="editable-contact" data-field="info">${escapeHtml(client.info || '—')}</span></div>
        <div class="datefield"><span>Note</span><span class="editable-contact" data-field="note">${escapeHtml(client.note || '—')}</span></div>
        <div class="datefield" style="margin-top:10px; border-bottom:none; justify-content:flex-end;">
            <button type="button" class="btn-secondary-outline btn-small" id="deleteClientBtn">Delete client</button>
        </div>
    `;

    contactInfo.querySelectorAll('.editable-contact').forEach((field) => {
        field.addEventListener('click', () => {
            const currentValue = field.textContent.trim();
            const nextValue = prompt('Update this field:', currentValue === '—' ? '' : currentValue);
            if (nextValue === null) return;
            const clientEntry = data.clients.find((entry) => entry.id === currentClientId);
            if (!clientEntry) return;
            clientEntry[field.getAttribute('data-field')] = nextValue.trim();
            saveData(data);
            renderContact();
            document.getElementById('d-sub').textContent = `${clientEntry.category || 'Client'} · ${clientEntry.contact || 'No contact name on file'}`;
        });
    });

    document.getElementById('deleteClientBtn')?.addEventListener('click', () => {
        const clientEntry = data.clients.find((entry) => entry.id === currentClientId);
        if (!clientEntry) return;
        if (!confirm(`Delete ${clientEntry.business || 'this client'}? This cannot be undone.`)) return;
        data.clients = (data.clients || []).filter((entry) => entry.id !== currentClientId);
        saveData(data);
        currentClientId = null;
        renderDirectory();
        renderDashboard();
        showView('directory');
    });
}

function renderKeyDates() {
    const keyDatesList = document.getElementById("keyDatesList");
    if (!keyDatesList || !currentClientId) return;

    const client = data.clients.find(entry => entry.id === currentClientId);
    if (!client) return;

    client.keyDates = client.keyDates || [];

    keyDatesList.innerHTML = "";

    // Existing key dates
    if (client.keyDates.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = "No key dates yet.";
        keyDatesList.appendChild(empty);
    } else {
        client.keyDates.forEach((keyDate, index) => {
            const row = document.createElement("div");
            row.className = "datefield";

            row.innerHTML = `
                <span class="utility editable-keydate-label" data-index="${index}">
                    ${escapeHtml(keyDate.label)}
                </span>

                <span class="utility editable-keydate-date" data-index="${index}">
                    ${keyDate.date}
                </span>
            `;

            keyDatesList.appendChild(row);
        });
    }

    // Add new key date form
    const form = document.createElement("form");
    form.id = "addKeyDateForm";
    form.style.marginTop = "15px";

    form.innerHTML = `
        <div class="field">
            <label>Title</label>
            <input type="text" id="newKeyDateTitle">
        </div>

        <div class="field">
            <label>Date</label>
            <input type="date" id="newKeyDateDate">
        </div>

        <button type="submit" class="btn-primary">
            Submit
        </button>
    `;

    keyDatesList.appendChild(form);

    // Submit new key date
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const label = document.getElementById("newKeyDateTitle").value.trim();
        const date = document.getElementById("newKeyDateDate").value;

        if (!label || !date) return;

        client.keyDates.push({
            label,
            date
        });

        saveData(data);
        renderKeyDates();
    });

    // Edit title
    keyDatesList.querySelectorAll(".editable-keydate-label").forEach(field => {
        field.addEventListener("click", () => {

            const index = Number(field.dataset.index);

            const value = prompt(
                "Key date title:",
                client.keyDates[index].label
            );

            if (value === null) return;

            client.keyDates[index].label = value.trim();

            saveData(data);
            renderKeyDates();
        });
    });

    // Edit date
    keyDatesList.querySelectorAll(".editable-keydate-date").forEach(field => {

        field.addEventListener("click", () => {

            const index = Number(field.dataset.index);

            const value = prompt(
                "Key date:",
                client.keyDates[index].date
            );

            if (value === null) return;

            client.keyDates[index].date = value;

            saveData(data);
            renderKeyDates();
        });

    });
}

function renderCampaignHistory(){ renderAdsList(); renderContact(); renderKeyDates(); }

function openDetail(id){
    currentClientId = id;
    currentAdId = null;
    const client = data.clients.find((entry) => entry.id === currentClientId);
    if (!client) return;
    document.getElementById('d-business').textContent = client.business;
    document.getElementById('d-sub').textContent = `${client.category || 'Client'} · ${client.contact || 'No contact name on file'}`;
    document.getElementById('addAdDetails').style.display = currentUser?.role === 'graphics' ? 'none' : '';
    setupAddAd();
    renderCampaignHistory();
    document.querySelectorAll('.view').forEach((view) => view.classList.remove('active'));
    document.getElementById('view-detail').classList.add('active');
    document.querySelectorAll('.nav-btn').forEach((button) => button.classList.remove('active'));
    document.querySelector('.nav-btn[data-view="directory"]')?.classList.add('active');
    document.getElementById('d-breadcrumb').textContent = `Clients > ${client.business}`;
}

function renderDetail(id){ openDetail(id); }
function goToClient(id){ if (!id) return; openDetail(id); }

/* ---------- AD DETAIL: the actual status timeline ---------- */

function renderAdStatusTimeline(){
    const list = document.getElementById('adStatusList');
    const client = data.clients.find((entry) => entry.id === currentClientId);
    const ad = client?.ads.find((entry) => entry.id === currentAdId);
    if (!list || !client || !ad) return;

    list.innerHTML = '';
    if (!ad.statusHistory || ad.statusHistory.length === 0) {
        list.innerHTML = '<div class="empty">No status touchpoints logged yet.</div>';
        return;
    }

    const sorted = [...ad.statusHistory].sort((a, b) => new Date(b.occurredAt || 0) - new Date(a.occurredAt || 0));

    sorted.forEach((entry) => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.innerHTML = `
            <div class="tdate">${entry.occurredAt || 'No date'}</div>
            <div class="ttitle">${escapeHtml(statusName(entry.statusId))}</div>
            ${entry.note ? `<div class="tlink">${escapeHtml(entry.note)}</div>` : ''}
            <div class="utility" style="font-size:11px;">${escapeHtml(entry.createdBy || '')}</div>
            <div class="timeline-actions">
                <button type="button" class="btn-secondary-outline btn-small" data-remove-status="${entry.id}">Remove</button>
            </div>
        `;
        list.appendChild(item);
    });

    list.querySelectorAll('[data-remove-status]').forEach((button) => {
        button.addEventListener('click', () => {
            const entryId = button.getAttribute('data-remove-status');
            const clientEntry = data.clients.find((c) => c.id === currentClientId);
            const adEntry = clientEntry?.ads.find((a) => a.id === currentAdId);
            if (!adEntry) return;
            if (!confirm('Remove this status touchpoint?')) return;

            adEntry.statusHistory = adEntry.statusHistory.filter((h) => h.id !== entryId);
            saveData(data);
            renderAdStatusTimeline();
        });
    });
}

function setupAddStatusEntry(){
    const form = document.getElementById('addStatusForm');
    if (!form) return;

    const statusSelect = document.getElementById('status-select');
    if (statusSelect) {
        statusSelect.innerHTML = STATUSES
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((s) => `<option value="${s.id}">${s.name}</option>`)
            .join('');
    }

    const dateField = document.getElementById('status-date');
    if (dateField && !dateField.value) {
        dateField.value = new Date().toISOString().slice(0, 10);
    }

    form.onsubmit = (event) => {
        event.preventDefault();
        const client = data.clients.find((entry) => entry.id === currentClientId);
        const ad = client?.ads.find((entry) => entry.id === currentAdId);
        if (!ad) return;

        const entry = {
            id: `h_${Date.now()}`,
            statusId: document.getElementById('status-select').value,
            note: document.getElementById('status-note').value.trim(),
            occurredAt: document.getElementById('status-date').value,
            createdBy: currentUser ? currentUser.name : 'Unknown'
        };

        ad.statusHistory = ad.statusHistory || [];
        ad.statusHistory.push(entry);
        saveData(data);
        event.target.reset();
        dateField.value = new Date().toISOString().slice(0, 10);
        renderAdStatusTimeline();
    };
}

function renderAdInfo(){
    const client = data.clients.find((entry) => entry.id === currentClientId);
    const ad = client?.ads.find((entry) => entry.id === currentAdId);
    const infoBox = document.getElementById('adInfoBox');
    if (!infoBox || !ad) return;

    const projectOptions = ['<option value="">No project</option>']
        .concat(data.projects.map((p) => `<option value="${p.id}" ${p.id === ad.projectId ? 'selected' : ''}>${escapeHtml(p.name)}</option>`))
        .join('');

    infoBox.innerHTML = `
        <span>Edit Ad</span>
        <div class="datefield">
            <span>Title</span>
            <span class="editable-ad" data-field="title">${escapeHtml(ad.title || '—')}</span>
        </div>
        <div class="datefield">
            <span>Project</span>
            <select id="ad-project-edit">${projectOptions}</select>
        </div>
        <div class="datefield">
            <span>Proof</span>
            <span class="editable-ad" data-field="proof">${escapeHtml(ad.proof || 'link_to_proof_example.pdf')}</span>
        </div>
        <div class="datefield" style="margin-top:10px; border-bottom:none; justify-content:flex-end;">
            <button type="button" class="btn-secondary-outline btn-small" id="deleteAdBtn">Delete ad</button>
        </div>
    `;

    infoBox.querySelectorAll('.editable-ad').forEach((field) => {
        field.addEventListener('click', () => {
            const currentValue = field.textContent.trim();
            const nextValue = prompt('Update this field:', currentValue === '—' ? '' : currentValue);
            if (nextValue === null) return;

            const clientEntry = data.clients.find((entry) => entry.id === currentClientId);
            const adEntry = clientEntry?.ads.find((entry) => entry.id === currentAdId);
            if (!adEntry) return;

            adEntry[field.getAttribute('data-field')] = nextValue.trim();
            saveData(data);
            renderAdInfo();
            document.getElementById('ad-title-header').textContent = adEntry.title;
        });
    });

    document.getElementById('ad-project-edit')?.addEventListener('change', (event) => {
        const clientEntry = data.clients.find((entry) => entry.id === currentClientId);
        const adEntry = clientEntry?.ads.find((entry) => entry.id === currentAdId);
        if (!adEntry) return;

        adEntry.projectId = event.target.value || null;
        saveData(data);

        const project = data.projects.find((p) => p.id === adEntry.projectId);
        document.getElementById('ad-sub').textContent = project ? project.name : 'No project assigned';
    });

    document.getElementById('deleteAdBtn')?.addEventListener('click', () => {
        const clientEntry = data.clients.find((entry) => entry.id === currentClientId);
        if (!clientEntry) return;
        if (!confirm(`Delete "${ad.title}"? This cannot be undone.`)) return;

        clientEntry.ads = clientEntry.ads.filter((entry) => entry.id !== currentAdId);
        saveData(data);
        backToClientDetail();
    });
}

function openAdDetail(adId){
    currentAdId = adId;
    const client = data.clients.find((entry) => entry.id === currentClientId);
    const ad = client?.ads.find((entry) => entry.id === currentAdId);
    if (!ad) return;

    const project = data.projects.find((p) => p.id === ad.projectId);
    document.getElementById('ad-title-header').textContent = ad.title;
    document.getElementById('ad-sub').textContent = project ? project.name : 'No project assigned';
    document.getElementById('ad-breadcrumb').textContent = `Clients > ${client.business} > ${ad.title}`;

    renderAdInfo();
    setupAddStatusEntry();
    renderAdStatusTimeline();

    document.querySelectorAll('.view').forEach((view) => view.classList.remove('active'));
    document.getElementById('view-ad-detail').classList.add('active');
}

function backToClientDetail(){
    openDetail(currentClientId);
}