import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ArrowRight, Info } from "lucide-react";

interface PrerequisiteNoticeProps {
  title: string;
  description: string;
  actionLabel: string;
  actionRoute: string;
}

/**
 * Friendly notice shown when a page depends on a previous setup step
 * (e.g. Precificação needs receitas, which need ingredientes).
 */
export function PrerequisiteNotice({
  title,
  description,
  actionLabel,
  actionRoute,
}: PrerequisiteNoticeProps) {
  const navigate = useNavigate();

  return (
    <Alert className="border-primary/30 bg-primary/5">
      <Info className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-muted-foreground">{description}</span>
        <Button
          size="sm"
          onClick={() => navigate(actionRoute)}
          className="flex-shrink-0 gap-1 self-start sm:self-auto"
        >
          {actionLabel}
          <ArrowRight className="h-3 w-3" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
