import { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { useDatabase } from '@/context/DatabaseContext';
import { 
  Lock, 
  LogOut, 
  Plus, 
  Trash2, 
  Star, 
  FolderTree, 
  Package, 
  ChevronRight,
  Image as ImageIcon,
  Save,
  X,
  Search,
  Users,
  FileText,
  Calendar,
  User,
  Shield,
  Edit3,
  LayoutTemplate
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import ReactQuill from 'react-quill-new';
import { CATEGORY_ICON_OPTIONS, getCategoryIcon } from '@/lib/categoryIcons';
import 'react-quill-new/dist/quill.snow.css';
import type { AdminUser } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useTelegram } from '@/context/TelegramContext';

// Quill editor modules and formats
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'font': [] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'align': [] }],
    ['link', 'image'],
    ['clean']
  ],
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'font', 'size',
  'list', 'bullet',
  'align',
  'link', 'image'
];


export default function AdminPage() {
  const { isTelegramEnvironment } = useTelegram();
  const { user: authUser, isAuthenticated, isLoading: authLoading, isAdmin, logout, authenticateWithPassword } = useAuth();
  
  // Fallback password authentication (development only)
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  useEffect(() => {
    const previousTheme = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'light');

    return () => {
      if (previousTheme) {
        document.documentElement.setAttribute('data-theme', previousTheme);
      }
    };
  }, []);


  // Handle password login (fallback for non-Telegram environments in development)
  const handlePasswordLogin = async () => {
    if (!username || !password) {
      setLoginError('Введите логин и пароль');
      return;
    }

    setIsLoginLoading(true);
    setLoginError('');

    try {
      await authenticateWithPassword(username, password);
      setShowPasswordLogin(false);
    } catch (error: any) {
      setLoginError(error.message || 'Неверный логин или пароль');
    } finally {
      setIsLoginLoading(false);
    }
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="theme-root min-h-screen bg-gray-50 flex items-center justify-center" data-theme="light">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Show authentication error or login prompt
  if (!isAuthenticated || !authUser) {
    return (
      <div className="theme-root min-h-screen bg-gray-50 flex items-center justify-center p-4" data-theme="light">
        <Card className="bg-white border-gray-200 w-full max-w-md shadow-xl">
          <CardHeader className="text-center pb-8">
            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-black">Админ панель</CardTitle>
            {isTelegramEnvironment ? (
              <p className="text-gray-500 text-sm mt-2">
                Аутентификация через Telegram...
              </p>
            ) : showPasswordLogin ? (
              <p className="text-gray-500 text-sm mt-2">Введите логин и пароль</p>
            ) : (
              <p className="text-gray-500 text-sm mt-2">
                Откройте через Telegram для доступа
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            {!isTelegramEnvironment && showPasswordLogin ? (
              <>
                <div>
                  <Label htmlFor="username" className="text-gray-700">Логин</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-gray-50 border-gray-200 text-black mt-1.5 focus:border-black focus:ring-black"
                    placeholder="Введите логин"
                    disabled={isLoginLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-gray-700">Пароль</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePasswordLogin()}
                    className="bg-gray-50 border-gray-200 text-black mt-1.5 focus:border-black focus:ring-black"
                    placeholder="Введите пароль"
                    disabled={isLoginLoading}
                  />
                </div>
                {loginError && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{loginError}</p>}
                <Button 
                  onClick={handlePasswordLogin} 
                  className="w-full bg-black text-white hover:bg-gray-800 rounded-lg py-5 text-base font-medium"
                  disabled={isLoginLoading}
                >
                  {isLoginLoading ? 'Вход...' : 'Войти'}
                </Button>
              </>
            ) : !isTelegramEnvironment ? (
              <>
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">
                    Для доступа к админ панели используйте Telegram Mini App
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setShowPasswordLogin(true)}
                    className="text-xs text-gray-500"
                  >
                    Использовать пароль (только для разработки)
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600">
                  Подключение к Telegram...
                </p>
              </div>
            )}
            <a 
              href="/" 
              className="block text-center text-gray-500 hover:text-black text-sm transition-colors"
            >
              Вернуться на сайт
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user has admin permissions
  if (!isAdmin) {
    return (
      <div className="theme-root min-h-screen bg-gray-50 flex items-center justify-center p-4" data-theme="light">
        <Card className="bg-white border-gray-200 w-full max-w-md shadow-xl">
          <CardHeader className="text-center pb-8">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-black">Доступ запрещен</CardTitle>
            <p className="text-gray-500 text-sm mt-2">
              У вас нет прав администратора
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Текущая роль:</p>
              <Badge className="bg-gray-200 text-gray-700">{authUser.role}</Badge>
            </div>
            <p className="text-sm text-gray-600">
              Свяжитесь с администратором для получения прав доступа.
            </p>
            <a 
              href="/" 
              className="block text-center bg-black text-white hover:bg-gray-800 py-3 rounded-lg transition-colors"
            >
              Вернуться на сайт
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Adapt user object to match original AdminPage expectations
  const currentUser = {
    id: authUser.id,
    username: authUser.username || authUser.firstName || 'Admin',
    is_master: authUser.role === 'master_admin',
    can_manage_categories: true,
    can_manage_products: true,
    can_manage_posts: true,
    can_manage_admins: authUser.role === 'master_admin',
  };

  const handleLogout = () => {
    logout();
  };


  // Main admin panel from original code
  return (
    <div className="theme-root admin-panel min-h-screen bg-gray-50" data-theme="light">
      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
        <div className="flex items-center justify-between px-4 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight text-black">АДМИН ПАНЕЛЬ</h1>
            <Badge className="bg-black text-white">
              {currentUser.is_master ? 'Главный админ' : 'Администратор'}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{currentUser.username}</span>
            <a 
              href="/" 
              className="text-sm text-gray-500 hover:text-black transition-colors font-medium"
            >
              На сайт
            </a>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="btn-secondary"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 lg:p-8">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="bg-white border border-gray-200 mb-6 p-1 rounded-xl flex-wrap h-auto gap-1">
            {currentUser.can_manage_posts && (
              <TabsTrigger 
                value="posts" 
                className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900 rounded-lg px-4 py-2.5 transition-all"
              >
                <FileText className="w-4 h-4 mr-2" />
                Посты
              </TabsTrigger>
            )}
            {currentUser.can_manage_categories && (
              <TabsTrigger 
                value="categories" 
                className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900 rounded-lg px-4 py-2.5 transition-all"
              >
                <FolderTree className="w-4 h-4 mr-2" />
                Категории
              </TabsTrigger>
            )}
            {currentUser.can_manage_products && (
              <TabsTrigger 
                value="products" 
                className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900 rounded-lg px-4 py-2.5 transition-all"
              >
                <Package className="w-4 h-4 mr-2" />
                Товары
              </TabsTrigger>
            )}
            {currentUser.can_manage_products && (
              <TabsTrigger 
                value="hero"
                className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900 rounded-lg px-4 py-2.5 transition-all"
              >
                <LayoutTemplate className="w-4 h-4 mr-2" />
                Главный блок
              </TabsTrigger>
            )}
            {currentUser.can_manage_admins && (
              <TabsTrigger 
                value="admins" 
                className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900 rounded-lg px-4 py-2.5 transition-all"
              >
                <Users className="w-4 h-4 mr-2" />
                Администраторы
              </TabsTrigger>
            )}
          </TabsList>

          {currentUser.can_manage_posts && (
            <TabsContent value="posts">
              <PostsManager currentUser={currentUser} />
            </TabsContent>
          )}

          {currentUser.can_manage_categories && (
            <TabsContent value="categories">
              <CategoriesManager />
            </TabsContent>
          )}

          {currentUser.can_manage_products && (
            <TabsContent value="products">
              <ProductsManager />
            </TabsContent>
          )}

          {currentUser.can_manage_products && (
            <TabsContent value="hero">
              <HeroManager />
            </TabsContent>
          )}

          {currentUser.can_manage_admins && (
            <TabsContent value="admins">
              <AdminsManager />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}

// Posts Manager Component
function PostsManager({ currentUser }: { currentUser: AdminUser }) {
  const { posts, addPost, updatePost, deletePost, adminUsers: allAdmins } = useDatabase();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    author_id: currentUser.id,
    author_name: currentUser.username,
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      image_url: '',
      author_id: currentUser.id,
      author_name: currentUser.username,
    });
    setEditingPost(null);
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.content.trim()) return;

    if (editingPost) {
      updatePost(editingPost.id, {
        title: formData.title,
        content: formData.content,
        image_url: formData.image_url,
      });
    } else {
      const selectedAdmin = allAdmins.find(a => a.id === formData.author_id);
      addPost({
        title: formData.title.trim(),
        content: formData.content,
        image_url: formData.image_url.trim() || undefined,
        author_id: formData.author_id,
        author_name: selectedAdmin?.username || currentUser.username,
      });
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      image_url: post.image_url || '',
      author_id: post.author_id,
      author_name: post.author_name,
    });
    setIsDialogOpen(true);
  };

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header with search and add button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-black">Посты</h2>
          <p className="text-gray-500 text-sm">Всего: {posts.length} постов</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск постов..."
              className="pl-10 bg-white border-gray-200"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="btn-primary rounded-lg"
                onClick={() => {
                  resetForm();
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-gray-200 max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-black">
                  {editingPost ? 'Редактировать пост' : 'Создать пост'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 py-4">
                {!editingPost && (
                  <div>
                    <Label className="text-gray-700">От имени администратора</Label>
                    <Select 
                      value={formData.author_id.toString()} 
                      onValueChange={(value) => {
                        const admin = allAdmins.find(a => a.id === parseInt(value));
                        setFormData({ 
                          ...formData, 
                          author_id: parseInt(value),
                          author_name: admin?.username || ''
                        });
                      }}
                    >
                      <SelectTrigger className="bg-gray-50 border-gray-200 mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        {allAdmins.map((admin) => (
                          <SelectItem key={admin.id} value={admin.id.toString()}>
                            {admin.username} {admin.is_master && '(Главный админ)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label className="text-gray-700">Заголовок</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-gray-50 border-gray-200 mt-1.5 focus:border-black focus:ring-black"
                    placeholder="Заголовок поста"
                  />
                </div>

                <div>
                  <Label className="text-gray-700">Ссылка на картинку (необязательно)</Label>
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="bg-gray-50 border-gray-200 mt-1.5 focus:border-black focus:ring-black"
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.image_url && (
                    <div className="mt-2">
                      <img 
                        src={formData.image_url} 
                        alt="Предпросмотр" 
                        className="max-h-32 rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-gray-700">Содержание</Label>
                  <div className="mt-1.5">
                    <ReactQuill
                      theme="snow"
                      value={formData.content}
                      onChange={(content) => setFormData({ ...formData, content })}
                      modules={quillModules}
                      formats={quillFormats}
                      className="bg-white rounded-lg"
                      style={{ height: '300px', marginBottom: '50px' }}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleSubmit}
                    className="flex-1 btn-primary rounded-lg"
                    disabled={!formData.title.trim() || !formData.content.trim()}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingPost ? 'Сохранить' : 'Опубликовать'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Отмена
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <Card key={post.id} className="bg-white border-gray-200 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {formatDate(post.created_at)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    {post.author_name}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEdit(post)}
                    className="btn-secondary"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Редактировать
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => deletePost(post.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-black mb-2">{post.title}</h3>
              {post.image_url && (
                <div className="mb-3">
                  <img 
                    src={post.image_url} 
                    alt={post.title} 
                    className="max-h-48 rounded-lg border border-gray-200"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div 
                className="text-gray-600 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content.substring(0, 300) + (post.content.length > 300 ? '...' : '') }}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-lg font-medium text-gray-900 mb-1">
            {searchQuery ? 'Ничего не найдено' : 'Нет постов'}
          </p>
          <p className="text-gray-500 text-sm">
            {searchQuery ? 'Попробуйте изменить запрос' : 'Создайте первый пост'}
          </p>
        </div>
      )}
    </div>
  );
}

// Categories Manager Component
function CategoriesManager() {
  const { categories, subcategories, addCategory, addSubcategory, deleteCategory, deleteSubcategory } = useDatabase();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('shirt');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addCategory(newCategoryName.trim(), newCategoryIcon);
      setNewCategoryName('');
      setNewCategoryIcon('shirt');
    }
  };

  const handleAddSubcategory = () => {
    if (newSubcategoryName.trim() && selectedCategoryId) {
      addSubcategory(newSubcategoryName.trim(), parseInt(selectedCategoryId));
      setNewSubcategoryName('');
      setSelectedCategoryId('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Add Category */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-black flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Добавить категорию
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-700">Название категории</Label>
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="bg-gray-50 border-gray-200 mt-1.5 focus:border-black focus:ring-black"
              placeholder="Например: Мужская одежда"
            />
          </div>
          <div>
            <Label className="text-gray-700">Иконка категории</Label>
            <Select value={newCategoryIcon} onValueChange={setNewCategoryIcon}>
              <SelectTrigger className="bg-gray-50 border-gray-200 mt-1.5">
                <SelectValue placeholder="Выберите иконку" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                {CATEGORY_ICON_OPTIONS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SelectItem key={item.value} value={item.value}>
                      <span className="inline-flex items-center gap-2"><Icon className="w-4 h-4" />{item.label}</span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleAddCategory}
            className="btn-primary rounded-lg"
            disabled={!newCategoryName.trim()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить категорию
          </Button>
        </CardContent>
      </Card>

      {/* Add Subcategory */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-black flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Добавить подкатегорию
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-700">Выберите категорию</Label>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger className="bg-gray-50 border-gray-200 mt-1.5">
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-gray-700">Название подкатегории</Label>
            <Input
              value={newSubcategoryName}
              onChange={(e) => setNewSubcategoryName(e.target.value)}
              className="bg-gray-50 border-gray-200 mt-1.5 focus:border-black focus:ring-black"
              placeholder="Например: Футболки"
            />
          </div>
          <Button 
            onClick={handleAddSubcategory}
            className="btn-primary rounded-lg"
            disabled={!selectedCategoryId || !newSubcategoryName.trim()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить подкатегорию
          </Button>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card className="bg-white border-gray-200 shadow-sm lg:col-span-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-black">Список категорий</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {categories.length === 0 ? (
                <div className="text-center py-12">
                  <FolderTree className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Нет категорий</p>
                </div>
              ) : (
                categories.map((category) => {
                  const isExpanded = expandedCategories.has(category.id);
                  const categorySubcategories = subcategories.filter(s => s.category_id === category.id);
                  
                  return (
                    <div key={category.id} className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                      <div className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors">
                        <div 
                          className="flex items-center gap-3 cursor-pointer flex-1"
                          onClick={() => toggleCategory(category.id)}
                        >
                          <div className={`w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                          </div>
                          <span className="font-medium text-black inline-flex items-center gap-2">{(() => { const Icon = getCategoryIcon(category.icon); return <Icon className="w-4 h-4" />; })()}{category.name}</span>
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                            {categorySubcategories.length} подкатегорий
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCategory(category.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {isExpanded && (
                        <div className="p-3 space-y-2 bg-gray-50 border-t border-gray-100">
                          {categorySubcategories.length === 0 ? (
                            <p className="text-gray-400 text-sm py-2 px-4">Нет подкатегорий</p>
                          ) : (
                            categorySubcategories.map((sub) => (
                              <div 
                                key={sub.id} 
                                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100"
                              >
                                <span className="text-sm text-gray-700">{sub.name}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteSubcategory(sub.id)}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// Products Manager Component
function ProductsManager() {
  const { categories, subcategories, products, addProduct, deleteProduct, updateProduct } = useDatabase();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    article: '',
    description: '',
    image_url: '',
    rating: 5,
    order_link: '',
    subcategory_id: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      article: '',
      description: '',
      image_url: '',
      rating: 5,
      order_link: '',
      subcategory_id: '',
    });
    setEditingProduct(null);
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.article.trim() || !formData.subcategory_id) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        ...formData,
        rating: parseInt(formData.rating.toString()),
        subcategory_id: parseInt(formData.subcategory_id),
      });
    } else {
      addProduct({
        name: formData.name.trim(),
        article: formData.article.trim(),
        description: formData.description.trim(),
        image_url: formData.image_url.trim(),
        rating: parseInt(formData.rating.toString()),
        order_link: formData.order_link.trim(),
        subcategory_id: parseInt(formData.subcategory_id),
      });
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      article: product.article || '',
      description: product.description || '',
      image_url: product.image_url || '',
      rating: product.rating,
      order_link: product.order_link || '',
      subcategory_id: product.subcategory_id.toString(),
    });
    setIsDialogOpen(true);
  };

  const getSubcategoryName = (subcategoryId: number) => {
    const sub = subcategories.find(s => s.id === subcategoryId);
    return sub?.name || 'Неизвестно';
  };

  const getCategoryName = (subcategoryId: number) => {
    const sub = subcategories.find(s => s.id === subcategoryId);
    if (!sub) return 'Неизвестно';
    const cat = categories.find(c => c.id === sub.category_id);
    return cat?.name || 'Неизвестно';
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-black">Товары</h2>
          <p className="text-gray-500 text-sm">Всего: {products.length} товаров</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск товаров..."
              className="pl-10 bg-white border-gray-200"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="btn-primary rounded-lg"
                onClick={() => {
                  resetForm();
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-gray-200 max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-black">
                  {editingProduct ? 'Редактировать товар' : 'Добавить товар'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 py-4">
                <div>
                  <Label className="text-gray-700">Категория / Подкатегория</Label>
                  <Select 
                    value={formData.subcategory_id} 
                    onValueChange={(value) => setFormData({ ...formData, subcategory_id: value })}
                  >
                    <SelectTrigger className="bg-gray-50 border-gray-200 mt-1.5">
                      <SelectValue placeholder="Выберите подкатегорию" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 max-h-60">
                      {categories.map((cat) => (
                        <div key={cat.id}>
                          <div className="px-3 py-2 text-xs text-gray-400 font-semibold uppercase bg-gray-50">
                            {cat.name}
                          </div>
                          {subcategories
                            .filter(s => s.category_id === cat.id)
                            .map((sub) => (
                              <SelectItem 
                                key={sub.id} 
                                value={sub.id.toString()}
                                className="pl-6"
                              >
                                {sub.name}
                              </SelectItem>
                            ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-700">Название товара</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-gray-50 border-gray-200 mt-1.5 focus:border-black focus:ring-black"
                    placeholder="Название товара"
                  />
                </div>

                <div>
                  <Label className="text-gray-700">Артикул</Label>
                  <Input
                    value={formData.article}
                    onChange={(e) => setFormData({ ...formData, article: e.target.value })}
                    className="bg-gray-50 border-gray-200 mt-1.5 focus:border-black focus:ring-black"
                    placeholder="Например: TSH-001"
                  />
                </div>

                <div>
                  <Label className="text-gray-700">Описание</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-gray-50 border-gray-200 mt-1.5 focus:border-black focus:ring-black"
                    placeholder="Описание товара"
                    rows={3}
                  />
                </div>

                <div>
                  <Label className="text-gray-700">URL изображения</Label>
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="bg-gray-50 border-gray-200 mt-1.5 focus:border-black focus:ring-black"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <Label className="text-gray-700">Рейтинг (1-5)</Label>
                  <Select 
                    value={formData.rating.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, rating: parseInt(value) })}
                  >
                    <SelectTrigger className="bg-gray-50 border-gray-200 mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {[1, 2, 3, 4, 5].map((r) => (
                        <SelectItem key={r} value={r.toString()}>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: r }, (_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-black" />
                            ))}
                            <span className="ml-2 text-gray-500">({r})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-700">Ссылка для заказа</Label>
                  <Input
                    value={formData.order_link}
                    onChange={(e) => setFormData({ ...formData, order_link: e.target.value })}
                    className="bg-gray-50 border-gray-200 mt-1.5 focus:border-black focus:ring-black"
                    placeholder="https://example.com/order"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleSubmit}
                    className="flex-1 btn-primary rounded-lg"
                    disabled={!formData.name.trim() || !formData.article.trim() || !formData.subcategory_id}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingProduct ? 'Сохранить' : 'Добавить'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Отмена
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="bg-white border-gray-200 overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="aspect-square bg-gray-100 relative overflow-hidden">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="w-12 h-12 text-gray-300" />
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <div className="text-xs text-gray-400 mb-1">
                {getCategoryName(product.subcategory_id)} / {getSubcategoryName(product.subcategory_id)}
              </div>
              <div className="text-xs text-gray-500 mb-2">Артикул: {product.article}</div>
              <h3 className="font-semibold text-black mb-2 line-clamp-1">{product.name}</h3>
              <p className="text-gray-500 text-sm mb-3 line-clamp-2">{product.description}</p>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i < product.rating ? 'fill-black text-black' : 'text-gray-200'}`}
                  />
                ))}
                <span className="text-xs text-gray-400 ml-1">({product.rating})</span>
              </div>
            </CardContent>
            <div className="px-4 pb-4 flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleEdit(product)}
                className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
              >
                Редактировать
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => deleteProduct(product.id)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-lg font-medium text-gray-900 mb-1">
            {searchQuery ? 'Ничего не найдено' : 'Нет товаров'}
          </p>
          <p className="text-gray-500 text-sm">
            {searchQuery ? 'Попробуйте изменить запрос' : 'Добавьте первый товар'}
          </p>
        </div>
      )}
    </div>
  );
}


function HeroManager() {
  const { heroContent, heroSlides, updateHeroContent, addHeroSlide, updateHeroSlide, deleteHeroSlide } = useDatabase();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newSlideUrl, setNewSlideUrl] = useState('');
  const [newSlideCaption, setNewSlideCaption] = useState('');

  useEffect(() => {
    setTitle(heroContent?.title || '');
    setDescription(heroContent?.description || '');
  }, [heroContent]);

  const handleSaveText = async () => {
    if (!title.trim() || !description.trim()) return;
    await updateHeroContent({ title: title.trim(), description: description.trim() });
  };

  const handleAddSlide = async () => {
    if (!newSlideUrl.trim()) return;
    await addHeroSlide({
      image_url: newSlideUrl.trim(),
      caption: newSlideCaption.trim() || null,
      sort_order: heroSlides.length,
    });
    setNewSlideUrl('');
    setNewSlideCaption('');
  };

  const moveSlide = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= heroSlides.length) return;

    const current = heroSlides[index];
    const target = heroSlides[targetIndex];

    await updateHeroSlide(current.id, {
      image_url: current.image_url,
      caption: current.caption,
      sort_order: target.sort_order,
    });

    await updateHeroSlide(target.id, {
      image_url: target.image_url,
      caption: target.caption,
      sort_order: current.sort_order,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-black">Текст главного блока</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-700">Заголовок</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-gray-50 border-gray-200 mt-1.5"
              placeholder="Введите заголовок"
            />
          </div>
          <div>
            <Label className="text-gray-700">Текст</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-gray-50 border-gray-200 mt-1.5 min-h-28"
              placeholder="Введите текст главного блока"
            />
          </div>
          <Button onClick={handleSaveText} className="btn-primary rounded-lg">
            <Save className="w-4 h-4 mr-2" />
            Сохранить текст
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-black">Лента скроллинга (фото)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-[1fr_280px_auto] gap-3">
            <Input
              value={newSlideUrl}
              onChange={(e) => setNewSlideUrl(e.target.value)}
              className="bg-gray-50 border-gray-200"
              placeholder="URL изображения"
            />
            <Input
              value={newSlideCaption}
              onChange={(e) => setNewSlideCaption(e.target.value)}
              className="bg-gray-50 border-gray-200"
              placeholder="Подпись (необязательно)"
            />
            <Button onClick={handleAddSlide} className="btn-primary rounded-lg">
              <Plus className="w-4 h-4 mr-2" />
              Добавить
            </Button>
          </div>

          <div className="space-y-3">
            {heroSlides.map((slide, index) => (
              <div key={slide.id} className="border border-gray-200 rounded-lg p-3 flex flex-col md:flex-row gap-3 md:items-center">
                <img src={slide.image_url} alt={slide.caption || `Слайд ${index + 1}`} className="h-20 w-24 object-cover rounded-md bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <Input
                    value={slide.image_url}
                    onChange={(e) => updateHeroSlide(slide.id, { image_url: e.target.value, caption: slide.caption, sort_order: slide.sort_order })}
                    className="bg-gray-50 border-gray-200"
                  />
                  <Input
                    value={slide.caption || ''}
                    onChange={(e) => updateHeroSlide(slide.id, { image_url: slide.image_url, caption: e.target.value, sort_order: slide.sort_order })}
                    className="bg-gray-50 border-gray-200"
                    placeholder="Подпись"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-gray-200" onClick={() => moveSlide(index, -1)} disabled={index === 0}>↑</Button>
                  <Button variant="outline" size="sm" className="border-gray-200" onClick={() => moveSlide(index, 1)} disabled={index === heroSlides.length - 1}>↓</Button>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deleteHeroSlide(slide.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {heroSlides.length === 0 && <p className="text-sm text-gray-500">Слайды еще не добавлены.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Admins Manager Component (Master Admin Only)
function AdminsManager() {
  const { adminUsers, addAdminUser, updateAdminUser, deleteAdminUser } = useDatabase();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [telegramUsers, setTelegramUsers] = useState<any[]>([]);
  const [telegramId, setTelegramId] = useState('');
  const [telegramRole, setTelegramRole] = useState<'admin' | 'master_admin'>('admin');
  const [actionError, setActionError] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    can_manage_categories: false,
    can_manage_products: false,
    can_manage_posts: false,
    can_manage_admins: false,
  });

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      can_manage_categories: false,
      can_manage_products: false,
      can_manage_posts: false,
      can_manage_admins: false,
    });
    setEditingAdmin(null);
  };

  const handleSubmit = () => {
    if (!formData.username.trim() || (!editingAdmin && !formData.password.trim())) return;

    if (editingAdmin) {
      const updateData: Partial<AdminUser> = {
        can_manage_categories: formData.can_manage_categories,
        can_manage_products: formData.can_manage_products,
        can_manage_posts: formData.can_manage_posts,
        can_manage_admins: formData.can_manage_admins,
      };
      if (formData.password.trim()) {
        updateData.password = formData.password;
      }
      updateAdminUser(editingAdmin.id, updateData);
    } else {
      addAdminUser({
        username: formData.username.trim(),
        password: formData.password.trim(),
        is_master: false,
        can_manage_categories: formData.can_manage_categories,
        can_manage_products: formData.can_manage_products,
        can_manage_posts: formData.can_manage_posts,
        can_manage_admins: formData.can_manage_admins,
      });
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (admin: AdminUser) => {
    if (admin.is_master) return;
    setEditingAdmin(admin);
    setFormData({
      username: admin.username,
      password: '',
      can_manage_categories: admin.can_manage_categories,
      can_manage_products: admin.can_manage_products,
      can_manage_posts: admin.can_manage_posts,
      can_manage_admins: admin.can_manage_admins,
    });
    setIsDialogOpen(true);
  };


  const loadTelegramUsers = async () => {
    try {
      const users = await apiClient.getTelegramUsers();
      setTelegramUsers(users);
    } catch {
      setTelegramUsers([]);
    }
  };

  useEffect(() => {
    loadTelegramUsers();
  }, []);

  const addTelegramAdmin = async () => {
    const parsed = Number(telegramId);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setActionError('Введите корректный Telegram ID');
      return;
    }

    try {
      setActionError('');
      await apiClient.addTelegramAdmin(parsed, telegramRole);
      setTelegramId('');
      await loadTelegramUsers();
    } catch (error: any) {
      setActionError(error.message || 'Не удалось добавить администратора');
    }
  };

  const formatPermissions = (admin: AdminUser) => {
    const perms = [];
    if (admin.can_manage_categories) perms.push('Категории');
    if (admin.can_manage_products) perms.push('Товары');
    if (admin.can_manage_posts) perms.push('Посты');
    if (admin.can_manage_admins) perms.push('Админы');
    return perms.length > 0 ? perms.join(', ') : 'Нет прав';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-black">Администраторы</h2>
          <p className="text-gray-500 text-sm">Всего: {adminUsers.length} администраторов</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="btn-primary rounded-lg"
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить администратора
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-gray-200 max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-black">
                {editingAdmin ? 'Редактировать администратора' : 'Создать администратора'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div>
                <Label className="text-gray-700">Логин</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="bg-gray-50 border-gray-200 mt-1.5 focus:border-black focus:ring-black"
                  placeholder="Введите логин"
                  disabled={!!editingAdmin}
                />
              </div>

              <div>
                <Label className="text-gray-700">
                  {editingAdmin ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль'}
                </Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-gray-50 border-gray-200 mt-1.5 focus:border-black focus:ring-black"
                  placeholder="Введите пароль"
                />
              </div>

              <div>
                <Label className="text-gray-700 mb-3 block">Права доступа</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="perm_categories"
                      checked={formData.can_manage_categories}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, can_manage_categories: checked as boolean })
                      }
                    />
                    <Label htmlFor="perm_categories" className="cursor-pointer">Управление категориями</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="perm_products"
                      checked={formData.can_manage_products}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, can_manage_products: checked as boolean })
                      }
                    />
                    <Label htmlFor="perm_products" className="cursor-pointer">Управление товарами</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="perm_posts"
                      checked={formData.can_manage_posts}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, can_manage_posts: checked as boolean })
                      }
                    />
                    <Label htmlFor="perm_posts" className="cursor-pointer">Управление постами</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="perm_admins"
                      checked={formData.can_manage_admins}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, can_manage_admins: checked as boolean })
                      }
                    />
                    <Label htmlFor="perm_admins" className="cursor-pointer">Управление администраторами</Label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleSubmit}
                  className="flex-1 btn-primary rounded-lg"
                  disabled={!formData.username.trim() || (!editingAdmin && !formData.password.trim())}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingAdmin ? 'Сохранить' : 'Создать'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                  className="btn-secondary"
                >
                  <X className="w-4 h-4 mr-2" />
                  Отмена
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>


      <Card className="bg-white border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">Telegram администраторы</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Telegram ID"
              className="bg-gray-50 border-gray-200"
            />
            <Select value={telegramRole} onValueChange={(value: 'admin' | 'master_admin') => setTelegramRole(value)}>
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="admin">admin</SelectItem>
                <SelectItem value="master_admin">master_admin</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={addTelegramAdmin} className="btn-primary">Добавить по Telegram ID</Button>
          </div>
          {actionError && <p className="text-sm text-red-600">{actionError}</p>}
          <div className="space-y-2">
            {telegramUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.first_name || user.username || 'Пользователь'} ({user.telegram_id})</p>
                  <p className="text-xs text-gray-500">@{user.username || 'без username'}</p>
                </div>
                <Badge className={user.role === 'master_admin' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-800'}>{user.role}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Admins List */}

      <div className="space-y-3">
        {adminUsers.map((admin) => (
          <Card key={admin.id} className="bg-white border-gray-200 overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Shield className={`w-5 h-5 ${admin.is_master ? 'text-black' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-black">{admin.username}</h3>
                      {admin.is_master && (
                        <Badge className="bg-black text-white">Главный админ</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Права: {formatPermissions(admin)}
                    </p>
                  </div>
                </div>
                {!admin.is_master && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(admin)}
                      className="btn-secondary"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Редактировать
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteAdminUser(admin.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {adminUsers.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-lg font-medium text-gray-900 mb-1">Нет администраторов</p>
          <p className="text-gray-500 text-sm">Добавьте первого администратора</p>
        </div>
      )}
    </div>
  );
}
