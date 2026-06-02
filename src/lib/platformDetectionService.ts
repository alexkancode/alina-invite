export interface PlatformInfo {
  os: 'ios' | 'android' | 'desktop';
  browser: 'safari' | 'chrome' | 'firefox' | 'other';
  version: string;
  supportsDeepLinking: boolean;
  requiresSafariOptimizations?: boolean;
  avoidTargetBlank?: boolean;
  requiresCursorPointer?: boolean;
  requiresIntentHandling?: boolean;
  preferStandardDownload?: boolean;
}

export function detectPlatform(): PlatformInfo {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;

  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !('MSStream' in window);
  const isAndroid = /Android/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  const isChrome = /Chrome/.test(userAgent);
  const isFirefox = /Firefox/.test(userAgent);

  const os: PlatformInfo['os'] = isIOS ? 'ios' : isAndroid ? 'android' : 'desktop';

  let browser: PlatformInfo['browser'] = 'other';
  if (isSafari) browser = 'safari';
  else if (isChrome) browser = 'chrome';
  else if (isFirefox) browser = 'firefox';

  const version = extractVersion(userAgent);
  const supportsDeepLinking = isIOS || isAndroid;

  const result: PlatformInfo = {
    os,
    browser,
    version,
    supportsDeepLinking
  };

  if (os === 'ios' && browser === 'safari') {
    result.requiresSafariOptimizations = true;
    result.avoidTargetBlank = true;
    result.requiresCursorPointer = true;
  }

  if (os === 'android') {
    result.requiresIntentHandling = true;
  }

  if (os === 'desktop') {
    result.preferStandardDownload = true;
  }

  return result;
}

function extractVersion(userAgent: string): string {
  const versionPatterns = [
    /Version\/(\d+\.\d+)/,
    /Chrome\/(\d+\.\d+)/,
    /Firefox\/(\d+\.\d+)/,
    /OS (\d+_\d+)/
  ];

  for (const pattern of versionPatterns) {
    const match = userAgent.match(pattern);
    if (match) {
      return match[1].replace('_', '.');
    }
  }

  return 'unknown';
}