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

function importClientData()
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

    const reader = new FileReader();

    reader.onload = (event) =>
    {
        try
        {
            const parsed = JSON.parse(event.target.result);

            if (!parsed.clients || !Array.isArray(parsed.clients))
            {
                throw new Error('File does not look like a Client Hub backup.');
            }

            data = parsed;
            saveData(data);
            status.textContent = `Imported ${data.clients.length} client(s) successfully.`;
            status.style.color = 'var(--green-tab)';
            renderDashboard();
            renderDirectory();
        }
        catch (error)
        {
            status.textContent = `Could not read that file: ${error.message}`;
            status.style.color = 'var(--red-tab)';
        }
    };

    reader.readAsText(file);
}

const exportButton = document.getElementById('exportBtn');
const importButton = document.getElementById('importBtn');

if (exportButton)
{
    exportButton.addEventListener('click', exportClientData);
}

if (importButton)
{
    importButton.addEventListener('click', importClientData);
}