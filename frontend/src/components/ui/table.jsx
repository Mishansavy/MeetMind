import { cn } from "../../lib/utils";

export function Table({ className, ...props }) {
    return (
        <div className="w-full overflow-x-auto">
            <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
        </div>
    );
}

export function TableHeader({ className, ...props }) {
    return <thead className={cn("bg-muted/40 [&_tr]:border-b", className)} {...props} />;
}

export function TableBody({ className, ...props }) {
    return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableRow({ className, ...props }) {
    return (
        <tr
            className={cn("border-b border-border transition-colors duration-150 hover:bg-primary/[0.03] data-[state=selected]:bg-muted", className)}
            {...props}
        />
    );
}

export function TableHead({ className, ...props }) {
    return (
        <th
            className={cn(
                "h-12 px-5 text-left align-middle text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
                "[&:has([role=checkbox])]:pr-0",
                className
            )}
            {...props}
        />
    );
}

export function TableCell({ className, ...props }) {
    return (
        <td
            className={cn("px-5 py-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
            {...props}
        />
    );
}
