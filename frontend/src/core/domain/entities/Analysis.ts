export type ProcessingState = 'PENDING' | 'FINISHED' | 'ERROR';

export interface MaeEvent {
    time: [number, number];
    class: string;
    confident?: number;
}

export interface Analysis {
    id: string;
    state: ProcessingState;
    predicted_class?: string;
    confidence_percent?: number;
    video_url?: string;
    mae: MaeEvent[] | null;
    yolo: Record<string, number[][][]> | null;
}