import { Code2 } from "lucide-react";
import { cn } from "../lib/utils";

const REPO_URL = "https://github.com/Mishansavy/MeetMind";

// AGPL-3.0 section 13: network users must be offered the source of the running version
export function SourceLink({ className }) {
    return (
        <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className={cn("flex items-center gap-1.5 px-2 py-1 text-xs transition-colors", className)}
        >
            <Code2 className="h-3 w-3 shrink-0" />
            Source code (AGPL-3.0)
        </a>
    );
}
