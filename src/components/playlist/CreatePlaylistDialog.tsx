
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { PlaylistCreateInput } from "@/types/playlist";

const playlistSchema = z.object({
  name: z.string().min(1, "Playlist name is required").max(100, "Playlist name cannot exceed 100 characters"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
  is_public: z.boolean().default(false),
});

interface CreatePlaylistDialogProps {
  children: React.ReactNode;
  onPlaylistCreated?: (playlistId: string) => void;
}

const CreatePlaylistDialog: React.FC<CreatePlaylistDialogProps> = ({
  children,
  onPlaylistCreated,
}) => {
  const { createPlaylist, isCreatingPlaylist } = usePlaylists();
  const [open, setOpen] = React.useState(false);
  
  const form = useForm<PlaylistCreateInput>({
    resolver: zodResolver(playlistSchema),
    defaultValues: {
      name: "",
      description: "",
      is_public: false,
    },
  });

  const onSubmit = async (data: PlaylistCreateInput) => {
    try {
      const playlist = await createPlaylist(data);
      setOpen(false);
      form.reset();
      
      if (playlist && onPlaylistCreated) {
        onPlaylistCreated(playlist.id);
      }
    } catch (error) {
      console.error("Error creating playlist:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-wip-dark border-wip-gray">
        <DialogHeader>
          <DialogTitle>Create New Playlist</DialogTitle>
          <DialogDescription>
            Create a new playlist to organize your tracks.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <DialogFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={isCreatingPlaylist}
              >
                {isCreatingPlaylist ? "Creating..." : "Create Playlist"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePlaylistDialog;
