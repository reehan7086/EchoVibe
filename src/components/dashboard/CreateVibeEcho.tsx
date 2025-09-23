// src/components/dashboard/CreateVibeEcho.tsx
import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { 
  Smile, MapPin, Clock, X, Image, Video, Mic, 
  Upload, Play, Pause, Volume2, Trash2, Edit3, Send 
} from 'lucide-react';

const moods = [
  { value: 'happy', label: '😊 Happy', color: 'bg-yellow-500' },
  { value: 'excited', label: '🎉 Excited', color: 'bg-orange-500' },
  { value: 'calm', label: '😌 Calm', color: 'bg-blue-500' },
  { value: 'adventurous', label: '🚀 Adventurous', color: 'bg-purple-500' },
  { value: 'creative', label: '🎨 Creative', color: 'bg-pink-500' },
  { value: 'social', label: '👥 Social', color: 'bg-green-500' },
  { value: 'thoughtful', label: '🤔 Thoughtful', color: 'bg-indigo-500' },
  { value: 'energetic', label: '⚡ Energetic', color: 'bg-red-500' },
];

const activities = [
  'Coffee', 'Food', 'Movies', 'Music', 'Art', 'Sports', 'Reading', 
  'Gaming', 'Travel', 'Nature', 'Photography', 'Dancing', 'Studying',
  'Shopping', 'Fitness', 'Cooking', 'Netflix', 'Beach', 'Hiking'
];

interface MediaUploadProps {
  onUpload: (result: { url: string; type: string; duration?: number }) => void;
  onRemove: () => void;
  currentMedia: { url: string; type: string; duration?: number } | null;
  mediaType: 'image' | 'video' | 'audio';
}

const MediaUpload: React.FC<MediaUploadProps> = ({ onUpload, onRemove, currentMedia, mediaType }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `vibe-${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      let duration: number | undefined;
      if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        duration = await getMediaDuration(file);
      }

      onUpload({
        url: publicUrl,
        type: file.type.startsWith('image/') ? 'image' : 
              file.type.startsWith('video/') ? 'video' : 'audio',
        duration
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getMediaDuration = (file: File): Promise<number | undefined> => {
    return new Promise((resolve) => {
      const element = file.type.startsWith('video/') ? 
        document.createElement('video') : document.createElement('audio');
      
      element.onloadedmetadata = () => resolve(element.duration);
      element.onerror = () => resolve(undefined);
      element.src = URL.createObjectURL(file);
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const acceptTypes = {
    image: 'image/*',
    video: 'video/*',
    audio: 'audio/*'
  };

  return (
    <div className="space-y-4">
      {!currentMedia && (
        <div 
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptTypes[mediaType]}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
          
          <div className="flex flex-col items-center space-y-2">
            {mediaType === 'image' && <Image className="h-10 w-10 text-gray-400" />}
            {mediaType === 'video' && <Video className="h-10 w-10 text-gray-400" />}
            {mediaType === 'audio' && <Mic className="h-10 w-10 text-gray-400" />}
            
            <div>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="mb-2"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : `Choose ${mediaType}`}
              </Button>
              <p className="text-sm text-gray-500">
                or drag and drop your {mediaType} here
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Max file size: 10MB
              </p>
            </div>
          </div>
        </div>
      )}

      {currentMedia && (
        <MediaPreview 
          media={currentMedia} 
          onRemove={onRemove}
        />
      )}
    </div>
  );
};

interface MediaPreviewProps {
  media: { url: string; type: string; duration?: number };
  onRemove: () => void;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({ media, onRemove }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

  const togglePlay = () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative bg-gray-50 rounded-lg p-4">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRemove}
        className="absolute top-2 right-2 z-10"
      >
        <X className="h-4 w-4" />
      </Button>

      {media.type === 'image' && (
        <img 
          src={media.url} 
          alt="Upload preview" 
          className="w-full h-48 object-cover rounded-lg"
        />
      )}

      {media.type === 'video' && (
        <div className="relative">
          <video 
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={media.url}
            className="w-full h-48 object-cover rounded-lg"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={togglePlay}
            className="absolute bottom-2 left-2"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          {media.duration && (
            <Badge variant="secondary" className="absolute bottom-2 right-2">
              {formatDuration(media.duration)}
            </Badge>
          )}
        </div>
      )}

      {media.type === 'audio' && (
        <div className="flex items-center space-x-4 p-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Volume2 className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-600">Audio Recording</span>
          {media.duration && (
            <Badge variant="secondary">
              {formatDuration(media.duration)}
            </Badge>
          )}
          <audio 
            ref={mediaRef as React.RefObject<HTMLAudioElement>}
            src={media.url}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
};

export const CreateVibeEcho: React.FC = () => {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [activity, setActivity] = useState('');
  const [customActivity, setCustomActivity] = useState('');
  const [media, setMedia] = useState<{ url: string; type: string; duration?: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });

      setLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
    } catch (error) {
      toast({
        title: "Location access denied",
        description: "Could not get your current location",
        variant: "destructive"
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleMediaUpload = (result: { url: string; type: string; duration?: number }) => {
    setMedia(result);
  };

  const handleRemoveMedia = () => {
    setMedia(null);
  };

  const selectedMood = moods.find(m => m.value === mood);
  const finalActivity = customActivity.trim() || activity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && !media) {
      toast({
        title: "Content required",
        description: "Please add some content or media to your vibe echo",
        variant: "destructive"
      });
      return;
    }

    if (!mood) {
      toast({
        title: "Mood required",
        description: "Please select your current mood",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const vibeEchoData = {
        user_id: user?.id,
        content: content.trim() || null,
        mood,
        activity: finalActivity || null,
        media_url: media?.url || null,
        media_type: media?.type || 'text',
        media_duration: media?.duration || null,
        location: location || null,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('vibe_echoes')
        .insert([vibeEchoData]);

      if (error) throw error;

      // Reset form
      setContent('');
      setMood('');
      setActivity('');
      setCustomActivity('');
      setMedia(null);
      setLocation('');

      toast({
        title: "Vibe echo shared!",
        description: "Your vibe is now echoing to nearby users",
      });

    } catch (error: any) {
      console.error('Error creating vibe echo:', error);
      toast({
        title: "Failed to share vibe",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-2">
            <Edit3 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Share Your Vibe</h2>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="text" className="flex items-center space-x-2">
                <Edit3 className="h-4 w-4" />
                <span>Text</span>
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center space-x-2">
                <Image className="h-4 w-4" />
                <span>Photo</span>
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center space-x-2">
                <Video className="h-4 w-4" />
                <span>Video</span>
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex items-center space-x-2">
                <Mic className="h-4 w-4" />
                <span>Audio</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="mt-4">
              <Textarea
                placeholder="What's your vibe right now? Share your thoughts, feelings, or what you're up to..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px] resize-none"
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">
                  {content.length}/500 characters
                </span>
              </div>
            </TabsContent>

            <TabsContent value="image" className="mt-4">
              <MediaUpload
                onUpload={handleMediaUpload}
                onRemove={handleRemoveMedia}
                currentMedia={media?.type === 'image' ? media : null}
                mediaType="image"
              />
            </TabsContent>

            <TabsContent value="video" className="mt-4">
              <MediaUpload
                onUpload={handleMediaUpload}
                onRemove={handleRemoveMedia}
                currentMedia={media?.type === 'video' ? media : null}
                mediaType="video"
              />
            </TabsContent>

            <TabsContent value="audio" className="mt-4">
              <MediaUpload
                onUpload={handleMediaUpload}
                onRemove={handleRemoveMedia}
                currentMedia={media?.type === 'audio' ? media : null}
                mediaType="audio"
              />
            </TabsContent>
          </Tabs>

          {/* Mood Selection */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2 text-sm font-medium">
              <Smile className="h-4 w-4" />
              <span>Current Mood *</span>
            </label>
            <Select value={mood} onValueChange={setMood}>
              <SelectTrigger>
                <SelectValue placeholder="How are you feeling?" />
              </SelectTrigger>
              <SelectContent>
                {moods.map((moodOption) => (
                  <SelectItem key={moodOption.value} value={moodOption.value}>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${moodOption.color}`} />
                      <span>{moodOption.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Activity Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">What are you up to?</label>
            <div className="flex flex-wrap gap-2">
              {activities.slice(0, 12).map((activityOption) => (
                <Badge
                  key={activityOption}
                  variant={activity === activityOption ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => {
                    setActivity(activity === activityOption ? '' : activityOption);
                    setCustomActivity('');
                  }}
                >
                  {activityOption}
                </Badge>
              ))}
            </div>
            <Input
              placeholder="or type your own activity..."
              value={customActivity}
              onChange={(e) => {
                setCustomActivity(e.target.value);
                setActivity('');
              }}
            />
          </div>

          {/* Location */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2 text-sm font-medium">
              <MapPin className="h-4 w-4" />
              <span>Location (optional)</span>
            </label>
            <div className="flex space-x-2">
              <Input
                placeholder="Where are you?"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
              >
                {isGettingLocation ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Preview */}
          {(selectedMood || finalActivity || location) && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="text-sm font-medium text-gray-700">Preview:</div>
              <div className="flex flex-wrap gap-2">
                {selectedMood && (
                  <Badge className={selectedMood.color}>
                    {selectedMood.label}
                  </Badge>
                )}
                {finalActivity && (
                  <Badge variant="secondary">
                    {finalActivity}
                  </Badge>
                )}
                {location && (
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{location}</span>
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Expiry Notice */}
          <div className="flex items-center space-x-2 text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
            <Clock className="h-4 w-4" />
            <span>Your vibe echo will be visible for 24 hours</span>
          </div>

          {/* Submit */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || (!content.trim() && !media) || !mood}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Sharing your vibe...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Send className="h-4 w-4" />
                <span>Share Vibe Echo</span>
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};