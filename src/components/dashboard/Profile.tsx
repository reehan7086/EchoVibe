import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { type Location } from '@/services/geolocationService';
import { User, Edit3, Save, X, MapPin, Calendar, Zap, Camera } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Updated ProfileData interface to match Supabase types
interface ProfileData {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  bio: string | null;  // Allow null from Supabase
  avatar_url: string | null;  // Allow null from Supabase
  vibe_score: number | null;  // Allow null from Supabase
  created_at: string | null;  // Allow null from Supabase
  is_online: boolean | null;  // Allow null from Supabase
  last_active: string | null;  // Allow null from Supabase
  location: any;  // Json type from Supabase
  updated_at: string | null;  // Allow null from Supabase
}

// Simple inline MediaUpload component to avoid import issues
const MediaUpload = ({ onUpload }: { onUpload: (url: string) => void }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const mockUrl = URL.createObjectURL(file);
    onUpload(mockUrl);
    setUploading(false);
  };

  return (
    <div className="relative">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="absolute inset-0 opacity-0 cursor-pointer"
        disabled={uploading}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-white hover:text-white"
        disabled={uploading}
      >
        <Camera className="h-4 w-4" />
      </Button>
    </div>
  );
};

export const Profile = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    city: '',
  });
  const [location, setLocation] = useState<Location | null>(null);
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        bio: data.bio || '',
        city: ((data as any)?.city) || '',
      });

      // Parse location if available
      if (data.location) {
        try {
          const locationStr = String(data.location || '');
          const coords = locationStr.match(/POINT\(([^ ]+) ([^ ]+)\)/);
          if (coords) {
            setLocation({
              longitude: parseFloat(coords[1]),
              latitude: parseFloat(coords[2]),
              city: ((data as any)?.city) || undefined
            });
          }
        } catch (e) {
          console.warn('Failed to parse location:', e);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (url: string) => {
    if (!user) return;

    setUploadingAvatar(true);
    try {
      await updateProfile({ avatar_url: url });
      setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
      
      toast({
        title: "Avatar updated!",
        description: "Your profile photo has been updated.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to update avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLocationSelect = async (selectedLocation: { city?: string; coordinates?: { lat: number; lng: number } }) => {
    const locationData: Location = {
      latitude: selectedLocation.coordinates?.lat || 0,
      longitude: selectedLocation.coordinates?.lng || 0,
      city: selectedLocation.city
    };
    
    setLocation(locationData);
    
    if (user && locationData.latitude && locationData.longitude) {
      try {
        setFormData(prev => ({ ...prev, city: locationData.city || '' }));
        
        toast({
          title: "Location updated!",
          description: `Location set to ${locationData.city || 'your area'}`,
        });
      } catch (error) {
        console.error('Error updating location:', error);
      }
    }
  };

  const saveProfile = async () => {
    if (!user || !profile) return;

    if (!formData.full_name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const updates: any = {
        full_name: formData.full_name.trim(),
        bio: formData.bio.trim() || null,
        updated_at: new Date().toISOString(),
      };

      // Update city if changed
      const currentCity = ((profile as any)?.city) || "Unknown";
      if (formData.city !== currentCity) {
        updates.city = formData.city.trim() || null;
      }

      await updateProfile(updates);

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      setEditing(false);
      
      toast({
        title: "Profile updated!",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setFormData({
      full_name: profile?.full_name || '',
      bio: profile?.bio || '',
      city: ((profile as any)?.city) || '',
    });
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardContent className="p-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-24 h-24 bg-muted rounded-full" />
              <div className="space-y-2 text-center">
                <div className="h-6 bg-muted rounded w-32" />
                <div className="h-4 bg-muted rounded w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <div className="space-y-4">
            <div className="text-6xl">👤</div>
            <h3 className="text-xl font-semibold">Profile not found</h3>
            <p className="text-muted-foreground">
              There was an issue loading your profile.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <User className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Your Profile</h2>
      </div>

      <Card className="border border-border bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-end">
            {editing ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={saveProfile}
                  disabled={saving}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-primary text-white text-2xl">
                  {profile.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {editing && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <MediaUpload onUpload={handleAvatarUpload} />
                </div>
              )}
            </div>

            <div className="text-center space-y-2">
              {editing ? (
                <Input
                  placeholder="Full Name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="text-center text-xl font-semibold"
                  maxLength={100}
                />
              ) : (
                <h3 className="text-2xl font-bold">{profile.full_name}</h3>
              )}
              
              <p className="text-muted-foreground">@{profile.username}</p>
              
              <div className="flex justify-center items-center gap-3">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {profile.vibe_score || 0} Vibe Score
                </Badge>
                
                <Badge variant={profile.is_online ? "default" : "secondary"} className="text-xs">
                  {profile.is_online ? '🟢 Online' : '⚫ Offline'}
                </Badge>
              </div>

              {(((profile as any)?.city) || location) && (
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {((profile as any)?.city) || location?.city || 'Location set'}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Bio</label>
              {editing ? (
                <Textarea
                  placeholder="Tell others about yourself, your interests, and what kind of vibes you're looking for..."
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="min-h-[100px]"
                  maxLength={500}
                />
              ) : (
                <div className="bg-muted/50 rounded-lg p-4 min-h-[100px] flex items-center justify-center">
                  {profile.bio ? (
                    <p className="text-sm leading-relaxed">{profile.bio}</p>
                  ) : (
                    <p className="text-muted-foreground text-sm italic">
                      No bio added yet. Tell others about yourself!
                    </p>
                  )}
                </div>
              )}
            </div>

            {editing && (
              <div>
                <label className="text-sm font-medium mb-2 block">Location</label>
                <LocationPicker
                  onLocationSelect={handleLocationSelect}
                  currentLocation={location || undefined}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Joined</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {profile.created_at ? formatDistanceToNow(new Date(profile.created_at), { addSuffix: true }) : 'Unknown'}
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Last Active</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {profile.last_active ? formatDistanceToNow(new Date(profile.last_active), { addSuffix: true }) : 'Unknown'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-border bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary">0</div>
              <p className="text-sm text-muted-foreground">Vibe Echoes</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-border bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary">0</div>
              <p className="text-sm text-muted-foreground">Matches</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-border bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary">0</div>
              <p className="text-sm text-muted-foreground">Communities</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};