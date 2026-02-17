import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDatabase } from '@/context/DatabaseContext';
import { Star, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';
import { Badge } from '@/components/ui/badge';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, subcategories, categories } = useDatabase();
  const [product, setProduct] = useState<any>(null);
  const { theme } = useTheme();
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    if (id) {
      const foundProduct = products.find(p => p.id === parseInt(id));
      if (foundProduct) {
        setProduct(foundProduct);
      }
    }
  }, [id, products]);

  if (!product) {
    return (
      <div className="theme-root min-h-screen liquid-bg flex items-center justify-center" data-theme={theme}>
        <div className="text-center">
          <p className="text-white/60 text-lg">Товар не найден</p>
          <Button
            onClick={() => navigate('/')}
            className="mt-4 liquid-button rounded-xl"
          >
            Вернуться на главную
          </Button>
        </div>
      </div>
    );
  }

  const subcategory = subcategories.find(s => s.id === product.subcategory_id);
  const category = subcategory ? categories.find(c => c.id === subcategory.category_id) : null;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < rating ? 'fill-white text-white' : 'text-white/25'}`}
      />
    ));
  };

  return (
    <div className="theme-root min-h-screen liquid-bg text-slate-100" data-theme={theme}>
      {/* Header */}
      <header className="sticky top-3 z-50 px-3 lg:px-6">
        <div className="liquid-panel flex items-center justify-between px-4 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="liquid-icon-btn text-white/90 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold tracking-tight text-white">CLOTHING STORE</h1>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <a
              href="#/admin"
              className="text-sm text-white/70 hover:text-white transition-colors font-medium"
            >
              Админ панель
            </a>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="px-4 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-sm text-white/50">
          <span
            className="hover:text-white cursor-pointer transition-colors"
            onClick={() => navigate('/')}
          >
            Главная
          </span>
          <span className="text-white/30">/</span>
          {category && (
            <>
              <span
                className="hover:text-white cursor-pointer transition-colors"
                onClick={() => navigate(`/?category=${category.id}`)}
              >
                {category.name}
              </span>
              <span className="text-white/30">/</span>
            </>
          )}
          {subcategory && (
            <>
              <span
                className="hover:text-white cursor-pointer transition-colors"
                onClick={() => navigate(`/?subcategory=${subcategory.id}`)}
              >
                {subcategory.name}
              </span>
              <span className="text-white/30">/</span>
            </>
          )}
          <span className="text-white font-medium">{product.name}</span>
        </nav>
      </div>

      {/* Product Content */}
      <main className="px-4 lg:px-8 py-4 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Image Section */}
            <div className="lg:w-1/2">
              <div className="liquid-card aspect-square rounded-[1.5rem] overflow-hidden relative group">
                {!isImageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                  </div>
                )}
                <img
                  src={product.image_url || '/placeholder.png'}
                  alt={product.name}
                  className={`w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02] p-4 ${
                    isImageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setIsImageLoaded(true)}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzFhMjMzMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                    setIsImageLoaded(true);
                  }}
                />
              </div>
            </div>

            {/* Info Section */}
            <div className="lg:w-1/2 space-y-6">
              {/* Category Badge */}
              {subcategory && (
                <Badge variant="secondary" className="liquid-badge text-white/90">
                  {subcategory.name}
                </Badge>
              )}

              {/* Title */}
              <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {renderStars(product.rating)}
                </div>
                <span className="text-white/50 text-sm">
                  {product.rating}/5
                </span>
              </div>

              <div className="h-px bg-white/10" />

              {/* Description */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-white">Описание</h2>
                <p className="text-white/70 leading-relaxed">
                  {product.description || 'Описание отсутствует'}
                </p>
              </div>

              <div className="h-px bg-white/10" />

              {/* Order Button */}
              <div className="pt-2">
                <Button
                  size="lg"
                  className="w-full sm:w-auto liquid-button px-12 py-6 text-lg rounded-xl"
                  onClick={() => product.order_link && window.open(product.order_link, '_blank')}
                >
                  <ShoppingBag className="w-5 h-5 mr-3" />
                  Заказать
                </Button>
              </div>

              {/* Additional Info */}
              <div className="liquid-card rounded-xl p-6 space-y-4">
                <h3 className="font-semibold text-white">Информация о товаре</h3>
                <div className="flex flex-col sm:flex-row sm:gap-8 gap-4 text-sm">
                  <div>
                    <span className="text-white/50">Артикул:</span>
                    <p className="font-medium text-white">{product.article || '—'}</p>
                  </div>
                  <div>
                    <span className="text-white/50">Категория:</span>
                    <p className="font-medium text-white">{category?.name || '—'}</p>
                  </div>
                  <div>
                    <span className="text-white/50">Подкатегория:</span>
                    <p className="font-medium text-white">{subcategory?.name || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
