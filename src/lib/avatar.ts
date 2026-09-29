import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

export type PickAvatarResult =
  | { cancelled: true }
  | { cancelled: false; uri: string; mimeType: string | null };

export async function pickAvatarImage(): Promise<PickAvatarResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { cancelled: true };

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (result.canceled || !result.assets[0]) return { cancelled: true };

  return { cancelled: false, uri: result.assets[0].uri, mimeType: result.assets[0].mimeType ?? null };
}

// One fixed object per user (upsert:true overwrites in place) so re-uploads never leave
// orphaned files behind — the extension in the path is nominal, Storage serves whatever
// contentType is passed regardless of the picked file's real format. The `?t=` query
// param forces RN's <Image> (and any CDN cache) to treat a re-upload as a new URI, since
// the underlying storage path/public URL never changes.
export async function uploadAvatar(userId: string, uri: string, mimeType: string | null) {
  const arraybuffer = await fetch(uri).then((res) => res.arrayBuffer());
  const path = `${userId}/avatar.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, arraybuffer, { contentType: mimeType ?? 'image/jpeg', upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId);
  if (updateError) throw new Error(updateError.message);

  return avatarUrl;
}
