import React from 'react';
import { FaPhoneAlt, FaUser, FaCalendarAlt, FaStar, FaCheckCircle, FaTimesCircle, FaBell, FaClock, FaMapMarkerAlt, FaCalendarPlus } from 'react-icons/fa';
import '../styles/CustomerCard.css';
import CalendarService from '../services/CalendarService';

const CustomerCard = ({ customer, onCall, onCallAction, variant = 'normal' }) => {

    // Variant styles
    const isUrgent = variant === 'urgent';
    const isCompleted = variant === 'completed';
    const isNew = variant === 'new';

    const getRandomColor = (name) => {
        const colors = ['#a29bfe', '#ffeaa7', '#55efc4', '#81ecec', '#74b9ff', '#fab1a0'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    // Get status badge configuration
    const getStatusBadge = () => {
        switch (customer.status) {
            case 'NOT_INTERESTED':
                return {
                    icon: <FaTimesCircle />,
                    text: 'Not Interested',
                    className: 'status-badge-not-interested'
                };
            case 'CONVERTED':
                return {
                    icon: <FaCheckCircle />,
                    text: 'Deal Closed',
                    className: 'status-badge-converted'
                };
            case 'TODAY':
                return {
                    icon: <FaBell />,
                    text: 'Attention Needed',
                    className: 'status-badge-today'
                };
            case 'NORMAL':
                return {
                    icon: <FaClock />,
                    text: 'Under Process',
                    className: 'status-badge-normal'
                };
            default:
                return null;
        }
    };

    const statusBadge = getStatusBadge();

    // Handle add to calendar
    const handleAddToCalendar = (e) => {
        e.stopPropagation();
        if (!customer.followUpDate) {
            alert('No follow-up date set for this customer.');
            return;
        }
        const user = JSON.parse(localStorage.getItem('user'));
        CalendarService.downloadICS(customer, user?.reminderHoursBefore || 2);
    };

    return (
        <div
            className={`crm-card ${isUrgent ? 'urgent-border' : ''} ${isNew ? 'new-border' : ''} ${isCompleted ? 'completed-dim' : ''}`}
            onClick={() => onCall(customer)}
            role="button"
            tabIndex={0}
        >
            <div className="crm-card-content">
                <div className="crm-avatar">
                    {customer.profilePicUrl ? (
                        <img src={customer.profilePicUrl} alt={`${customer.name}'s avatar`} />
                    ) : (
                        <div className="avatar-placeholder" style={{ background: getRandomColor(customer.name || 'User') }}>
                            {(customer.name || '?').charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                <div className="crm-info">
                    <h3 className="crm-name">{customer.name}</h3>
                    {customer.customerName && <p className="crm-detail"><FaUser className="icon-small" /> {customer.customerName}</p>}
                    <p className="crm-detail phone-text">{customer.phone}</p>
                    {customer.address && <p className="crm-detail"><FaMapMarkerAlt className="icon-small" /> {customer.address}</p>}

                    {/* Date Badge moved here */}
                    {customer.followUpDate && (
                        <div className="crm-date-badge">
                            <FaCalendarAlt /> <span>{customer.followUpDate}</span>
                        </div>
                    )}

                    {/* Status Badge */}
                    {statusBadge && (
                        <div className={`status-badge ${statusBadge.className}`}>
                            {statusBadge.icon}
                            <span>{statusBadge.text}</span>
                        </div>
                    )}

                    {/* Last Call Status - New Addition */}
                    {customer.callHistory && customer.callHistory.length > 0 && (() => {
                        const lastCall = customer.callHistory[customer.callHistory.length - 1];
                        const isPicked = lastCall.status === 'PICKED';
                        const timeString = new Date(lastCall.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return (
                            <div className="last-call-badge" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginTop: '6px',
                                fontSize: '0.75rem',
                                color: isPicked ? '#00b894' : '#d63031',
                                background: isPicked ? 'rgba(0, 184, 148, 0.1)' : 'rgba(214, 48, 49, 0.1)',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                width: 'fit-content'
                            }}>
                                {isPicked ? <FaPhoneAlt size={10} /> : <FaTimesCircle size={10} />}
                                <span>{isPicked ? 'Answered' : lastCall.status} • {timeString}</span>
                            </div>
                        );
                    })()}
                </div>

                <div className="crm-actions">
                    {/* Star Icon for New/Important */}
                    {customer.status === 'NEW' && <FaStar className="star-icon" />}

                    {/* Calendar Button */}
                    {customer.followUpDate && (
                        <button
                            className="call-action-btn calendar-btn"
                            onClick={handleAddToCalendar}
                            title="Add to Calendar"
                        >
                            <FaCalendarPlus />
                        </button>
                    )}

                    <button
                        className="call-action-btn navigate-btn"
                        style={{ backgroundColor: '#0984e3' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            let query = "";
                            if (customer.coordinates && customer.coordinates.lat !== undefined && customer.coordinates.lng !== undefined) {
                                query = `${customer.coordinates.lat},${customer.coordinates.lng}`;
                            } else {
                                query = encodeURIComponent(customer.address || customer.phone || "");
                            }

                            if (query) {
                                window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                            } else {
                                alert("No address or phone number available for navigation.");
                            }
                        }}
                        title="Navigate"
                    >
                        <FaMapMarkerAlt />
                    </button>

                    {/* Call Button */}
                    <button
                        className="call-action-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onCallAction) {
                                onCallAction(customer);
                            } else {
                                window.location.href = `tel:${customer.phone}`;
                            }
                        }}
                    >
                        <FaPhoneAlt />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerCard;
