import { createDemoExpenseRepository } from './demoExpenseRepository';
import { createFirestoreExpenseRepository } from './firestoreExpenseRepository';

export function createExpenseRepository({ isDemoMode, currentUserId, db, appId }) {
  if (isDemoMode) {
    return createDemoExpenseRepository();
  }

  if (!currentUserId) {
    return null;
  }

  return createFirestoreExpenseRepository({
    db,
    appId,
    currentUserId
  });
}

export { createDemoExpenseRepository, createFirestoreExpenseRepository };
