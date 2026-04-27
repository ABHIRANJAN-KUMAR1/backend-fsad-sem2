import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { Home } from "lucide-react";
import { useEffect } from "react";

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
          <p className="text-xl text-muted-foreground mb-6">Page not found</p>
          <p className="text-muted-foreground mb-8 max-w-md">
            The page you're looking for doesn't exist. It might have been moved or deleted.
          </p>
          <Button onClick={() => navigate("/dashboard")} className="gap-2">
            <Home className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
