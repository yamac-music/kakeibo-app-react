export function calculateTotals(expenses) {
  let user1Total = 0;
  let user2Total = 0;
  let invalidPayerTotal = 0;
  const categories = {};

  expenses.forEach((expense) => {
    categories[expense.category] = (categories[expense.category] || 0) + expense.amount;

    if (expense.payerId === 'user1') {
      user1Total += expense.amount;
      return;
    }

    if (expense.payerId === 'user2') {
      user2Total += expense.amount;
      return;
    }

    invalidPayerTotal += expense.amount;
  });

  return {
    user1Total,
    user2Total,
    invalidPayerTotal,
    categories,
    totalExpense: user1Total + user2Total + invalidPayerTotal
  };
}

export function calculateSettlement(totals, displayNames) {
  const totalSpent = totals.user1Total + totals.user2Total;
  const fairShare = totalSpent / 2;
  const diffUser1 = totals.user1Total - fairShare;

  const invalidWarning = totals.invalidPayerTotal > 0
    ? ` ⚠️ 不明な支払者のデータ${totals.invalidPayerTotal.toLocaleString()}円は精算計算から除外されています。`
    : '';

  if (totalSpent === 0) {
    return {
      message: `まだ支出がありません。${invalidWarning}`,
      amount: 0,
      from: '',
      to: ''
    };
  }

  if (Math.abs(diffUser1) < 0.01) {
    return {
      message: `負担額は均等です。${invalidWarning}`,
      amount: 0,
      from: '',
      to: ''
    };
  }

  if (diffUser1 > 0) {
    return {
      message: `${displayNames.user2}が${displayNames.user1}に ${Math.abs(diffUser1).toLocaleString()} 円支払う${invalidWarning}`,
      amount: Math.abs(diffUser1),
      from: displayNames.user2,
      to: displayNames.user1
    };
  }

  return {
    message: `${displayNames.user1}が${displayNames.user2}に ${Math.abs(diffUser1).toLocaleString()} 円支払う${invalidWarning}`,
    amount: Math.abs(diffUser1),
    from: displayNames.user1,
    to: displayNames.user2
  };
}
