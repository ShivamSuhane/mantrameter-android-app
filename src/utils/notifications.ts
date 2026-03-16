/**
 * Mantra Meter — Notification System
 *
 * Capacitor LocalNotifications use karta hai — ye app closed/background/foreground
 * sabhi conditions mein kaam karta hai Android par.
 *
 * 6 Types:
 * 1. Mantra Reminder (User set time)
 * 2. Morning Schedule (6:30 AM)
 * 3. Evening Reminder (10:00 PM)
 * 4. Missed Session (6:15 AM next day)
 * 5. Milestone (Har 50 mala par)
 * 6. 7-Day Streak
 */

import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Mantra } from '../types';

// ── Motivational Quotes Pool ──────────────────────────────────────────────────
const MOTIVATIONAL_QUOTES = [
  "Every chant brings you closer to the Divine. 🕉️",
  "Your devotion today plants seeds of peace for tomorrow. 🌸",
  "Each bead counted is a prayer heard by the universe. 🙏",
  "Consistency in sadhana transforms the soul. ✨",
  "The Divine energy within you grows with every mantra. 🌟",
  "Stillness of mind is the greatest gift you give yourself. 🪷",
  "A devoted heart finds peace in every moment. 🌺",
  "Your spiritual practice is your greatest treasure. 💫",
  "The universe listens when you chant with sincerity. 🔔",
  "Inner peace begins with a single sacred chant. ☮️",
];

function getRandomQuote(): string {
  return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
}

// Mantra naam 20 chars se lamba ho toh truncate karo
// Content poora rahega, sirf naam short hoga
function truncName(name: string, max = 20): string {
  return name.length > max ? name.substring(0, max) + '...' : name;
}

// ── Notification ID System ────────────────────────────────────────────────────
const NOTIF_TYPE = {
  REMINDER: 0,
  MORNING:  1,
  EVENING:  2,
  STREAK:   3,
  MISSED:   4,
  MILESTONE: 5,
};

function getNotifId(mantraIndex: number, type: number): number {
  return (mantraIndex * 10) + type + 1000;
}

// ── Permission Check & Request ────────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    }
    return false;
  }
  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch (e) {
    console.error('Permission error:', e);
    return false;
  }
}

export async function checkNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return 'Notification' in window && Notification.permission === 'granted';
  }
  try {
    const result = await LocalNotifications.checkPermissions();
    return result.display === 'granted';
  } catch (e) {
    return false;
  }
}

// ── Cancel All Notifications for a Mantra ────────────────────────────────────
async function cancelMantraNotifications(mantraIndex: number) {
  if (!Capacitor.isNativePlatform()) return;
  const ids = Object.values(NOTIF_TYPE).map(type => ({
    id: getNotifId(mantraIndex, type),
  }));
  try {
    await LocalNotifications.cancel({ notifications: ids });
  } catch (e) {
    console.error('Cancel error:', e);
  }
}

// ── Schedule All Notifications for a Mantra ──────────────────────────────────
export async function scheduleMantraNotifications(
  mantra: Mantra,
  mantraIndex: number,
  enabled: boolean
) {
  if (!Capacitor.isNativePlatform()) return;

  await cancelMantraNotifications(mantraIndex);
  if (!enabled) return;

  const hasPermission = await checkNotificationPermission();
  if (!hasPermission) return;

  const notifications: ScheduleOptions['notifications'] = [];

  // ── 1. Mantra Reminder — User Set Time ──────────────────────────────────────
  if (mantra.reminderEnabled && mantra.reminderTime) {
    const [hour, minute] = mantra.reminderTime.split(':').map(Number);
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    const ampm = hour < 12 ? 'AM' : 'PM';
    const timeStr = `${h12}:${String(minute).padStart(2, '0')} ${ampm}`;
    const rName = truncName(mantra.name);

    notifications.push({
      id: getNotifId(mantraIndex, NOTIF_TYPE.REMINDER),
      title: `🔔 Mantra Meter — Sadhana Time`,
      body: `${timeStr} — "${rName}" ki sadhana ka samay ho gaya hai. 🙏`,
      schedule: {
        on: { hour, minute },
        repeats: true,
        allowWhileIdle: true,
      },
      smallIcon: 'ic_notification',
      iconColor: '#4f46e5',
      largeIcon: 'ic_launcher',
      iconColor: '#4f46e5',
      channelId: 'mantra_reminders',
      actionTypeId: '',
      extra: { mantraId: mantra.id, type: 'reminder' },
    });
  }

  // ── 2. Morning Motivation — 6:30 AM ─────────────────────────────────────────
  notifications.push({
    id: getNotifId(mantraIndex, NOTIF_TYPE.MORNING),
    title: `🌅 Mantra Meter — Suprabhat`,
    body: `"${truncName(mantra.name)}" — Aaj ki sadhana shuru karein. ${getRandomQuote()}`,
    schedule: {
      on: { hour: 6, minute: 30 },
      repeats: true,
      allowWhileIdle: true,
    },
    smallIcon: 'ic_notification',
    iconColor: '#4f46e5',
    largeIcon: 'ic_launcher',
    channelId: 'mantra_reminders',
    actionTypeId: '',
    extra: { mantraId: mantra.id, type: 'morning' },
  });

  // ── 3. Evening Reminder — 9:00 PM ───────────────────────────────────────────
  notifications.push({
    id: getNotifId(mantraIndex, NOTIF_TYPE.EVENING),
    title: `🌙 Mantra Meter — Sandhya Vandana`,
    body: `"${truncName(mantra.name)}" — Din dhalte dhalte ek mala zaroor karein. 🪷`,
    schedule: {
      on: { hour: 21, minute: 0 },
      repeats: true,
      allowWhileIdle: true,
    },
    smallIcon: 'ic_notification',
    iconColor: '#4f46e5',
    largeIcon: 'ic_launcher',
    channelId: 'mantra_reminders',
    actionTypeId: '',
    extra: { mantraId: mantra.id, type: 'evening' },
  });

  // ── 4. Missed Session — 6:15 AM ─────────────────────────────────────────────
  notifications.push({
    id: getNotifId(mantraIndex, NOTIF_TYPE.MISSED),
    title: `🕊️ Mantra Meter — Koi baat nahi`,
    body: `Kal chuk gayi sadhana? Aaj naya din hai — "${truncName(mantra.name)}" se phir shuru karein. 🌸`,
    schedule: {
      on: { hour: 6, minute: 15 },
      repeats: true,
      allowWhileIdle: true,
    },
    smallIcon: 'ic_notification',
    iconColor: '#4f46e5',
    largeIcon: 'ic_launcher',
    channelId: 'mantra_reminders',
    actionTypeId: '',
    extra: { mantraId: mantra.id, type: 'missed' },
  });

  if (notifications.length > 0) {
    try {
      await LocalNotifications.schedule({ notifications });
    } catch (e) {
      console.error('Schedule error:', e);
    }
  }
}

// ── Milestone Notification ────────────────────────────────────────────────────
export async function triggerMilestoneNotification(
  mantraName: string,
  totalMalas: number
) {
  if (!Capacitor.isNativePlatform()) return;
  const hasPermission = await checkNotificationPermission();
  if (!hasPermission) return;

  try {
    await LocalNotifications.schedule({
      notifications: [{
        id: Math.floor(Math.random() * 9000) + 1000,
        title: `🏆 Mantra Meter — Milestone!`,
        body: `Wah! "${truncName(mantraName)}" ki ${totalMalas} malaein poori hui. Aapki shraddha adbhut hai! 🙏✨`,
        schedule: { at: new Date(Date.now() + 500) },
        smallIcon: 'ic_notification',
        iconColor: '#4f46e5',
        largeIcon: 'ic_launcher',
        channelId: 'mantra_milestones',
        actionTypeId: '',
        extra: { type: 'milestone', totalMalas },
      }],
    });
  } catch (e) {
    console.error('Milestone notification error:', e);
  }
}

// ── Streak Notification — Next morning 7:00 AM ───────────────────────────────
export async function scheduleStreakNotification(
  mantraName: string,
  streakDays: number,
  mantraIndex: number
) {
  if (!Capacitor.isNativePlatform()) return;
  const hasPermission = await checkNotificationPermission();
  if (!hasPermission) return;

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(7, 0, 0, 0);

    await LocalNotifications.schedule({
      notifications: [{
        id: getNotifId(mantraIndex, NOTIF_TYPE.STREAK),
        title: `🔥 Mantra Meter — ${streakDays} Din ki Streak!`,
        body: `Shabash! "${truncName(mantraName)}" mein ${streakDays} dinon ki nirantar sadhana. Sankalp drishya ho raha hai! 💫`,
        schedule: { at: tomorrow },
        smallIcon: 'ic_notification',
        iconColor: '#4f46e5',
        largeIcon: 'ic_launcher',
        iconColor: '#4f46e5',
      channelId: 'mantra_reminders',
        actionTypeId: '',
        extra: { mantraId: mantraIndex, type: 'streak', days: streakDays },
      }],
    });
  } catch (e) {
    console.error('Streak notification error:', e);
  }
}

// ── Reschedule All ────────────────────────────────────────────────────────────
export async function rescheduleAllNotifications(
  mantras: Mantra[],
  notificationsEnabled: boolean
) {
  for (let i = 0; i < mantras.length; i++) {
    await scheduleMantraNotifications(mantras[i], i, notificationsEnabled);
  }
}

// ── Cancel Evening Reminder ───────────────────────────────────────────────────
export async function cancelEveningReminder(mantraIndex: number) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: getNotifId(mantraIndex, NOTIF_TYPE.EVENING) }],
    });
  } catch (e) {
    console.error('Cancel evening error:', e);
  }
}

// ── Cancel Missed Reminder ────────────────────────────────────────────────────
export async function cancelMissedReminder(mantraIndex: number) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: getNotifId(mantraIndex, NOTIF_TYPE.MISSED) }],
    });
  } catch (e) {
    console.error('Cancel missed error:', e);
  }
}
