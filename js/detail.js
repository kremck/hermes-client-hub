function renderTimeline(){
    const timelineList = document.getElementById('timelineList');
    if (!timelineList || !currentClientId) return;
    const client = data.clients.find((entry) => entry.id === currentClientId);
    if (!client) return;
    timelineList.innerHTML = '';
    if (!client.timeline || client.timeline.length === 0) { timelineList.innerHTML = '<div class="empty">No campaigns logged yet.</div>'; return; }
    [...client.timeline].sort((left, right) => new Date(right.date || 0) - new Date(left.date || 0)).forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        const proofHtml = entry.proof ? `<div class="tlink">📎 <a href="${escapeHtml(entry.proof)}" target="_blank" rel="noopener">${escapeHtml(entry.proof)}</a></div>` : '<div class="tlink" style="color:var(--muted);">No proof attached</div>';
        const editButton = currentUser?.role === 'graphics' ? `<button type="button" class="btn-secondary-outline btn-small" data-edit-proof="${index}" style="margin-top:6px;">${entry.proof ? 'Edit proof link' : 'Attach proof'}</button>` : '';
        item.innerHTML = `<div class="tdate">${entry.date || 'No date'}</div><div class="ttitle">${escapeHtml(entry.what || 'Untitled campaign')}</div>${proofHtml}${editButton}`;
        timelineList.appendChild(item);
    });
    timelineList.querySelectorAll('[data-edit-proof]').forEach((button) => {
        button.addEventListener('click', () => {
            const index = parseInt(button.getAttribute('data-edit-proof'), 10);
            const clientEntry = data.clients.find((entry) => entry.id === currentClientId);
            const current = clientEntry.timeline[index].proof || '';
            const link = prompt('Paste the shared-drive link or path to the proof file:', current);
            if (link !== null) { clientEntry.timeline[index].proof = link.trim(); saveData(data); openDetail(currentClientId); }
        });
    });
}

function renderContact(){
    const contactInfo = document.getElementById('contactInfo');
    if (!contactInfo || !currentClientId) return;
    const client = data.clients.find((entry) => entry.id === currentClientId);
    if (!client) return;
    contactInfo.innerHTML = `<div class="datefield"><span>Contact</span><span>${escapeHtml(client.contact || '—')}</span></div><div class="datefield"><span>Info</span><span>${escapeHtml(client.info || '—')}</span></div><div class="datefield"><span>Note</span><span>${escapeHtml(client.note || '—')}</span></div>`;
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