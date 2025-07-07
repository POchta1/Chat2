import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, EyeOff, Check, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showKeys, setShowKeys] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    secretKey: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, register, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  // Redirect to chat if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const result = await login(formData.username, formData.password);
        if (result.success) {
          toast({
            title: "Успешно!",
            description: result.message,
          });
          // Принудительно обновляем страницу для отображения чата
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          toast({
            title: "Ошибка",
            description: result.message,
            variant: "destructive",
          });
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Ошибка",
            description: "Пароли не совпадают",
            variant: "destructive",
          });
          return;
        }

        const result = await register(
          formData.username,
          formData.password,
          formData.confirmPassword,
          formData.secretKey
        );
        
        if (result.success) {
          toast({
            title: "Успешно!",
            description: result.message,
          });
          // Принудительно обновляем страницу для отображения чата
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          toast({
            title: "Ошибка",
            description: result.message,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Что-то пошло не так",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="auth-container">
      <Card className="w-full max-w-md mx-auto bg-slate-900 border-slate-700 shadow-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">SecureChat</CardTitle>
          <CardDescription className="text-gray-400">
            Анонимный и безопасный мессенджер
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="secretKey" className="text-sm font-medium text-gray-300">
                  Секретный ключ
                </Label>
                <Input
                  id="secretKey"
                  name="secretKey"
                  type="text"
                  value={formData.secretKey}
                  onChange={handleInputChange}
                  className="bg-slate-800 border-slate-600 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 font-mono"
                  placeholder="Введите секретный ключ"
                  required={!isLogin}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Для регистрации требуется секретный ключ
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="username" className="text-sm font-medium text-gray-300">
                Имя пользователя
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                className="bg-slate-800 border-slate-600 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                placeholder={isLogin ? "Введите имя пользователя" : "Выберите имя пользователя"}
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-300">
                Пароль
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                className="bg-slate-800 border-slate-600 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                placeholder={isLogin ? "Введите пароль" : "Создайте пароль"}
                required
              />
            </div>

            {!isLogin && (
              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                  Подтверждение пароля
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="bg-slate-800 border-slate-600 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Подтвердите пароль"
                  required
                />
              </div>
            )}

            <Button
              type="submit"
              className={`w-full py-3 font-semibold transition-colors ${
                isLogin ? 'chat-button primary' : 'chat-button success'
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Подождите...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
            </Button>
          </form>

          <Button
            onClick={() => setIsLogin(!isLogin)}
            variant="outline"
            className="w-full py-3 font-semibold bg-transparent border-slate-600 hover:border-slate-500 text-gray-300 hover:text-white"
          >
            {isLogin ? 'Регистрация' : 'Назад к входу'}
          </Button>


        </CardContent>
      </Card>
    </div>
  );
}
