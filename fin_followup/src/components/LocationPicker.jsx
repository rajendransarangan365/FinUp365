import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { FaMapMarkerAlt, FaCheck } from 'react-icons/fa';

// Fix for default marker icon in Leaflet with React
// -----------------------------------------------------------
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;
// -----------------------------------------------------------

const LocationPicker = ({ onClose, onConfirm }) => {
    // Default to a central location (e.g., India or user's current location)
    // Using simple default implementation: India center approx
    const [position, setPosition] = useState([20.5937, 78.9629]);
    const [zoom, setZoom] = useState(5);
    const [hasLocation, setHasLocation] = useState(false);

    // Component to handle map clicks
    const LocationMarker = () => {
        useMapEvents({
            click(e) {
                setPosition([e.latlng.lat, e.latlng.lng]);
                setHasLocation(true);
            },
        });

        return hasLocation ? <Marker position={position} /> : null;
    };

    // Try to get user's current location on mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition([pos.coords.latitude, pos.coords.longitude]);
                    setZoom(13);
                    setHasLocation(true);
                },
                (err) => console.log("Geolocation denied or error:", err)
            );
        }
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '600px',
                height: '80vh',
                background: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
            }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#333' }}>Pick Location</h3>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: '0 8px' }}
                    >
                        &times;
                    </button>
                </div>

                <div style={{ flex: 1, position: 'relative' }}>
                    <MapContainer center={position} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker />
                        {/* Re-center map when position changes programmatically from geolocation */}
                        <RecenterMap position={position} zoom={zoom} />
                    </MapContainer>
                </div>

                <div style={{ padding: '16px', background: 'white', borderTop: '1px solid #eee' }}>
                    <button
                        onClick={() => {
                            if (hasLocation) {
                                onConfirm({ lat: position[0], lng: position[1] });
                            } else {
                                alert("Please tap on the map to set a location marker.");
                            }
                        }}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: hasLocation ? '#4318FF' : '#ccc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            cursor: hasLocation ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                        disabled={!hasLocation}
                    >
                        <FaCheck /> Confirm Location
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper to update map view
const RecenterMap = ({ position, zoom }) => {
    const map = useMapEvents({});
    useEffect(() => {
        map.setView(position, zoom);
    }, [position, zoom, map]);
    return null;
};

export default LocationPicker;
