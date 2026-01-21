import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import { FaTimes, FaCheck } from 'react-icons/fa';
import '../styles/ImageCropper.css';

const ImageCropper = ({ imageSrc, aspect, onCropComplete, onClose }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropChange = (crop) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom) => {
        setZoom(zoom);
    };

    const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const showCroppedImage = useCallback(async () => {
        try {
            console.log('🔄 Starting to crop image...');
            const croppedImage = await getCroppedImg(
                imageSrc,
                croppedAreaPixels
            );
            console.log('✂️ Image cropped successfully, calling onCropComplete');
            onCropComplete(croppedImage);
        } catch (e) {
            console.error('❌ Error cropping image:', e);
            alert("Error cropping image: " + e.message);
        }
    }, [imageSrc, croppedAreaPixels, onCropComplete]);

    return (
        <div className="cropper-overlay" onClick={onClose} style={{ cursor: 'pointer' }}>
            <div className="cropper-container" onClick={(e) => e.stopPropagation()} style={{ cursor: 'default' }}>
                <div className="cropper-header">
                    <h3>Crop Image</h3>
                    <button onClick={(e) => {
                        console.log('Close clicked');
                        e.stopPropagation();
                        onClose();
                    }} className="close-btn"><FaTimes /></button>
                </div>
                <div className="cropper-area">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteCallback}
                        onZoomChange={onZoomChange}
                    />
                </div>
                <div className="cropper-controls">
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(e.target.value)}
                        className="zoom-range"
                    />
                    <button onClick={showCroppedImage} className="crop-btn">
                        <FaCheck /> Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;
