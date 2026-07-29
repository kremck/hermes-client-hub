/* ===========================
   Global Variables & Constants (js/globals.js)
   =========================== */

const STORAGE_KEY = "clientHubData_v1";
const USERS_KEY = "clientHubUsers_v1";
const USERS_FILE_PATH = "";

const STATUSES = [
    { id: "s1", name: "Initial Contact", sortOrder: 1 },
    { id: "s2", name: "Follow Up", sortOrder: 2 },
    { id: "s3", name: "Reserved", sortOrder: 3 },
    { id: "s4", name: "Info Received", sortOrder: 4 },
    { id: "s5", name: "Out for Approval", sortOrder: 5 },
    { id: "s6", name: "Exported", sortOrder: 6 },
    { id: "s7", name: "Completed", sortOrder: 7 }
];

function statusName(statusId) {
    const status = STATUSES.find((entry) => entry.id === statusId);
    return status ? status.name : "Unknown status";
}

/* Global application state */
let data = null;
let users = [];
let currentClientId = null;
let currentAdId = null;
let currentProjectId = null;
let currentUser = null;