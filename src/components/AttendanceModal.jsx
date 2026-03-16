import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Calendar as CalendarIcon,
  User,
  ChevronLeft,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { format, isToday, isFuture, parseISO, isValid, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';

import API_PATH from "../../constants.js"

const AttendanceModal = ({ isOpen, onClose, user, onAttendanceMarked }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('Present');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch attendance history
  const fetchAttendanceHistory = async () => {
    if (!user?.id) return;
    
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setAttendanceData(Array.isArray(data) ? data : [data]);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  };

  // Mark attendance
  const handleMarkAttendance = async () => {
    if (!user?.id) return;
    if (isFuture(selectedDate)) {
      toast.error('Cannot mark attendance for future dates');
      return;
    }

    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    const existingAttendance = attendanceData.find(a => a.attendance_date === formattedDate);

    if (existingAttendance) {
      toast.error('Attendance already marked for this date');
      return;
    }

    setMarkingAttendance(true);
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendance_date: formattedDate,
          status: selectedStatus,
          user_id: user.id
        }),
      });

      if (response.ok) {
        toast.success('Attendance marked successfully!');
        await fetchAttendanceHistory();
        if (onAttendanceMarked) onAttendanceMarked(await response.json());
      }
    } catch (error) {
      toast.error('Failed to mark attendance');
    } finally {
      setMarkingAttendance(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) fetchAttendanceHistory();
  }, [isOpen, user]);

  // Calendar helpers
  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getEmptyCells = () => {
    const startDay = getDay(startOfMonth(currentMonth));
    return Array.from({ length: startDay });
  };

  const getDateAttendance = (date) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      return attendanceData.find(a => a.attendance_date === dateStr);
    } catch {
      return null;
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-600" />
            Attendance - {user?.name || 'Unknown User'}
          </DialogTitle>
          <DialogDescription>
            View and mark attendance for {user?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          {/* Calendar Section */}
          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Attendance Calendar
                  </h3>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Badge variant="outline" className="bg-blue-50">
                      {format(currentMonth, 'MMMM yyyy')}
                    </Badge>
                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="border rounded-lg">
                  <div className="grid grid-cols-7 bg-gray-50 border-b">
                    {weekDays.map(day => (
                      <div key={day} className="text-center py-2 text-sm font-medium text-gray-600">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {getEmptyCells().map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square p-2 bg-gray-50/50" />
                    ))}
                    {getDaysInMonth().map((date) => {
                      const attendance = getDateAttendance(date);
                      const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                      let bgColor = 'bg-white hover:bg-gray-50';
                      
                      if (attendance?.status === 'Present') bgColor = 'bg-green-100 hover:bg-green-200';
                      else if (attendance?.status === 'Absent') bgColor = 'bg-red-100 hover:bg-red-200';
                      else if (isToday(date)) bgColor = 'bg-blue-50 hover:bg-blue-100';
                      else if (isFuture(date)) bgColor = 'bg-gray-50';

                      return (
                        <button
                          key={format(date, 'yyyy-MM-dd')}
                          onClick={() => setSelectedDate(date)}
                          disabled={isFuture(date)}
                          className={`aspect-square p-2 ${bgColor} ${isSelected ? 'ring-2 ring-blue-500' : ''} relative`}
                        >
                          <span className="font-medium">{format(date, 'd')}</span>
                          {attendance && (
                            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                              {attendance.status === 'Present' ? (
                                <CheckCircle className="w-3 h-3 text-green-600" />
                              ) : (
                                <XCircle className="w-3 h-3 text-red-600" />
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex gap-4 mt-4 text-xs">
                  <div className="flex items-center"><div className="w-3 h-3 bg-green-100 rounded mr-1"></div>Present</div>
                  <div className="flex items-center"><div className="w-3 h-3 bg-red-100 rounded mr-1"></div>Absent</div>
                  <div className="flex items-center"><div className="w-3 h-3 bg-blue-50 border rounded mr-1"></div>Today</div>
                  <div className="flex items-center"><div className="w-3 h-3 bg-gray-50 rounded mr-1"></div>Future</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mark Attendance Section */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2 text-blue-600" />
                  Mark Attendance
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500">Selected Date</label>
                    <div className="p-3 bg-gray-50 rounded-lg border mt-1">
                      <div className="font-medium">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</div>
                      {isToday(selectedDate) && <div className="text-xs text-gray-500">(Today)</div>}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500">Status</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <Button
                        variant={selectedStatus === 'Present' ? 'default' : 'outline'}
                        className={selectedStatus === 'Present' ? 'bg-green-600 hover:bg-green-700' : ''}
                        onClick={() => setSelectedStatus('Present')}
                        disabled={isFuture(selectedDate)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Present
                      </Button>
                      <Button
                        variant={selectedStatus === 'Absent' ? 'default' : 'outline'}
                        className={selectedStatus === 'Absent' ? 'bg-red-600 hover:bg-red-700' : ''}
                        onClick={() => setSelectedStatus('Absent')}
                        disabled={isFuture(selectedDate)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Absent
                      </Button>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleMarkAttendance}
                    disabled={markingAttendance || isFuture(selectedDate)}
                  >
                    {markingAttendance ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Marking...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark {selectedStatus}
                      </>
                    )}
                  </Button>

                  {getDateAttendance(selectedDate) && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600">Already marked:</p>
                      <p className="font-medium mt-1">Status: {getDateAttendance(selectedDate)?.status}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceModal;