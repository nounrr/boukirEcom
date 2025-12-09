import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, Search } from 'lucide-react';

export default function HomePage() {
  const t = useTranslations('common');

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center max-w-4xl">
        <h1 className="text-5xl font-bold mb-4">
          {t('home')}
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Welcome to Boukir E-Commerce - Professional Hardware Store
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Button size="lg" className="gap-2">
            <ShoppingCart className="w-5 h-5" />
            Shop Now
          </Button>
          <Button size="lg" variant="outline" className="gap-2">
            <Search className="w-5 h-5" />
            Search Products
          </Button>
          <Button size="lg" variant="secondary" className="gap-2">
            <Heart className="w-5 h-5" />
            Wishlist
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 border rounded-lg bg-card">
            <h3 className="font-semibold mb-2">Primary Button</h3>
            <Button>Click Me</Button>
          </div>
          <div className="p-6 border rounded-lg bg-card">
            <h3 className="font-semibold mb-2">Outline Button</h3>
            <Button variant="outline">Click Me</Button>
          </div>
          <div className="p-6 border rounded-lg bg-card">
            <h3 className="font-semibold mb-2">Secondary Button</h3>
            <Button variant="secondary">Click Me</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
