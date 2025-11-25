// Template storage utility using IndexedDB (client-side storage)

const DB_NAME = 'FaceAttendDB';
const DB_VERSION = 1;
const STORE_NAME = 'templates';
const TEMPLATE_KEY = 'report_template';

export class TemplateStorage {
    private db: IDBDatabase | null = null;

    private async openDB(): Promise<IDBDatabase> {
        if (this.db) {
            return this.db;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(request.result);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
        });
    }

    async saveTemplate(file: File): Promise<void> {
        try {
            const db = await this.openDB();
            const arrayBuffer = await file.arrayBuffer();

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put(arrayBuffer, TEMPLATE_KEY);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error saving template:', error);
            throw error;
        }
    }

    async getTemplate(): Promise<ArrayBuffer | null> {
        try {
            const db = await this.openDB();

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(TEMPLATE_KEY);

                request.onsuccess = () => {
                    resolve(request.result || null);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error getting template:', error);
            return null;
        }
    }

    async hasTemplate(): Promise<boolean> {
        const template = await this.getTemplate();
        return template !== null;
    }

    async deleteTemplate(): Promise<void> {
        try {
            const db = await this.openDB();

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.delete(TEMPLATE_KEY);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error deleting template:', error);
            throw error;
        }
    }
}

export const templateStorage = new TemplateStorage();

