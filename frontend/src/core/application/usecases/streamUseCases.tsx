import { ApiStreamRepository } from '../../infrastructure/repositories/apiStreamRepository';

export async function startStream(
    streamRepo: ApiStreamRepository,
    onEvent: (event: any) => void
): Promise<() => void> {
    const wsUrl = `${import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8008/ws'}/stream`;
    await streamRepo.connect(wsUrl);
    const unsubscribe = streamRepo.onEvent(onEvent);
    return unsubscribe;
}

export function stopStream(streamRepo: ApiStreamRepository): void {
    streamRepo.disconnect();
}