export const SCHEMA_VERSION = '2.1';
export const EXPORT_VERSION = '2.1';

export const DEFAULT_DISPLAY_NAMES = {
  user1: 'ユーザー1',
  user2: 'ユーザー2'
};

export const DEFAULT_PAYER_IDS = ['user1', 'user2'];

export const CATEGORIES = [
  '食費',
  '日用品',
  '趣味・娯楽',
  '交通費',
  '住宅費',
  '医療費',
  '教育費',
  '交際費',
  '衣服・美容',
  '特別な支出',
  'その他'
];

export const PIE_CHART_COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82Ca9D',
  '#FFC0CB',
  '#A52A2A',
  '#DEB887',
  '#5F9EA0',
  '#7FFF00',
  '#DA70D6'
];

export const DEMO_STORAGE_KEYS = {
  EXPENSES: 'demo_expenses',
  SETTINGS: 'demo_settings',
  LEGACY_USER_NAMES: 'demo_user_names',
  BUDGETS: 'demo_budgets'
};

export const FIRESTORE_IMPORT_CHUNK_SIZE = 500;
export const BACKUP_STORAGE_KEY = 'kakeibo_export_backups_v1';
export const MAX_BACKUP_RECORDS = 3;
