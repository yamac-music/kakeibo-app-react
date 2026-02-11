import { beforeEach, describe, expect, it } from 'vitest';
import { createDemoExpenseRepository } from '../features/expenses/repositories';
import { buildExpenseFingerprint } from '../features/expenses';

describe('v2.1 家計データ運用機能', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('月次締めを保存できる', async () => {
    const repo = createDemoExpenseRepository();

    await repo.saveMonthClosure({
      monthKey: '2026-02',
      closureRecord: {
        status: 'closed',
        closedAt: '2026-02-28T12:00:00.000Z',
        closedBy: 'test-user',
        settlementSnapshot: {
          amount: 1200,
          fromPayerId: 'user1',
          toPayerId: 'user2'
        },
        totalsSnapshot: {
          user1Total: 3200,
          user2Total: 800,
          totalExpense: 4000,
          categories: {
            食費: 4000
          }
        },
        reopenHistory: []
      }
    });

    const closure = repo.getSnapshot().settings.monthClosures['2026-02'];
    expect(closure.status).toBe('closed');
    expect(closure.settlementSnapshot.amount).toBe(1200);
  });

  it('月次締め解除時に理由履歴が残る', async () => {
    const repo = createDemoExpenseRepository();

    await repo.saveMonthClosure({
      monthKey: '2026-02',
      closureRecord: {
        status: 'closed',
        closedAt: '2026-02-28T12:00:00.000Z',
        closedBy: 'test-user',
        settlementSnapshot: null,
        totalsSnapshot: null,
        reopenHistory: []
      }
    });

    await repo.reopenMonth({
      monthKey: '2026-02',
      reason: '入力漏れを追加するため'
    });

    const closure = repo.getSnapshot().settings.monthClosures['2026-02'];
    expect(closure.status).toBe('open');
    expect(closure.reopenHistory).toHaveLength(1);
    expect(closure.reopenHistory[0].reason).toBe('入力漏れを追加するため');
  });

  it('dryRun インポートでは実データを書き込まない', async () => {
    const repo = createDemoExpenseRepository();

    const result = await repo.importData({
      rawData: {
        version: '2.1',
        expenses: [
          {
            description: 'テスト支出',
            amount: 1000,
            category: '食費',
            payerId: 'user1',
            date: '2026-02-10'
          }
        ]
      },
      fallbackSettings: repo.getSnapshot().settings,
      options: {
        dryRun: true,
        skipDuplicates: true
      }
    });

    expect(result.success).toBe(true);
    expect(result.dryRun).toBe(true);
    expect(result.importedCount).toBe(1);
    expect(repo.getSnapshot().expenses).toHaveLength(0);
  });

  it('fingerprint 重複時にスキップできる', async () => {
    const repo = createDemoExpenseRepository();
    const settings = repo.getSnapshot().settings;

    await repo.saveExpense({
      expense: {
        description: 'スーパー',
        amount: 2300,
        category: '食費',
        payerId: 'user1',
        date: '2026-02-10'
      },
      settings
    });

    const result = await repo.importData({
      rawData: {
        version: '2.1',
        expenses: [
          {
            description: 'スーパー',
            amount: 2300,
            category: '食費',
            payerId: 'user1',
            date: '2026-02-10'
          }
        ]
      },
      fallbackSettings: repo.getSnapshot().settings,
      options: {
        dryRun: false,
        skipDuplicates: true
      }
    });

    expect(result.success).toBe(true);
    expect(result.importedCount).toBe(0);
    expect(result.duplicateCount).toBe(1);
    expect(repo.getSnapshot().expenses).toHaveLength(1);
  });

  it('fingerprint は同一内容を同じキーに正規化する', () => {
    const a = buildExpenseFingerprint({
      description: '  スーパー  ',
      amount: 2300,
      category: '食費',
      payerId: 'user1',
      date: '2026-02-10'
    });
    const b = buildExpenseFingerprint({
      description: 'スーパー',
      amount: '2300',
      category: '食費',
      payerId: 'user1',
      date: '2026-02-10'
    });
    expect(a).toBe(b);
  });
});

