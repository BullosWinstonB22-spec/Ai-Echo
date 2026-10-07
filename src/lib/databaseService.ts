import { getSQLiteInstance, saveSQLiteToDisk, clearLocalSQLiteData } from './sqlite';
import { syncEngine } from './syncEngine';
import { getCurrentUserUID, db } from './firebase';
import { doc, deleteDoc, getDocs, collection } from 'firebase/firestore';
import { UserProfile, ConversationSession, ChatMessage, RecentSearch } from '../types';
import { DEFAULT_PROFILE } from './storageService';

export class DatabaseService {
  private isInitialized = false;

  public async initialize(): Promise<{
    userProfile: UserProfile;
    conversations: ConversationSession[];
    recentSearches: RecentSearch[];
  }> {
    if (!this.isInitialized) {
      await getSQLiteInstance();
      await syncEngine.initializeSync();
      this.isInitialized = true;
    }

    const userProfile = await this.getUser();
    const conversations = await this.getConversations();
    const recentSearches = await this.getRecentSearches();

    return { userProfile, conversations, recentSearches };
  }

  // --- USER PROFILE & SETTINGS ---
  public async getUser(): Promise<UserProfile> {
    const sqlite = await getSQLiteInstance();
    const uid = getCurrentUserUID();

    const uRes = sqlite.exec(`SELECT name, email, avatar FROM users WHERE id = '${uid}' OR firebase_uid = '${uid}';`);
    let name = DEFAULT_PROFILE.name;
    let email = DEFAULT_PROFILE.email;
    let avatarUrl = DEFAULT_PROFILE.avatarUrl;

    if (uRes.length > 0 && uRes[0].values.length > 0) {
      const [rName, rEmail, rAvatar] = uRes[0].values[0];
      if (rName) name = String(rName);
      if (rEmail) email = String(rEmail);
      if (rAvatar) avatarUrl = String(rAvatar);
    }

    // Settings
    const sRes = sqlite.exec(`SELECT setting_key, setting_value FROM settings;`);
    const prefs = { ...DEFAULT_PROFILE.preferences };

    if (sRes.length > 0 && sRes[0].values.length > 0) {
      for (const row of sRes[0].values) {
        const key = String(row[0]);
        const val = row[1];
        if (key === 'themeGlow') prefs.themeGlow = val === 'true' || String(val) === '1';
        if (key === 'glowIntensity') prefs.glowIntensity = Number(val) || 4;
        if (key === 'ttsVoice') prefs.ttsVoice = String(val);
        if (key === 'autoSpeak') prefs.autoSpeak = val === 'true' || String(val) === '1';
        if (key === 'speechRate') prefs.speechRate = Number(val) || 1.0;
        if (key === 'speechPitch') prefs.speechPitch = Number(val) || 1.0;
        if (key === 'soundEffects') prefs.soundEffects = val === 'true' || String(val) === '1';
        if (key === 'hapticFeedback') prefs.hapticFeedback = val === 'true' || String(val) === '1';
        if (key === 'offlineCaching') prefs.offlineCaching = val === 'true' || String(val) === '1';
        if (key === 'selectedAiModel') prefs.selectedAiModel = String(val);
      }
    }

    return {
      name,
      email,
      avatarUrl,
      preferences: prefs,
      memberSince: DEFAULT_PROFILE.memberSince,
      totalQueries: DEFAULT_PROFILE.totalQueries,
    };
  }

  public async saveUser(user: UserProfile): Promise<void> {
    const sqlite = await getSQLiteInstance();
    const uid = getCurrentUserUID();
    const now = new Date().toISOString();

    sqlite.run(
      `INSERT OR REPLACE INTO users (id, firebase_uid, name, email, avatar, updated_at)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [uid, uid, user.name, user.email, user.avatarUrl, now]
    );

    // Save preferences
    for (const [k, v] of Object.entries(user.preferences)) {
      sqlite.run(
        `INSERT OR REPLACE INTO settings (id, firebase_uid, setting_key, setting_value, updated_at, is_synced)
         VALUES (?, ?, ?, ?, ?, 0);`,
        [`${uid}_${k}`, uid, k, String(v), now]
      );
    }

    // Add to sync queue
    const queueId = 'q-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    const payload = JSON.stringify({
      uid,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      preferences: user.preferences,
      updatedAt: now,
    });

    sqlite.run(
      `INSERT INTO sync_queue (id, operation, table_name, record_id, payload, created_at, status)
       VALUES (?, 'UPSERT', 'users', ?, ?, ?, 'pending');`,
      [queueId, uid, payload, now]
    );

    await saveSQLiteToDisk();
    syncEngine.startSync().catch(() => {});
  }

  // --- CONVERSATIONS ---
  public async getConversations(): Promise<ConversationSession[]> {
    const sqlite = await getSQLiteInstance();
    const uid = getCurrentUserUID();
    const cRes = sqlite.exec(
      `SELECT id, title, category, preview, created_at, updated_at FROM conversations 
       WHERE firebase_uid = '${uid}' 
       ORDER BY updated_at DESC;`
    );

    const result: ConversationSession[] = [];
    if (!cRes.length || !cRes[0].values.length) {
      return result;
    }

    for (const row of cRes[0].values) {
      const [id, title, category, preview, createdAt, updatedAt] = row as [string, string, string, string, string, string];
      const messages = await this.getMessages(id);

      result.push({
        id,
        title: title || 'Untitled',
        createdAt: createdAt || new Date().toISOString(),
        updatedAt: updatedAt || new Date().toISOString(),
        category: (category as any) || 'general',
        preview: preview || '',
        messages,
      });
    }

    return result;
  }

  public async getConversation(id: string): Promise<ConversationSession | null> {
    const conversations = await this.getConversations();
    return conversations.find(c => c.id === id) || null;
  }

  public async saveConversation(conv: ConversationSession): Promise<void> {
    const sqlite = await getSQLiteInstance();
    const uid = getCurrentUserUID();
    const now = conv.updatedAt || new Date().toISOString();

    sqlite.run(
      `INSERT OR REPLACE INTO conversations (id, firebase_uid, title, category, preview, created_at, updated_at, is_synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0);`,
      [conv.id, uid, conv.title, conv.category, conv.preview || '', conv.createdAt || now, now]
    );

    // Sync queue item
    const queueId = 'q-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    const payload = JSON.stringify({
      id: conv.id,
      title: conv.title,
      category: conv.category,
      preview: conv.preview,
      createdAt: conv.createdAt,
      updatedAt: now,
    });

    sqlite.run(
      `INSERT INTO sync_queue (id, operation, table_name, record_id, payload, created_at, status)
       VALUES (?, 'UPSERT', 'conversations', ?, ?, ?, 'pending');`,
      [queueId, conv.id, payload, now]
    );

    // Save individual messages
    for (const msg of conv.messages) {
      await this.saveMessage(conv.id, msg);
    }

    await saveSQLiteToDisk();
    syncEngine.startSync().catch(() => {});
  }

  public async updateConversation(conv: ConversationSession): Promise<void> {
    await this.saveConversation(conv);
  }

  public async renameConversation(id: string, newTitle: string): Promise<void> {
    const sqlite = await getSQLiteInstance();
    const uid = getCurrentUserUID();
    const now = new Date().toISOString();

    sqlite.run(`UPDATE conversations SET title = ?, updated_at = ? WHERE id = ? AND firebase_uid = ?;`, [newTitle, now, id, uid]);

    const queueId = 'q-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    const payload = JSON.stringify({
      id,
      title: newTitle,
      updatedAt: now,
    });

    sqlite.run(
      `INSERT INTO sync_queue (id, operation, table_name, record_id, payload, created_at, status)
       VALUES (?, 'UPSERT', 'conversations', ?, ?, ?, 'pending');`,
      [queueId, id, payload, now]
    );

    await saveSQLiteToDisk();
    syncEngine.startSync().catch(() => {});
  }

  public async deleteConversation(id: string): Promise<void> {
    const sqlite = await getSQLiteInstance();
    const now = new Date().toISOString();

    sqlite.run(`DELETE FROM conversations WHERE id = '${id}';`);
    sqlite.run(`DELETE FROM messages WHERE conversation_id = '${id}';`);

    const queueId = 'q-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    sqlite.run(
      `INSERT INTO sync_queue (id, operation, table_name, record_id, payload, created_at, status)
       VALUES (?, 'DELETE', 'conversations', ?, '{}', ?, 'pending');`,
      [queueId, id, now]
    );

    await saveSQLiteToDisk();
    syncEngine.startSync().catch(() => {});
  }

  // --- MESSAGES ---
  public async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const sqlite = await getSQLiteInstance();
    const mRes = sqlite.exec(
      `SELECT id, role, content, created_at, image_url, file_name, model_used, grounding_chunks
       FROM messages WHERE conversation_id = '${conversationId}' ORDER BY created_at ASC;`
    );

    if (!mRes.length || !mRes[0].values.length) {
      return [];
    }

    return mRes[0].values.map(row => {
      const [id, role, content, createdAt, imageUrl, fileName, modelUsed, groundingChunksStr] = row;
      let groundingChunks: any[] | undefined = undefined;
      if (groundingChunksStr && typeof groundingChunksStr === 'string') {
        try {
          groundingChunks = JSON.parse(groundingChunksStr);
        } catch (e) {}
      }

      const dateObj = createdAt ? new Date(String(createdAt)) : new Date();
      const timestampStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return {
        id: String(id),
        role: role as 'user' | 'assistant',
        content: String(content || ''),
        timestamp: timestampStr,
        imageUrl: imageUrl ? String(imageUrl) : undefined,
        fileName: fileName ? String(fileName) : undefined,
        modelUsed: modelUsed ? String(modelUsed) : undefined,
        groundingChunks,
      };
    });
  }

  public async saveMessage(conversationId: string, msg: ChatMessage): Promise<void> {
    const sqlite = await getSQLiteInstance();
    const uid = getCurrentUserUID();
    const now = new Date().toISOString();

    sqlite.run(
      `INSERT OR REPLACE INTO messages (id, conversation_id, firebase_uid, role, content, image_url, file_name, model_used, grounding_chunks, created_at, updated_at, is_synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0);`,
      [
        msg.id,
        conversationId,
        uid,
        msg.role,
        msg.content,
        msg.imageUrl || '',
        msg.fileName || '',
        msg.modelUsed || '',
        JSON.stringify(msg.groundingChunks || []),
        now,
        now,
      ]
    );

    // Update parent conversation preview and updated_at
    const previewText = msg.content.slice(0, 50) + (msg.content.length > 50 ? '...' : '');
    sqlite.run(
      `UPDATE conversations SET preview = ?, updated_at = ? WHERE id = ?;`,
      [previewText, now, conversationId]
    );

    // Enqueue in sync queue
    const queueId = 'q-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    const payload = JSON.stringify({
      id: msg.id,
      conversation_id: conversationId,
      role: msg.role,
      content: msg.content,
      imageUrl: msg.imageUrl || '',
      fileName: msg.fileName || '',
      modelUsed: msg.modelUsed || '',
      groundingChunks: msg.groundingChunks || [],
      createdAt: now,
      updatedAt: now,
    });

    sqlite.run(
      `INSERT INTO sync_queue (id, operation, table_name, record_id, payload, created_at, status)
       VALUES (?, 'UPSERT', 'messages', ?, ?, ?, 'pending');`,
      [queueId, msg.id, payload, now]
    );

    await saveSQLiteToDisk();
    syncEngine.startSync().catch(() => {});
  }

  public async updateMessage(msg: ChatMessage, conversationId: string): Promise<void> {
    await this.saveMessage(conversationId, msg);
  }

  public async deleteMessage(id: string): Promise<void> {
    const sqlite = await getSQLiteInstance();
    sqlite.run(`DELETE FROM messages WHERE id = '${id}';`);
    await saveSQLiteToDisk();
  }

  // --- RECENT SEARCHES ---
  public async getRecentSearches(): Promise<RecentSearch[]> {
    const sqlite = await getSQLiteInstance();
    const uid = getCurrentUserUID();
    const sRes = sqlite.exec(
      `SELECT id, query, category, preview, status, timestamp FROM recent_searches 
       WHERE firebase_uid = '${uid}' 
       ORDER BY created_at DESC;`
    );

    if (!sRes.length || !sRes[0].values.length) {
      return [];
    }

    return sRes[0].values.map(row => {
      const [id, query, category, preview, status, timestamp] = row;
      return {
        id: String(id),
        query: String(query || ''),
        category: (category as any) || 'chat',
        preview: String(preview || ''),
        status: (status as any) || 'completed',
        timestamp: String(timestamp || new Date().toLocaleTimeString()),
      };
    });
  }

  public async saveRecentSearch(search: Omit<RecentSearch, 'id' | 'timestamp'> & { id?: string }): Promise<void> {
    const sqlite = await getSQLiteInstance();
    const uid = getCurrentUserUID();
    const id = search.id || 'search-' + Date.now();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const now = new Date().toISOString();

    sqlite.run(
      `INSERT OR REPLACE INTO recent_searches (id, firebase_uid, query, category, preview, status, timestamp, created_at, is_synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0);`,
      [id, uid, search.query, search.category, search.preview, search.status, timestamp, now]
    );

    const queueId = 'q-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    const payload = JSON.stringify({
      id,
      query: search.query,
      category: search.category,
      preview: search.preview,
      status: search.status,
      timestamp,
      createdAt: now,
    });

    sqlite.run(
      `INSERT INTO sync_queue (id, operation, table_name, record_id, payload, created_at, status)
       VALUES (?, 'UPSERT', 'recent_searches', ?, ?, ?, 'pending');`,
      [queueId, id, payload, now]
    );

    await saveSQLiteToDisk();
    syncEngine.startSync().catch(() => {});
  }

  public async deleteRecentSearch(id: string): Promise<void> {
    const sqlite = await getSQLiteInstance();
    const now = new Date().toISOString();

    sqlite.run(`DELETE FROM recent_searches WHERE id = '${id}';`);

    const queueId = 'q-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    sqlite.run(
      `INSERT INTO sync_queue (id, operation, table_name, record_id, payload, created_at, status)
       VALUES (?, 'DELETE', 'recent_searches', ?, '{}', ?, 'pending');`,
      [queueId, id, now]
    );

    await saveSQLiteToDisk();
    syncEngine.startSync().catch(() => {});
  }

  // --- SETTINGS ---
  public async getSettings(): Promise<Record<string, string>> {
    const sqlite = await getSQLiteInstance();
    const res = sqlite.exec(`SELECT setting_key, setting_value FROM settings;`);
    const out: Record<string, string> = {};
    if (res.length && res[0].values.length) {
      for (const row of res[0].values) {
        out[String(row[0])] = String(row[1]);
      }
    }
    return out;
  }

  public async saveSettings(key: string, value: string): Promise<void> {
    const sqlite = await getSQLiteInstance();
    const uid = getCurrentUserUID();
    const now = new Date().toISOString();

    sqlite.run(
      `INSERT OR REPLACE INTO settings (id, firebase_uid, setting_key, setting_value, updated_at, is_synced)
       VALUES (?, ?, ?, ?, ?, 0);`,
      [`${uid}_${key}`, uid, key, value, now]
    );

    await saveSQLiteToDisk();
  }

  // --- SYNC QUEUE MANAGEMENT ---
  public async getPendingSyncItems(): Promise<any[]> {
    const sqlite = await getSQLiteInstance();
    const res = sqlite.exec(`SELECT * FROM sync_queue WHERE status = 'pending';`);
    if (!res.length || !res[0].values.length) return [];
    return res[0].values;
  }

  public async markAsSynced(tableName: string, recordId: string): Promise<void> {
    const sqlite = await getSQLiteInstance();
    sqlite.run(`UPDATE ${tableName} SET is_synced = 1 WHERE id = '${recordId}';`);
    await saveSQLiteToDisk();
  }

  public async sync(): Promise<void> {
    await syncEngine.startSync();
  }

  // --- DATA MANAGEMENT ---
  public async clearLocalCache(): Promise<void> {
    await clearLocalSQLiteData();
  }

  public async deleteCloudData(): Promise<void> {
    const uid = getCurrentUserUID();
    try {
      // Delete user subcollections
      const convs = await getDocs(collection(db, 'users', uid, 'conversations'));
      for (const c of convs.docs) {
        await deleteDoc(doc(db, 'users', uid, 'conversations', c.id));
      }
      const searches = await getDocs(collection(db, 'users', uid, 'recentSearches'));
      for (const s of searches.docs) {
        await deleteDoc(doc(db, 'users', uid, 'recentSearches', s.id));
      }
      await deleteDoc(doc(db, 'users', uid, 'settings', 'preferences'));
      await deleteDoc(doc(db, 'users', uid));
    } catch (e) {
      console.error('Error deleting cloud data:', e);
      throw e;
    }
  }
}

export const databaseService = new DatabaseService();
