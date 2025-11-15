import React, { useState, useEffect } from 'react';
import { Hash, Plus, Trash2, Edit, Check, X, Search, Users, BookOpen, GraduationCap, Calendar, Shield, AlertCircle, Loader } from 'lucide-react';
import axios from 'axios';

// API Base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// API Service
const api = {
  // Departments
  getDepartments: () => axios.get(`${API_URL}/departments`),
  createDepartment: (data) => axios.post(`${API_URL}/departments`, data),
  updateDepartment: (id, data) => axios.put(`${API_URL}/departments/${id}`, data),
  deleteDepartment: (id) => axios.delete(`${API_URL}/departments/${id}`),
  
  // Classes
  getClasses: (deptId) => axios.get(`${API_URL}/classes`, { params: { deptId } }),
  createClass: (data) => axios.post(`${API_URL}/classes`, data),
  updateClass: (id, data) => axios.put(`${API_URL}/classes/${id}`, data),
  deleteClass: (id) => axios.delete(`${API_URL}/classes/${id}`),
  
  // Students
  getStudents: (params) => axios.get(`${API_URL}/students`, { params }),
  createStudent: (data) => axios.post(`${API_URL}/students`, data),
  updateStudent: (id, data) => axios.put(`${API_URL}/students/${id}`, data),
  deleteStudent: (id) => axios.delete(`${API_URL}/students/${id}`),
  
  // Attendance
  markAttendance: (data) => axios.post(`${API_URL}/attendance`, data),
  getStudentAttendance: (studentId) => axios.get(`${API_URL}/attendance/${studentId}`),
  
  // Validation
  validateAll: () => axios.get(`${API_URL}/validate`)
};

export default function BAMS() {
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState('departments');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [showAddDept, setShowAddDept] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Load data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [deptsRes, classesRes, studentsRes] = await Promise.all([
        api.getDepartments(),
        api.getClasses(),
        api.getStudents()
      ]);
      setDepartments(deptsRes.data);
      setClasses(classesRes.data);
      setStudents(studentsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data. Please check if backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  // Department operations
  const addDepartment = async (name) => {
    try {
      await api.createDepartment({ name });
      await loadAllData();
      setShowAddDept(false);
    } catch (error) {
      alert('Error adding department: ' + error.message);
    }
  };

  const updateDepartment = async (id, name) => {
    try {
      await api.updateDepartment(id, { name });
      await loadAllData();
      setEditingItem(null);
    } catch (error) {
      alert('Error updating department: ' + error.message);
    }
  };

  const deleteDepartment = async (id) => {
    if (!window.confirm('Are you sure? This will add a deletion block to the blockchain.')) return;
    try {
      await api.deleteDepartment(id);
      await loadAllData();
    } catch (error) {
      alert('Error deleting department: ' + error.message);
    }
  };

  // Class operations
  const addClass = async (name, deptId) => {
    try {
      await api.createClass({ name, deptId });
      await loadAllData();
      setShowAddClass(false);
    } catch (error) {
      alert('Error adding class: ' + error.message);
    }
  };

  const updateClass = async (id, name) => {
    try {
      await api.updateClass(id, { name });
      await loadAllData();
      setEditingItem(null);
    } catch (error) {
      alert('Error updating class: ' + error.message);
    }
  };

  const deleteClass = async (id) => {
    if (!window.confirm('Are you sure? This will add a deletion block to the blockchain.')) return;
    try {
      await api.deleteClass(id);
      await loadAllData();
    } catch (error) {
      alert('Error deleting class: ' + error.message);
    }
  };

  // Student operations
  const addStudent = async (name, rollNo, deptId, classId) => {
    try {
      await api.createStudent({ name, rollNo, deptId, classId });
      await loadAllData();
      setShowAddStudent(false);
    } catch (error) {
      alert('Error adding student: ' + error.message);
    }
  };

  const updateStudent = async (id, updates) => {
    try {
      await api.updateStudent(id, updates);
      await loadAllData();
      setEditingItem(null);
    } catch (error) {
      alert('Error updating student: ' + error.message);
    }
  };

  const deleteStudent = async (id) => {
    if (!window.confirm('Are you sure? This will add a deletion block to the blockchain.')) return;
    try {
      await api.deleteStudent(id);
      await loadAllData();
    } catch (error) {
      alert('Error deleting student: ' + error.message);
    }
  };

  // Attendance operations
  const markAttendance = async (studentId, status) => {
    try {
      await api.markAttendance({ studentId, status });
      await loadAllData();
      alert(`Attendance marked as ${status}! Block added to blockchain.`);
    } catch (error) {
      alert('Error marking attendance: ' + error.message);
    }
  };

  // Validation
  const validateSystem = async () => {
    try {
      const response = await api.validateAll();
      const results = response.data;
      
      if (results.overall) {
        alert('✅ All blockchains are valid!');
      } else {
        alert('❌ Validation failed! Check console for details.');
      }
      console.log('Validation Results:', results);
    } catch (error) {
      alert('Error validating system: ' + error.message);
    }
  };

  // Filtering
  const filteredDepartments = departments.filter(d => 
    !d.deleted && d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClasses = classes.filter(c => 
    !c.deleted && 
    (!selectedDept || c.deptId === selectedDept) &&
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStudents = students.filter(s => 
    !s.deleted &&
    (!selectedDept || s.deptId === selectedDept) &&
    (!selectedClass || s.classId === selectedClass) &&
    (s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     s.rollNo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading blockchain data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-10 h-10 text-indigo-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Blockchain Attendance Management</h1>
                <p className="text-gray-600">Secure • Immutable • Hierarchical</p>
              </div>
            </div>
            <button
              onClick={validateSystem}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              <Shield className="w-5 h-5" />
              Validate Chains
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="flex border-b">
            {[
              { id: 'departments', label: 'Departments', icon: BookOpen },
              { id: 'classes', label: 'Classes', icon: Users },
              { id: 'students', label: 'Students', icon: GraduationCap },
              { id: 'attendance', label: 'Attendance', icon: Calendar }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchTerm('');
                }}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-indigo-600'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              {activeTab === 'departments' && (
                <button
                  onClick={() => setShowAddDept(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add Department
                </button>
              )}
              {activeTab === 'classes' && (
                <button
                  onClick={() => setShowAddClass(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  disabled={departments.length === 0}
                >
                  <Plus className="w-5 h-5" />
                  Add Class
                </button>
              )}
              {activeTab === 'students' && (
                <button
                  onClick={() => setShowAddStudent(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  disabled={classes.length === 0}
                >
                  <Plus className="w-5 h-5" />
                  Add Student
                </button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {activeTab === 'departments' && (
              <DepartmentsView
                departments={filteredDepartments}
                onUpdate={updateDepartment}
                onDelete={deleteDepartment}
                editingItem={editingItem}
                setEditingItem={setEditingItem}
              />
            )}

            {activeTab === 'classes' && (
              <ClassesView
                classes={filteredClasses}
                departments={departments}
                selectedDept={selectedDept}
                setSelectedDept={setSelectedDept}
                onUpdate={updateClass}
                onDelete={deleteClass}
                editingItem={editingItem}
                setEditingItem={setEditingItem}
              />
            )}

            {activeTab === 'students' && (
              <StudentsView
                students={filteredStudents}
                departments={departments}
                classes={classes}
                selectedDept={selectedDept}
                setSelectedDept={setSelectedDept}
                selectedClass={selectedClass}
                setSelectedClass={setSelectedClass}
                onUpdate={updateStudent}
                onDelete={deleteStudent}
                onSelectStudent={setSelectedStudent}
                editingItem={editingItem}
                setEditingItem={setEditingItem}
              />
            )}

            {activeTab === 'attendance' && (
              <AttendanceView
                students={students}
                departments={departments}
                classes={classes}
                selectedStudent={selectedStudent}
                onMarkAttendance={markAttendance}
                setSelectedStudent={setSelectedStudent}
              />
            )}
          </div>
        </div>

        {/* Modals */}
        {showAddDept && (
          <AddDepartmentModal
            onAdd={addDepartment}
            onClose={() => setShowAddDept(false)}
          />
        )}

        {showAddClass && (
          <AddClassModal
            departments={departments}
            onAdd={addClass}
            onClose={() => setShowAddClass(false)}
          />
        )}

        {showAddStudent && (
          <AddStudentModal
            departments={departments}
            classes={classes}
            onAdd={addStudent}
            onClose={() => setShowAddStudent(false)}
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// VIEW COMPONENTS
// ============================================

function DepartmentsView({ departments, onUpdate, onDelete, editingItem, setEditingItem }) {
  const [editName, setEditName] = useState('');

  const startEdit = (dept) => {
    setEditingItem(dept.id);
    setEditName(dept.name);
  };

  const saveEdit = (id) => {
    onUpdate(id, editName);
    setEditingItem(null);
  };

  if (departments.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No departments found. Click "Add Department" to create one.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {departments.map(dept => (
        <div key={dept.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              {editingItem === dept.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                  autoFocus
                />
              ) : (
                <h3 className="font-semibold text-gray-800">{dept.name}</h3>
              )}
            </div>
            <div className="flex gap-1">
              {editingItem === dept.id ? (
                <>
                  <button onClick={() => saveEdit(dept.id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingItem(null)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => startEdit(dept)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(dept.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <p className="flex items-center gap-1">
              <Hash className="w-3 h-3" />
              Blocks: {dept.blockchain?.chain?.length || 1}
            </p>
            <p className="truncate">ID: {dept.id}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ClassesView({ classes, departments, selectedDept, setSelectedDept, onUpdate, onDelete, editingItem, setEditingItem }) {
  const [editName, setEditName] = useState('');

  const startEdit = (cls) => {
    setEditingItem(cls.id);
    setEditName(cls.name);
  };

  const saveEdit = (id) => {
    onUpdate(id, editName);
    setEditingItem(null);
  };

  const getDeptName = (deptId) => {
    const dept = departments.find(d => d.id === deptId);
    return dept?.name || 'Unknown';
  };

  return (
    <div>
      {/* Department Filter */}
      <div className="mb-4">
        <select
          value={selectedDept || ''}
          onChange={(e) => setSelectedDept(e.target.value || null)}
          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="">All Departments</option>
          {departments.filter(d => !d.deleted).map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No classes found. Click "Add Class" to create one.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map(cls => (
            <div key={cls.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-5 h-5 text-indigo-600" />
                    {editingItem === cls.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="border rounded px-2 py-1 text-sm flex-1"
                        autoFocus
                      />
                    ) : (
                      <h3 className="font-semibold text-gray-800">{cls.name}</h3>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{getDeptName(cls.deptId)}</p>
                </div>
                <div className="flex gap-1">
                  {editingItem === cls.id ? (
                    <>
                      <button onClick={() => saveEdit(cls.id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingItem(null)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(cls)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(cls.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  Blocks: {cls.blockchain?.chain?.length || 1}
                </p>
                <p className="truncate">ID: {cls.id}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StudentsView({ students, departments, classes, selectedDept, setSelectedDept, selectedClass, setSelectedClass, onUpdate, onDelete, onSelectStudent, editingItem, setEditingItem }) {
  const [editData, setEditData] = useState({ name: '', rollNo: '' });

  const startEdit = (student) => {
    setEditingItem(student.id);
    setEditData({ name: student.name, rollNo: student.rollNo });
  };

  const saveEdit = (id) => {
    onUpdate(id, editData);
    setEditingItem(null);
  };

  const getDeptName = (deptId) => departments.find(d => d.id === deptId)?.name || 'Unknown';
  const getClassName = (classId) => classes.find(c => c.id === classId)?.name || 'Unknown';

  const filteredClasses = classes.filter(c => !c.deleted && (!selectedDept || c.deptId === selectedDept));

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex gap-3">
        <select
          value={selectedDept || ''}
          onChange={(e) => {
            setSelectedDept(e.target.value || null);
            setSelectedClass(null);
          }}
          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="">All Departments</option>
          {departments.filter(d => !d.deleted).map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>

        <select
          value={selectedClass || ''}
          onChange={(e) => setSelectedClass(e.target.value || null)}
          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          disabled={!selectedDept}
        >
          <option value="">All Classes</option>
          {filteredClasses.map(cls => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>
      </div>

      {students.length === 0 ? (
        <div className="text-center py-12">
          <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No students found. Click "Add Student" to create one.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {students.map(student => (
            <div key={student.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                    {editingItem === student.id ? (
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="border rounded px-2 py-1 text-sm flex-1"
                        autoFocus
                      />
                    ) : (
                      <h3 className="font-semibold text-gray-800">{student.name}</h3>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {editingItem === student.id ? (
                      <input
                        type="text"
                        value={editData.rollNo}
                        onChange={(e) => setEditData({ ...editData, rollNo: e.target.value })}
                        className="border rounded px-2 py-1 text-xs w-full"
                      />
                    ) : (
                      `Roll: ${student.rollNo}`
                    )}
                  </p>
                  <p className="text-xs text-gray-500">{getDeptName(student.deptId)} • {getClassName(student.classId)}</p>
                </div>
                <div className="flex gap-1">
                  {editingItem === student.id ? (
                    <>
                      <button onClick={() => saveEdit(student.id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingItem(null)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(student)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(student.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500 mb-2">
                <p className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  Blocks: {student.blockchain?.chain?.length || 1}
                </p>
              </div>
              <button
                onClick={() => onSelectStudent(student)}
                className="w-full bg-indigo-50 text-indigo-600 px-3 py-1 rounded text-sm hover:bg-indigo-100 transition-colors"
              >
                View Attendance
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AttendanceView({ students, departments, classes, selectedStudent, onMarkAttendance, setSelectedStudent }) {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedStudent) {
      loadAttendance();
    }
  }, [selectedStudent]);

  const loadAttendance = async () => {
    if (!selectedStudent) return;
    setLoading(true);
    try {
      const response = await api.getStudentAttendance(selectedStudent.id);
      setAttendanceRecords(response.data);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDeptName = (deptId) => departments.find(d => d.id === deptId)?.name || 'Unknown';
  const getClassName = (classId) => classes.find(c => c.id === classId)?.name || 'Unknown';

  const activeStudents = students.filter(s => !s.deleted);

  if (!selectedStudent) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">Select a student to mark attendance</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeStudents.map(student => (
            <div
              key={student.id}
              onClick={() => setSelectedStudent(student)}
              className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md cursor-pointer transition-all hover:border-indigo-400"
            >
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-gray-800">{student.name}</h3>
              </div>
              <p className="text-sm text-gray-600">Roll: {student.rollNo}</p>
              <p className="text-xs text-gray-500">{getDeptName(student.deptId)} • {getClassName(student.classId)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{selectedStudent.name}</h3>
            <p className="text-sm text-gray-600">Roll: {selectedStudent.rollNo}</p>
            <p className="text-xs text-gray-500">{getDeptName(selectedStudent.deptId)} • {getClassName(selectedStudent.classId)}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onMarkAttendance(selectedStudent.id, 'Present')}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              Mark Present
            </button>
            <button
              onClick={() => onMarkAttendance(selectedStudent.id, 'Absent')}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Mark Absent
            </button>
            <button
              onClick={() => setSelectedStudent(null)}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </div>

      <h4 className="text-lg font-semibold mb-4">Attendance History</h4>
      {loading ? (
        <div className="text-center py-12">
          <Loader className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-500">Loading attendance records...</p>
        </div>
      ) : attendanceRecords.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No attendance records found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {attendanceRecords.map((block, index) => (
            <div key={index} className="bg-white border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      block.transactions.status === 'Present' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {block.transactions.status}
                    </span>
                    <span className="text-sm text-gray-600">{block.transactions.date}</span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p className="flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      Block #{block.index}
                    </p>
                    <p className="truncate">Hash: {block.hash}</p>
                    <p className="truncate">Previous: {block.prev_hash}</p>
                    <p>Nonce: {block.nonce}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// MODAL COMPONENTS
// ============================================

function AddDepartmentModal({ onAdd, onClose }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim());
      setName('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Department</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Department Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="e.g., School of Computing"
              autoFocus
              required
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              Add Department
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddClassModal({ departments, onAdd, onClose }) {
  const [name, setName] = useState('');
  const [deptId, setDeptId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && deptId) {
      onAdd(name.trim(), deptId);
      setName('');
      setDeptId('');
    }
  };

  const activeDepts = departments.filter(d => !d.deleted);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Class</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={deptId}
              onChange={(e) => setDeptId(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            >
              <option value="">Select Department</option>
              {activeDepts.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Class Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="e.g., Class 1"
              required
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              Add Class
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddStudentModal({ departments, classes, onAdd, onClose }) {
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [deptId, setDeptId] = useState('');
  const [classId, setClassId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && rollNo.trim() && deptId && classId) {
      onAdd(name.trim(), rollNo.trim(), deptId, classId);
      setName('');
      setRollNo('');
      setDeptId('');
      setClassId('');
    }
  };

  const activeDepts = departments.filter(d => !d.deleted);
  const filteredClasses = classes.filter(c => !c.deleted && c.deptId === deptId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Student</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={deptId}
              onChange={(e) => {
                setDeptId(e.target.value);
                setClassId('');
              }}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            >
              <option value="">Select Department</option>
              {activeDepts.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              disabled={!deptId}
              required
            >
              <option value="">Select Class</option>
              {filteredClasses.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Student Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="e.g., John Doe"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number</label>
            <input
              type="text"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="e.g., 11001"
              required
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              Add Student
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}