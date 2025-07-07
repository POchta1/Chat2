import { useState, useEffect } from 'react';
import { X, Camera, Save, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/hooks/useAuth';

interface ProfileModalProps {
  user: User | null;
  onClose: () => void;
}

export default function ProfileModal({ user, onClose }: ProfileModalProps) {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    password: '',
    avatar: user?.avatar || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateProfile } = useAuth();
  const { toast } = useToast();

  // Update form data when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        password: '',
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updateData: any = {};
      
      if (formData.username !== user?.username) {
        updateData.username = formData.username;
      }
      
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      if (formData.avatar !== user?.avatar) {
        updateData.avatar = formData.avatar;
      }

      if (Object.keys(updateData).length > 0) {
        const result = await updateProfile(updateData);
        
        if (result.success) {
          toast({
            title: "Успешно!",
            description: result.message,
          });
          // Reset password field after successful update
          setFormData(prev => ({
            ...prev,
            password: '',
          }));
          onClose();
        } else {
          toast({
            title: "Ошибка",
            description: result.message,
            variant: "destructive",
          });
        }
      } else {
        onClose();
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить профиль",
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

  const handleAvatarChange = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Create a preview URL for the image
        const previewUrl = URL.createObjectURL(file);
        setFormData(prev => ({
          ...prev,
          avatar: previewUrl,
        }));
        
        toast({
          title: "Аватар загружен",
          description: "Аватар будет сохранен при нажатии кнопки 'Сохранить'",
        });
      }
    };
    input.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Настройки профиля</h3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="text-center">
            <div className="relative inline-block">
              <Avatar className="w-24 h-24 mx-auto border-4 border-slate-600">
                <AvatarImage src={formData.avatar || undefined} />
                <AvatarFallback className="bg-slate-600 text-white text-lg">
                  {user?.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                onClick={handleAvatarChange}
                className="absolute bottom-0 right-0 chat-button primary p-2 rounded-full"
                title="Изменить аватар"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-400 mt-2">Нажмите для изменения аватара</p>
          </div>

          {/* Username */}
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
              required
            />
          </div>

          {/* Password Change */}
          <div>
            <Label htmlFor="password" className="text-sm font-medium text-gray-300">
              Новый пароль
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              className="chat-input"
              placeholder="Оставьте пустым для сохранения текущего"
            />
          </div>

          {/* Security Settings */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="font-medium text-white mb-3 flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Настройки безопасности
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Двухфакторная аутентификация</span>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Уведомления о входе</span>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Автоудаление сообщений</span>
                <Switch />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              type="submit"
              className="flex-1 chat-button primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                'Сохранение...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Сохранить
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-gray-300 border-slate-600"
            >
              Отмена
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
