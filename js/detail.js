/* ===========================
   Detail View Functions (js/detail.js)
   =========================== */

function renderTimeline(){
    const timelineList = document.getElementById('timelineList');

    if (!timelineList || !currentClientId) return;
    const client = data.clients.find((entry) => entry.id === currentClientId);
    if (!client) return;
    timelineList.innerHTML = '';
    if (!client.timeline || client.timeline.length === 0) {
        timelineList.innerHTML = '<div class="empty">No campaigns logged yet.</div>';
        return;
    }

    const sortedTimeline = [...client.timeline]
        .map((entry, index) => ({ entry, index }))
        .sort((left, right) => new Date(right.entry.date || 0) - new Date(left.entry.date || 0));

    sortedTimeline.forEach(({ entry, index }) => {
        const item = document.createElement('div');
        item.className = 'timeline-item';

        const proofHtml = entry.proof ? `<div class="tlink">📎 <a href="${escapeHtml(entry.proof)}" target="_blank" rel="noopener">${escapeHtml(entry.proof)}</a></div>` : '<div class="tlink" style="color:var(--muted);">No proof attached</div>';
        const editButton = `<button type="button" class="btn-secondary-outline btn-small" data-edit-proof="${index}">${entry.proof ? 'Edit proof link' : 'Attach proof'}</button>`;
        const deleteButton = `<button type="button" class="btn-secondary-outline btn-small" data-remove-timeline="${index}">Remove Ad</button>`;

        item.innerHTML = `<div class="tdate">${entry.date || 'No date'}</div><div class="ttitle">${escapeHtml(entry.what || 'Untitled campaign')}</div>${proofHtml}<div class="timeline-actions">${editButton}${deleteButton}</div>`;

        timelineList.appendChild(item);
    });

    timelineList.querySelectorAll('[data-edit-proof]').forEach((button) => {
        button.addEventListener('click', () => {
            const index = parseInt(button.getAttribute('data-edit-proof'), 10);
            const clientEntry = data.clients.find((entry) => entry.id === currentClientId);
            const current = clientEntry.timeline[index].proof || '';
            const link = prompt('Paste the shared-drive link or path to the proof file:', current);
            if (link !== null) {
                clientEntry.timeline[index].proof = link.trim();
                saveData(data);
                openDetail(currentClientId);
            }
        });
    });

    timelineList.querySelectorAll('[data-remove-timeline]').forEach((button) => {
        button.addEventListener('click', () => {
            const index = parseInt(button.getAttribute('data-remove-timeline'), 10);
            const clientEntry = data.clients.find((entry) => entry.id === currentClientId);
            if (!clientEntry || !clientEntry.timeline || !clientEntry.timeline[index]) return;
            if (!confirm('Remove this timeline item?')) return;
            clientEntry.timeline.splice(index, 1);
            saveData(data);
            openDetail(currentClientId);
        });
    });
}

function renderContact(){
    const contactInfo = document.getElementById('contactInfo');
    if (!contactInfo || !currentClientId) return;
    const client = data.clients.find((entry) => entry.id === currentClientId);
    if (!client) return;

    contactInfo.innerHTML = `
        <div class="datefield">
            <span>Contact</span>
            <span class="editable-contact" data-field="contact">${escapeHtml(client.contact || '—')}</span>
        </div>
        <div class="datefield">
            <span>Info</span>
            <span class="editable-contact" data-field="info">${escapeHtml(client.info || '—')}</span>
        </div>
        <div class="datefield">
            <span>Note</span>
            <span class="editable-contact" data-field="note">${escapeHtml(client.note || '—')}</span>
        </div>
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

function renderKeyDates(){
    const keyDatesList = document.getElementById('keyDatesList');
    if (!keyDatesList || !currentClientId) return;
    const client = data.clients.find((entry) => entry.id === currentClientId);
    if (!client) return;
    keyDatesList.innerHTML = '';
    if (!client.keyDates || client.keyDates.length === 0) { keyDatesList.innerHTML = '<div class="empty">No key dates on file.</div>'; return; }
    client.keyDates.forEach((keyDate) => {
        const row = document.createElement('div');
        row.className = 'datefield';
        row.innerHTML = `<span>${escapeHtml(keyDate.label)}</span><span class="utility">${keyDate.date}</span>`;
        keyDatesList.appendChild(row);
    });
}

function renderCampaignHistory(){ renderTimeline(); renderContact(); renderKeyDates(); }

function addCampaign(){
    document.getElementById('campaignForm')?.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!currentClientId) return;
        const client = data.clients.find((entry) => entry.id === currentClientId);
        const what = document.getElementById('c-what').value.trim();
        const cdate = document.getElementById('c-date').value;
        const proof = document.getElementById('c-proof').value.trim();
        if (!what && !cdate) return;
        client.timeline = client.timeline || [];
        client.timeline.push({ what, date: cdate, proof });
        saveData(data); event.target.reset(); openDetail(client.id);
    });
}

function goToClient(id){ if (!id) return; openDetail(id); }
function renderDetail(id){ openDetail(id); }
function openDetail(id){
    currentClientId = id;
    const client = data.clients.find((entry) => entry.id === currentClientId);
    if (!client) return;
    document.getElementById('d-business').textContent = client.business;
    document.getElementById('d-sub').textContent = `${client.category || 'Client'} · ${client.contact || 'No contact name on file'}`;
    document.getElementById('addCampaignDetails').style.display = currentUser?.role === 'graphics' ? 'none' : '';
    renderCampaignHistory();
    document.querySelectorAll('.view').forEach((view) => view.classList.remove('active'));
    document.getElementById('view-detail').classList.add('active');
    document.querySelectorAll('.nav-btn').forEach((button) => button.classList.remove('active'));
    document.querySelector('.nav-btn[data-view="directory"]')?.classList.add('active');
    document.getElementById('d-breadcrumb').textContent = `Clients > ${client.business}`;
}

addCampaign();