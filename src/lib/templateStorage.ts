// Template storage utility using IndexedDB (client-side storage)

const DB_NAME = 'FaceAttendDB';
const DB_VERSION = 2; // Incremented to support multiple templates
const STORE_NAME = 'templates';
const TEMPLATE_LIST_KEY = 'template_list';
const SELECTED_TEMPLATE_KEY = 'selected_template_id';

export interface TemplateInfo {
    id: string;
    name: string;
    uploadedAt: number;
    size: number;
}

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

    async saveTemplate(file: File, templateId?: string): Promise<string> {
        try {
            const db = await this.openDB();
            const arrayBuffer = await file.arrayBuffer();
            const id = templateId || `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Save template file
            await new Promise<void>((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put(arrayBuffer, id);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });

            // Update template list
            const templates = await this.getAllTemplates();
            const templateInfo: TemplateInfo = {
                id,
                name: file.name,
                uploadedAt: Date.now(),
                size: file.size,
            };

            // Remove old template with same ID if exists
            const existingIndex = templates.findIndex(t => t.id === id);
            if (existingIndex >= 0) {
                templates[existingIndex] = templateInfo;
            } else {
                templates.push(templateInfo);
            }

            // Save template list
            await new Promise<void>((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put(JSON.stringify(templates), TEMPLATE_LIST_KEY);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });

            return id;
        } catch (error) {
            console.error('Error saving template:', error);
            throw error;
        }
    }

    async getTemplate(templateId?: string): Promise<ArrayBuffer | null> {
        try {
            const db = await this.openDB();
            const id = templateId || await this.getSelectedTemplateId();

            if (!id) {
                // Fallback to old single template key for backward compatibility
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction([STORE_NAME], 'readonly');
                    const store = transaction.objectStore(STORE_NAME);
                    const request = store.get('report_template');

                    request.onsuccess = () => {
                        resolve(request.result || null);
                    };
                    request.onerror = () => reject(request.error);
                });
            }

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(id);

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

    async getAllTemplates(): Promise<TemplateInfo[]> {
        try {
            const db = await this.openDB();

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(TEMPLATE_LIST_KEY);

                request.onsuccess = () => {
                    const data = request.result;
                    if (data) {
                        try {
                            resolve(JSON.parse(data));
                        } catch {
                            resolve([]);
                        }
                    } else {
                        resolve([]);
                    }
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error getting template list:', error);
            return [];
        }
    }

    async setSelectedTemplate(templateId: string): Promise<void> {
        try {
            localStorage.setItem(SELECTED_TEMPLATE_KEY, templateId);
        } catch (error) {
            console.error('Error setting selected template:', error);
        }
    }

    async getSelectedTemplateId(): Promise<string | null> {
        try {
            return localStorage.getItem(SELECTED_TEMPLATE_KEY);
        } catch (error) {
            console.error('Error getting selected template:', error);
            return null;
        }
    }

    async hasTemplate(): Promise<boolean> {
        const templates = await this.getAllTemplates();
        return templates.length > 0;
    }

    async deleteTemplate(templateId: string): Promise<void> {
        try {
            const db = await this.openDB();

            // Delete template file
            await new Promise<void>((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.delete(templateId);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });

            // Remove from template list
            const templates = await this.getAllTemplates();
            const updatedTemplates = templates.filter(t => t.id !== templateId);

            await new Promise<void>((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put(JSON.stringify(updatedTemplates), TEMPLATE_LIST_KEY);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });

            // If deleted template was selected, clear selection
            const selectedId = await this.getSelectedTemplateId();
            if (selectedId === templateId) {
                localStorage.removeItem(SELECTED_TEMPLATE_KEY);
            }
        } catch (error) {
            console.error('Error deleting template:', error);
            throw error;
        }
    }
}

export const templateStorage = new TemplateStorage();

