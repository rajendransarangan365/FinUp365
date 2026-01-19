import React from 'react';
import { FaPhoneAlt, FaUser, FaCalendarAlt, FaStar } from 'react-icons/fa';
import '../styles/CustomerCard.css';

const CustomerCard = ({ customer, onCall, variant = 'normal' }) => {

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

                    {/* Date Badge moved here */}
                    {customer.followUpDate && (
                        <div className="crm-date-badge">
                            <FaCalendarAlt /> <span>{customer.followUpDate}</span>
                        </div>
                    )}
                </div>

                <div className="crm-actions">
                    {/* Star Icon for New/Important */}
                    {customer.status === 'NEW' && <FaStar className="star-icon" />}

                    {/* Call Button */}
                    <button
                        className="call-action-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `tel:${customer.phone}`;
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
