export type TransitionKind = 'advancing' | 'finalizing';
export type TransitionStatus = 'ready' | TransitionKind;

export interface TransitionLock {
  acquire: (kind: TransitionKind) => boolean;
  release: () => void;
  getStatus: () => TransitionStatus;
}

export function createTransitionLock(): TransitionLock {
  let status: TransitionStatus = 'ready';

  return {
    acquire(kind) {
      if (status !== 'ready') {
        return false;
      }
      status = kind;
      return true;
    },
    release() {
      status = 'ready';
    },
    getStatus() {
      return status;
    },
  };
}

