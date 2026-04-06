import React, { useRef } from 'react';
// @ts-ignore – react-player работает без типов
import ReactPlayer from 'react-player';
import './VideoPlayer.css';

interface VideoPlayerProps {
    url: string | null;
    onProgress?: (playedSeconds: number) => void;
    onDuration?: (duration: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, onProgress, onDuration }) => {
    const playerRef = useRef<any>(null);

    if (!url) return <div className="video-placeholder">Нет видео</div>;

    return (
        <div className="video-player-wrapper">
            <ReactPlayer
                ref={playerRef}
                url={url}
                width="100%"
                height="100%"
                controls
                onProgress={(progress: { playedSeconds: number }) => onProgress?.(progress.playedSeconds)}
                onDuration={onDuration}
                style={{ position: 'absolute', top: 0, left: 0 }}
            />
        </div>
    );
};