import { WebSocketClient } from '../websocket/webSocketClient';
import { StreamEvent } from '../../domain/entities/StreamEvent';

export class ApiStreamRepository {
    private wsClient: WebSocketClient | null = null;

    connect(url: string): Promise<void> {
        this.wsClient = new WebSocketClient(url);
        return this.wsClient.connect();
    }

    disconnect(): void {
        this.wsClient?.disconnect();
        this.wsClient = null;
    }

    sendFrame(frameBase64: string): void {
        this.wsClient?.send(JSON.stringify({ image: frameBase64 }));
    }

    onEvent(callback: (event: StreamEvent) => void): () => void {
        if (!this.wsClient) throw new Error('Not connected');
        return this.wsClient.onMessage((data) => {
            try {
                const event = JSON.parse(data) as StreamEvent;
                callback(event);
            } catch (e) {
                console.error('Failed to parse WebSocket message', e);
            }
        });
    }

    isConnected(): boolean {
        return this.wsClient?.isConnected() ?? false;
    }
}