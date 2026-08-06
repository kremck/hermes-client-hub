/* ===========================
   Authentication Functions (js/auth.js)
   =========================== */

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
    document.getElementById('userBadge').textContent = `${currentUser.name} · Sales`;
    applyRolePermissions();
    showView('dashboard');
}

function applyRolePermissions(){
    const quickAddNav = document.getElementById('navQuickAdd');
    if (quickAddNav && currentUser) quickAddNav.style.display = '';
}

function isAdminUser(user = currentUser){
    return Boolean(user?.role && user.role.toLowerCase() === 'admin');
}

function visibleClients(){
    if (!currentUser) return [];
    if (isAdminUser(currentUser)) return [...(data.clients || [])];
    return (data.clients || []).filter((client) => (client.owner || '').toLowerCase() === currentUser.name.toLowerCase());
}

function visibleProjects(){
    if (!currentUser) return [];
    if (isAdminUser(currentUser)) return [...(data.projects || [])];
    return [...(data.projects || [])];
}

function logout(){
    sessionStorage.removeItem('clientHubUser');
    currentUser = null;
    document.getElementById('appShell').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
}


/*Fairly new code might be buggy*/

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

    document.getElementById('quickRegisterForm')?.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = document.getElementById('qr-name').value.trim();
        const role = 'sales';
        if (!name) return;

        const existing = users.find((entry) => entry.name.toLowerCase() === name.toLowerCase());
        const user = existing || { name, role };

        if (!existing) {
            users.push(user);
            saveUsers(users);
            populateLoginDropdown();
        }

        currentUser = { name: user.name, role: user.role };
        sessionStorage.setItem('clientHubUser', JSON.stringify(currentUser));
        event.target.reset();
        enterApp();
    });

    document.getElementById('logoutLink')?.addEventListener('click', logout);
}

registerLoginHandlers();