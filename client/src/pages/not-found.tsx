import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { HardHat, Home, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function NotFound() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <Card className="max-w-md w-full border-primary/10">
        <CardContent className="p-8 text-center space-y-5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto">
            <HardHat className="w-9 h-9 text-primary" />
          </div>
          <div>
            <h1 className="text-5xl font-bold tracking-tight">404</h1>
            <h2 className="text-lg font-semibold mt-3">This area is still under construction</h2>
            <p className="text-sm text-muted-foreground mt-2">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
            <Button asChild className="gap-2">
              <Link href={isAuthenticated ? "/dashboard" : "/"}>
                <Home className="w-4 h-4" />
                {isAuthenticated ? "Back to Dashboard" : "Back to Home"}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
