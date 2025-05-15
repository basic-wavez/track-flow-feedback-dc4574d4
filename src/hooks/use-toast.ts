
import * as React from "react"
import { useToast as useToastOriginal } from "@/components/ui/toast"
import { toast as toastOriginal } from "@/components/ui/toast"

// Re-export directly from here to avoid circular dependencies
export const useToast = useToastOriginal
export const toast = toastOriginal
