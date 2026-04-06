import React, { useState, useRef, useEffect } from 'react';
import { VideoPlayer } from '../components/VideoPlayer/VideoPlayer';
import { BBoxCanvas } from '../components/BBoxCanvas/BBoxCanvas';
import { Timeline } from '../components/Timeline/Timeline';
import { LogPanel } from '../components/LogPanel/LogPanel';
import { HistoryList } from '../components/HistoryList/HistoryList';
import { ApiVideoRepository } from '../core/infrastructure/repositories/apiVideoRepository';
import { ApiFeedbackRepository } from '../core/infrastructure/repositories/apiFeedbackRepository';
import { LocalStorageHistoryRepository } from '../core/infrastructure/repositories/localStorageHistoryRepository';
import { HttpClient } from '../core/infrastructure/http/httpClient';
import { uploadVideo } from '../core/application/usecases/uploadVideo';
import { getAnalysisStatus } from '../core/application/usecases/getAnalysisStatus';
import { getHistory } from '../core/application/usecases/getHistory';
import { sendFeedback } from '../core/application/usecases/sendFeedback';
import { Analysis } from '../core/domain/entities/Analysis';
import { HistoryItem } from '../core/domain/entities/HistoryItem';

const http = new HttpClient();
const videoRepo = new ApiVideoRepository(http);
const feedbackRepo = new ApiFeedbackRepository(http);
const historyRepo = new LocalStorageHistoryRepository();

export const UploadPage: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [url, setUrl] = useState('');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<Analysis | null>(null);
    const [logs, setLogs] = useState<{ time: string; msg: string }[]>([]);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const videoRef = useRef<HTMLVideoElement>(null);

    const addLog = (msg: string) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { time, msg }].slice(-50));
    };

    const loadHistory = async () => {
        const items = await getHistory(historyRepo);
        setHistory(items);
    };

    const loadAnalysisById = async (id: string) => {
        try {
            addLog(`Загрузка анализа ${id}...`);
            const analysis = await getAnalysisStatus(videoRepo, id);
            setResult(analysis);
            if (analysis.video_url) setVideoUrl(analysis.video_url);
            addLog('Данные восстановлены');
        } catch (err: any) {
            addLog(`Ошибка: ${err.message}`);
        }
    };

    const handleUpload = async () => {
        if (!file && !url) return;
        setLoading(true);
        setResult(null);
        addLog('Отправка на сервер...');

        try {
            let sourceFile = file;
            if (!sourceFile && url) {
                const response = await fetch(url);
                const blob = await response.blob();
                sourceFile = new File([blob], 'video.mp4', { type: blob.type });
            }
            if (!sourceFile) throw new Error('Не удалось получить видео');

            const analysis = await uploadVideo(videoRepo, sourceFile, (status) => {
                addLog(`Статус: ${status.state}`);
                if (status.state === 'FINISHED') setResult(status);
                if (status.state === 'ERROR') addLog('Ошибка обработки');
            });

            const newHistoryItem: HistoryItem = {
                id: analysis.id,
                timestamp: new Date().toLocaleString(),
                sourceName: file?.name || url,
                feedbackStatus: null,
            };
            historyRepo.addItem(newHistoryItem);
            await loadHistory();

            if (analysis.video_url) setVideoUrl(analysis.video_url);
            setResult(analysis);
            addLog('Анализ завершён');
        } catch (err: any) {
            addLog(`Ошибка: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleFeedback = async (id: string, isConfirmed: boolean) => {
        await sendFeedback(feedbackRepo, historyRepo, id, isConfirmed);
        await loadHistory();
        addLog(isConfirmed ? 'Фидбек отправлен' : 'Инцидент отклонён');
    };

    const currentBBoxes = (): Array<[number, number, number, number]> | null => {
        if (!result?.yolo) return null;
        const secondKey = Math.floor(currentTime).toString();
        const boxes = result.yolo[secondKey];
        if (!boxes || boxes.length === 0) return null;

        const bboxes: Array<[number, number, number, number]> = [];
        for (const detection of boxes) {
            // detection – это массив, где первый элемент – массив bbox [x1,y1,x2,y2]
            if (Array.isArray(detection) && detection.length > 0) {
                const bbox = detection[0];
                if (Array.isArray(bbox) && bbox.length === 4) {
                    bboxes.push([bbox[0], bbox[1], bbox[2], bbox[3]]);
                }
            }
        }
        return bboxes.length > 0 ? bboxes : null;
    };

    useEffect(() => {
        loadHistory();
    }, []);

    return (
        <div className="upload-page">
            <div className="upload-controls">
                <input type="file" accept="video/*" onChange={e => setFile(e.target.files?.[0] || null)} />
                <input type="text" placeholder="Ссылка на видео" value={url} onChange={e => setUrl(e.target.value)} />
                <button onClick={handleUpload} disabled={loading}>{loading ? 'Обработка...' : 'Запустить анализ'}</button>
            </div>

            <div className="video-container">
                <VideoPlayer url={videoUrl} onProgress={setCurrentTime} onDuration={setDuration} />
                <BBoxCanvas videoElement={videoRef.current} detections={currentBBoxes()} />
                {result?.mae && duration > 0 && (
                    <Timeline events={result.mae} duration={duration} currentTime={currentTime} onSeek={t => {
                        if (videoRef.current) videoRef.current.currentTime = t;
                    }} />
                )}
            </div>

            <div className="side-panels">
                <LogPanel logs={logs} onClear={() => setLogs([])} />
                <HistoryList items={history} onLoad={loadAnalysisById} onFeedback={handleFeedback} />
            </div>
        </div>
    );
};