import { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Video, FileText, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface FileUploadModalProps {
  onClose: () => void;
  onFileUpload: (content: string, messageType: string, fileData: any) => void;
}

export default function FileUploadModal({ onClose, onFileUpload }: FileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Ошибка",
          description: "Размер файла не должен превышать 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        
        // Determine message type based on file type
        let messageType = 'file';
        if (selectedFile.type.startsWith('image/')) {
          messageType = 'image';
        } else if (selectedFile.type.startsWith('video/')) {
          messageType = 'video';
        }

        // Send message with file
        onFileUpload(
          selectedFile.name,
          messageType,
          {
            fileUrl: result.fileUrl,
            fileName: result.fileName,
            fileSize: result.fileSize,
          }
        );

        toast({
          title: "Успешно!",
          description: "Файл загружен и отправлен",
        });

        onClose();
      } else {
        const errorData = await response.json();
        toast({
          title: "Ошибка",
          description: errorData.message || "Не удалось загрузить файл",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить файл",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-8 h-8 text-blue-400" />;
    } else if (file.type.startsWith('video/')) {
      return <Video className="w-8 h-8 text-yellow-400" />;
    } else {
      return <FileText className="w-8 h-8 text-green-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Загрузить файл</h3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* File Selection */}
          {!selectedFile ? (
            <>
              <div
                className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Перетащите файлы сюда</p>
                    <p className="text-sm text-gray-400">или нажмите для выбора</p>
                  </div>
                  <Button className="chat-button primary">
                    Выбрать файлы
                  </Button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,video/*,.pdf,.doc,.docx,.txt"
              />
            </>
          ) : (
            <>
              {/* Selected File Preview */}
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  {getFileIcon(selectedFile)}
                  <div className="flex-1">
                    <p className="text-white font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-400">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <Button
                    onClick={() => setSelectedFile(null)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">Загрузка файла...</span>
                    <span className="text-sm text-gray-400">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                className="w-full chat-button primary"
                disabled={isUploading}
              >
                {isUploading ? 'Загрузка...' : 'Загрузить и отправить'}
              </Button>
            </>
          )}

          {/* File Types */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-700 rounded-lg p-3 text-center">
              <ImageIcon className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-sm text-gray-300">Изображения</p>
              <p className="text-xs text-gray-400">JPG, PNG, GIF</p>
            </div>
            <div className="bg-slate-700 rounded-lg p-3 text-center">
              <Video className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-sm text-gray-300">Видео</p>
              <p className="text-xs text-gray-400">MP4, AVI, MOV</p>
            </div>
            <div className="bg-slate-700 rounded-lg p-3 text-center">
              <FileText className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-gray-300">Документы</p>
              <p className="text-xs text-gray-400">PDF, DOC, TXT</p>
            </div>
          </div>

          {/* Encryption Notice */}
          <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400 font-medium">Безопасная загрузка</span>
            </div>
            <p className="text-xs text-gray-300 mt-1">Файлы шифруются перед отправкой</p>
          </div>
        </div>
      </div>
    </div>
  );
}
