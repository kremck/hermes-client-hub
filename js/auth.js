async function tryRestoreSession(){
    const fileUsers = await tryLoadUsersFromFile();
    if (fileUsers) { users = fileUsers; saveUsers(users); }
    populateLoginDropdown();
    renderUsersList();
    const raw = sessionStorage.getItem('clientHubUser');
    if (raw) { currentUser = JSON.parse(raw); enterApp(); }
}

function enterApp(){
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appShell').style.display = 'block';
    document.getElementById('userBadge').textContent = `${currentUser.name} · ${currentUser.role === 'graphics' ? 'Graphics' : 'Sales'}`;
    applyRolePermissions();
    showView('dashboard');
}

function applyRolePermissions(){
    const quickAddNav = document.getElementById('navQuickAdd');
    if (quickAddNav && currentUser) quickAddNav.style.display = currentUser.role === 'graphics' ? 'none' : '';
}

function visibleClients(){
    if (!currentUser) return [];
    if (currentUser.role === 'graphics') return data.clients;
    return data.clients.filter((client) => (client.owner || '').toLowerCase() === currentUser.name.toLowerCase());
}

function logout(){
    sessionStorage.removeItem('clientHubUser');
    currentUser = null;
    document.getElementById('appShell').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
}

function registerLoginHandlers(){
    document.getElementById('loginForm')?.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = document.getElementById('login-user').value;
        const user = users.find((entry) => entry.name === name);
        if (!user) return;
        currentUser = { name: user.name, role: user.role };
        sessionStorage.setItem('clientHubUser', JSON.stringify(currentUser));
        enterApp();
    });

    document.getElementById('logoutLink')?.addEventListener('click', logout);
}

registerLoginHandlers();