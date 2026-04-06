import { LocalStorageHistoryRepository } from '../../infrastructure/repositories/localStorageHistoryRepository';
import { HistoryItem } from '../../domain/entities/HistoryItem';

export async function getHistory(
    historyRepo: LocalStorageHistoryRepository
): Promise<HistoryItem[]> {
    return historyRepo.getHistory();
}