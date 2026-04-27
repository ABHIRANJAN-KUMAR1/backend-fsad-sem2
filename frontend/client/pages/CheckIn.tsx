import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useActivities } from "@/context/ActivityContext";
import { useAuth } from "@/context/AuthContext";
import { activitiesApi, checkInsApi, usersApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Users, Search, CheckCircle, XCircle, Calendar, 
  MapPin, Clock, QrCode, UserCheck, UserX, RefreshCw, Download 
} from "lucide-react";
import { toast } from "sonner";
import type { User, CheckIn, Activity } from "@/types";
import { User as IUser } from "@/types";

export default function CheckIn() {
  const { activities, updateActivity } = useActivities();
  const { user, isAuthenticated } = useAuth();
  const [selectedActivity, setSelectedActivity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activityData, setActivityData] = useState<Activity | null>(null);
  interface Participant extends User {
    checkedIn: boolean;
    checkInTime?: string;
  }
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [bulkSelect, setBulkSelect] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Only admins
  if (isAuthenticated && user?.role !== "admin") {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>Check-in management is for admins only.</p>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    );
  }

  // Get today's/upcoming activities
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingActivities = activities.filter(
    a => new Date(a.date) >= today
  );

  // Load data for selected activity
  useEffect(() => {
    const loadActivityData = async () => {
      if (!selectedActivity) {
        setActivityData(null);
        setParticipants([]);
        setCheckIns([]);
        return;
      }

      setLoading(true);
      try {
        // Get activity details
        const activity = activities.find(a => a.id === selectedActivity);
        setActivityData(activity || null);

        if (activity) {
          // Get check-ins for activity
          const activityCheckIns = await checkInsApi.getByActivity(activity.id);
          setCheckIns(activityCheckIns);

          // Get all users (for lookup)
          const users = allUsers.length > 0 ? allUsers : await usersApi.getAll();
          if (allUsers.length === 0) {
            setAllUsers(users);
          }

          // Get participant details (real users)
          const participantUsers = activity.currentParticipants
            .map(id => users.find(u => u.id === id))
            .filter(Boolean) as User[];

          // Add check-in status
          const participantsWithStatus = participantUsers.map(p => ({
            ...p,
            checkedIn: activityCheckIns.some(c => c.userId === p.id),
            checkInTime: activityCheckIns.find(c => c.userId === p.id)?.checkedInAt
          }));

          setParticipants(participantsWithStatus);
        }
      } catch (error) {
        toast.error("Failed to load activity data");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadActivityData();
  }, [selectedActivity, activities, allUsers, refreshKey]);

  // Filtered participants
  const filteredParticipants = participants.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const checkedInCount = checkIns.length;

  // Check-in single user
  const handleCheckIn = async (userId: string) => {
    if (!activityData || !user || loading) return;

    const existingCheckIn = checkIns.find(c => c.userId === userId);
    if (existingCheckIn) {
      toast.error("User already checked in");
      return;
    }

    setLoading(true);
    try {
      const newCheckIn = await checkInsApi.checkIn({
        userId,
        userName: participants.find(p => p.id === userId)?.name || "Unknown",
        activityId: activityData.id,
        checkedInBy: user.name
      });
      
      // Refresh data
      const updatedCheckIns = [...checkIns, newCheckIn];
      setCheckIns(updatedCheckIns);
      
      // Update optimistic UI
      setParticipants(prev => prev.map(p => 
        p.id === userId 
          ? { ...p, checkedIn: true, checkInTime: newCheckIn.checkedInAt }
          : p
      ));
      
      toast.success("Check-in successful!");
    } catch (error) {
      toast.error("Check-in failed");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Check-out single user
  const handleCheckOut = async (userId: string) => {
    if (!activityData || loading) return;

    const checkIn = checkIns.find(c => c.userId === userId);
    if (!checkIn) return;

    setLoading(true);
    try {
      await checkInsApi.checkOut(checkIn.id);
      
      // Refresh data
      const updatedCheckIns = checkIns.filter(c => c.userId !== userId);
      setCheckIns(updatedCheckIns);
      
      setParticipants(prev => prev.map(p => 
        p.id === userId ? { ...p, checkedIn: false, checkInTime: undefined } : p
      ));
      
      toast.success("Check-out successful!");
    } catch (error) {
      toast.error("Check-out failed");
    } finally {
      setLoading(false);
    }
  };

  // Bulk actions
  const handleBulkCheckIn = async () => {
    if (!activityData || bulkSelect.length === 0 || !user || loading) return;

    setLoading(true);
    try {
      const result = await checkInsApi.bulkCheckIn({
        activityId: activityData.id,
        userIds: bulkSelect,
        checkedInBy: user.name
      });
      
      // Refresh full data
      const updatedCheckIns = await checkInsApi.getByActivity(activityData.id);
      setCheckIns(updatedCheckIns);
      
      setBulkSelect([]);
      const successCount = result.results.filter((r: any) => r.status === 'success').length;
      toast.success(`Bulk check-in: ${successCount}/${bulkSelect.length} successful`);
    } catch (error) {
      toast.error("Bulk check-in failed");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBulkSelect = (userId: string) => {
    setBulkSelect(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const selectAll = () => {
    if (bulkSelect.length === filteredParticipants.length) {
      setBulkSelect([]);
    } else {
      setBulkSelect(filteredParticipants.map(p => p.id));
    }
  };

  const refreshData = () => {
    if (selectedActivity) {
      setRefreshKey(prev => prev + 1);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Check-In System</h1>
            <p className="text-muted-foreground mt-1">Real-time attendance management</p>
          </div>
          {selectedActivity && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={refreshData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={async () => {
                  if (!activityData) return;
                  const report = await checkInsApi.getReport(activityData.id);
                  const csv = report.csvExport;
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `attendance_${activityData.title.replace(/[^a-z0-9]/gi, '_')}.csv`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                  toast.success('Report downloaded');
                }} 
                disabled={!activityData || loading}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          )}
        </div>

        {/* Activity Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Select Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedActivity} onValueChange={setSelectedActivity}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an activity..." />
              </SelectTrigger>
              <SelectContent>
                {upcomingActivities.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.title} - {new Date(a.date).toLocaleDateString()} ({a.currentParticipants.length}/{a.maxParticipants})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activityData && (
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{activityData.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{new Date(activityData.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{participants.length} registered</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>{checkedInCount} / {participants.length} checked in</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedActivity && (
          <>
            {/* Search & Bulk Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search participants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {bulkSelect.length > 0 && (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={selectAll}
                  >
                    {bulkSelect.length === filteredParticipants.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleBulkCheckIn} 
                    disabled={loading}
                  >
                    Bulk Check-in ({bulkSelect.length})
                  </Button>
                </div>
              )}
            </div>

            {/* Participants List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Participants ({filteredParticipants.length})
                  </span>
                  {bulkSelect.length > 0 && (
                    <Badge>{bulkSelect.length} selected</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">Loading...</div>
                ) : filteredParticipants.length > 0 ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {filteredParticipants.map(participant => (
                      <div 
                        key={participant.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Checkbox 
                            checked={bulkSelect.includes(participant.id)}
                            onCheckedChange={() => toggleBulkSelect(participant.id)}
                            className="w-5 h-5"
                          />
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            participant.checkedIn 
                              ? "bg-green-100 dark:bg-green-900/30 border-2 border-green-200" 
                              : "bg-muted"
                          }`}>
                            {participant.checkedIn ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <span className="text-lg font-bold text-muted-foreground">
                                {participant.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground truncate">{participant.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{participant.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {participant.checkedIn ? (
                            <>
                              <Badge variant="secondary" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {participant.checkInTime 
                                  ? new Date(participant.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                  : 'Now'
                                }
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCheckOut(participant.id)}
                                disabled={loading}
                              >
                                <UserX className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleCheckIn(participant.id)}
                              disabled={loading}
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Check In
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No participants matching your search</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}

