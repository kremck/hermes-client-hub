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
    const visibleClientIds = new Set(visibleClients().map((client) => client.id));

    (data.clients || []).forEach((client) => {
        if (!visibleClientIds.has(client.id)) return;

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

    const projects = visibleProjects();

    if (!projects || projects.length === 0) {
        grid.innerHTML = '<div class="empty">No projects created yet.</div>';
        return;
    }

    projects.forEach((project) => {
        const count = getAdsForProject(project.id).length;
        const card = document.createElement('div');
        card.className = 'client-card card shadow';
        card.innerHTML = `
            <div class="biz">${escapeHtml(project.name)}</div>
            <div class="contact">${project.endDate ? 'Ends ' + project.endDate : 'No end date set'}</div>
            <div class="meta"><span>${count} ad(s) linked</span></div>
        `;
        card.addEventListener('click', () => { openProjectDetail(project.id); renderProjectSideCard(project.id); });
        grid.appendChild(card);
    });
}

function getProjectAdSortKey(ad) {
    const latest = ad.statusHistory && ad.statusHistory.length
        ? [...ad.statusHistory].sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))[0]
        : null;
    const statusEntry = latest ? STATUSES.find((entry) => entry.id === latest.statusId) : null;
    const stageOrder = statusEntry ? statusEntry.sortOrder : 1;
    const activityDate = latest && latest.occurredAt ? new Date(latest.occurredAt) : new Date(ad.createdAt || 0);
    return { latest, stageOrder, activityDate };
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
        linked.sort((left, right) => {
            const leftKey = getProjectAdSortKey(left.ad);
            const rightKey = getProjectAdSortKey(right.ad);
            if (leftKey.stageOrder !== rightKey.stageOrder) {
                return leftKey.stageOrder - rightKey.stageOrder;
            }
            return rightKey.activityDate - leftKey.activityDate;
        });

        linked.forEach(({ client, ad }) => {
            const latest = getProjectAdSortKey(ad).latest;
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

function renderProjectSideCard(projectId){
    const box = document.getElementById('projectInfoBox');
    if (!box) return;
    const project = data.projects.find((p) => p.id === projectId);
    if (!project) {
        box.innerHTML = '';
        return;
    }

    // Keep a snapshot for cancel
    const original = { ...project };

    box.innerHTML = `
        <h4>Edit Project</h4>
        <form id="editProjectForm">
            <div class="field-row">
                <div class="field"><label>Name</label><input type="text" id="ep-name" value="${escapeHtml(project.name)}"></div>
            </div>
            <div class="field-row">
                <div class="field"><label>End date</label><input type="date" id="ep-enddate" value="${project.endDate || ''}"></div>
            </div>
            <div class="field-row">
                <div class="field"><label>Note</label><textarea id="ep-note">${escapeHtml(project.note || '')}</textarea></div>
            </div>
            <div style="display:flex; gap:8px; margin-top:10px;">
                <button type="submit" class="btn-primary">Save</button>
                <button type="button" class="btn-secondary-outline" id="ep-cancel">Cancel</button>
                <button type="button" class="btn-secondary-outline" id="ep-delete" style="color:#c00; border-color:#c00;">Delete</button>
            </div>
        </form>
    `;

    const form = document.getElementById('editProjectForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('ep-name').value.trim();
        if (!name) return alert('Project name is required');

        project.name = name;
        project.endDate = document.getElementById('ep-enddate').value || '';
        project.note = document.getElementById('ep-note').value.trim();

        saveData(data);
        // update header and lists
        document.getElementById('project-title-header').textContent = project.name;
        document.getElementById('project-sub').textContent = project.note || 'No notes';
        renderProjectsList();
        renderProjectSideCard(projectId);
    });

    document.getElementById('ep-cancel').addEventListener('click', () => {
        // revert in-memory (we only modified copy when saving), just re-render
        renderProjectSideCard(projectId);
    });

    document.getElementById('ep-delete').addEventListener('click', () => {
        if (!confirm(`Delete project "${project.name}"? This will unassign it from any linked ads.`)) return;

        // Remove the project
        data.projects = (data.projects || []).filter((p) => p.id !== projectId);

        // Unassign from any ads that referenced this project
        (data.clients || []).forEach((client) => {
            (client.ads || []).forEach((ad) => {
                if (ad.projectId === projectId) ad.projectId = null;
            });
        });

        saveData(data);
        currentProjectId = null;
        renderProjectsList();
        showView('projects');
    });
}


function backToProjects(){
    showView('projects');
}

setupAddProject();