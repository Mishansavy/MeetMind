import { cn } from "../lib/utils";

export function EmptyState({ icon: Icon, title, description, action, secondaryAction, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 px-6 py-16 text-center", className)}>
      {Icon && (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-8 w-8" />
        </div>
      )}
      <div className="space-y-1">
        <p className="text-base font-semibold">{title}</p>
        {description && <p className="max-w-xs text-sm text-muted-foreground">{description}</p>}
      </div>
      {(action || secondaryAction) && (
        <div className="mt-2 flex items-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
