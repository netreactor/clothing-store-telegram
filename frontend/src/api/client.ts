const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const TOKEN_KEY = 'telegram_auth_token';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options.headers,
      },
    });

    // Handle 401 - token expired or invalid
    if (response.status === 401) {
      // Clear auth data and trigger re-authentication
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('telegram_auth_user');
      
      // Trigger a custom event that components can listen to
      window.dispatchEvent(new CustomEvent('auth:expired'));
      
      throw new Error('Authentication expired. Please log in again.');
    }

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (typeof errorData?.error === 'string') {
          errorMessage = errorData.error;
        }
      } catch {
        // Ignore invalid JSON errors and use fallback message
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // ============================================
  // AUTHENTICATION
  // ============================================

  async authenticateTelegram(initData: string) {
    return this.request('/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({ initData }),
    });
  }

  async authenticateAdmin(username: string, password: string) {
    return this.request('/auth/admin', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // ============================================
  // CATEGORIES
  // ============================================

  async getCategories() {
    return this.request('/categories');
  }

  async addCategory(name: string, icon: string) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify({ name, icon }),
    });
  }

  async deleteCategory(id: number) {
    return this.request(`/categories/${id}`, { method: 'DELETE' });
  }

  // ============================================
  // SUBCATEGORIES
  // ============================================

  async getSubcategories(categoryId?: number) {
    const params = categoryId ? `?category_id=${categoryId}` : '';
    return this.request(`/subcategories${params}`);
  }

  async addSubcategory(name: string, categoryId: number) {
    return this.request('/subcategories', {
      method: 'POST',
      body: JSON.stringify({ name, category_id: categoryId }),
    });
  }

  async deleteSubcategory(id: number) {
    return this.request(`/subcategories/${id}`, { method: 'DELETE' });
  }

  // ============================================
  // PRODUCTS
  // ============================================

  async getProducts(subcategoryId?: number, search?: string) {
    const params = new URLSearchParams();
    if (subcategoryId) params.append('subcategory_id', subcategoryId.toString());
    if (search) params.append('search', search);
    const queryString = params.toString();
    return this.request(`/products${queryString ? `?${queryString}` : ''}`);
  }

  async getProduct(id: number) {
    return this.request(`/products/${id}`);
  }

  async addProduct(product: any) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: number, product: any) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  async deleteProduct(id: number) {
    return this.request(`/products/${id}`, { method: 'DELETE' });
  }

  // ============================================
  // POSTS
  // ============================================

  async getPosts() {
    return this.request('/posts');
  }

  async addPost(post: any) {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(post),
    });
  }

  async updatePost(id: number, post: any) {
    return this.request(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(post),
    });
  }

  async deletePost(id: number) {
    return this.request(`/posts/${id}`, { method: 'DELETE' });
  }

  // ============================================
  // HERO CONTENT
  // ============================================

  async getHeroContent() {
    return this.request('/hero-content');
  }

  async updateHeroContent(payload: { title: string; description: string }) {
    return this.request('/hero-content', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // ============================================
  // HERO SLIDES
  // ============================================

  async getHeroSlides() {
    return this.request('/hero-slides');
  }

  async addHeroSlide(slide: { image_url: string; caption?: string | null; sort_order?: number }) {
    return this.request('/hero-slides', {
      method: 'POST',
      body: JSON.stringify(slide),
    });
  }

  async updateHeroSlide(id: number, slide: { image_url: string; caption?: string | null; sort_order: number }) {
    return this.request(`/hero-slides/${id}`, {
      method: 'PUT',
      body: JSON.stringify(slide),
    });
  }

  async deleteHeroSlide(id: number) {
    return this.request(`/hero-slides/${id}`, { method: 'DELETE' });
  }

  // ============================================
  // ADMIN USERS
  // ============================================

  async getAdminUsers() {
    return this.request('/admin-users');
  }

  async getAdminUserByUsername(username: string) {
    try {
      return await this.request(`/admin-users/${username}`);
    } catch {
      return null;
    }
  }

  async addAdminUser(user: any) {
    return this.request('/admin-users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async updateAdminUser(id: number, user: any) {
    return this.request(`/admin-users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  }

  async deleteAdminUser(id: number) {
    return this.request(`/admin-users/${id}`, { method: 'DELETE' });
  }

  // ============================================
  // TELEGRAM USERS (Admin only)
  // ============================================


  async addTelegramAdmin(telegramId: number, role: 'admin' | 'master_admin') {
    return this.request('/admin/add', {
      method: 'POST',
      body: JSON.stringify({ telegram_id: telegramId, role }),
    });
  }

  async getTelegramUsers() {
    return this.request('/telegram-users');
  }

  async updateTelegramUserRole(id: number, role: 'user' | 'admin' | 'master_admin') {
    return this.request(`/telegram-users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }
}

export const apiClient = new ApiClient(API_URL);
