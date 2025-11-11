import { openDB } from 'idb';

const DB_NAME = 'retflow-db';
const STORE_NAME = 'videos';

export interface VideoData {
  id: string;
  name: string;
  url: string;
  timestamp: number;
}

export async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

export async function saveVideo(video: VideoData) {
  const db = await initDB();
  await db.put(STORE_NAME, video);
}

export async function getVideo(id: string): Promise<VideoData | undefined> {
  const db = await initDB();
  return db.get(STORE_NAME, id);
}

export async function deleteVideo(id: string) {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
}

export async function getAllVideos(): Promise<VideoData[]> {
  const db = await initDB();
  return db.getAll(STORE_NAME);
}
