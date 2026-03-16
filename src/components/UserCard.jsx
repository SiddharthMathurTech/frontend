import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import AttendanceModal from './AttendanceModal';
import { CheckCircle, XCircle, Calendar, Eye, FileText, User, Trash2, Clock, Award } from 'lucide-react';

import API_PATH from '../../constants.js';

const UserCard = ({ 
  user = {
    name: "John Doe",
    id: "d3248851-6529-422b-81d7-4da9852f1d7d",
    email: "john.doe@company.com",
    department: "Engineering",
    presentDays: 0,
    absentDays: 0,
    totalDays: 365,
    status: "Active",
  },
  showActions = true,
  onViewDetails,
  onGenerateReport,
  onDeleteSuccess,
  variant = "default"
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Safe calculation with fallbacks
  const calculateAttendancePercentage = () => {
    const present = user.presentDays || 0;
    const total = user.totalDays || 365;
    return ((present / total) * 100).toFixed(1);
  };


  console.log()

  const getStatusColor = () => {
    const percentage = parseFloat(calculateAttendancePercentage());
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = () => {
    const percentage = parseFloat(calculateAttendancePercentage());
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Handle delete employee - FIXED ENDPOINT
  const handleDelete = async () => {
    setIsDeleting(true);
    
    const loadingToast = toast.loading(`Deleting ${user.name}...`);
    
   
    try {
      // FIXED: Changed from '/employees/' to '/employee/'
      const response = await fetch(`${API_PATH}/employee/${user.user_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      toast.dismiss(loadingToast);

      // Handle 204 No Content as success
      if (response.status === 204) {
        toast.success(`${user.name} has been successfully deactivated.`, {
          description: "The employee status has been set to inactive.",
          duration: 5000,
        });
        
        if (onDeleteSuccess) {
          onDeleteSuccess(user.user_id);
        }
      } else if (response.status === 422) {
        const errorData = await response.json();
        toast.error("Validation Error", {
          description: errorData.detail?.[0]?.msg || "Invalid user ID format",
          duration: 5000,
        });
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.dismiss();
      toast.error("Failed to delete employee", {
        description: "Please check your connection and try again.",
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Handle attendance marked
  const handleAttendanceMarked = (newAttendance) => {
    console.log('Attendance marked:', newAttendance);
  };

  return (
    <>
      <Card className="w-full max-w-md mx-auto bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
        {/* Header with User Info */}
        <CardHeader className="border-b border-gray-100 pb-4 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className={`p-2.5 rounded-xl ${
                user.status === 'Active' 
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                  : 'bg-gradient-to-br from-gray-400 to-gray-500'
              }`}>
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate">{user.name}</h3>
                <div className="flex flex-col space-y-1 mt-1">
                  <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block w-fit">
                    {user.user_id ? `EMP${user.id}` : 'N/A'}
                  </span>
                  {user.email && (
                    <span className="text-xs text-gray-600 truncate flex items-center">
                      <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                      {user.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                user.status === 'Active' 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-gray-100 text-red-600 border border-red-200'
              }`}>
                {user.status === 'Active' ? '● Active' : '○ Inactive'}
              </span>
            </div>
          </div>
          
          {/* Department Badge */}
          {user.department && (
            <div className="mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                <Award className="w-3 h-3 mr-1" />
                {user.department}
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-5">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {/* Total Days */}
            <div className="bg-gray-100 p-3 rounded-lg text-center border border-gray-200">
              <Calendar className="w-4 h-4 text-gray-600 mx-auto mb-1" />
              <p className="text-xs text-gray-500 font-medium">Total</p>
              <p className="text-xl font-bold text-gray-800">{user.totalDays || 365}</p>
            </div>

            {/* Present Days */}
            <div className="bg-green-100 p-3 rounded-lg text-center border border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600 mx-auto mb-1" />
              <p className="text-xs text-gray-500 font-medium">Present</p>
              <p className="text-xl font-bold text-green-700">{user.presentDays || 0}</p>
            </div>

            {/* Absent Days */}
            <div className="bg-red-100 p-3 rounded-lg text-center border border-red-200">
              <XCircle className="w-4 h-4 text-red-600 mx-auto mb-1" />
              <p className="text-xs text-gray-500 font-medium">Absent</p>
              <p className="text-xl font-bold text-red-700">{user.absentDays || 0}</p>
            </div>
          </div>

          {/* Progress Section */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-700 font-medium flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                Attendance Rate
              </span>
              <span className={`font-bold ${getStatusColor()}`}>
                {calculateAttendancePercentage()}%
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
              <div 
                className={`${getProgressColor()} h-2.5 rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(parseFloat(calculateAttendancePercentage()), 100)}%` }}
              ></div>
            </div>

            {/* Quick Stats */}
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  <span className="text-gray-600">Present: {user.presentDays || 0}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                  <span className="text-gray-600">Absent: {user.absentDays || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Actions Footer */}
        {showActions && (
          <CardFooter className="border-t border-gray-200 bg-gray-50 pt-4 flex justify-end space-x-2">
            {/* <Button 
              variant="outline" 
              size="sm"
              className="flex items-center space-x-1 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              onClick={() => onViewDetails && onViewDetails(user)}
            >
              <Eye className="w-4 h-4" />
              <span>Details</span>
            </Button> */}
            <Button 
              size="sm"
              className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              onClick={() => setIsAttendanceModalOpen(true)}
            >
              <Calendar className="w-4 h-4" />
              <span>Attendance</span>
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Attendance Modal */}
      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        user={user}
        onAttendanceMarked={handleAttendanceMarked}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate <span className="font-semibold">{user.name}</span>? 
              This will perform a soft delete by setting their status to inactive.
              This action can be reversed by an administrator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserCard;