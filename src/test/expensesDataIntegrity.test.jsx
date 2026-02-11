import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDemoExpenseRepository } from '../features/expenses/repositories'
import { calculateSettlement, calculateTotals } from '../features/expenses/calculations'
import { commitInChunks } from '../features/expenses/importExport'

describe('家計データ運用の整合性', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('デモモードで予算保存後に再読み込みしても保持される', async () => {
    const repo1 = createDemoExpenseRepository()

    await repo1.saveBudgets({
      '2026-02': {
        食費: 50000,
        交通費: 10000
      }
    })

    const repo2 = createDemoExpenseRepository()
    const snapshot = repo2.getSnapshot()

    expect(snapshot.monthlyBudgets['2026-02'].食費).toBe(50000)
    expect(snapshot.monthlyBudgets['2026-02'].交通費).toBe(10000)
  })

  it('月ごとの精算完了記録を保存・取り消しできる', async () => {
    const repo = createDemoExpenseRepository()

    await repo.saveSettlementCompletion({
      monthKey: '2026-02',
      settlementRecord: {
        monthKey: '2026-02',
        amount: 12000,
        fromPayerId: 'user1',
        toPayerId: 'user2',
        completedAt: '2026-02-28T12:00:00.000Z'
      }
    })

    expect(repo.getSnapshot().settings.settlements['2026-02'].amount).toBe(12000)

    await repo.clearSettlementCompletion('2026-02')
    expect(repo.getSnapshot().settings.settlements['2026-02']).toBeUndefined()
  })

  it('旧形式(payer文字列のみ)のJSONをインポートして payerId に変換できる', async () => {
    const repo = createDemoExpenseRepository()

    const result = await repo.importData({
      rawData: {
        version: '1.0',
        userNames: {
          user1Name: '太郎',
          user2Name: '花子'
        },
        monthlyBudgets: {},
        expenses: [
          {
            description: 'スーパー',
            amount: 3200,
            category: '食費',
            payer: '太郎',
            date: '2026-02-10'
          }
        ]
      },
      fallbackSettings: repo.getSnapshot().settings
    })

    expect(result.success).toBe(true)
    expect(result.importedCount).toBe(1)

    const snapshot = repo.getSnapshot()
    expect(snapshot.expenses[0].payerId).toBe('user1')
  })

  it('ユーザー名変更後も payerId ベース集計で精算結果が変わらない', async () => {
    const repo = createDemoExpenseRepository()

    await repo.saveDisplayNames({
      displayNames: { user1: '太郎', user2: '花子' },
      previousDisplayNames: { user1: 'ユーザー1', user2: 'ユーザー2' },
      payerAliases: repo.getSnapshot().settings.payerAliases
    })

    const firstSnapshot = repo.getSnapshot()

    await repo.saveExpense({
      expense: {
        description: 'ランチ',
        amount: 2000,
        category: '食費',
        payerId: 'user1',
        date: '2026-02-10'
      },
      settings: firstSnapshot.settings
    })

    await repo.saveDisplayNames({
      displayNames: { user1: '太郎(新)', user2: '花子' },
      previousDisplayNames: { user1: '太郎', user2: '花子' },
      payerAliases: repo.getSnapshot().settings.payerAliases
    })

    const latestSnapshot = repo.getSnapshot()
    const totals = calculateTotals(latestSnapshot.expenses)
    const settlement = calculateSettlement(totals, latestSnapshot.settings.displayNames)

    expect(totals.user1Total).toBe(2000)
    expect(settlement.amount).toBe(1000)
    expect(settlement.to).toBe('太郎(新)')
  })

  it('1200件データを500件単位でチャンク処理できる', async () => {
    const items = Array.from({ length: 1200 }, (_, index) => ({ id: index + 1 }))
    const commitMock = vi.fn().mockResolvedValue(undefined)

    const committedCount = await commitInChunks(items, commitMock, 500)

    expect(committedCount).toBe(1200)
    expect(commitMock).toHaveBeenCalledTimes(3)
    expect(commitMock.mock.calls[0][0]).toHaveLength(500)
    expect(commitMock.mock.calls[1][0]).toHaveLength(500)
    expect(commitMock.mock.calls[2][0]).toHaveLength(200)
  })
})
