import { useEffect, useRef, useState } from 'react';
import { ApiStreamRepository } from '../core/infrastructure/repositories/apiStreamRepository';
import { startStream, stopStream } from '../core/application/usecases/streamUseCases';

export function useWebSocket() {
    const [isConnected, setIsConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState<any>(null);
    const repoRef = useRef<ApiStreamRepository | null>(null);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        const repo = new ApiStreamRepository();
        repoRef.current = repo;

        startStream(repo, (event) => {
            setLastEvent(event);
        }).then((unsubscribe) => {
            unsubscribeRef.current = unsubscribe;
            setIsConnected(true);
        }).catch(err => {
            console.error('WebSocket connection failed', err);
            setIsConnected(false);
        });

        return () => {
            if (unsubscribeRef.current) unsubscribeRef.current();
            stopStream(repo);
            setIsConnected(false);
        };
    }, []);

    const send = (frameBase64: string) => {
        if (repoRef.current && isConnected) {
            repoRef.current.sendFrame(frameBase64);
        }
    };

    return { isConnected, lastEvent, send };
}