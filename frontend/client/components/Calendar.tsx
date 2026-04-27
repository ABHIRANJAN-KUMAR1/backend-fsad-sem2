import { useState, useEffect } from "react";
import { Activity } from "@/types";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarViewProps {
  activities: Activity[];
  onActivityClick?: (activityId: string) => void;
  highlightDate?: string;
}

export function CalendarView({ activities, onActivityClick, highlightDate }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Auto-jump to highlightDate if provided
  useEffect(() => {
    if (highlightDate) {
      try {
        const date = parseISO(highlightDate);
        setCurrentDate(date);
      } catch (e) {
        console.error('Invalid highlightDate:', highlightDate, e);
      }
    }
  }, [highlightDate]);

  // Debug log for activities
  useEffect(() => {
    console.log('CalendarView loaded with', activities.length, 'activities');
    if (activities.length > 0) {
      console.log('Recent activities:', activities.slice(0,3).map(a => ({id: a.id, title: a.title, date: a.date})));
    }
  }, [activities]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDay = monthStart.getDay();
  const paddedDays = Array(startDay).fill(null).concat(days);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getActivitiesForDay = (day: Date) => {
    return activities.filter(activity => {
      const activityDate = parseISO(activity.date);
      return isSameDay(activityDate, day);
    });
  };

  const isToday = (day: Date) => isSameDay(day, new Date());

  const getDayClassName = (day: Date | null, isCurrentMonth: boolean) => {
    let className = "min-h-[80px] p-1 border border-border rounded ";
    if (!day) {
      className += "bg-muted/20";
    } else if (isCurrentMonth) {
      className += "bg-card";
    } else {
      className += "bg-muted/30";
    }
    if (day && isToday(day)) {
      className += " ring-2 ring-blue-500";
    }
    return className;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {paddedDays.map((day, index) => {
          const dayActivities = day ? getActivitiesForDay(day) : [];
          const isCurrentMonth = day ? isSameMonth(day, currentDate) : false;

          return (
            <div key={index} className={getDayClassName(day, isCurrentMonth)}>
              {day && (
                <div>
                  <div className={`text-xs font-medium mb-1 ${isToday(day) ? "text-blue-500 font-bold" : "text-muted-foreground"}`}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {dayActivities.slice(0, 2).map(activity => (
                      <button
                        key={activity.id}
                        onClick={() => onActivityClick?.(activity.id)}
                        className="w-full text-xs p-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded truncate text-left hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        {activity.title}
                      </button>
                    ))}
                    {dayActivities.length > 2 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{dayActivities.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
