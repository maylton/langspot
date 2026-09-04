export type PendingAssessmentWrite = {
  id: string;
  attemptId: string;
  questionId: string;
  answer: string;
  createdAt: string;
};

const DB_NAME = 'langspot-assessments';
const STORE_NAME = 'pending-responses';

export function coalescePendingWrites(writes: PendingAssessmentWrite[]): PendingAssessmentWrite[] {
  const latest = new Map<string, PendingAssessmentWrite>();
  writes.forEach((write) => latest.set(`${write.attemptId}:${write.questionId}`, write));
  return [...latest.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueAssessmentWrite(write: PendingAssessmentWrite): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(write);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function listAssessmentWrites(attemptId: string): Promise<PendingAssessmentWrite[]> {
  const database = await openDatabase();
  const writes = await new Promise<PendingAssessmentWrite[]>((resolve, reject) => {
    const request = database.transaction(STORE_NAME).objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as PendingAssessmentWrite[]);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return coalescePendingWrites(writes.filter((write) => write.attemptId === attemptId));
}

export async function removeAssessmentWrite(id: string): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}
