/* Safe date utilities for dashboard and other modules
   Include this file before other scripts that rely on `dateUtils` for best behavior.
*/
(function(window){
    function isValidDate(d){
        return d instanceof Date && !isNaN(d);
    }

    function parseDateSafe(input){
        if (input === null || input === undefined || input === '') return null;

        if (input instanceof Date) return isValidDate(input) ? new Date(input.getTime()) : null;

        if (typeof input === 'number'){
            const d = new Date(input);
            return isValidDate(d) ? d : null;
        }

        if (typeof input === 'string'){
            // Prefer YYYY-MM-DD as a local date (no timezone shift)
            const ymd = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (ymd){
                const y = Number(ymd[1]);
                const m = Number(ymd[2]) - 1;
                const d = Number(ymd[3]);
                const dt = new Date(y, m, d);
                return isValidDate(dt) ? dt : null;
            }

            const parsed = new Date(input);
            return isValidDate(parsed) ? parsed : null;
        }

        return null;
    }

    function toLocalDateKey(date){
        const d = parseDateSafe(date);
        if (!d) return null;
        d.setHours(0,0,0,0);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function daysBetweenLocal(a, b){
        const da = parseDateSafe(a);
        const db = parseDateSafe(b);
        if (!da || !db) return null;
        da.setHours(0,0,0,0);
        db.setHours(0,0,0,0);
        return Math.round((db - da) / 86400000);
    }

    function daysUntilSafe(date){
        const today = new Date();
        today.setHours(0,0,0,0);
        return daysBetweenLocal(today, date);
    }

    function daysAgoSafe(date){
        const d = parseDateSafe(date);
        if (!d) return null;
        const today = new Date();
        today.setHours(0,0,0,0);
        d.setHours(0,0,0,0);
        return Math.round((today - d) / 86400000);
    }

    window.dateUtils = {
        parseDateSafe: parseDateSafe,
        toLocalDateKey: toLocalDateKey,
        daysBetweenLocal: daysBetweenLocal,
        daysUntilSafe: daysUntilSafe,
        daysAgoSafe: daysAgoSafe
    };

})(window);
