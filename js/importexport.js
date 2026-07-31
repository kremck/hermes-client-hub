/* ===========================
   Import/Export (js/importexport.js)
   =========================== */

function setStatusMessage(elementId, message, isError = false)
{
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.style.color = isError ? 'var(--red-tab)' : 'var(--green-tab)';
}

/* ---------- EXPORT ---------- */

function filterDataByMonthYear(sourceData, month, year)
{
    if (!month && !year) return sourceData;

    const filteredClients = (sourceData.clients || []).map((client) => {
        const filteredAds = (client.ads || []).filter((ad) => {
            return (ad.statusHistory || []).some((entry) => {
                if (!entry.occurredAt) return false;
                const d = new Date(entry.occurredAt);
                const matchesYear = year ? d.getFullYear() === parseInt(year, 10) : true;
                const matchesMonth = month ? (d.getMonth() + 1) === parseInt(month, 10) : true;
                return matchesYear && matchesMonth;
            });
        });

        if (filteredAds.length === 0) return null;
        return { ...client, ads: filteredAds };
    }).filter(Boolean);

    return { ...sourceData, clients: filteredClients };
}

function exportClientData()
{
    if (!data) return;

    const monthSelect = document.getElementById('export-month');
    const yearSelect = document.getElementById('export-year');
    const month = monthSelect ? monthSelect.value : '';
    const year = yearSelect ? yearSelect.value : '';

    try
    {
        const exportPayload = filterDataByMonthYear(data, month, year);

        if ((month || year) && (!exportPayload.clients || exportPayload.clients.length === 0))
        {
            setStatusMessage('exportStatus', 'No ads found matching that month/year. Nothing was exported.', true);
            return;
        }

        const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');

        let stamp;
        if (month && year) stamp = `${year}-${String(month).padStart(2, '0')}`;
        else if (year) stamp = `${year}`;
        else if (month) stamp = `all-years-month-${String(month).padStart(2, '0')}`;
        else stamp = new Date().toISOString().slice(0, 10);

        const filename = `client-hub-export_${stamp}.json`;

        downloadLink.href = url;
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        URL.revokeObjectURL(url);

        setStatusMessage('exportStatus', `Saved ${filename}`);
    }
    catch (error)
    {
        setStatusMessage('exportStatus', `Export failed: ${error.message}`, true);
    }
}

function populateExportYearOptions()
{
    const yearSelect = document.getElementById('export-year');
    if (!yearSelect) return;

    const yearsInData = new Set();
    (data?.clients || []).forEach((client) => {
        (client.ads || []).forEach((ad) => {
            (ad.statusHistory || []).forEach((entry) => {
                if (entry.occurredAt) yearsInData.add(new Date(entry.occurredAt).getFullYear());
            });
        });
    });

    const currentYear = new Date().getFullYear();
    yearsInData.add(currentYear);

    const sortedYears = [...yearsInData].sort((a, b) => b - a);

    yearSelect.innerHTML = '<option value="">Any year</option>' +
        sortedYears.map((y) => `<option value="${y}">${y}</option>`).join('');
}

/* ---------- IMPORT (full replace) ---------- */

async function importClientData()
{
    const fileInput = document.getElementById('importFile');

    if (!fileInput)
        return;

    const file = fileInput.files[0];

    if (!file)
    {
        setStatusMessage('importStatus', 'Choose a file first.', true);
        return;
    }

    if (!confirm('This will completely replace all current data with the contents of this file. This cannot be undone. Continue?'))
    {
        setStatusMessage('importStatus', 'Import cancelled.', true);
        return;
    }

    try
    {
        const parsed = JSON.parse(await file.text());

        if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.clients))
        {
            throw new Error('This file does not look like a valid Client Hub backup.');
        }

        data = parsed;
        if (!Array.isArray(data.projects)) data.projects = [];
        saveData(data);

        renderDashboard();
        renderDirectory();
        populateExportYearOptions();

        setStatusMessage('importStatus', `Loaded ${data.clients.length} client(s) from ${file.name}. Local data was replaced.`);
    }
    catch (error)
    {
        setStatusMessage('importStatus', `Could not import that file: ${error.message}`, true);
    }
}

/* ---------- MERGE (two files -> new downloaded file, does not touch live data) ---------- */

function mergeClients(existingClients = [], incomingClients = [])
{
    const merged = Array.isArray(existingClients) ? [...existingClients] : [];
    const seenIds = new Set(merged.filter((entry) => entry && entry.id).map((entry) => String(entry.id)));
    let addedCount = 0;

    (Array.isArray(incomingClients) ? incomingClients : []).forEach((client) =>
    {
        if (!client || typeof client !== 'object') return;

        const clientId = client.id ? String(client.id) : '';

        if (!clientId)
        {
            merged.push(client);
            addedCount += 1;
            return;
        }

        if (seenIds.has(clientId)) return;

        seenIds.add(clientId);
        merged.push(client);
        addedCount += 1;
    });

    return { clients: merged, addedCount };
}

function mergeProjects(existingProjects = [], incomingProjects = [])
{
    const merged = Array.isArray(existingProjects) ? [...existingProjects] : [];
    const seenIds = new Set(merged.map((p) => String(p.id)));
    let addedCount = 0;

    (Array.isArray(incomingProjects) ? incomingProjects : []).forEach((project) => {
        if (!project || !project.id || seenIds.has(String(project.id))) return;
        seenIds.add(String(project.id));
        merged.push(project);
        addedCount += 1;
    });

    return { projects: merged, addedCount };
}

async function readJsonFile(fileInputId)
{
    const fileInput = document.getElementById(fileInputId);
    const file = fileInput?.files[0];

    if (!file) return null;

    const parsed = JSON.parse(await file.text());
    return { parsed, name: file.name };
}

async function mergeFiles()
{
    try
    {
        const targetFile = await readJsonFile('mergeTargetFile');
        const otherFile = await readJsonFile('mergeOtherFile');

        if (!targetFile)
        {
            setStatusMessage('mergeStatus', 'Choose a target file first.', true);
            return;
        }

        if (!otherFile)
        {
            setStatusMessage('mergeStatus', 'Choose a second file to merge in.', true);
            return;
        }

        const targetData = targetFile.parsed;
        const otherData = otherFile.parsed;

        if (!targetData || !Array.isArray(targetData.clients))
        {
            throw new Error(`${targetFile.name} does not look like a valid backup.`);
        }

        if (!otherData || !Array.isArray(otherData.clients))
        {
            throw new Error(`${otherFile.name} does not look like a valid backup.`);
        }

        const clientMerge = mergeClients(targetData.clients, otherData.clients);
        const projectMerge = mergeProjects(targetData.projects || [], otherData.projects || []);

        const mergedData = {
            ...targetData,
            clients: clientMerge.clients,
            projects: projectMerge.projects
        };

        const blob = new Blob([JSON.stringify(mergedData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        const stamp = new Date().toISOString().slice(0, 10);
        const filename = `client-hub-merged_${stamp}.json`;

        downloadLink.href = url;
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        URL.revokeObjectURL(url);

        setStatusMessage('mergeStatus', `Saved ${filename} — added ${clientMerge.addedCount} new client(s) and ${projectMerge.addedCount} new project(s) from ${otherFile.name} into ${targetFile.name}.`);
    }
    catch (error)
    {
        setStatusMessage('mergeStatus', `Merge failed: ${error.message}`, true);
    }
}

/* ---------- Wire up buttons ---------- */

document.getElementById('exportBtn')?.addEventListener('click', exportClientData);
document.getElementById('importBtn')?.addEventListener('click', importClientData);
document.getElementById('mergeBtn')?.addEventListener('click', mergeFiles);

populateExportYearOptions();