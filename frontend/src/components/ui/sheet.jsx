import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

function SheetOverlay({ className, ...props }) {
    return (
        <DialogPrimitive.Overlay
            className={cn(
                "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm",
                "data-[state=open]:animate-in data-[state=closed]:animate-out",
                "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                className
            )}
            {...props}
        />
    );
}

export function SheetContent({ className, children, side = "right", ...props }) {
    const sides = {
        right: "inset-y-0 right-0 h-full w-full sm:max-w-md data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
        left:  "inset-y-0 left-0 h-full w-full sm:max-w-md data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
    };

    return (
        <DialogPrimitive.Portal>
            <SheetOverlay />
            <DialogPrimitive.Content
                className={cn(
                    "fixed z-50 bg-background border-l border-border shadow-xl flex flex-col",
                    "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out",
                    sides[side],
                    className
                )}
                {...props}
            >
                {children}
                <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring">
                    <X className="h-4 w-4" />
                </DialogPrimitive.Close>
            </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
    );
}

export function SheetHeader({ className, ...props }) {
    return <div className={cn("px-6 py-5 border-b border-border", className)} {...props} />;
}

export function SheetTitle({ className, ...props }) {
    return <DialogPrimitive.Title className={cn("text-base font-semibold", className)} {...props} />;
}

export function SheetDescription({ className, ...props }) {
    return <DialogPrimitive.Description className={cn("text-sm text-muted-foreground mt-0.5", className)} {...props} />;
}

export function SheetBody({ className, ...props }) {
    return <div className={cn("flex-1 overflow-y-auto px-6 py-5", className)} {...props} />;
}

export function SheetFooter({ className, ...props }) {
    return <div className={cn("px-6 py-4 border-t border-border flex items-center justify-end gap-2", className)} {...props} />;
}
