// src/services/mediaService.ts
import { supabase, uploadFile, getPublicUrl } from '@/lib/supabase'

export interface MediaUploadResult {
  url: string
  path: string
  type: 'image' | 'video' | 'audio'
  size: number
}

class MediaService {
  private readonly MAX_FILE_SIZES = {
    image: 5 * 1024 * 1024, // 5MB
    video: 50 * 1024 * 1024, // 50MB
    audio: 10 * 1024 * 1024, // 10MB
  }

  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  private readonly ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
  private readonly ALLOWED_AUDIO_TYPES = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mpeg']

  async uploadAvatar(userId: string, file: File): Promise<string> {
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('Invalid image format. Please use JPG, PNG, WebP, or GIF.')
    }

    if (file.size > this.MAX_FILE_SIZES.image) {
      throw new Error('Image file too large. Maximum size is 5MB.')
    }

    // Compress image if needed
    const compressedFile = await this.compressImage(file, 1024, 1024, 0.8)
    
    const path = `${userId}/avatar-${Date.now()}.${this.getFileExtension(compressedFile.type)}`
    
    await uploadFile('avatars', path, compressedFile)
    const url = getPublicUrl('avatars', path)
    
    // Update user profile
    await supabase
      .from('profiles')
      .update({ avatar_url: url })
      .eq('user_id', userId)
    
    return url
  }

  async uploadVibeMedia(userId: string, file: File): Promise<MediaUploadResult> {
    const mediaType = this.getMediaType(file.type)
    
    if (!this.isValidFileType(file.type, mediaType)) {
      throw new Error(`Invalid ${mediaType} format.`)
    }

    if (file.size > this.MAX_FILE_SIZES[mediaType]) {
      const maxSizeMB = this.MAX_FILE_SIZES[mediaType] / (1024 * 1024)
      throw new Error(`${mediaType} file too large. Maximum size is ${maxSizeMB}MB.`)
    }

    let processedFile = file

    // Process file based on type
    if (mediaType === 'image') {
      processedFile = await this.compressImage(file, 1920, 1080, 0.85)
    } else if (mediaType === 'video') {
      // For video, we might want to generate a thumbnail
      await this.generateVideoThumbnail(file, userId)
    }

    const path = `${userId}/${mediaType}s/${Date.now()}-${file.name}`
    
    await uploadFile('media', path, processedFile)
    const url = getPublicUrl('media', path)

    return {
      url,
      path,
      type: mediaType,
      size: processedFile.size
    }
  }

  private getMediaType(mimeType: string): 'image' | 'video' | 'audio' {
    if (this.ALLOWED_IMAGE_TYPES.includes(mimeType)) return 'image'
    if (this.ALLOWED_VIDEO_TYPES.includes(mimeType)) return 'video'
    if (this.ALLOWED_AUDIO_TYPES.includes(mimeType)) return 'audio'
    throw new Error('Unsupported file type')
  }

  private isValidFileType(mimeType: string, mediaType: 'image' | 'video' | 'audio'): boolean {
    switch (mediaType) {
      case 'image':
        return this.ALLOWED_IMAGE_TYPES.includes(mimeType)
      case 'video':
        return this.ALLOWED_VIDEO_TYPES.includes(mimeType)
      case 'audio':
        return this.ALLOWED_AUDIO_TYPES.includes(mimeType)
      default:
        return false
    }
  }

  private getFileExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/quicktime': 'mov',
      'audio/mp3': 'mp3',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/m4a': 'm4a'
    }
    return extensions[mimeType] || 'bin'
  }

  private compressImage(
    file: File, 
    maxWidth: number, 
    maxHeight: number, 
    quality: number
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          file.type,
          quality
        )
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  private async generateVideoThumbnail(file: File, userId: string): Promise<string | null> {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(1, video.duration / 2) // Seek to middle or 1 second
      }

      video.onseeked = async () => {
        canvas.width = Math.min(video.videoWidth, 640)
        canvas.height = Math.min(video.videoHeight, 480)
        
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              const thumbnailFile = new File([blob], `thumb-${Date.now()}.jpg`, {
                type: 'image/jpeg'
              })
              
              const path = `${userId}/thumbnails/${thumbnailFile.name}`
              await uploadFile('media', path, thumbnailFile)
              const url = getPublicUrl('media', path)
              resolve(url)
            } catch (error) {
              console.error('Failed to upload thumbnail:', error)
              resolve(null)
            }
          } else {
            resolve(null)
          }
        }, 'image/jpeg', 0.8)
      }

      video.onerror = () => resolve(null)
      video.src = URL.createObjectURL(file)
    })
  }

  // Get video duration
  getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      
      video.onloadedmetadata = () => {
        resolve(Math.floor(video.duration))
      }
      
      video.onerror = () => reject(new Error('Failed to load video'))
      video.src = URL.createObjectURL(file)
    })
  }

  // Get audio duration
  getAudioDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = document.createElement('audio')
      
      audio.onloadedmetadata = () => {
        resolve(Math.floor(audio.duration))
      }
      
      audio.onerror = () => reject(new Error('Failed to load audio'))
      audio.src = URL.createObjectURL(file)
    })
  }

  // Delete media file
  async deleteMedia(path: string, bucket: string = 'media'): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])
    
    if (error) throw error
  }

  // Generate media preview URL
  generatePreviewUrl(file: File): string {
    return URL.createObjectURL(file)
  }

  // Cleanup preview URL
  cleanupPreviewUrl(url: string): void {
    URL.revokeObjectURL(url)
  }
}

export const mediaService = new MediaService()

// src/components/ui/media-upload.tsx
import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Upload, Image, Video, Music } from 'lucide-react'
import { cn } from '@/lib/utils'
import { mediaService } from '@/services/mediaService'
import { useToast } from '@/hooks/use-toast'

interface MediaUploadProps {
  accept?: 'image' | 'video' | 'audio' | 'all'
  maxSize?: number
  onUpload?: (result: { url: string; type: string; duration?: number }) => void
  onError?: (error: string) => void
  className?: string
  userId: string
  disabled?: boolean
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  accept = 'all',
  maxSize,
  onUpload,
  onError,
  className,
  userId,
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [preview, setPreview] = useState<{ url: string; type: string } | null>(null)
  const { toast } = useToast()

  const getAcceptedTypes = () => {
    switch (accept) {
      case 'image':
        return { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] }
      case 'video':
        return { 'video/*': ['.mp4', '.webm', '.mov'] }
      case 'audio':
        return { 'audio/*': ['.mp3', '.wav', '.m4a'] }
      default:
        return {
          'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
          'video/*': ['.mp4', '.webm', '.mov'],
          'audio/*': ['.mp3', '.wav', '.m4a']
        }
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0 || disabled) return

    const file = acceptedFiles[0]
    setUploading(true)
    setUploadProgress(0)

    try {
      // Generate preview
      const previewUrl = mediaService.generatePreviewUrl(file)
      const mediaType = file.type.startsWith('image/') ? 'image' : 
                       file.type.startsWith('video/') ? 'video' : 'audio'
      
      setPreview({ url: previewUrl, type: mediaType })

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      // Upload file
      const result = await mediaService.uploadVibeMedia(userId, file)
      
      // Get duration for video/audio
      let duration: number | undefined
      if (result.type === 'video') {
        duration = await mediaService.getVideoDuration(file)
      } else if (result.type === 'audio') {
        duration = await mediaService.getAudioDuration(file)
      }

      clearInterval(progressInterval)
      setUploadProgress(100)

      // Cleanup preview URL
      mediaService.cleanupPreviewUrl(previewUrl)

      onUpload?.({
        url: result.url,
        type: result.type,
        duration
      })

      toast({
        title: "Upload successful! 🎉",
        description: `Your ${result.type} has been uploaded.`,
      })

    } catch (error: any) {
      const errorMessage = error.message || 'Upload failed'
      onError?.(errorMessage)
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      })
      
      if (preview) {
        mediaService.cleanupPreviewUrl(preview.url)
      }
    } finally {
      setUploading(false)
      setUploadProgress(0)
      setPreview(null)
    }
  }, [userId, onUpload, onError, disabled, toast, preview])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: getAcceptedTypes(),
    maxSize,
    multiple: false,
    disabled: disabled || uploading
  })

  const getIcon = () => {
    switch (accept) {
      case 'image':
        return <Image className="h-8 w-8" />;
      case 'video':
        return <Video className="h-8 w-8" />;
      case 'audio':
        return <Music className="h-8 w-8" />;
      default:
        return <Upload className="h-8 w-8" />;
    }
  }

  const getUploadText = () => {
    const typeText = accept === 'all' ? 'media files' : `${accept} files`
    return `Drop ${typeText} here or click to browse`
  }

  if (uploading) {
    return (
      <Card className={cn("border-2 border-dashed", className)}>
        <CardContent className="p-8">
          <div className="space-y-4">
            {preview && (
              <div className="flex justify-center">
                {preview.type === 'image' && (
                  <img 
                    src={preview.url} 
                    alt="Preview" 
                    className="max-w-32 max-h-32 object-cover rounded-lg"
                  />
                )}
                {preview.type === 'video' && (
                  <video 
                    src={preview.url} 
                    className="max-w-32 max-h-32 object-cover rounded-lg"
                    muted
                  />
                )}
                {preview.type === 'audio' && (
                  <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center">
                    <Music className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
            )}
            
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Uploading...</p>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      {...getRootProps()} 
      className={cn(
        "border-2 border-dashed cursor-pointer transition-colors",
        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <input {...getInputProps()} />
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="text-muted-foreground">
            {getIcon()}
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">
              {isDragActive ? 'Drop files here...' : getUploadText()}
            </p>
            
            <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              {accept === 'image' && (
                <Badge variant="outline">JPG, PNG, WebP, GIF</Badge>
              )}
              {accept === 'video' && (
                <Badge variant="outline">MP4, WebM, MOV</Badge>
              )}
              {accept === 'audio' && (
                <Badge variant="outline">MP3, WAV, M4A</Badge>
              )}
              {accept === 'all' && (
                <>
                  <Badge variant="outline">Images</Badge>
                  <Badge variant="outline">Videos</Badge>
                  <Badge variant="outline">Audio</Badge>
                </>
              )}
            </div>
            
            {maxSize && (
              <p className="text-xs text-muted-foreground">
                Max size: {Math.round(maxSize / (1024 * 1024))}MB
              </p>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            disabled={disabled}
            onClick={(e) => e.stopPropagation()}
          >
            Choose File
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}