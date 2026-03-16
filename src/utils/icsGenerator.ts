export const generateICS = (
  shifts,
  startWeekDate,
  operatorName,
  numWeeks = 1) => {
  const events = [];
  const formatLocal = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}${m}${d}T${h}${min}00`;
  };


  const formatKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [y, m, d] = startWeekDate.split('-').map(Number);
  const baseSunday = new Date(y, m - 1, d);


  for (let w = 0; w < numWeeks; w++) {

    const currentSunday = new Date(baseSunday);
    currentSunday.setDate(baseSunday.getDate() + w * 7);

    let weekShifts = [];

    if (Array.isArray(shifts)) {
      weekShifts = shifts;
    } else if (typeof shifts === 'object' && shifts !== null) {

      const key = formatKey(currentSunday);
      weekShifts = (shifts as Record<string, { days: number[]; start: number; end: number }[]>)[key] || [];
    }

    if (!weekShifts || !Array.isArray(weekShifts)) continue;

    weekShifts.forEach((shift) => {
      if (!shift || !shift.days || !Array.isArray(shift.days)) return;

      shift.days.forEach((dayIndex) => {

        const shiftDate = new Date(currentSunday);
        shiftDate.setDate(currentSunday.getDate() + dayIndex);


        const startHour = Math.floor(shift.start);
        const startMin = shift.start % 1 * 60;
        shiftDate.setHours(startHour, startMin, 0, 0);
        const dtStart = formatLocal(shiftDate);


        const endDate = new Date(shiftDate);

        const endHourIs = shift.end === 0 ? 24 : shift.end;
        const endHour = Math.floor(endHourIs);
        const endMin = endHourIs % 1 * 60;


        endDate.setHours(endHour, endMin, 0, 0);

        const dtEnd = formatLocal(endDate);

        events.push(`BEGIN:VEVENT
SUMMARY:Turno Control Master - ${operatorName}
DTSTART;TZID=America/Costa_Rica:${dtStart}
DTEND;TZID=America/Costa_Rica:${dtEnd}
DESCRIPTION:Turno asignado en Enlace.
STATUS:CONFIRMED
END:VEVENT`);
      });
    });
  }

  const cal = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Enlace//Operator Schedule//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Horario ${operatorName}
X-WR-TIMEZONE:America/Costa_Rica
BEGIN:VTIMEZONE
TZID:America/Costa_Rica
X-LIC-LOCATION:America/Costa_Rica
BEGIN:STANDARD
TZOFFSETFROM:-0600
TZOFFSETTO:-0600
TZNAME:CST
DTSTART:19700101T000000
END:STANDARD
END:VTIMEZONE
${events.join('\n')}
END:VCALENDAR`;

  return cal;
};

export const downloadICS = (content, filename) => {

  if (typeof window !== 'undefined') {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};