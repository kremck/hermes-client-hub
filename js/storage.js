/* ===========================
   Client Data Storage
   =========================== */

function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw)
        return JSON.parse(raw);

    // Default seed data

    const seed = {

        clients: [

            {
                id: "c1",

                business: "Old Stuff Antiques Co-op",

                category: "Antiques/Thrift",

                contact: "Stacy Martin",

                info: "(555) 019-2231 · stacy@oldstuffcoop.com",

                note: "Runs seasonal ad each quarterly issue. Was slow to get into AccountScout initially.",

                followup: "",

                owner: "Jordan Reyes",

                keyDates: [

                    {
                        label: "Fall issue renewal",
                        date: futureDate(18)
                    },

                    {
                        label: "Anniversary sale",
                        date: futureDate(70)
                    }

                ],

                timeline: [

                    {
                        what: "Half-page ad, Spring Issue",
                        date: pastDate(210),
                        proof: "OldStuff_2026_Spring.pdf"
                    },

                    {
                        what: "Quarter-page ad, Winter Issue",
                        date: pastDate(390),
                        proof: "OldStuff_2025_Winter.pdf"
                    }

                ]
            },

            {
                id: "c2",

                business: "Riverside Thrift & Vintage",

                category: "Antiques/Thrift",

                contact: "Marcus Lee",

                info: "(555) 774-1120",

                note: "New lead — interested in advertising opportunity given rise in thrift shopping.",

                followup: futureDate(3),

                owner: "Jordan Reyes",

                keyDates: [],

                timeline: []
            },

            {
                id: "c3",

                business: "Cascade Business Partners",

                category: "Business Partner",

                contact: "Renee Ford",

                info: "renee@cascadebp.com",

                note: "Campaign ending soon — send renewal reminder.",

                followup: "",

                owner: "Taylor Brooks",

                keyDates: [

                    {
                        label: "Campaign end",
                        date: futureDate(6)
                    }

                ],

                timeline: [

                    {
                        what: "Full-page, Meet Mac feature",
                        date: pastDate(140),
                        proof: "CascadeBP_2026_MeetMac.pdf"
                    }

                ]
            }

        ]

    };

    saveData(seed);

    return seed;
}

function saveData(dataObject) {

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(dataObject)

    );

}

/* ===========================
   User Storage
   =========================== */

function loadUsers() {

    const raw = localStorage.getItem(USERS_KEY);

    if (raw)
        return JSON.parse(raw);

    const seed = [

        {
            name: "Jordan Reyes",
            role: "sales"
        },

        {
            name: "Taylor Brooks",
            role: "sales"
        },

        {
            name: "Casey Lin",
            role: "graphics"
        }

    ];

    saveUsers(seed);

    return seed;
}

function saveUsers(userArray) {

    localStorage.setItem(

        USERS_KEY,

        JSON.stringify(userArray)

    );

}