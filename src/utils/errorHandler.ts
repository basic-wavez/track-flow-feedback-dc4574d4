
import { toast } from "@/components/ui/use-toast";

/**
 * Handles errors with toast notifications
 * @param error The error to handle
 * @param title Custom title for the toast
 * @param fallbackMessage Default message if error doesn't have one
 */
export const handleError = (
  error: any, 
  title: string = "Error", 
  fallbackMessage: string = "An unexpected error occurred"
): void => {
  console.error(title, error);
  
  toast({
    title: title,
    description: error.message || fallbackMessage,
    variant: "destructive",
  });
};

/**
 * Shows a success toast notification
 * @param title Success title
 * @param message Success message
 */
export const showSuccess = (title: string, message: string): void => {
  toast({
    title: title,
    description: message,
    variant: "default",
  });
};
