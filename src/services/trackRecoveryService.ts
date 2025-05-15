
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { validateFileSize } from "./uploadService";

/**
 * Retry uploading the original file for a track that failed the initial upload
 */
export const retryOriginalFileUpload = async (
  trackId: string,
  file: File
): Promise<boolean> => {
  try {
    // Validate file size
    validateFileSize(file);

    // Get the track data to ensure we're authorized to modify it
    const { data: trackData, error: trackError } = await supabase
      .from('tracks')
      .select('user_id, original_filename')
      .eq('id', trackId)
      .single();

    if (trackError || !trackData) {
      throw new Error("Track not found or you don't have permission to modify it");
    }

    // Check if user is authorized
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== trackData.user_id) {
      throw new Error("You don't have permission to modify this track");
    }

    // Generate path for the original file
    const fileExt = file.name.split('.').pop();
    const uniquePath = `${user.id}/original_recovery_${trackId}.${fileExt}`;

    // Upload the file directly to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio')
      .upload(uniquePath, file);

    if (uploadError) {
      console.error("Error uploading original file:", uploadError);
      throw new Error(uploadError.message || "Failed to upload the original file");
    }

    // Get the public URL for the uploaded file
    const { data: urlData } = await supabase.storage
      .from('audio')
      .getPublicUrl(uniquePath);

    if (!urlData?.publicUrl) {
      throw new Error("Failed to get the public URL for the uploaded file");
    }

    // Update the track record with the new original file URL
    const { error: updateError } = await supabase
      .from('tracks')
      .update({
        original_url: urlData.publicUrl,
      })
      .eq('id', trackId);

    if (updateError) {
      throw updateError;
    }

    return true;
  } catch (error: any) {
    console.error("Error retrying original file upload:", error);
    toast({
      title: "Upload Failed",
      description: error.message || "There was an error uploading your file",
      variant: "destructive",
    });
    return false;
  }
};
