import React, { useState } from 'react';
import { FaSearch, FaTimes, FaFilter, FaCheckCircle, FaTimesCircle, FaBell, FaClock, FaStar, FaCalendarAlt } from 'react-icons/fa';
import '../styles/FilterBar.css';

const FilterBar = ({ onFilterChange, activeFilters, totalCount, filteredCount }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(true);

    const statusFilters = [
        { value: 'ALL', label: 'All', icon: <FaFilter /> },
        { value: 'NEW', label: 'New', icon: <FaStar /> },
        { value: 'TODAY', label: 'Today', icon: <FaBell /> },
        { value: 'NORMAL', label: 'Under Process', icon: <FaClock /> },
        { value: 'CONVERTED', label: 'Converted', icon: <FaCheckCircle /> },
        { value: 'NOT_INTERESTED', label: 'Not Interested', icon: <FaTimesCircle /> }
    ];

    const dateFilters = [
        { value: 'ALL', label: 'All Time' },
        { value: 'TODAY', label: 'Today' },
        { value: 'THIS_WEEK', label: 'This Week' },
        { value: 'THIS_MONTH', label: 'This Month' }
    ];

    const handleStatusFilter = (status) => {
        onFilterChange({ ...activeFilters, status });
    };

    const handleDateFilter = (dateRange) => {
        onFilterChange({ ...activeFilters, dateRange });
    };

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        onFilterChange({ ...activeFilters, search: query });
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        onFilterChange({ status: 'ALL', dateRange: 'ALL', search: '' });
    };

    const hasActiveFilters = activeFilters.status !== 'ALL' ||
        activeFilters.dateRange !== 'ALL' ||
        activeFilters.search !== '';

    const activeFilterCount = [
        activeFilters.status !== 'ALL',
        activeFilters.dateRange !== 'ALL',
        activeFilters.search !== ''
    ].filter(Boolean).length;

    return (
        <div className="filter-bar">
            {/* Search Bar */}
            <div className="filter-search-container">
                <div className="search-input-wrapper">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by name or phone..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="filter-search-input"
                    />
                    {searchQuery && (
                        <button
                            className="clear-search-btn"
                            onClick={() => {
                                setSearchQuery('');
                                onFilterChange({ ...activeFilters, search: '' });
                            }}
                        >
                            <FaTimes />
                        </button>
                    )}
                </div>

                {/* Toggle Filters Button (Mobile) */}
                <button
                    className="toggle-filters-btn"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <FaFilter />
                    {activeFilterCount > 0 && (
                        <span className="filter-count-badge">{activeFilterCount}</span>
                    )}
                </button>
            </div>

            {/* Filter Chips Container */}
            <div className={`filter-chips-container ${showFilters ? 'show' : 'hide'}`}>
                {/* Status Filters */}
                <div className="filter-group">
                    <label className="filter-label">Status:</label>
                    <div className="filter-chips">
                        {statusFilters.map(filter => (
                            <button
                                key={filter.value}
                                className={`filter-chip ${activeFilters.status === filter.value ? 'active' : ''}`}
                                onClick={() => handleStatusFilter(filter.value)}
                            >
                                {filter.icon}
                                <span>{filter.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date Range Filters */}
                <div className="filter-group">
                    <label className="filter-label">Date Range:</label>
                    <div className="filter-chips">
                        {dateFilters.map(filter => (
                            <button
                                key={filter.value}
                                className={`filter-chip ${activeFilters.dateRange === filter.value ? 'active' : ''}`}
                                onClick={() => handleDateFilter(filter.value)}
                            >
                                <FaCalendarAlt />
                                <span>{filter.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Clear All & Results Count */}
                <div className="filter-actions">
                    {hasActiveFilters && (
                        <button className="clear-filters-btn" onClick={handleClearFilters}>
                            <FaTimes />
                            <span>Clear All Filters</span>
                        </button>
                    )}
                    <div className="results-count">
                        Showing <strong>{filteredCount}</strong> of <strong>{totalCount}</strong> customers
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
