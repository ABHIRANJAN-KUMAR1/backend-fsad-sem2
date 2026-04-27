import { Layout } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";

export default function Settings() {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Account Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Name
              </label>
              <p className="text-foreground mt-1">{user?.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Email
              </label>
              <p className="text-foreground mt-1">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Role
              </label>
              <p className="text-foreground capitalize mt-1">{user?.role}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Member Since
              </label>
              <p className="text-foreground mt-1">
                {user?.createdAt && new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
