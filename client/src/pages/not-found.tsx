import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { HardHat } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-sm w-full">
        <CardContent className="p-6 text-center space-y-4">
          <HardHat className="w-12 h-12 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-semibold">Page Not Found</h1>
          <p className="text-sm text-muted-foreground">
            This area is still under construction.
          </p>
          <Button asChild>
            <Link href="/">Back to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
