import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiClient } from '@/api/client';
import type { HeroContent, HeroSlide } from '@/types';

interface DatabaseContextType {
  categories: any[];
  subcategories: any[];
  products: any[];
  posts: any[];
  adminUsers: any[];
  heroContent: HeroContent | null;
  heroSlides: HeroSlide[];

  // Categories
  addCategory: (name: string, icon: string) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;

  // Subcategories
  getSubcategoriesByCategory: (categoryId: number) => any[];
  addSubcategory: (name: string, categoryId: number) => Promise<void>;
  deleteSubcategory: (id: number) => Promise<void>;

  // Products
  getProductsBySubcategory: (subcategoryId: number) => any[];
  searchProducts: (query: string) => Promise<void>;
  addProduct: (product: any) => Promise<void>;
  updateProduct: (id: number, product: any) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;

  // Posts
  addPost: (post: any) => Promise<void>;
  updatePost: (id: number, post: any) => Promise<void>;
  deletePost: (id: number) => Promise<void>;

  // Hero
  updateHeroContent: (payload: { title: string; description: string }) => Promise<void>;
  addHeroSlide: (slide: { image_url: string; caption?: string | null; sort_order?: number }) => Promise<void>;
  updateHeroSlide: (id: number, slide: { image_url: string; caption?: string | null; sort_order: number }) => Promise<void>;
  deleteHeroSlide: (id: number) => Promise<void>;

  // Admin Users
  getAdminUserByUsername: (username: string) => any | null;
  addAdminUser: (user: any) => Promise<void>;
  updateAdminUser: (id: number, user: any) => Promise<void>;
  deleteAdminUser: (id: number) => Promise<void>;

  isLoading: boolean;
  loadError: string | null;
  refreshData: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [heroContent, setHeroContent] = useState<HeroContent | null>(null);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      // Load public data independently - don't let one failure break everything
      const results = await Promise.allSettled([
        apiClient.getCategories(),
        apiClient.getSubcategories(),
        apiClient.getProducts(),
        apiClient.getPosts(),
        apiClient.getAdminUsers().catch(() => []),
        apiClient.getHeroContent().catch(() => null),
        apiClient.getHeroSlides(),
      ]);

      const getValue = <T,>(result: PromiseSettledResult<T>, fallback: T): T =>
        result.status === 'fulfilled' ? result.value : fallback;

      setCategories(getValue(results[0], []));
      setSubcategories(getValue(results[1], []));
      setProducts(getValue(results[2], []));
      setPosts(getValue(results[3], []));
      setAdminUsers(getValue(results[4], []));
      setHeroContent(getValue(results[5], null));
      setHeroSlides(getValue(results[6], []));

      // Check if critical data failed
      const criticalFailed = results.slice(0, 4).some(r => r.status === 'rejected');
      if (criticalFailed) {
        const errors = results
          .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
          .map(r => r.reason?.message || 'Unknown error');
        setLoadError(errors.join('; '));
        console.error('Some data failed to load:', errors);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Categories
  const addCategory = async (name: string, icon: string) => {
    await apiClient.addCategory(name, icon);
    await loadData();
  };

  const deleteCategory = async (id: number) => {
    await apiClient.deleteCategory(id);
    await loadData();
  };

  // Subcategories
  const getSubcategoriesByCategory = (categoryId: number) => {
    return subcategories.filter(s => s.category_id === categoryId);
  };

  const addSubcategory = async (name: string, categoryId: number) => {
    await apiClient.addSubcategory(name, categoryId);
    await loadData();
  };

  const deleteSubcategory = async (id: number) => {
    await apiClient.deleteSubcategory(id);
    await loadData();
  };

  // Products
  const getProductsBySubcategory = (subcategoryId: number) => {
    return products.filter(p => p.subcategory_id === subcategoryId);
  };

  const searchProducts = async (query: string) => {
    const results = await apiClient.getProducts(undefined, query);
    setProducts(results);
  };

  const addProduct = async (product: any) => {
    await apiClient.addProduct(product);
    await loadData();
  };

  const updateProduct = async (id: number, product: any) => {
    await apiClient.updateProduct(id, product);
    await loadData();
  };

  const deleteProduct = async (id: number) => {
    await apiClient.deleteProduct(id);
    await loadData();
  };

  // Posts
  const addPost = async (post: any) => {
    await apiClient.addPost(post);
    await loadData();
  };

  const updatePost = async (id: number, post: any) => {
    await apiClient.updatePost(id, post);
    await loadData();
  };

  const deletePost = async (id: number) => {
    await apiClient.deletePost(id);
    await loadData();
  };

  // Hero
  const updateHeroContent = async (payload: { title: string; description: string }) => {
    await apiClient.updateHeroContent(payload);
    await loadData();
  };

  const addHeroSlide = async (slide: { image_url: string; caption?: string | null; sort_order?: number }) => {
    await apiClient.addHeroSlide(slide);
    await loadData();
  };

  const updateHeroSlide = async (id: number, slide: { image_url: string; caption?: string | null; sort_order: number }) => {
    await apiClient.updateHeroSlide(id, slide);
    await loadData();
  };

  const deleteHeroSlide = async (id: number) => {
    await apiClient.deleteHeroSlide(id);
    await loadData();
  };

  // Admin Users
  const getAdminUserByUsername = (username: string) => {
    return adminUsers.find(u => u.username === username) || null;
  };

  const addAdminUser = async (user: any) => {
    await apiClient.addAdminUser(user);
    await loadData();
  };

  const updateAdminUser = async (id: number, user: any) => {
    await apiClient.updateAdminUser(id, user);
    await loadData();
  };

  const deleteAdminUser = async (id: number) => {
    await apiClient.deleteAdminUser(id);
    await loadData();
  };

  const value: DatabaseContextType = {
    categories,
    subcategories,
    products,
    posts,
    adminUsers,
    heroContent,
    heroSlides,
    addCategory,
    deleteCategory,
    getSubcategoriesByCategory,
    addSubcategory,
    deleteSubcategory,
    getProductsBySubcategory,
    searchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    addPost,
    updatePost,
    deletePost,
    updateHeroContent,
    addHeroSlide,
    updateHeroSlide,
    deleteHeroSlide,
    getAdminUserByUsername,
    addAdminUser,
    updateAdminUser,
    deleteAdminUser,
    isLoading,
    loadError,
    refreshData: loadData,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
