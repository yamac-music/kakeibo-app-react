import { CATEGORIES } from './constants';

export const ZAIM_CATEGORY_MAP = {
  '食費': '食費',
  '住まい': '住宅費',
  'クルマ': '交通費',
  'エンタメ': '趣味・娯楽',
  '通信・機器等': 'その他',
  '美容・衣服': '衣服・美容',
  '医療・保険': '医療費',
  '日用雑貨': '日用品',
  '水道・光熱': '住宅費',
  '交通': '交通費',
  '税金': 'その他',
  '大型出費': '特別な支出',
  '教育・教養': '教育費',
  '交際費': '交際費',
  'その他': 'その他',
  '貯蓄・投資等': 'その他',
};

const PRE_UNCHECK_SUBCATEGORIES = new Set([
  'カードの引落',
  '貯金用',
  '積立NISA',
]);

const REQUIRED_HEADERS = ['日付', '方法', 'カテゴリ', '支出'];

export function shouldPreUncheck(row) {
  if (row['集計の設定'] === '集計に含めない') return true;
  if (row['カテゴリ'] === '貯蓄・投資等') return true;
  if (row['カテゴリ'] === 'その他' && PRE_UNCHECK_SUBCATEGORIES.has(row['カテゴリの内訳'])) return true;
  return false;
}

function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  fields.push(current.trim());

  return fields;
}

function normalizeZaimDate(dateStr) {
  if (!dateStr) return '';
  return dateStr.replace(/\//g, '-');
}

function parseZaimAmount(amountStr) {
  if (!amountStr) return 0;
  const cleaned = String(amountStr).replace(/,/g, '');
  const num = parseInt(cleaned, 10);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

export function parseZaimCsv(csvText) {
  const errors = [];
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length < 2) {
    return { rows: [], errors: ['CSVにデータ行がありません。'] };
  }

  const headers = parseCsvLine(lines[0]);
  const missingHeaders = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missingHeaders.length > 0) {
    return { rows: [], errors: [`必須ヘッダーが不足しています: ${missingHeaders.join(', ')}`] };
  }

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length !== headers.length) {
      errors.push(`行${i + 1}: 列数が不正です`);
      continue;
    }

    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx];
    });

    if (row['方法'] !== 'payment') continue;

    const amount = parseZaimAmount(row['支出']);
    if (amount <= 0) continue;

    rows.push(row);
  }

  return { rows, errors };
}

export function mapZaimRowsToExpenses(parsedRows) {
  return parsedRows.map((row) => {
    const description = row['お店'] || row['品名'] || row['カテゴリの内訳'] || row['カテゴリ'] || '';
    const zaimCategory = row['カテゴリ'] || '';
    const mapped = ZAIM_CATEGORY_MAP[zaimCategory];
    const mappedCategory = mapped && CATEGORIES.includes(mapped) ? mapped : 'その他';

    return {
      date: normalizeZaimDate(row['日付']),
      description,
      amount: parseZaimAmount(row['支出']),
      zaimCategory,
      zaimSubCategory: row['カテゴリの内訳'] || '',
      mappedCategory,
      paymentSource: row['支払元'] || '',
      memo: row['メモ'] || '',
      itemName: row['品名'] || '',
      preUnchecked: shouldPreUncheck(row),
    };
  });
}
