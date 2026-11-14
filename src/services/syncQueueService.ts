/**
 * DO OR DIE - Spare Parts Inventory Suite
 * Persistent Offline Sync Queue & Auto-Retry Engine (Phase 6)
 *
 * Guarantees zero data loss:
 * 1. Safely stores unsynced operations in localStorage ('spareparts_sync_queue_v1')
 * 2. Deduplicates rapid consecutive updates to the same product ID
 * 3. Automatically flushes and retries with exponential backoff when connection returns
 * 4. Broadcasts reactive sync status: pendingCount, isSyncing, lastSyncedAt, lastError
 */

export type SyncAction = 'upsert' | 'archive' | 'delete' | 'batch_upsert';

export interface SyncJob {
  id: string;              // unique job id (e.g. job-1699999999)
  action: SyncAction;
  partId: string;          // permanent product SKU / ID (e.g. DX-000001)
  data: any;               // product payload with all 11 columns
  timestamp: number;       // creation time in ms
  updatedAt: number;       // last update time
  attempts: number;        // retry count
  status: 'pending' | 'processing' | 'failed';
  lastError?: string;
}

export interface SyncStatus {
  isOnline: boolean;
  isConnected: boolean;
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
  lastSyncedAt: string | null;
  lastError: string | null;
  revision?: string;
}

type SyncStatusListener = (status: SyncStatus) => void;
type JobProcessor = (job: SyncJob) => Promise<{ success: boolean; message?: string }>;

const STORAGE_KEY_QUEUE = 'spareparts_sync_queue_v1';
const STORAGE_KEY_STATUS = 'spareparts_sync_status_v1';
const MAX_ATTEMPTS = 5;
const BASE_RETRY_DELAY_MS = 2000;

export class SyncQueueService {
  private static listeners: Set<SyncStatusListener> = new Set();
  private static processor: JobProcessor | null = null;
  private static isProcessing = false;
  private static timerId: any = null;

  private static currentStatus: SyncStatus = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isConnected: true,
    isSyncing: false,
    pendingCount: 0,
    failedCount: 0,
    lastSyncedAt: null,
    lastError: null
  };

  /**
   * Initialize queue and register online/offline listeners
   */
  public static init(jobProcessor: JobProcessor) {
    this.processor = jobProcessor;
    this.loadInitialStatus();
    this.updateCounts();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.currentStatus.isOnline = true;
        this.notify();
        this.processQueue();
      });

      window.addEventListener('offline', () => {
        this.currentStatus.isOnline = false;
        this.notify();
      });
    }

    // Attempt processing on boot if online
    if (this.currentStatus.isOnline) {
      setTimeout(() => this.processQueue(), 1500);
    }
  }

  public static subscribe(listener: SyncStatusListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public static getStatus(): SyncStatus {
    return { ...this.currentStatus };
  }

  private static loadInitialStatus() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_STATUS);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.currentStatus.lastSyncedAt = parsed.lastSyncedAt || null;
      }
    } catch {}
  }

  private static saveStatus() {
    try {
      localStorage.setItem(STORAGE_KEY_STATUS, JSON.stringify({
        lastSyncedAt: this.currentStatus.lastSyncedAt
      }));
    } catch {}
  }

  public static getQueue(): SyncJob[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_QUEUE);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  private static saveQueue(queue: SyncJob[]) {
    try {
      localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(queue));
    } catch (e) {
      console.error('[SyncQueue] Failed to save queue to localStorage:', e);
    }
    this.updateCounts();
  }

  private static updateCounts() {
    const queue = this.getQueue();
    this.currentStatus.pendingCount = queue.filter(j => j.status === 'pending' || j.status === 'processing').length;
    this.currentStatus.failedCount = queue.filter(j => j.status === 'failed').length;
    this.notify();
  }

  private static notify() {
    const status = this.getStatus();
    this.listeners.forEach(l => l(status));
  }

  /**
   * Enqueue a sync job.
   * If a pending job for the same partId and action already exists, coalesces data into 1 job to avoid duplicate network calls.
   */
  public static enqueue(action: SyncAction, partId: string, data: any): SyncJob {
    const queue = this.getQueue();
    const now = Date.now();

    // Check for existing pending job for this part
    const existingIdx = queue.findIndex(j => j.partId === partId && j.status !== 'processing');

    let job: SyncJob;
    if (existingIdx >= 0) {
      const existing = queue[existingIdx];
      job = {
        ...existing,
        action,
        data: { ...existing.data, ...data },
        updatedAt: now,
        status: 'pending'
      };
      queue[existingIdx] = job;
    } else {
      job = {
        id: `job-${now}-${Math.random().toString(36).slice(2, 7)}`,
        action,
        partId,
        data,
        timestamp: now,
        updatedAt: now,
        attempts: 0,
        status: 'pending'
      };
      queue.push(job);
    }

    this.saveQueue(queue);
    console.log(`[SyncQueue] Enqueued ${action} for ${partId}. Queue size: ${queue.length}`);

    // Trigger processing if online
    if (this.currentStatus.isOnline) {
      this.processQueue();
    }

    return job;
  }

  /**
   * Process all pending jobs in order
   */
  public static async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    if (!this.processor) {
      console.warn('[SyncQueue] No processor registered');
      return;
    }
    if (!this.currentStatus.isOnline) {
      console.log('[SyncQueue] Offline - holding queue');
      return;
    }

    const queue = this.getQueue();
    const pending = queue.filter(j => j.status === 'pending');
    if (pending.length === 0) return;

    this.isProcessing = true;
    this.currentStatus.isSyncing = true;
    this.notify();

    try {
      for (const job of pending) {
        if (!this.currentStatus.isOnline) break;

        // Mark as processing
        job.status = 'processing';
        this.saveQueue(queue);

        try {
          const res = await this.processor(job);
          if (res && res.success) {
            // Remove successful job from queue
            const updatedQueue = this.getQueue().filter(j => j.id !== job.id);
            this.saveQueue(updatedQueue);
            this.currentStatus.lastSyncedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            this.currentStatus.isConnected = true;
            this.currentStatus.lastError = null;
            this.saveStatus();
          } else {
            job.attempts += 1;
            job.lastError = res?.message || 'Remote sync failed';
            job.status = job.attempts >= MAX_ATTEMPTS ? 'failed' : 'pending';
            this.saveQueue(queue);
          }
        } catch (err: any) {
          job.attempts += 1;
          job.lastError = err?.message || 'Network exception';
          job.status = job.attempts >= MAX_ATTEMPTS ? 'failed' : 'pending';
          this.currentStatus.lastError = job.lastError || null;
          this.currentStatus.isConnected = false;
          this.saveQueue(queue);

          // Wait backoff before next attempt
          const delay = BASE_RETRY_DELAY_MS * Math.pow(1.5, Math.min(job.attempts, 4));
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    } finally {
      this.isProcessing = false;
      this.currentStatus.isSyncing = false;
      this.updateCounts();
    }
  }

  /**
   * Manually retry all failed jobs
   */
  public static retryFailed() {
    const queue = this.getQueue();
    queue.forEach(j => {
      if (j.status === 'failed') {
        j.status = 'pending';
        j.attempts = 0;
      }
    });
    this.saveQueue(queue);
    this.processQueue();
  }

  /**
   * Clear queue (only used when user explicitly formats database)
   */
  public static clearQueue() {
    this.saveQueue([]);
    this.currentStatus.lastError = null;
    this.notify();
  }

  public static setConnectionStatus(connected: boolean, lastError: string | null = null) {
    this.currentStatus.isConnected = connected;
    if (lastError !== null) this.currentStatus.lastError = lastError;
    this.notify();
  }
}
