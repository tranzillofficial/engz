import { getCurrentUser } from '@/lib/services/auth';
import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingHero from '@/components/landing/LandingHero';
import LandingCategories from '@/components/landing/LandingCategories';
import LandingHowItWorks from '@/components/landing/LandingHowItWorks';
import LandingFeatures from '@/components/landing/LandingFeatures';
import LandingFooter from '@/components/landing/LandingFooter';

export const metadata = {
  title: 'Engz — منصة التوصيل الذكية | كل طلباتك نوصلها لك',
  description:
    'من أي مكان وفي أي وقت، منصة توصيل ويب متكاملة، سريعة وآمنة لتوصيل أي شيء. خضار، صيدلية، عيش، مشتريات، وطلبات حرة.',
};

export default async function HomePage() {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans antialiased selection:bg-orange-500 selection:text-white" dir="rtl">
      <LandingNavbar user={user} />
      <main className="flex-1">
        <LandingHero />
        <LandingCategories />
        <LandingHowItWorks />
        <LandingFeatures />
      </main>
      <LandingFooter />
    </div>
  );
}
