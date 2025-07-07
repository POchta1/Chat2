import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, EyeOff, Check, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showWords, setShowWords] = useState(false);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    secretKey: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, register } = useAuth();
  const { toast } = useToast();

  const { data: availableWords = [] } = useQuery({
    queryKey: ['/api/secret-words'],
    enabled: !isLogin,
  });

  // Обновляем секретный ключ когда выбираются слова
  useEffect(() => {
    if (selectedWords.length === 10) {
      setFormData(prev => ({ ...prev, secretKey: selectedWords.join('-') }));
    } else {
      setFormData(prev => ({ ...prev, secretKey: '' }));
    }
  }, [selectedWords]);

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

  const handleWordClick = (word: string) => {
    if (selectedWords.includes(word)) {
      // Убираем слово из выбранных
      setSelectedWords(prev => prev.filter(w => w !== word));
    } else if (selectedWords.length < 10) {
      // Добавляем слово к выбранным
      setSelectedWords(prev => [...prev, word]);
    } else {
      toast({
        title: "Внимание",
        description: "Можно выбрать только 10 слов",
        variant: "destructive",
      });
    }
  };

  const clearSelectedWords = () => {
    setSelectedWords([]);
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
                <Label className="text-sm font-medium text-gray-300">
                  Выберите 10 слов для создания секретного ключа
                </Label>
                
                {/* Выбранные слова */}
                <div className="bg-slate-700 rounded-lg p-3 mb-3 min-h-[60px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">
                      Выбрано: {selectedWords.length}/10
                    </span>
                    {selectedWords.length > 0 && (
                      <Button
                        onClick={clearSelectedWords}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Очистить
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedWords.map((word, index) => (
                      <span
                        key={index}
                        className="bg-blue-600 text-white px-2 py-1 rounded text-sm cursor-pointer hover:bg-blue-500"
                        onClick={() => handleWordClick(word)}
                      >
                        {word} <X className="w-3 h-3 inline ml-1" />
                      </span>
                    ))}
                  </div>
                  {selectedWords.length === 0 && (
                    <p className="text-gray-400 text-sm text-center">
                      Выберите слова из списка ниже
                    </p>
                  )}
                </div>

                {/* Кнопка показать/скрыть слова */}
                <Button
                  type="button"
                  onClick={() => setShowWords(!showWords)}
                  variant="outline"
                  className="w-full mb-3 bg-slate-700 hover:bg-slate-600 text-gray-300 border-slate-600"
                >
                  {showWords ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Скрыть слова
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Показать доступные слова
                    </>
                  )}
                </Button>
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
              disabled={isSubmitting || (!isLogin && selectedWords.length !== 10)}
            >
              {isSubmitting ? 'Подождите...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
            </Button>
            
            {!isLogin && selectedWords.length !== 10 && (
              <p className="text-sm text-yellow-400 text-center">
                Выберите ровно 10 слов для регистрации
              </p>
            )}
          </form>

          <Button
            onClick={() => setIsLogin(!isLogin)}
            variant="outline"
            className="w-full py-3 font-semibold bg-transparent border-slate-600 hover:border-slate-500 text-gray-300 hover:text-white"
          >
            {isLogin ? 'Регистрация' : 'Назад к входу'}
          </Button>

          {!isLogin && showWords && (
            <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-600">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">
                Доступные слова для выбора:
              </h3>
              
              <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                {availableWords.map((word, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleWordClick(word)}
                    className={`px-3 py-2 rounded text-sm font-medium transition-all ${
                      selectedWords.includes(word)
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    {word}
                    {selectedWords.includes(word) && (
                      <Check className="w-3 h-3 inline ml-1" />
                    )}
                  </button>
                ))}
              </div>
              
              <div className="mt-3 text-xs text-gray-400 text-center">
                Нажмите на слова для выбора. Нужно выбрать ровно 10 слов.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
