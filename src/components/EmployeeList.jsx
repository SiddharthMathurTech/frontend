import React, { useState, useEffect } from 'react';
import UserCard from './UserCard';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Toaster } from "sonner";
import { 
  Loader2, 
  Search, 
  RefreshCw, 
  Users, 
  UserPlus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { toast } from "sonner";

// Predefined departments list
const DEPARTMENTS = [
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Human Resources', label: 'Human Resources' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Information Technology', label: 'IT' },
  { value: 'Customer Support', label: 'Customer Support' },
  { value: 'Research & Development', label: 'R&D' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Administration', label: 'Administration' },
  { value: 'Product Management', label: 'Product' },
  { value: 'Quality Assurance', label: 'QA' },
  { value: 'Business Development', label: 'Business Dev' },
  { value: 'Executive', label: 'Executive' }
];

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    firstName: '',
    lastName: '',
    emailAddress: '',
    department: ''
  });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    skip: 0,
    limit: 10, // Changed from 100 to 10 for better pagination demo
    total: 0,
    totalPages: 0
  });

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    department: 'all',
    status: 'all'
  });
  
  const [departments, setDepartments] = useState([]);
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    department: 'all',
    status: 'all'
  });

  // Fetch employees from API with pagination and filters
  const fetchEmployees = async (skip = pagination.skip, limit = pagination.limit, applyFilters = true) => {
    setLoading(true);
    setError(null);
    
    try {
      // Build URL with query parameters
      let url = `http://localhost:8000/employees/?skip=${skip}&limit=${limit}`;
      
      // Add filter parameters if they exist
      if (applyFilters) {
        if (appliedFilters.search) {
          url += `&search=${encodeURIComponent(appliedFilters.search)}`;
        }
        if (appliedFilters.department && appliedFilters.department !== 'all') {
          url += `&department=${encodeURIComponent(appliedFilters.department)}`;
        }
        if (appliedFilters.status && appliedFilters.status !== 'all') {
          url += `&status=${encodeURIComponent(appliedFilters.status)}`;
        }
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check if response has pagination metadata
      const employeesData = data.items || data.employees || data.data || data;
      const totalCount = data.total || data.total_count || data.totalCount || employeesData.length;
      
      // Transform API data to match UserCard props
      const transformedEmployees = (Array.isArray(employeesData) ? employeesData : []).map(emp => ({
        name: `${emp.firstname || emp.firstName || ''} ${emp.lastname || emp.lastName || ''}`.trim(),
        id: emp.user_company_id || '',
        user_id: emp.user_id || emp.id || '',
        email: emp.emailaddress || emp.email || '',
        department: emp.department || 'Unassigned',
        status: emp.isactive || emp.isActive ? 'Active' : 'Inactive',
        presentDays: emp.present_days || emp.presentDays || 0,
        absentDays: emp.absent_days || emp.absentDays || 0,
        totalDays: 365,
        firstname: emp.firstname || emp.firstName || '',
        lastname: emp.lastname || emp.lastName || '',
        isactive: emp.isactive || emp.isActive || false,
        emailaddress: emp.emailaddress || emp.email || ''
      }));
      
      setEmployees(transformedEmployees);
      
      // Calculate total pages
      const total = totalCount;
      const totalPages = Math.ceil(total / limit);
      
      setPagination(prev => ({
        ...prev,
        skip,
        limit,
        total,
        totalPages
      }));
      
      // Extract unique departments for filter
      const apiDepartments = [...new Set(transformedEmployees.map(emp => emp.department))];
      const allDepartments = [...new Set([...apiDepartments, ...DEPARTMENTS.map(d => d.value)])];
      setDepartments(allDepartments.filter(dept => dept !== 'Unassigned'));
      
    } catch (err) {
      setError(err.message);
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding new employee
  const handleAddEmployee = async () => {
    // Validate form
    if (!newEmployee.firstName || !newEmployee.lastName || !newEmployee.emailAddress || !newEmployee.department) {
      toast.error("Validation Error", {
        description: "Please fill in all fields",
        duration: 3000,
      });
      return;
    }

    setIsAdding(true);
    
    const loadingToast = toast.loading('Adding new employee...');
    
    try {
      const response = await fetch('http://localhost:8000/employee/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          department: newEmployee.department,
          emailAddress: newEmployee.emailAddress,
          firstName: newEmployee.firstName,
          lastName: newEmployee.lastName
        }),
      });

      toast.dismiss(loadingToast);

      if (response.ok) {
        toast.success('Employee added successfully!', {
          description: `${newEmployee.firstName} ${newEmployee.lastName} has been added to the system.`,
          duration: 5000,
        });
        
        setNewEmployee({
          firstName: '',
          lastName: '',
          emailAddress: '',
          department: ''
        });
        setIsAddDialogOpen(false);
        
        // Reset to first page and refresh
        setPagination(prev => ({ ...prev, skip: 0 }));
        fetchEmployees(0, pagination.limit);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add employee');
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error("Failed to add employee", {
        description: error.message || "Please check your connection and try again.",
        duration: 5000,
      });
    } finally {
      setIsAdding(false);
    }
  };

  // Handle successful delete
  const handleDeleteSuccess = (deletedUserId) => {
    // Refresh the current page
    fetchEmployees(pagination.skip, pagination.limit);
  };

  // Apply filters
  const applyFilters = () => {
    setAppliedFilters(filters);
    setPagination(prev => ({ ...prev, skip: 0 })); // Reset to first page
    fetchEmployees(0, pagination.limit, true);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      department: 'all',
      status: 'all'
    });
    setAppliedFilters({
      search: '',
      department: 'all',
      status: 'all'
    });
    setPagination(prev => ({ ...prev, skip: 0 }));
    fetchEmployees(0, pagination.limit, false);
  };

  // Pagination handlers
  const goToFirstPage = () => {
    if (pagination.skip > 0) {
      setPagination(prev => ({ ...prev, skip: 0 }));
      fetchEmployees(0, pagination.limit, true);
    }
  };

  const goToPreviousPage = () => {
    const newSkip = Math.max(0, pagination.skip - pagination.limit);
    if (newSkip !== pagination.skip) {
      setPagination(prev => ({ ...prev, skip: newSkip }));
      fetchEmployees(newSkip, pagination.limit, true);
    }
  };

  const goToNextPage = () => {
    const newSkip = pagination.skip + pagination.limit;
    if (newSkip < pagination.total) {
      setPagination(prev => ({ ...prev, skip: newSkip }));
      fetchEmployees(newSkip, pagination.limit, true);
    }
  };

  const goToLastPage = () => {
    const lastPageSkip = Math.max(0, (pagination.totalPages - 1) * pagination.limit);
    if (lastPageSkip !== pagination.skip) {
      setPagination(prev => ({ ...prev, skip: lastPageSkip }));
      fetchEmployees(lastPageSkip, pagination.limit, true);
    }
  };

  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({ ...prev, limit: parseInt(newLimit), skip: 0 }));
    fetchEmployees(0, parseInt(newLimit), true);
  };

  // Initial fetch
  useEffect(() => {
    fetchEmployees(0, pagination.limit, false);
  }, []);

  // Calculate current page
  const currentPage = Math.floor(pagination.skip / pagination.limit) + 1;

  return (
    <>
      <Toaster 
        position="top-right"
        richColors
        expand={true}
        closeButton
      />
      
      <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <Users className="w-6 h-6 mr-2 text-blue-600" />
              Employees
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Total: {pagination.total} employees
            </p>
          </div>
          <div className="flex space-x-2 w-full sm:w-auto">
            {/* Add Employee Button */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none">
                  <UserPlus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Add Employee</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-white w-[95vw] max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                  <DialogDescription>
                    Fill in the details below to add a new employee to the system.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="firstName" className="text-right text-sm">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      className="col-span-3"
                      value={newEmployee.firstName}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="lastName" className="text-right text-sm">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      className="col-span-3"
                      value={newEmployee.lastName}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right text-sm">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@company.com"
                      className="col-span-3"
                      value={newEmployee.emailAddress}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, emailAddress: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="department" className="text-right text-sm">
                      Department
                    </Label>
                    <div className="col-span-3">
                      <Select
                        value={newEmployee.department}
                        onValueChange={(value) => setNewEmployee(prev => ({ ...prev, department: value }))}
                      >
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                        <SelectContent className="bg-white max-h-[300px]">
                          {DEPARTMENTS.map((dept) => (
                            <SelectItem key={dept.value} value={dept.value}>
                              {dept.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                    disabled={isAdding}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    onClick={handleAddEmployee}
                    disabled={isAdding}
                    className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Employee'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Refresh Button */}
            <Button 
              onClick={() => fetchEmployees(pagination.skip, pagination.limit, true)} 
              variant="outline"
              disabled={loading}
              className="bg-white flex-1 sm:flex-none"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">↻</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-9 bg-white w-full"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                />
              </div>

              <Select
                value={filters.department}
                onValueChange={(value) => setFilters(prev => ({ ...prev, department: value }))}
              >
                <SelectTrigger className="bg-white w-full">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent className="bg-white max-h-[300px]">
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.sort().map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="bg-white w-full">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Button onClick={applyFilters} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Apply
                </Button>
                <Button onClick={resetFilters} variant="outline" className="flex-1">
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results count and items per page */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{employees.length}</span> of{" "}
            <span className="font-semibold">{pagination.total}</span> employees
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Show:</span>
            <Select
              value={pagination.limit.toString()}
              onValueChange={handleLimitChange}
            >
              <SelectTrigger className="w-20 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="p-8 text-center bg-white mb-6">
            <div className="text-red-500 mb-4">Error: {error}</div>
            <Button onClick={() => fetchEmployees(pagination.skip, pagination.limit, true)} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Employee Grid */}
        {!loading && !error && (
          <>
            {employees.length === 0 ? (
              <Card className="p-12 text-center bg-white">
                <p className="text-gray-500">No employees found</p>
                <Button 
                  onClick={() => setIsAddDialogOpen(true)} 
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Your First Employee
                </Button>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-6">
                  {employees.map((employee) => (
                    <UserCard
                      key={employee.user_id}
                      user={employee}
                      onViewDetails={() => console.log('View details:', employee)}
                      onGenerateReport={() => console.log('Generate report:', employee)}
                      onDeleteSuccess={handleDeleteSuccess}
                      variant="compact"
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                    <div className="text-sm text-gray-600">
                      Page {currentPage} of {pagination.totalPages}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToFirstPage}
                        disabled={currentPage === 1 || loading}
                        className="bg-white"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1 || loading}
                        className="bg-white"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <span className="text-sm font-medium px-4 py-2 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                        {currentPage}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={currentPage === pagination.totalPages || loading}
                        className="bg-white"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToLastPage}
                        disabled={currentPage === pagination.totalPages || loading}
                        className="bg-white"
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default EmployeeList;