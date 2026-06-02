import { generatePersonalizedICS, generateGenericICS } from './calendarGenerator.js';
import type { PlatformInfo } from './platformDetectionService.js';

export interface CalendarEvent {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  guestName?: string;
}

export interface CalendarOptions {
  preferDeepLink?: boolean;
  fallbackToICS?: boolean;
}

export async function addToCalendar(
  event: CalendarEvent,
  platformInfo: PlatformInfo,
  options: CalendarOptions = { preferDeepLink: true, fallbackToICS: true }
): Promise<void> {
  try {
    if (platformInfo.supportsDeepLinking && options.preferDeepLink) {
      await attemptDeepLink(event, platformInfo);
    } else {
      await generateICSDownload(event, platformInfo);
    }
  } catch (error) {
    console.warn('Primary calendar method failed, trying fallback:', error);
    if (options.fallbackToICS) {
      await generateICSDownload(event, platformInfo);
    } else {
      throw error;
    }
  }
}

async function attemptDeepLink(event: CalendarEvent, platformInfo: PlatformInfo): Promise<void> {
  if (platformInfo.os === 'ios') {
    await iosUniversalLink(event);
  } else if (platformInfo.os === 'android') {
    await androidDeepLink(event);
  } else {
    throw new Error('Deep linking not supported on this platform');
  }
}

async function iosUniversalLink(event: CalendarEvent): Promise<void> {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.description || '',
    dates: formatDateRangeForUrl(event.startTime, event.endTime),
    location: event.location || ''
  });

  const url = `https://calendar.google.com/calendar/render?${params.toString()}`;
  window.location.href = url;
}

async function androidDeepLink(event: CalendarEvent): Promise<void> {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.description || '',
    dates: formatDateRangeForUrl(event.startTime, event.endTime),
    location: event.location || ''
  });

  try {
    const intentUrl = `intent://calendar.google.com/calendar/render?${params.toString()}#Intent;scheme=https;package=com.google.android.calendar;end`;
    window.location.href = intentUrl;
  } catch {
    const fallbackUrl = `https://calendar.google.com/calendar/render?${params.toString()}`;
    window.location.href = fallbackUrl;
  }
}

async function generateICSDownload(event: CalendarEvent, platformInfo: PlatformInfo): Promise<void> {
  const icsContent = event.guestName
    ? generatePersonalizedICS(event.guestName)
    : generateGenericICS();

  if (platformInfo.requiresSafariOptimizations) {
    safariOptimizedDownload(icsContent, event.title);
  } else {
    standardICSDownload(icsContent, event.title);
  }
}

function safariOptimizedDownload(icsContent: string, filename: string): void {
  const blob = new Blob([icsContent], {
    type: 'text/calendar;charset=utf-8'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `${filename}.ics`;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

function standardICSDownload(icsContent: string, filename: string): void {
  const blob = new Blob([icsContent], {
    type: 'text/calendar;charset=utf-8'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `${filename}.ics`;
  link.target = '_blank';
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

export function formatDateForGoogleCalendar(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function formatDateRangeForUrl(startTime: Date, endTime: Date): string {
  const start = formatDateForGoogleCalendar(startTime);
  const end = formatDateForGoogleCalendar(endTime);
  return `${start}/${end}`;
}