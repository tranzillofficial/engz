/**
 * Single source of truth for the four installable Engz apps.
 *
 * Every interface (customer / driver / agent / admin) ships its own web app
 * manifest, its own icon set and its own colours, so installing from one
 * dashboard puts a visually distinct app on the phone's home screen.
 */

export type PwaRole = 'customer' | 'driver' | 'agent' | 'admin';

export const PWA_ROLES_LIST: PwaRole[] = ['customer', 'driver', 'agent', 'admin'];

export interface PwaRoleConfig {
  /** Stable manifest id — what the browser uses to tell the four apps apart. */
  id: string;
  name: string;
  shortName: string;
  description: string;
  /** Where the installed app opens. */
  startUrl: string;
  /** Navigation scope of the installed app. */
  scope: string;
  /** Browser UI / status bar colour. */
  themeColor: string;
  /** Splash screen colour behind the icon while the app boots. */
  backgroundColor: string;
  /** Public path of this role's icon folder. */
  iconDir: string;
  /** Arabic title shown on the install card. */
  title: string;
  /** Arabic one-liner shown under the title. */
  tagline: string;
  badge: string;
  /** Label on the install button itself. */
  buttonLabel: string;
  shortcuts: { name: string; short_name: string; url: string }[];
}

export const PWA_ROLES: Record<PwaRole, PwaRoleConfig> = {
  customer: {
    id: '/customer-app',
    name: 'إنجز | توصيل أي حاجة',
    shortName: 'إنجز',
    description: 'اطلب أي حاجة من أي مكان ووصّلها لحد باب البيت.',
    startUrl: '/',
    scope: '/',
    themeColor: '#FA3802',
    backgroundColor: '#FA3802',
    iconDir: '/icons/customer',
    title: 'تطبيق إنجز للطلبات',
    tagline: 'ثبّت إنجز على هاتفك واطلب أي حاجة بنقرة واحدة.',
    badge: 'توصيل فوري',
    buttonLabel: 'تثبيت تطبيق إنجز',
    shortcuts: [
      { name: 'اطلب الآن', short_name: 'طلب جديد', url: '/orders/new' },
      { name: 'طلباتي', short_name: 'طلباتي', url: '/orders' },
    ],
  },
  driver: {
    id: '/driver-app',
    name: 'إنجز كابتن | Engz Captain',
    shortName: 'إنجز كابتن',
    description: 'تطبيق كباتن التوصيل — استقبل الطلبات الجديدة أول بأول.',
    startUrl: '/driver',
    scope: '/driver',
    themeColor: '#B45309',
    backgroundColor: '#78350F',
    iconDir: '/icons/driver',
    title: 'تطبيق كابتن إنجز',
    tagline: 'ثبّت تطبيق الكابتن واستقبل تنبيهات الطلبات فوراً.',
    badge: 'كابتن توصيل',
    buttonLabel: 'تثبيت تطبيق الكابتن',
    shortcuts: [
      { name: 'الطلبات المتاحة', short_name: 'المتاحة', url: '/driver' },
      { name: 'محفظتي', short_name: 'المحفظة', url: '/driver/wallet' },
    ],
  },
  agent: {
    id: '/agent-app',
    name: 'إنجز وكيل | Engz Agent',
    shortName: 'إنجز وكيل',
    description: 'لوحة وكيل المنطقة — تابع طيارين وطلبات منطقتك لحظياً.',
    startUrl: '/agent',
    scope: '/agent',
    themeColor: '#047857',
    backgroundColor: '#064E3B',
    iconDir: '/icons/agent',
    title: 'تطبيق وكيل المنطقة',
    tagline: 'ثبّت لوحة الوكالة كتطبيق مستقل على هاتفك.',
    badge: 'وكالة معتمدة',
    buttonLabel: 'تثبيت تطبيق الوكيل',
    shortcuts: [
      { name: 'طلبات المنطقة', short_name: 'الطلبات', url: '/agent/orders' },
      { name: 'الطيارين', short_name: 'الطيارين', url: '/agent/drivers' },
    ],
  },
  admin: {
    id: '/admin-app',
    name: 'إنجز أدمن | Engz Admin',
    shortName: 'إنجز أدمن',
    description: 'لوحة التحكم المركزية لمنصة إنجز.',
    startUrl: '/admin',
    // Wide scope so the super-admin console (/engzadmin) stays inside the app.
    scope: '/',
    themeColor: '#0F172A',
    backgroundColor: '#0F172A',
    iconDir: '/icons/admin',
    title: 'تطبيق إدارة إنجز',
    tagline: 'ثبّت لوحة الإدارة كتطبيق منفصل للوصول السريع.',
    badge: 'إدارة مركزية',
    buttonLabel: 'تثبيت تطبيق الأدمن',
    shortcuts: [
      { name: 'الطلبات', short_name: 'الطلبات', url: '/admin/orders' },
      { name: 'اعتماد الطيارين', short_name: 'الاعتماد', url: '/admin/driver-verifications' },
    ],
  },
};

/** Public URL of the manifest that belongs to a role. */
export function manifestPathFor(role: PwaRole): string {
  return `/manifest-${role}.webmanifest`;
}

/** Which of the four apps a given pathname belongs to. */
export function resolveRoleFromPath(pathname: string): PwaRole {
  if (pathname.startsWith('/driver')) return 'driver';
  if (pathname.startsWith('/agent')) return 'agent';
  if (pathname.startsWith('/admin') || pathname.startsWith('/engzadmin')) return 'admin';
  return 'customer';
}

/**
 * Builds the web app manifest for a role.
 *
 * Chrome only treats a site as installable when the manifest advertises real
 * PNG icons of at least 192px and 512px, plus a maskable one — SVG icons are
 * ignored by the install criteria, which is why every role has its own PNGs.
 */
export function buildRoleManifest(
  role: PwaRole,
  /**
   * URL this manifest is actually served from. It is advertised back as the
   * app's own related application, so it must match the URL the page links to
   * — the root pages link /manifest.webmanifest, the role routes link their own.
   */
  manifestUrl: string = manifestPathFor(role),
): Record<string, unknown> {
  const c = PWA_ROLES[role];
  return {
    id: c.id,
    name: c.name,
    short_name: c.shortName,
    description: c.description,
    start_url: c.startUrl,
    scope: c.scope,
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'portrait',
    lang: 'ar',
    dir: 'rtl',
    theme_color: c.themeColor,
    background_color: c.backgroundColor,
    categories: ['shopping', 'food', 'travel'],
    prefer_related_applications: false,
    // Declaring this app as its own "related application" is what lets
    // navigator.getInstalledRelatedApps() report whether it is already
    // installed — without it the call always returns an empty list, and the
    // install button cannot tell "already installed" from "not installable".
    related_applications: [{ platform: 'webapp', url: manifestUrl }],
    icons: [
      { src: `${c.iconDir}/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `${c.iconDir}/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `${c.iconDir}/maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: c.shortcuts,
  };
}
