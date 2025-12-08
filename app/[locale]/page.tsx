import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('common');

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          {t('home')}
        </h1>
        <p className="text-xl text-muted-foreground">
          Welcome to Boukir E-Commerce
        </p>
      </div>
    </div>
  );
}
