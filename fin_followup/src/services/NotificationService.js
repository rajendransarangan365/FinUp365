// Notification Service for managing browser notifications and reminders

class NotificationService {
    constructor() {
        this.permission = Notification.permission;
        this.scheduledNotifications = new Map(); // Store timeout IDs
    }

    // Request notification permission
    async requestPermission() {
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return false;
        }

        if (this.permission === 'granted') {
            return true;
        }

        if (this.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            return permission === 'granted';
        }

        return false;
    }

    // Calculate notification time based on reminder hours
    calculateNotificationTime(followUpDate, followUpTime, reminderHoursBefore) {
        // Parse follow-up date and time
        const dateStr = followUpDate; // YYYY-MM-DD
        const timeStr = followUpTime || '09:00'; // HH:MM or default 9 AM

        const [year, month, day] = dateStr.split('-').map(Number);
        const [hours, minutes] = timeStr.split(':').map(Number);

        // Create follow-up datetime
        const followUpDateTime = new Date(year, month - 1, day, hours, minutes);

        // Subtract reminder hours
        const notificationTime = new Date(followUpDateTime.getTime() - (reminderHoursBefore * 60 * 60 * 1000));

        return notificationTime;
    }

    // Schedule a notification for a customer
    scheduleNotification(customer, reminderHoursBefore) {
        if (this.permission !== 'granted') {
            console.warn('Notification permission not granted');
            return;
        }

        if (!customer.followUpDate) {
            return; // No follow-up date set
        }

        // Calculate when to show notification
        const notificationTime = this.calculateNotificationTime(
            customer.followUpDate,
            customer.followUpTime,
            reminderHoursBefore
        );

        const now = new Date();
        const timeUntilNotification = notificationTime.getTime() - now.getTime();

        // Only schedule if notification time is in the future
        if (timeUntilNotification > 0) {
            // Don't schedule if more than 24 hours away (browser limitations)
            if (timeUntilNotification > 24 * 60 * 60 * 1000) {
                console.log(`Notification for ${customer.name} is more than 24 hours away, will schedule later`);
                return;
            }

            // Clear existing notification for this customer
            if (this.scheduledNotifications.has(customer._id)) {
                clearTimeout(this.scheduledNotifications.get(customer._id));
            }

            // Schedule the notification
            const timeoutId = setTimeout(() => {
                this.showNotification(customer);
                this.scheduledNotifications.delete(customer._id);
            }, timeUntilNotification);

            this.scheduledNotifications.set(customer._id, timeoutId);

            console.log(`Scheduled notification for ${customer.name} in ${Math.round(timeUntilNotification / 1000 / 60)} minutes`);
        }
    }

    // Show browser notification
    showNotification(customer) {
        if (this.permission !== 'granted') return;

        const title = `Meeting Reminder: ${customer.name}`;
        const body = `${customer.loanType || 'Follow-up'} meeting scheduled.\n📞 ${customer.phone}\n📍 ${customer.address || 'No address'}`;

        const notification = new Notification(title, {
            body,
            icon: '/logo192.png',
            badge: '/logo192.png',
            tag: `customer-${customer._id}`,
            requireInteraction: true,
            data: { customerId: customer._id }
        });

        notification.onclick = () => {
            window.focus();
            // Navigate to customer details if needed
            notification.close();
        };
    }

    // Check all upcoming meetings and schedule notifications
    checkUpcomingMeetings(customers, reminderHoursBefore) {
        if (this.permission !== 'granted') {
            console.warn('Cannot check meetings: notification permission not granted');
            return;
        }

        const now = new Date();
        const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        customers.forEach(customer => {
            if (!customer.followUpDate) return;

            // Parse follow-up date
            const [year, month, day] = customer.followUpDate.split('-').map(Number);
            const followUpDate = new Date(year, month - 1, day);

            // Check if meeting is within next 24 hours
            if (followUpDate >= now && followUpDate <= next24Hours) {
                this.scheduleNotification(customer, reminderHoursBefore);
            }
        });
    }

    // Clear all scheduled notifications
    clearAll() {
        this.scheduledNotifications.forEach(timeoutId => clearTimeout(timeoutId));
        this.scheduledNotifications.clear();
    }

    // Get number of scheduled notifications
    getScheduledCount() {
        return this.scheduledNotifications.size;
    }
}

export default new NotificationService();
