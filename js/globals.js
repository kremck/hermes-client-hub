/* ===========================
   Global Variables & Constants
   =========================== */

const STORAGE_KEY = "clientHubData_v1";
const USERS_KEY = "clientHubUsers_v1";

/*
    Leave blank for now.

    Later this can become something like

    "\\\\Server\\ClientHub\\users.json"

*/
const USERS_FILE_PATH = "";

/* Global application state */

let data = null;

let users = [];

let currentClientId = null;

let currentUser = null;