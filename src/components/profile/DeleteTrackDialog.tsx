
import { TrackData } from "@/types/track";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteTrackDialogProps {
  trackToDelete: TrackData | null;
  isDeletingTrack: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
}

const DeleteTrackDialog = ({ 
  trackToDelete, 
  isDeletingTrack, 
  onClose, 
  onDelete 
}: DeleteTrackDialogProps) => {
  return (
    <AlertDialog open={!!trackToDelete} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Track</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{trackToDelete?.title}"? This action cannot be undone.
            <p className="mt-2 text-red-300">
              All feedback associated with this track will also be permanently deleted.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isDeletingTrack}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault(); // Prevent the default close behavior
              onDelete();
            }}
            className="bg-red-500 text-white hover:bg-red-600"
            disabled={isDeletingTrack}
          >
            {isDeletingTrack ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Deleting...
              </>
            ) : (
              'Delete Track'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteTrackDialog;
