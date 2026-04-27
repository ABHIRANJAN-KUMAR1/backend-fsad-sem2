import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { CalendarView } from "@/components/Calendar";
import { useActivities } from "@/context/ActivityContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, List } from "lucide-react";

export default function ActivitiesCalendar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightDate = searchParams.get("date") || undefined;
  const { activities } = useActivities();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const handleActivityClick = (activityId: string) => {
    navigate(`/activities/${activityId}`);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Activity Calendar</h1>
          <p className="text-muted-foreground mt-1">
            View all activities in a calendar format
          </p>
        </div>

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="w-4 h-4" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2" onClick={() => navigate("/activities")}>
              <List className="w-4 h-4" />
              List View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-6">
            <CalendarView 
              activities={activities} 
              onActivityClick={handleActivityClick}
              highlightDate={highlightDate}
            />

          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
