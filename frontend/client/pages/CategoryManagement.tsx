import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Folder } from "lucide-react";
import { toast } from "sonner";
import { Category } from "@/types";
import { useActivities } from "@/context/ActivityContext";

export default function CategoryManagement() {
  const { categories, addCategory, deleteCategory } = useActivities();
  const [newCategoryName, setNewCategoryName] = useState("");

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    if (categories.find(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      toast.error("Category already exists");
      return;
    }

    const newCategory: Category = {
      id: `cat_${Date.now()}`,
      name: newCategoryName.trim(),
      createdAt: new Date().toISOString(),
    };

    addCategory(newCategory);
    setNewCategoryName("");
    toast.success("Category added successfully!");
  };

  const handleDeleteCategory = (id: string, name: string) => {
    deleteCategory(id);
    toast.success(`Category "${name}" deleted successfully!`);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Category Management</h1>
          <p className="text-muted-foreground mt-1">Manage activity categories</p>
        </div>

        {/* Add Category Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add New Category</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCategory} className="flex gap-3">
              <Input
                type="text"
                placeholder="Enter category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Category
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Categories List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Existing Categories ({categories.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Folder className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{category.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(category.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCategory(category.id, category.name)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No categories yet. Add your first category above.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
