/* ===========================
   Projects (js/projects.js)
   =========================== */

function setupAddProject(){
    const form = document.getElementById('addProjectForm');
    if (!form) return;

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = document.getElementById('ap-projectname').value.trim();
        if (!name) return;

        const newProject = {
            id: `p_${Date.now()}`,
            name,
            note: document.getElementById('ap-note').value.trim(),
            endDate: document.getElementById('ap-followup').value,
            createdAt: new Date().toISOString().slice(0, 10)
        };

        data.projects = data.projects || [];
        data.projects.push(newProject);
        saveData(data);
        event.target.reset();
        showView('projects');
    });
}

function getAdsForProject(projectId){
    const results = [];
    (data.clients || []).forEach((client) => {
        (client.ads || []).forEach((ad) => {
            if (ad.projectId === projectId) results.push({ client, ad });
        });
    });
    return results;
}

function renderProjectsList(){
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!data.projects || data.projects.length === 0) {
        grid.innerHTML = '<div class="empty">No projects created yet.</div>';
        return;
    }

    data.projects.forEach((project) => {
        const count = getAdsForProject(project.id).length;
        const card = document.createElement('div');
        card.className = 'client-card card shadow';
        card.innerHTML = `
            <div class="biz">${escapeHtml(project.name)}</div>
            <div class="contact">${project.endDate ? 'Ends ' + project.endDate : 'No end date set'}</div>
            <div class="meta"><span>${count} ad(s) linked</span></div>
        `;
        card.addEventListener('click', () => openProjectDetail(project.id));
        grid.appendChild(card);
    });
}

function openProjectDetail(projectId){
    currentProjectId = projectId;
    const project = data.projects.find((p) => p.id === projectId);
    if (!project) return;

    document.getElementById('project-title-header').textContent = project.name;
    document.getElementById('project-sub').textContent = project.note || 'No notes';

    const list = document.getElementById('projectAdsList');
    list.innerHTML = '';
    const linked = getAdsForProject(projectId);

    if (linked.length === 0) {
        list.innerHTML = '<div class="empty">No ads linked to this project yet.</div>';
    } else {
        linked.forEach(({ client, ad }) => {
            const latest = ad.statusHistory && ad.statusHistory.length
                ? [...ad.statusHistory].sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))[0]
                : null;
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.style.cursor = 'pointer';
            item.innerHTML = `
                <div class="ttitle">${escapeHtml(client.business)} — ${escapeHtml(ad.title)}</div>
                <div class="tdate">${latest ? statusName(latest.statusId) : 'No status logged'}</div>
            `;
            item.addEventListener('click', () => {
                currentClientId = client.id;
                openAdDetail(ad.id);
            });
            list.appendChild(item);
        });
    }

    document.querySelectorAll('.view').forEach((view) => view.classList.remove('active'));
    document.getElementById('view-project-detail').classList.add('active');
}

function backToProjects(){
    showView('projects');
}

setupAddProject();