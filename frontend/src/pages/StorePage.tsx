import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDatabase } from '@/context/DatabaseContext';
import { Star, ShoppingBag, Menu, ChevronRight, Calendar, User, Cuboid, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';
import { getCategoryIcon } from '@/lib/categoryIcons';

// Function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function StorePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories, subcategories, products, posts, heroContent, heroSlides, getProductsBySubcategory, getSubcategoriesByCategory, isLoading, loadError } = useDatabase();
  const { theme } = useTheme();
  
  const urlCategory = searchParams.get('category');
  const urlSubcategory = searchParams.get('subcategory');
  
  const [selectedCategory, setSelectedCategory] = useState<number | null>(urlCategory ? parseInt(urlCategory) : null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(urlSubcategory ? parseInt(urlSubcategory) : null);
  const [shuffledProducts, setShuffledProducts] = useState(products);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Shuffle products when component mounts or products change
  useEffect(() => {
    setShuffledProducts(shuffleArray(products));
  }, [products]);

  useEffect(() => {
    if (urlCategory) {
      setSelectedCategory(parseInt(urlCategory));
    }
    if (urlSubcategory) {
      setSelectedSubcategory(parseInt(urlSubcategory));
    }
  }, [urlCategory, urlSubcategory]);

  useEffect(() => {
    if (heroSlides.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [heroSlides]);

  const handleCategoryClick = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(null);
    if (categoryId) {
      setSearchParams({ category: categoryId.toString() });
    } else {
      setSearchParams({});
    }
  };

  const handleSubcategoryClick = (subcategoryId: number) => {
    setSelectedSubcategory(subcategoryId);
    setSearchParams({ subcategory: subcategoryId.toString() });
  };

  const displayedProducts = selectedSubcategory
    ? getProductsBySubcategory(selectedSubcategory)
    : selectedCategory
      ? products.filter(p => {
          const sub = subcategories.find(s => s.id === p.subcategory_id);
          return sub?.category_id === selectedCategory;
        })
      : shuffledProducts;

  const featuredProduct = shuffledProducts[0] || displayedProducts[0] || null;
  const activeHeroSlide = heroSlides.length > 0 ? heroSlides[currentSlide % heroSlides.length] : null;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 ${i < rating ? 'fill-white text-white' : 'text-white/35'}`}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const SidebarContent = () => (
    <div className="space-y-1">
      <div 
        className={`liquid-nav-item nav-animate p-3 rounded-xl cursor-pointer transition-all duration-200 ${
          selectedCategory === null 
            ? 'is-active text-white' 
            : 'text-white/75'
        }`}
        onClick={() => handleCategoryClick(null)}
      >
        <span className="font-medium inline-flex items-center gap-2"><Layers className="w-4 h-4" />Все товары</span>
      </div>
      {categories.map((category) => {
        const isSelected = selectedCategory === category.id;
        const catSubcategories = getSubcategoriesByCategory(category.id);
        
        return (
          <div key={category.id} className="space-y-1">
            <div
              className={`liquid-nav-item nav-animate p-3 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-between ${
                isSelected 
                  ? 'is-active text-white' 
                  : 'text-white/75'
              }`}
              onClick={() => handleCategoryClick(category.id)}
            >
              <span className="font-medium inline-flex items-center gap-2">{(() => { const Icon = getCategoryIcon(category.icon); return <Icon className="w-4 h-4" />; })()}{category.name}</span>
              {catSubcategories.length > 0 && (
                <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
              )}
            </div>
            {isSelected && catSubcategories.length > 0 && (
              <div className="ml-4 space-y-1 border-l border-white/20 pl-3">
                {catSubcategories.map((sub) => (
                  <div
                    key={sub.id}
                    className={`liquid-nav-item nav-animate p-2.5 rounded-lg cursor-pointer transition-all duration-200 text-sm ${
                      selectedSubcategory === sub.id 
                        ? 'is-active text-white' 
                        : 'text-white/70'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubcategoryClick(sub.id);
                    }}
                  >
                    {sub.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  if (isLoading) {
    return (
      <div className="theme-root min-h-screen liquid-bg flex items-center justify-center" data-theme={theme}>
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-white/80 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (loadError && products.length === 0) {
    return (
      <div className="theme-root min-h-screen liquid-bg flex items-center justify-center" data-theme={theme}>
        <div className="text-center px-4">
          <p className="text-white/80 text-lg mb-2">Не удалось загрузить данные</p>
          <p className="text-white/50 text-sm mb-4">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="liquid-button px-6 py-3 rounded-xl text-white"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-root min-h-screen liquid-bg text-slate-100" data-theme={theme}>
      {/* Header */}
      <header className="sticky top-3 z-50 px-3 lg:px-6">
        <div className="liquid-panel flex items-center justify-between px-4 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="liquid-icon-btn text-white/90 hover:text-white">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="liquid-sheet w-80 text-white border-white/15">
                <div className="text-xl font-bold mb-6 text-white">Категории</div>
                <ScrollArea className="h-[calc(100vh-120px)]">
                  <SidebarContent />
                </ScrollArea>
              </SheetContent>
            </Sheet>
            
            <h1 className="text-xl font-bold tracking-tight text-white">CLOTHING STORE</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <a 
              href="/admin" 
              className="text-sm text-white/70 hover:text-white transition-colors font-medium"
            >
              Админ панель
            </a>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-80 min-h-[calc(100vh-110px)] sticky top-[102px] p-4 pt-6">
          <div className="liquid-panel p-6">
            <div className="text-lg font-bold mb-5 text-white">Категории</div>
            <ScrollArea className="h-[calc(100vh-180px)]">
              <SidebarContent />
            </ScrollArea>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          <Tabs defaultValue="home" className="w-full">
            <TabsList className="liquid-panel mb-6 p-1.5 rounded-2xl border-white/20">
              <TabsTrigger 
                value="home" 
                className="liquid-tab-trigger nav-animate data-[state=active]:text-white rounded-xl px-6 py-2.5 transition-all"
              >
                Главная
              </TabsTrigger>
              <TabsTrigger 
                value="products" 
                className="liquid-tab-trigger nav-animate data-[state=active]:text-white rounded-xl px-6 py-2.5 transition-all"
              >
                Все товары
              </TabsTrigger>
            </TabsList>

            {/* Home Tab - Posts */}
            <TabsContent value="home" className="space-y-6">
              {featuredProduct && (
                <section className="material-hero overflow-hidden rounded-[1.75rem] p-5 md:p-8">
                  <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
                    <div className="lg:flex-[1.2]">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-white/75">
                        <Cuboid className="h-3.5 w-3.5" />
                        Главный объект
                      </div>
                      <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-tight text-white md:text-4xl">
                        {heroContent?.title || 'Реалистичный минимализм — будто вещь находится прямо перед вами'}
                      </h2>
                      <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70 md:text-base">
                        {heroContent?.description || 'Мы оставили спокойное пространство и один акцент: фактуру ткани, мягкий реальный свет и глубину, которая делает каталог ближе к физическому миру.'}
                      </p>
                    </div>
                    <div
                      className="material-object group cursor-pointer lg:flex-1"
                      onClick={() => navigate(`/product/${featuredProduct.id}`)}
                    >
                      <div className="material-glow" />
                      <img
                        src={activeHeroSlide?.image_url || featuredProduct.image_url || '/placeholder.png'}
                        alt={featuredProduct.name}
                        className="relative z-10 h-[360px] w-full rounded-[1.2rem] object-cover shadow-2xl transition-transform duration-700 group-hover:scale-[1.03]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                        }}
                      />
                      <div className="relative z-10 mt-4 flex items-center justify-between px-1">
                        <div>
                          <p className="text-sm uppercase tracking-[0.14em] text-white/45">Выбор недели</p>
                          <p className="text-lg font-medium text-white">{activeHeroSlide?.caption || featuredProduct.name}</p>
                        </div>
                        <Button
                          className="liquid-button rounded-xl"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/product/${featuredProduct.id}`);
                          }}
                        >
                          Смотреть
                        </Button>
                      </div>
                      {heroSlides.length > 1 && (
                        <div className="relative z-10 mt-3 flex gap-2 px-1">
                          {heroSlides.map((slide, index) => (
                            <button
                              key={slide.id}
                              type="button"
                              className={`h-2.5 w-2.5 rounded-full transition-all ${index === currentSlide ? 'bg-white' : 'bg-white/35 hover:bg-white/60'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentSlide(index);
                              }}
                              aria-label={`Слайд ${index + 1}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Новости и акции</h2>
                <Badge variant="secondary" className="liquid-badge text-white/90">
                  {posts.length} постов
                </Badge>
              </div>

              {posts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 liquid-panel rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-white/50" />
                  </div>
                  <p className="text-white/60">Нет новостей</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <Card key={post.id} className="liquid-card overflow-hidden transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4 text-sm text-white/60">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {formatDate(post.created_at)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User className="w-4 h-4" />
                            {post.author_name}
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">{post.title}</h3>
                        <div 
                          className="text-white/75 leading-relaxed line-clamp-3"
                          dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products">
              {/* Breadcrumb */}
              <div className="mb-8 flex items-center gap-2 text-sm">
                <span 
                  className={`cursor-pointer transition-colors ${selectedCategory === null ? 'text-white font-medium' : 'text-white/45 hover:text-white'}`}
                  onClick={() => handleCategoryClick(null)}
                >
                  Все товары
                </span>
                {selectedCategory && (
                  <>
                    <span className="text-white/30">/</span>
                    <span 
                      className={`cursor-pointer transition-colors ${selectedSubcategory === null ? 'text-white font-medium' : 'text-white/45 hover:text-white'}`}
                      onClick={() => {
                        setSelectedSubcategory(null);
                        setSearchParams({ category: selectedCategory.toString() });
                      }}
                    >
                      {categories.find(c => c.id === selectedCategory)?.name}
                    </span>
                  </>
                )}
                {selectedSubcategory && (
                  <>
                    <span className="text-white/30">/</span>
                    <span className="text-white font-medium">
                      {subcategories.find(s => s.id === selectedSubcategory)?.name}
                    </span>
                  </>
                )}
              </div>

              {/* Products Grid */}
              {displayedProducts.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 liquid-panel rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag className="w-10 h-10 text-white/45" />
                  </div>
                  <p className="text-xl font-medium text-white mb-2">Нет товаров</p>
                  <p className="text-white/60">В этой категории пока нет товаров</p>
                </div>
              ) : (
                <div className="product-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                  {displayedProducts.map((product, index) => (
                    <Card 
                      key={product.id} 
                      className="liquid-card overflow-hidden group cursor-pointer hover:-translate-y-1 py-0 gap-0"
                      onClick={() => navigate(`/product/${product.id}`)}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="aspect-[4/5] overflow-hidden bg-slate-900/30 relative ">
                        <img
                          src={product.image_url || '/placeholder.png'}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                          }}
                        />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                      </div>
                      <CardContent className="p-5">
                        <h3 className="font-semibold text-lg mb-2 text-white line-clamp-1 transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-white/60 text-sm mb-3 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                        <div className="flex items-center gap-1.5">
                          {renderStars(product.rating)}
                          <span className="text-xs text-white/50 ml-1">({product.rating})</span>
                        </div>
                      </CardContent>
                      <CardFooter className="px-5 pb-5 pt-0">
                        <Button 
                          className="w-full liquid-button rounded-xl transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (product.order_link) {
                              window.open(product.order_link, '_blank');
                            }
                          }}
                        >
                          <ShoppingBag className="w-4 h-4 mr-2" />
                          Заказать
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
