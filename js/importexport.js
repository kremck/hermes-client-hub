/* ===========================
   Import/Export (js/importexport.js)
   =========================== */

let sharedImportFolderHandle = null;
let sharedImportFolderName = '';

function setSharedImportStatus(message, isError = false)
{
    const status = document.getElementById('sharedImportStatus');

    if (!status)
        return;

    status.textContent = message;
    status.style.color = isError ? 'var(--red-tab)' : 'var(--green-tab)';
}

function setSharedPathView(message, isError = false)
{
    const status = document.getElementById('sharedPathView');

    if (!status)
        return;

    status.textContent = message;
    status.style.color = isError ? 'var(--red-tab)' : 'var(--green-tab)';
}

function exportClientData()
{
    if (!data)
        return;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);

    downloadLink.href = url;
    downloadLink.download = `client-hub-backup_${stamp}.json`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    URL.revokeObjectURL(url);
}

function mergeClients(existingClients = [], incomingClients = [])
{
    const merged = Array.isArray(existingClients) ? [...existingClients] : [];
    const seenIds = new Set(merged.filter((entry) => entry && entry.id).map((entry) => String(entry.id)));
    let addedCount = 0;

    (Array.isArray(incomingClients) ? incomingClients : []).forEach((client) =>
    {
        if (!client || typeof client !== 'object')
            return;

        const clientId = client.id ? String(client.id) : '';

        if (!clientId)
        {
            merged.push(client);
            addedCount += 1;
            return;
        }

        if (seenIds.has(clientId))
            return;

        seenIds.add(clientId);
        merged.push(client);
        addedCount += 1;
    });

    return { clients: merged, addedCount };
}

function mergeUsers(existingUsers = [], incomingUsers = [])
{
    const merged = Array.isArray(existingUsers) ? [...existingUsers] : [];
    const seenNames = new Set(merged.filter((entry) => entry && entry.name).map((entry) => String(entry.name).trim().toLowerCase()));
    let addedCount = 0;

    (Array.isArray(incomingUsers) ? incomingUsers : []).forEach((user) =>
    {
        if (!user || typeof user !== 'object')
            return;

        const name = typeof user.name === 'string' ? user.name.trim() : '';

        if (!name)
            return;

        const normalizedName = name.toLowerCase();

        if (seenNames.has(normalizedName))
            return;

        seenNames.add(normalizedName);
        merged.push({ ...user, name });
        addedCount += 1;
    });

    return { users: merged, addedCount };
}

async function applyImportedData(parsed, sourceLabel)
{
    if (!parsed || typeof parsed !== 'object')
    {
        throw new Error('The selected file is empty or invalid.');
    }

    const baseData = data && typeof data === 'object' ? { ...data } : {};
    const incomingClients = Array.isArray(parsed.clients) ? parsed.clients : [];
    const incomingUsers = Array.isArray(parsed.users) ? parsed.users : [];

    if (!incomingClients.length && !incomingUsers.length)
    {
        throw new Error('This backup does not contain any client or user data to merge.');
    }

    const clientMerge = mergeClients(baseData.clients || [], incomingClients);
    const userMerge = mergeUsers(users || [], incomingUsers);

    data = {
        ...baseData,
        ...parsed,
        clients: clientMerge.clients
    };

    saveData(data);

    if (userMerge.addedCount > 0)
    {
        users = userMerge.users;
        saveUsers(users);
    }

    const status = document.getElementById('importStatus');
    const sourceText = sourceLabel ? ` from ${sourceLabel}` : '';
    const summaryParts = [];

    if (clientMerge.addedCount > 0)
        summaryParts.push(`${clientMerge.addedCount} new client(s)`);

    if (userMerge.addedCount > 0)
        summaryParts.push(`${userMerge.addedCount} new user(s)`);

    const summary = summaryParts.length > 0 ? summaryParts.join(' and ') : 'no new records';

    if (status)
    {
        status.textContent = `Merged ${summary}${sourceText}. Existing local records were kept.`;
        status.style.color = 'var(--green-tab)';
    }

    renderDashboard();
    renderDirectory();
    populateLoginDropdown();
    renderUsersList();
}

async function importClientData()
{
    const fileInput = document.getElementById('importFile');
    const status = document.getElementById('importStatus');

    if (!fileInput || !status)
        return;

    const file = fileInput.files[0];

    if (!file)
    {
        status.textContent = 'Choose a file first.';
        status.style.color = 'var(--red-tab)';
        return;
    }

    try
    {
        const parsed = JSON.parse(await file.text());
        await applyImportedData(parsed, file.name);
    }
    catch (error)
    {
        status.textContent = `Could not read that file: ${error.message}`;
        status.style.color = 'var(--red-tab)';
    }
}

async function pickSharedImportFolder()
{
    if (typeof window.showDirectoryPicker !== 'function')
    {
        setSharedImportStatus('This browser does not support selecting a shared folder automatically. Use the manual import button instead.', true);
        return;
    }

    try
    {
        const handle = await window.showDirectoryPicker({ mode: 'read' });
        sharedImportFolderHandle = handle;
        sharedImportFolderName = handle.name || 'shared folder';

        setSharedImportStatus(`Shared folder selected: ${sharedImportFolderName}. Checking it for client data now.`, false);
        await autoImportFromSharedFolder();
    }
    catch (error)
    {
        if (error && error.name !== 'AbortError')
        {
            setSharedImportStatus(`Could not open the shared folder: ${error.message}`, true);
        }
    }
}

async function autoImportFromSharedFolder()
{
    if (!sharedImportFolderHandle)
        return;

    const candidateNames = ['client-hub-backup.json', 'clients.json', 'client-data.json'];

    for (const fileName of candidateNames)
    {
        try
        {
            const fileHandle = await sharedImportFolderHandle.getFileHandle(fileName, { create: false });
            const file = await fileHandle.getFile();
            const parsed = JSON.parse(await file.text());

            await applyImportedData(parsed, sharedImportFolderName ? `${sharedImportFolderName}/${fileName}` : fileName);
            setSharedImportStatus(`Imported ${data.clients.length} client(s) from ${sharedImportFolderName}/${fileName}.`, false);
            return;
        }
        catch (error)
        {
            // Keep trying the next file name.
        }
    }

    try
    {
        const jsonFiles = [];

        for await (const [name, handle] of sharedImportFolderHandle.entries())
        {
            if (handle.kind === 'file' && name.toLowerCase().endsWith('.json'))
            {
                jsonFiles.push({ name, handle });
            }
        }

        if (jsonFiles.length > 0)
        {
            const firstFile = jsonFiles[0];
            const file = await firstFile.handle.getFile();
            const parsed = JSON.parse(await file.text());

            await applyImportedData(parsed, sharedImportFolderName ? `${sharedImportFolderName}/${firstFile.name}` : firstFile.name);
            setSharedImportStatus(`Imported ${data.clients.length} client(s) from ${sharedImportFolderName}/${firstFile.name}.`, false);
            return;
        }
    }
    catch (error)
    {
        // No fallback file available.
    }

    setSharedImportStatus('No supported client backup file was found in the selected shared folder.', true);
}

const exportButton = document.getElementById('exportBtn');
const importButton = document.getElementById('importBtn');
const pickSharedFolderButton = document.getElementById('chooseSharedFolderBtn');

if (exportButton)
{
    exportButton.addEventListener('click', exportClientData);
}

if (importButton)
{
    importButton.addEventListener('click', importClientData);
}

if (pickSharedFolderButton)
{
    pickSharedFolderButton.addEventListener('click', pickSharedImportFolder);
}