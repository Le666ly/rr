import React, { useRef, useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { BBoxCanvas } from '../components/BBoxCanvas/BBoxCanvas';

export const StreamPage: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const { isConnected, lastEvent, send } = useWebSocket();
    const [streamActive, setStreamActive] = useState(false);

    useEffect(() => {
        if (streamActive) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    if (videoRef.current) videoRef.current.srcObject = stream;
                    // Запуск отправки кадров
                    const interval = setInterval(() => {
                        if (videoRef.current && isConnected) {
                            const canvas = document.createElement('canvas');
                            canvas.width = videoRef.current.videoWidth;
                            canvas.height = videoRef.current.videoHeight;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                                ctx.drawImage(videoRef.current, 0, 0);
                                const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                                send(base64);
                            }
                        }
                    }, 300);
                    return () => clearInterval(interval);
                })
                .catch(err => console.error('Camera error', err));
        }
    }, [streamActive, isConnected, send]);

    const detections = lastEvent?.type === 'YOLO' ? lastEvent.payload.detections.map((d: any) => d.bbox) : null;

    return (
        <div className="stream-page">
            <div className="stream-header">
                <button onClick={() => setStreamActive(!streamActive)}>
                    {streamActive ? 'Остановить' : 'Запустить камеру'}
                </button>
                <div className="ws-status">{isConnected ? 'WebSocket OK' : 'WebSocket OFF'}</div>
            </div>
            <div className="stream-video-wrapper">
                <video ref={videoRef} autoPlay playsInline muted className="stream-video" />
                <BBoxCanvas videoElement={videoRef.current} detections={detections} />
            </div>
        </div>
    );
};