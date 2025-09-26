import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Video, Upload, X } from 'lucide-react';

interface MediaUploadProps {
  onFileSelect: (file: File, type: 'image' | 'video') => void;
  uploading: boolean;
  disabled?: boolean;
}

const MediaUpload: React.FC<MediaUploadProps> = ({ 
  onFileSelect, 
  uploading, 
  disabled = false 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<'image' | 'video'>('image');
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndUpload(file);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const validateAndUpload = (file: File) => {
    // Check file size (max 10MB for images, 50MB for videos)
    const maxSizeImage = 10 * 1024 * 1024; // 10MB
    const maxSizeVideo = 50 * 1024 * 1024; // 50MB
    
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      alert('Please select an image or video file.');
      return;
    }
    
    const maxSize = isImage ? maxSizeImage : maxSizeVideo;
    if (file.size > maxSize) {
      alert(`File size too large. Maximum size is ${isImage ? '10MB' : '50MB'}.`);
      return;
    }
    
    // Check file type
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    
    if (isImage && !allowedImageTypes.includes(file.type)) {
      alert('Unsupported image format. Please use JPEG, PNG, GIF, or WebP.');
      return;
    }
    
    if (isVideo && !allowedVideoTypes.includes(file.type)) {
      alert('Unsupported video format. Please use MP4, WebM, or QuickTime.');
      return;
    }
    
    onFileSelect(file, isImage ? 'image' : 'video');
  };

  const triggerUpload = (type: 'image' | 'video') => {
    if (disabled || uploading) return;
    
    setUploadType(type);
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' 
        ? 'image/jpeg,image/jpg,image/png,image/gif,image/webp' 
        : 'video/mp4,video/webm,video/quicktime';
      fileInputRef.current.click();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled || uploading) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      validateAndUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        aria-label={`Upload ${uploadType}`}
        disabled={disabled || uploading}
      />
      
      {/* Image Upload Button */}
      <button
        onClick={() => triggerUpload('image')}
        disabled={disabled || uploading}
        className={`p-2 rounded-full transition-all ${
          disabled || uploading
            ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
            : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
        }`}
        aria-label="Add image"
        title="Upload Image (JPEG, PNG, GIF, WebP - Max 10MB)"
      >
        {uploading ? (
          <Upload size={18} className="animate-spin" />
        ) : (
          <ImageIcon size={18} />
        )}
      </button>

      {/* Video Upload Button */}
      <button
        onClick={() => triggerUpload('video')}
        disabled={disabled || uploading}
        className={`p-2 rounded-full transition-all ${
          disabled || uploading
            ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
        }`}
        aria-label="Add video"
        title="Upload Video (MP4, WebM, QuickTime - Max 50MB)"
      >
        {uploading ? (
          <Upload size={18} className="animate-spin" />
        ) : (
          <Video size={18} />
        )}
      </button>

      {/* Drag and Drop Area (when uploading) */}
      {uploading && (
        <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full">
          <Upload size={14} className="animate-spin" />
          <span>Uploading...</span>
        </div>
      )}

      {/* Drag and Drop Overlay */}
      {dragOver && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border-2 border-dashed border-purple-400 p-8 text-center">
            <Upload size={48} className="mx-auto mb-4 text-purple-400" />
            <p className="text-white text-lg font-semibold mb-2">Drop your file here</p>
            <p className="text-white/60 text-sm">
              Images: JPEG, PNG, GIF, WebP (max 10MB)<br />
              Videos: MP4, WebM, QuickTime (max 50MB)
            </p>
          </div>
        </div>
      )}

      {/* Hidden drag overlay for the entire upload area */}
      <div
        className="absolute inset-0 opacity-0"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      />
    </div>
  );
};

export default MediaUpload;