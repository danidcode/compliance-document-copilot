import { Alert, AlertDescription } from "./ui/alert.js";

type ErrorBannerProps = {
  error: unknown;
};

export function ErrorBanner({ error }: ErrorBannerProps) {
  if (!error) {
    return null;
  }

  return (
    <Alert className="mb-4">
      <AlertDescription>{toErrorMessage(error)}</AlertDescription>
    </Alert>
  );
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}
