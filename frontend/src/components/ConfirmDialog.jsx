import { Button } from "./ui/button";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogClose,
} from "./ui/dialog";

export function ConfirmDialog({
    open, onOpenChange, title, description, onConfirm, confirmLabel = "Confirm",
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2 mt-4">
                    <DialogClose asChild>
                        <Button variant="outline" size="sm">Cancel</Button>
                    </DialogClose>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => { onConfirm(); onOpenChange(false); }}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
