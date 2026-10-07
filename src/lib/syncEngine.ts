import { doc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';
import { db, auth, getCurrentUserUID, ensureFirebaseAuth, handleFirestoreError, OperationType } from './firebase';
import { getSQLiteInstance, saveSQLiteToDisk } from './sqlite';

export type SyncStatus = 'ONLINE' | 'OFFLINE' | 'CONNECTING' | 'SYNCING' | 'SYNCED' | 'SYNC_ERROR';

type SyncStatusListener = (status: SyncStatus, details?: string) => void;

export class SyncEngine {
  private status: SyncStatus = 'CONNECTING';
  private statusListeners: SyncStatusListener[] = [];
  private isSyncing = false;
  private syncTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  public getSyncStatus(): SyncStatus {
    return this.status;
  }

  public onSyncStatusChange(fn: SyncStatusListener): () => void {
    this.statusListeners.push(fn);
    fn(this.status);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== fn);
    };
  }

  private setStatus(newStatus: SyncStatus, details?: string) {
    this.status = newStatus;
    this.statusListeners.forEach(fn => fn(newStatus, details));
  }

  private async handleNetworkChange(online: boolean) {
    if (online) {
      this.setStatus('ONLINE', 'Connected');
      await this.startSync();
    } else {
      this.setStatus('OFFLINE', 'Offline mode active');
    }
  }

  public async initializeSync(): Promise<void> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setStatus('OFFLINE', 'Operating offline');
      return;
    }

    this.setStatus('CONNECTING', 'Initializing auth & cloud sync...');
    try {
      await ensureFirebaseAuth();
      this.setStatus('ONLINE', 'Online & authenticated');
      await this.startSync();
    } catch (err) {
      console.warn('Sync initialization auth warning:', err);
      this.setStatus('OFFLINE', 'Auth failed, running locally');
    }
  }

  public async startSync(): Promise<void> {
    if (this.isSyncing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setStatus('OFFLINE');
      return;
    }

    this.isSyncing = true;
    this.setStatus('SYNCING', 'Syncing with Firebase Cloud...');

    try {
      const user = await ensureFirebaseAuth();
      if (!user || !auth.currentUser) {
        this.setStatus('OFFLINE', 'Awaiting Firebase authentication');
        return;
      }

      const uid = auth.currentUser.uid;
      // 1. Upload local pending queue items from sync_queue to Firebase
      await this.syncPendingRecords(uid);

      // 2. Download remote changes from Firebase into SQLite
      await this.downloadRemoteChanges(uid);

      this.setStatus('SYNCED', 'All data synced');
    } catch (err: any) {
      console.error('Sync process error:', err);
      this.setStatus('SYNC_ERROR', err?.message || 'Sync error occurred');
    } finally {
      this.isSyncing = false;
    }
  }

  public stopSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Resolves conflicts between a local record and a remote record based on specified strategy.
   * Default strategy: LAST_WRITE_WINS using ISO timestamp fields.
   */
  public resolveConflicts<T extends { updatedAt?: string; updated_at?: string; createdAt?: string; created_at?: string }>(
    localRecord: T,
    remoteRecord: T,
    strategy: 'LAST_WRITE_WINS' | 'REMOTE_WINS' | 'LOCAL_WINS' = 'LAST_WRITE_WINS'
  ): 'LOCAL' | 'REMOTE' {
    if (strategy === 'REMOTE_WINS') return 'REMOTE';
    if (strategy === 'LOCAL_WINS') return 'LOCAL';

    const localTimeStr = localRecord.updatedAt || localRecord.updated_at || localRecord.createdAt || localRecord.created_at || '0';
    const remoteTimeStr = remoteRecord.updatedAt || remoteRecord.updated_at || remoteRecord.createdAt || remoteRecord.created_at || '0';

    const localTime = new Date(localTimeStr).getTime();
    const remoteTime = new Date(remoteTimeStr).getTime();

    if (isNaN(remoteTime)) return 'LOCAL';
    if (isNaN(localTime)) return 'REMOTE';

    return remoteTime > localTime ? 'REMOTE' : 'LOCAL';
  }

  public async syncPendingRecords(uid: string): Promise<void> {
    if (!auth.currentUser || auth.currentUser.uid !== uid) {
      // Must be authenticated as the target uid to write to users/{uid}
      return;
    }

    const sqlite = await getSQLiteInstance();
    const res = sqlite.exec(`SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY created_at ASC;`);

    if (!res.length || !res[0].values.length) {
      return;
    }

    const rows = res[0].values;
    for (const row of rows) {
      const [queueId, operation, tableName, recordId, payloadStr] = row as [string, string, string, string, string];
      let payload: any = {};
      try {
        payload = JSON.parse(payloadStr);
      } catch (e) {
        console.error('Malformed queue payload:', e);
      }

      let targetPath = `users/${uid}`;
      try {
        if (operation === 'UPSERT') {
          if (tableName === 'users') {
            targetPath = `users/${uid}`;
            await setDoc(doc(db, 'users', uid), payload, { merge: true });
          } else if (tableName === 'conversations') {
            targetPath = `users/${uid}/conversations/${recordId}`;
            await setDoc(doc(db, 'users', uid, 'conversations', recordId), payload, { merge: true });
            sqlite.run(`UPDATE conversations SET is_synced = 1 WHERE id = '${recordId}';`);
          } else if (tableName === 'messages') {
            const convId = payload.conversation_id || 'default';
            targetPath = `users/${uid}/conversations/${convId}/messages/${recordId}`;
            await setDoc(doc(db, 'users', uid, 'conversations', convId, 'messages', recordId), payload, { merge: true });
            sqlite.run(`UPDATE messages SET is_synced = 1 WHERE id = '${recordId}';`);
          } else if (tableName === 'recent_searches') {
            targetPath = `users/${uid}/recentSearches/${recordId}`;
            await setDoc(doc(db, 'users', uid, 'recentSearches', recordId), payload, { merge: true });
            sqlite.run(`UPDATE recent_searches SET is_synced = 1 WHERE id = '${recordId}';`);
          } else if (tableName === 'settings') {
            targetPath = `users/${uid}/settings/preferences`;
            await setDoc(doc(db, 'users', uid, 'settings', 'preferences'), payload, { merge: true });
            sqlite.run(`UPDATE settings SET is_synced = 1 WHERE id = '${recordId}';`);
          }
        } else if (operation === 'DELETE') {
          if (tableName === 'conversations') {
            targetPath = `users/${uid}/conversations/${recordId}`;
            await deleteDoc(doc(db, 'users', uid, 'conversations', recordId));
          } else if (tableName === 'recent_searches') {
            targetPath = `users/${uid}/recentSearches/${recordId}`;
            await deleteDoc(doc(db, 'users', uid, 'recentSearches', recordId));
          }
        }

        // Delete processed item from sync_queue
        sqlite.run(`DELETE FROM sync_queue WHERE id = '${queueId}';`);
      } catch (err: any) {
        console.error(`Failed to sync item ${queueId}:`, err);
        if (err?.code === 'permission-denied' || (err?.message && err.message.includes('permissions'))) {
          try {
            handleFirestoreError(err, OperationType.WRITE, targetPath);
          } catch (wrappedErr) {
            console.error('Handled Firestore permission error:', wrappedErr);
          }
        }
        sqlite.run(`UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = '${queueId}';`);
      }
    }

    await saveSQLiteToDisk();
  }

  public async downloadRemoteChanges(uid: string): Promise<void> {
    if (!auth.currentUser || auth.currentUser.uid !== uid) {
      return;
    }

    const sqlite = await getSQLiteInstance();

    try {
      // 1. Remote conversations
      const convSnap = await getDocs(collection(db, 'users', uid, 'conversations'));
      for (const convDoc of convSnap.docs) {
        const data = convDoc.data();
        const convId = convDoc.id;

        const checkLocal = sqlite.exec(`SELECT updated_at, is_synced FROM conversations WHERE id = '${convId}';`);
        const localExists = checkLocal.length > 0 && checkLocal[0].values.length > 0;

        if (!localExists) {
          sqlite.run(
            `INSERT OR REPLACE INTO conversations (id, firebase_uid, title, category, preview, created_at, updated_at, is_synced)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1);`,
            [convId, uid, data.title || 'Untitled', data.category || 'general', data.preview || '', data.createdAt || new Date().toISOString(), data.updatedAt || new Date().toISOString()]
          );
        } else {
          const localUpdatedAt = String(checkLocal[0].values[0][0] || '');
          const localSynced = Number(checkLocal[0].values[0][1] || 0);

          const decision = this.resolveConflicts(
            { updated_at: localUpdatedAt },
            { updatedAt: data.updatedAt }
          );

          if (decision === 'REMOTE' && localSynced === 1) {
            sqlite.run(
              `UPDATE conversations SET title = ?, category = ?, preview = ?, updated_at = ?, is_synced = 1 WHERE id = ?;`,
              [data.title || 'Untitled', data.category || 'general', data.preview || '', data.updatedAt || new Date().toISOString(), convId]
            );
          }
        }

        // Fetch messages for each conversation
        const msgSnap = await getDocs(collection(db, 'users', uid, 'conversations', convId, 'messages'));
        for (const msgDoc of msgSnap.docs) {
          const mData = msgDoc.data();
          const msgId = msgDoc.id;
          const msgCheck = sqlite.exec(`SELECT updated_at FROM messages WHERE id = '${msgId}';`);
          if (!msgCheck.length || !msgCheck[0].values.length) {
            sqlite.run(
              `INSERT OR REPLACE INTO messages (id, conversation_id, firebase_uid, role, content, image_url, file_name, model_used, grounding_chunks, created_at, updated_at, is_synced)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1);`,
              [
                msgId,
                convId,
                uid,
                mData.role || 'assistant',
                mData.content || '',
                mData.imageUrl || '',
                mData.fileName || '',
                mData.modelUsed || '',
                JSON.stringify(mData.groundingChunks || []),
                mData.createdAt || new Date().toISOString(),
                mData.updatedAt || new Date().toISOString(),
              ]
            );
          }
        }
      }

      // 2. Remote recent searches
      const searchSnap = await getDocs(collection(db, 'users', uid, 'recentSearches'));
      for (const sDoc of searchSnap.docs) {
        const sData = sDoc.data();
        const sId = sDoc.id;
        const sCheck = sqlite.exec(`SELECT id FROM recent_searches WHERE id = '${sId}';`);
        if (!sCheck.length || !sCheck[0].values.length) {
          sqlite.run(
            `INSERT OR REPLACE INTO recent_searches (id, firebase_uid, query, category, preview, status, timestamp, created_at, is_synced)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1);`,
            [sId, uid, sData.query || '', sData.category || 'chat', sData.preview || '', sData.status || 'completed', sData.timestamp || '', sData.createdAt || new Date().toISOString()]
          );
        }
      }

      await saveSQLiteToDisk();
    } catch (err: any) {
      console.warn('Error downloading remote changes:', err);
      if (err?.code === 'permission-denied' || (err?.message && err.message.includes('permissions'))) {
        try {
          handleFirestoreError(err, OperationType.GET, `users/${uid}`);
        } catch (wrappedErr) {
          console.error('Handled Firestore permission error:', wrappedErr);
        }
      }
    }
  }

  public async syncAll(uid?: string): Promise<void> {
    const user = await ensureFirebaseAuth();
    const targetUid = uid || (user ? user.uid : null) || (auth.currentUser ? auth.currentUser.uid : null);
    if (!targetUid) return;
    await this.syncPendingRecords(targetUid);
    await this.downloadRemoteChanges(targetUid);
  }

  public async retryFailedSync(): Promise<void> {
    const user = await ensureFirebaseAuth();
    if (user && auth.currentUser) {
      await this.syncPendingRecords(auth.currentUser.uid);
    }
  }
}

export const syncEngine = new SyncEngine();
export const SyncEngineClass = SyncEngine;

