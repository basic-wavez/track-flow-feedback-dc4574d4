
import { toast } from "@/components/ui/use-toast";

// Track error toasts to prevent spam
const errorToastMap = new Map<string, number>();
const ERROR_TOAST_COOLDOWN_MS = 10000; // 10 seconds

/**
 * Handles errors with toast notifications and prevents duplicate toasts
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
  
  // Create a unique key for this error
  const errorKey = `${title}_${error?.message || fallbackMessage}`;
  const now = Date.now();
  const lastShown = errorToastMap.get(errorKey);
  
  // Check if we've shown this error recently to avoid spam
  if (lastShown && now - lastShown < ERROR_TOAST_COOLDOWN_MS) {
    console.log(`Suppressing duplicate error toast: ${errorKey}`);
    return;
  }
  
  // Show the toast and record when we showed it
  errorToastMap.set(errorKey, now);
  
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
