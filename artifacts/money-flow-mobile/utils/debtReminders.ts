import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

interface ReminderDebt {
  id: string;
  name: string;
  amount: number;
  dueDate?: string;
}

const REMINDER_IDS_KEY = '@dong-tien/debt-reminder-ids-v1';
const ANDROID_CHANNEL = 'debt-reminders';

async function readScheduledIds(): Promise<Record<string, string>> {
  const raw = await AsyncStorage.getItem(REMINDER_IDS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

function parseDueDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 9, 0, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

export async function enableNotificationPermission() {
  if (Platform.OS === 'web') return { granted: false, canAskAgain: false };
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
      name: 'Nhắc khoản phải trả',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
  return { granted: permission.granted, canAskAgain: permission.canAskAgain };
}

export async function scheduleDebtReminder(debt: ReminderDebt) {
  if (!debt.dueDate) return;
  const due = parseDueDate(debt.dueDate);
  if (!due) throw new Error('Ngày đến hạn không hợp lệ.');

  const ids = await readScheduledIds();
  if (ids[debt.id]) {
    await Notifications.cancelScheduledNotificationAsync(ids[debt.id]);
    delete ids[debt.id];
  }

  const reminder = new Date(due);
  reminder.setDate(reminder.getDate() - 1);
  if (reminder.getTime() <= Date.now()) reminder.setTime(due.getTime());
  if (reminder.getTime() <= Date.now()) {
    await AsyncStorage.setItem(REMINDER_IDS_KEY, JSON.stringify(ids));
    return;
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Sắp đến hạn thanh toán',
      body: `${debt.name} đến hạn ${debt.dueDate}. Mở Dòng Tiền để xem chi tiết.`,
      data: { debtId: debt.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminder,
      channelId: ANDROID_CHANNEL,
    },
  });
  ids[debt.id] = identifier;
  await AsyncStorage.setItem(REMINDER_IDS_KEY, JSON.stringify(ids));
}

export async function cancelDebtReminder(debtId: string) {
  const ids = await readScheduledIds();
  const identifier = ids[debtId];
  if (identifier) await Notifications.cancelScheduledNotificationAsync(identifier);
  delete ids[debtId];
  await AsyncStorage.setItem(REMINDER_IDS_KEY, JSON.stringify(ids));
}

export async function clearDebtReminders() {
  const ids = await readScheduledIds();
  await Promise.all(Object.values(ids).map((identifier) =>
    Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined),
  ));
  await AsyncStorage.removeItem(REMINDER_IDS_KEY);
}

export function validateDueDate(value: string) {
  return parseDueDate(value) !== null;
}
