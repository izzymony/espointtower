// components/ui/toast.tsx
"use client"

import * as React from "react"
import { ToastProps as RadixToastProps, ToastProvider, ToastViewport } from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProviderContext = React.createContext<{
  // eslint-disable-next-line no-unused-vars
  publish: (props: ToastPropsExtended) => void
}>({
  publish: () => {},
})

export function useToast() {
  return React.useContext(ToastProviderContext)
}

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
        success: "group border-green-500 bg-green-50 text-green-900",
        warning: "group border-yellow-500 bg-yellow-50 text-yellow-900",
        info: "group border-blue-500 bg-blue-50 text-blue-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface ToastPropsExtended extends RadixToastProps, VariantProps<typeof toastVariants> {
  title?: string
  description?: string
  action?: React.ReactNode
  duration?: number
  id?: string
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastPropsExtended[]>([])

  const publish = (props: ToastPropsExtended) => {
    setToasts((currentToasts) => [...currentToasts, props])
  }

  const onOpenChange = (id: string, open: boolean) => {
    if (!open) {
      setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id))
    }
  }

  return (
    <ToastProviderContext.Provider value={{ publish }}>
      {toasts.map((toast) => (
        <ToastProvider key={toast.id} duration={toast.duration || 5000}>
          <Toast
            {...toast}
            className={cn(toastVariants({ variant: toast.variant }), toast.className)}
            onOpenChange={(open) => onOpenChange(toast.id as string, open)}
          >
            <div className="grid gap-1">
              {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
              {toast.description && (
                <ToastDescription>{toast.description}</ToastDescription>
              )}
            </div>
            {toast.action && <ToastAction>{toast.action}</ToastAction>}
            <ToastClose />
          </Toast>
        </ToastProvider>
      ))}
      <ToastViewport className="fixed top-0 right-0 z-[100] flex w-full flex-col-reverse p-4 sm:right-4 sm:top-4 sm:flex-col md:max-w-[420px]" />
    </ToastProviderContext.Provider>
  )
}

import { Toast as RadixToast } from "@radix-ui/react-toast"

const Toast = React.forwardRef<
  React.ElementRef<typeof RadixToast>,
  React.ComponentPropsWithoutRef<typeof RadixToast> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <RadixToast
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = "Toast"

const ToastTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm font-semibold [&+div]:text-xs", className)}
    {...props}
  />
))
ToastTitle.displayName = "ToastTitle"

const ToastDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = "ToastDescription"

const ToastClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    {...props}
  >
    <X className="h-4 w-4" />
  </button>
))
ToastClose.displayName = "ToastClose"

const ToastAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = "ToastAction"
// Helper function for easy toast usage
export function toast({
  title,
  description,
  variant = "default",
  duration = 5000,
  action,
  ...props
}: Omit<ToastPropsExtended, "id">) {
  const { publish } = React.useContext(ToastProviderContext)
  const id = React.useId()

  publish({
    id,
    title,
    description,
    variant,
    duration,
    action,
    ...props,
  } as ToastPropsExtended)

  return id
}