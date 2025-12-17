import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, Search, Package, Truck, Shield } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const t = useTranslations('common');

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Welcome to Boukir
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Professional Hardware & Building Materials Store
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/shop">
              <Button size="lg" className="gap-2">
                <ShoppingCart className="w-5 h-5" />
                Shop Now
              </Button>
            </Link>
            <Link href="/shop">
              <Button size="lg" variant="outline" className="gap-2">
                <Search className="w-5 h-5" />
                Search Products
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-secondary/20">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border rounded-xl bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Wide Selection</h3>
              <p className="text-muted-foreground">Thousands of products for all your building needs</p>
            </div>
            <div className="p-6 border rounded-xl bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Fast Delivery</h3>
              <p className="text-muted-foreground">Quick and reliable shipping to your location</p>
            </div>
            <div className="p-6 border rounded-xl bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Quality Guarantee</h3>
              <p className="text-muted-foreground">All products backed by our quality assurance</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
