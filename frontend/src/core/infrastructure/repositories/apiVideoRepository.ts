import { HttpClient } from '../http/httpClient';
import { Analysis } from '../../domain/entities/Analysis';

export class ApiVideoRepository {
    constructor(private http: HttpClient) { }

    async upload(file: File, responseUrl?: string): Promise<Analysis> {
        const formData = new FormData();
        formData.append('data', file);
        if (responseUrl) formData.append('response_url', responseUrl);
        return this.http.postForm<Analysis>('/Klin/upload', formData);
    }

    async getStatus(id: string): Promise<Analysis> {
        return this.http.get<Analysis>(`/Klin/${id}`);
    }

    // Заглушка для получения истории (бэкенд не поддерживает)
    async getHistory(): Promise<Analysis[]> {
        // В реальном проекте был бы GET /Klin/history
        return [];
    }
}