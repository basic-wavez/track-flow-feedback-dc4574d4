import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { usePlaylists } from "@/hooks/usePlaylists";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PlaylistUpdateInput } from "@/types/playlist";
import Header from "@/components/layout/Header";

const playlistSchema = z.object({
  name: z.string().min(1, "Playlist name is required").max(100, "Playlist name cannot exceed 100 characters"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
  is_public: z.boolean(),
});

const EditPlaylistPage = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getPlaylist, updatePlaylist: updatePlaylistMutation } = usePlaylists();
  
  const { 
    data: playlist,
    isLoading: isLoadingPlaylist,
    error
  } = getPlaylist(playlistId || "");

  const form = useForm<PlaylistUpdateInput>({
    resolver: zodResolver(playlistSchema),
    defaultValues: {
      name: "",
      description: "",
      is_public: false,
    },
  });

  // Redirect if not logged in
  if (!user) {
    navigate('/auth');
    return null;
  }
  
  // Populate form with playlist data when it loads
  useEffect(() => {
    if (playlist) {
      form.reset({
        name: playlist.name,
        description: playlist.description || "",
        is_public: playlist.is_public,
      });
    }
  }, [playlist, form]);

  const onSubmit = async (data: PlaylistUpdateInput) => {
    if (!playlistId) return;
    
    try {
      await updatePlaylistMutation({
        playlistId,
        updates: data
      });
      navigate(`/playlist/${playlistId}`);
    } catch (error) {
      console.error("Error updating playlist:", error);
    }
  };

  // Handle loading and error states
  if (isLoadingPlaylist) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-center py-12">
          <div className="animate-pulse">Loading playlist...</div>
        </div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-2 text-red-500">Playlist not found</h2>
          <Button onClick={() => navigate('/playlists')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Playlists
          </Button>
        </div>
      </div>
    );
  }

  // Check ownership
  const isOwner = user && playlist.user_id === user.id;
  if (!isOwner) {
    navigate(`/playlist/${playlist.id}`);
    return null;
  }

  return (
    <>
      <Header />
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => navigate(`/playlist/${playlist.id}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Playlist
        </Button>
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Edit Playlist</h1>
          <p className="text-gray-300 mt-1">Update the details of your playlist</p>
        </div>
        
        <div className="max-w-xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Playlist Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Awesome Playlist" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="A collection of my favorite tracks..."
                        className="resize-none"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Briefly describe your playlist.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_public"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-wip-gray p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Public Playlist</FormLabel>
                      <FormDescription>
                        Make this playlist visible to everyone.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/playlist/${playlist.id}`)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </>
  );
};

export default EditPlaylistPage;
