// Calendar Service for generating .ics calendar files

class CalendarService {
    // Generate .ics file content for a customer meeting
    generateICS(customer, reminderHoursBefore = 2) {
        const { name, phone, address, followUpDate, followUpTime, loanType } = customer;

        // Parse follow-up date and time
        const dateStr = followUpDate; // YYYY-MM-DD
        const timeStr = followUpTime || '09:00'; // HH:MM or default 9 AM

        const [year, month, day] = dateStr.split('-').map(Number);
        const [hours, minutes] = timeStr.split(':').map(Number);

        // Create datetime objects
        const meetingStart = new Date(year, month - 1, day, hours, minutes);
        const meetingEnd = new Date(meetingStart.getTime() + 60 * 60 * 1000); // 1 hour duration

        // Format dates for iCalendar (YYYYMMDDTHHMMSSZ in UTC)
        const formatICSDate = (date) => {
            const pad = (num) => String(num).padStart(2, '0');
            return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
        };

        const startDateFormatted = formatICSDate(meetingStart);
        const endDateFormatted = formatICSDate(meetingEnd);
        const now = formatICSDate(new Date());

        // Create alarm (reminder)
        const reminderMinutes = reminderHoursBefore * 60;

        // Build ICS content
        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//FinUp365//Customer Meeting//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:finup365-${customer._id || Date.now()}-${Date.now()}@finup365.app
DTSTAMP:${now}
DTSTART:${startDateFormatted}
DTEND:${endDateFormatted}
SUMMARY:Meeting with ${name}
DESCRIPTION:${loanType || 'Follow-up'} meeting\\n\\nCustomer: ${name}\\nPhone: ${phone}\\nLoan Type: ${loanType || 'N/A'}
LOCATION:${address || 'To be determined'}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
ACTION:DISPLAY
TRIGGER:-PT${reminderMinutes}M
DESCRIPTION:Reminder: Meeting with ${name}
END:VALARM
END:VEVENT
END:VCALENDAR`;

        return icsContent;
    }

    // Download .ics file
    downloadICS(customer, reminderHoursBefore = 2) {
        const icsContent = this.generateICS(customer, reminderHoursBefore);

        // Create blob and download link
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `meeting-${customer.name?.replace(/\s+/g, '-') || 'customer'}-${customer.followUpDate}.ics`;

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        URL.revokeObjectURL(link.href);
    }
}

export default new CalendarService();
