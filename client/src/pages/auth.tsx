import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const SECRET_KEYS = [
  "SK-7H9J2K8L3M4N5P6Q",
  "SK-R2T4Y6U8I9O0P1A3",
  "SK-S5D7F9G1H3J4K6L8",
  "SK-Z9X8C7V6B5N4M3Q2",
  "SK-W1E3R5T7Y9U2I4O6",
  "SK-P8O9I0U7Y6T5R4E3",
  "SK-A2S4D6F8G9H1J3K5",
  "SK-L7Z9X2C4V6B8N0M1",
  "SK-Q3W5E7R9T1Y3U5I7",
  "SK-O9P1A3S5D7F9G2H4"
];

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
  
  const { login, register } = useAuth();
  const { toast } = useToast();

  const { data: availableKeys = [] } = useQuery({
    queryKey: ['/api/secret-keys'],
    enabled: !isLogin,
  });

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
      <Card className="auth-card">
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
                  className="chat-input font-mono"
                  placeholder="Введите секретный ключ"
                  required={!isLogin}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Для регистрации требуется один из {availableKeys.length} доступных ключей
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
                className="chat-input"
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
                className="chat-input"
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
                  className="chat-input"
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

          {!isLogin && (
            <div className="mt-8 p-4 bg-slate-800 rounded-lg border border-slate-600">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-300">
                  Секретные ключи для регистрации:
                </h3>
                <Button
                  onClick={() => setShowKeys(!showKeys)}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              
              {showKeys && (
                <div className="space-y-1 text-xs font-mono text-gray-400">
                  {SECRET_KEYS.map((key, index) => (
                    <div
                      key={index}
                      className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                        availableKeys.includes(key) 
                          ? 'bg-slate-700 hover:bg-slate-600' 
                          : 'bg-red-900/20 text-red-400 line-through'
                      }`}
                      onClick={() => {
                        if (availableKeys.includes(key)) {
                          setFormData(prev => ({ ...prev, secretKey: key }));
                        }
                      }}
                    >
                      {key} {!availableKeys.includes(key) && '(использован)'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
