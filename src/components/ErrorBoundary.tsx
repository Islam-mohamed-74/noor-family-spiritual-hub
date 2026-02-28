import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex items-center justify-center min-h-screen p-4"
          dir="rtl"
        >
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 space-y-4 text-center">
              <div className="text-5xl">⚠️</div>
              <h2 className="text-xl font-bold">حدث خطأ غير متوقع</h2>
              <p className="text-sm text-muted-foreground">
                {this.state.error?.message ?? "حاول تحديث الصفحة"}
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                تحديث الصفحة
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}
