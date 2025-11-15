// ============================================
// BACKEND SERVER - server.js
// Node.js + Express Backend for BAMS
// ============================================

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// BLOCKCHAIN CORE CLASSES
// ============================================

class Block {
  constructor(index, timestamp, transactions, prev_hash, nonce = 0) {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.prev_hash = prev_hash;
    this.nonce = nonce;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(
        this.timestamp +
        JSON.stringify(this.transactions) +
        this.prev_hash +
        this.nonce
      )
      .digest('hex');
  }

  mineBlock(difficulty = 4) {
    const target = '0'.repeat(difficulty);
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    return this;
  }
}

class Blockchain {
  constructor(name, parentHash = '0') {
    this.name = name;
    this.chain = [this.createGenesisBlock(parentHash)];
  }

  createGenesisBlock(parentHash) {
    const genesis = new Block(0, Date.now(), { type: 'genesis', name: this.name }, parentHash);
    genesis.mineBlock(4);
    return genesis;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(transactions) {
    const newBlock = new Block(
      this.chain.length,
      Date.now(),
      transactions,
      this.getLatestBlock().hash
    );
    newBlock.mineBlock(4);
    this.chain.push(newBlock);
    return newBlock;
  }

  isValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const prevBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.prev_hash !== prevBlock.hash) {
        return false;
      }

      if (!currentBlock.hash.startsWith('0000')) {
        return false;
      }
    }
    return true;
  }

  toJSON() {
    return {
      name: this.name,
      chain: this.chain
    };
  }

  static fromJSON(data) {
    const blockchain = new Blockchain(data.name);
    blockchain.chain = data.chain.map(blockData => {
      const block = new Block(
        blockData.index,
        blockData.timestamp,
        blockData.transactions,
        blockData.prev_hash,
        blockData.nonce
      );
      block.hash = blockData.hash;
      return block;
    });
    return blockchain;
  }
}

// ============================================
// DATA STORAGE SERVICE
// ============================================

class DataService {
  constructor() {
    this.dataDir = path.join(__dirname, 'data');
    this.departmentsFile = path.join(this.dataDir, 'departments.json');
    this.classesFile = path.join(this.dataDir, 'classes.json');
    this.studentsFile = path.join(this.dataDir, 'students.json');
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Initialize with default data if files don't exist
      try {
        await fs.access(this.departmentsFile);
      } catch {
        await this.initializeDefaultData();
      }
    } catch (error) {
      console.error('Error initializing data service:', error);
    }
  }

  async initializeDefaultData() {
    const departments = [
      { 
        id: 'dept1', 
        name: 'School of Computing', 
        blockchain: new Blockchain('School of Computing').toJSON(),
        createdAt: Date.now()
      },
      { 
        id: 'dept2', 
        name: 'School of Software Engineering', 
        blockchain: new Blockchain('School of Software Engineering').toJSON(),
        createdAt: Date.now()
      }
    ];

    const classes = [];
    const students = [];

    departments.forEach((dept, deptIdx) => {
      for (let i = 1; i <= 5; i++) {
        const classId = `${dept.id}_class${i}`;
        const deptBlockchain = Blockchain.fromJSON(dept.blockchain);
        classes.push({
          id: classId,
          name: `Class ${i}`,
          deptId: dept.id,
          blockchain: new Blockchain(
            `${dept.name} - Class ${i}`, 
            deptBlockchain.getLatestBlock().hash
          ).toJSON(),
          createdAt: Date.now()
        });

        for (let j = 1; j <= 35; j++) {
          const studentId = `${classId}_student${j}`;
          const rollNo = `${deptIdx + 1}${i}${j.toString().padStart(3, '0')}`;
          const classBlockchain = Blockchain.fromJSON(classes[classes.length - 1].blockchain);
          students.push({
            id: studentId,
            name: `Student ${rollNo}`,
            rollNo: rollNo,
            deptId: dept.id,
            classId: classId,
            blockchain: new Blockchain(
              `Student ${rollNo}`, 
              classBlockchain.getLatestBlock().hash
            ).toJSON(),
            createdAt: Date.now()
          });
        }
      }
    });

    await this.saveDepartments(departments);
    await this.saveClasses(classes);
    await this.saveStudents(students);
    console.log('✅ Default data initialized successfully');
  }

  async loadDepartments() {
    try {
      const data = await fs.readFile(this.departmentsFile, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async saveDepartments(departments) {
    await fs.writeFile(this.departmentsFile, JSON.stringify(departments, null, 2));
  }

  async loadClasses() {
    try {
      const data = await fs.readFile(this.classesFile, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async saveClasses(classes) {
    await fs.writeFile(this.classesFile, JSON.stringify(classes, null, 2));
  }

  async loadStudents() {
    try {
      const data = await fs.readFile(this.studentsFile, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async saveStudents(students) {
    await fs.writeFile(this.studentsFile, JSON.stringify(students, null, 2));
  }
}

const dataService = new DataService();

// ============================================
// CONTROLLERS
// ============================================

// Department Controller
class DepartmentController {
  static async getAll(req, res) {
    try {
      const departments = await dataService.loadDepartments();
      res.json(departments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const departments = await dataService.loadDepartments();
      const dept = departments.find(d => d.id === req.params.id);
      if (!dept) return res.status(404).json({ error: 'Department not found' });
      res.json(dept);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: 'Name is required' });

      const departments = await dataService.loadDepartments();
      const newDept = {
        id: `dept${Date.now()}`,
        name,
        blockchain: new Blockchain(name).toJSON(),
        createdAt: Date.now()
      };

      departments.push(newDept);
      await dataService.saveDepartments(departments);
      res.status(201).json(newDept);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { name } = req.body;
      const departments = await dataService.loadDepartments();
      const deptIndex = departments.findIndex(d => d.id === req.params.id);
      
      if (deptIndex === -1) return res.status(404).json({ error: 'Department not found' });

      const dept = departments[deptIndex];
      const blockchain = Blockchain.fromJSON(dept.blockchain);
      
      blockchain.addBlock({
        type: 'update',
        action: 'name_updated',
        oldName: dept.name,
        newName: name,
        timestamp: Date.now()
      });

      dept.name = name;
      dept.blockchain = blockchain.toJSON();
      dept.updatedAt = Date.now();

      await dataService.saveDepartments(departments);
      res.json(dept);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const departments = await dataService.loadDepartments();
      const deptIndex = departments.findIndex(d => d.id === req.params.id);
      
      if (deptIndex === -1) return res.status(404).json({ error: 'Department not found' });

      const dept = departments[deptIndex];
      const blockchain = Blockchain.fromJSON(dept.blockchain);
      
      blockchain.addBlock({
        type: 'delete',
        status: 'deleted',
        name: dept.name,
        timestamp: Date.now()
      });

      dept.deleted = true;
      dept.blockchain = blockchain.toJSON();
      dept.deletedAt = Date.now();

      await dataService.saveDepartments(departments);
      res.json(dept);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

// Class Controller
class ClassController {
  static async getAll(req, res) {
    try {
      const classes = await dataService.loadClasses();
      const { deptId } = req.query;
      const filtered = deptId ? classes.filter(c => c.deptId === deptId) : classes;
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const classes = await dataService.loadClasses();
      const cls = classes.find(c => c.id === req.params.id);
      if (!cls) return res.status(404).json({ error: 'Class not found' });
      res.json(cls);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { name, deptId } = req.body;
      if (!name || !deptId) return res.status(400).json({ error: 'Name and deptId are required' });

      const departments = await dataService.loadDepartments();
      const dept = departments.find(d => d.id === deptId);
      if (!dept) return res.status(404).json({ error: 'Department not found' });

      const deptBlockchain = Blockchain.fromJSON(dept.blockchain);
      const classes = await dataService.loadClasses();
      
      const newClass = {
        id: `class${Date.now()}`,
        name,
        deptId,
        blockchain: new Blockchain(
          `${dept.name} - ${name}`,
          deptBlockchain.getLatestBlock().hash
        ).toJSON(),
        createdAt: Date.now()
      };

      classes.push(newClass);
      await dataService.saveClasses(classes);
      res.status(201).json(newClass);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { name } = req.body;
      const classes = await dataService.loadClasses();
      const classIndex = classes.findIndex(c => c.id === req.params.id);
      
      if (classIndex === -1) return res.status(404).json({ error: 'Class not found' });

      const cls = classes[classIndex];
      const blockchain = Blockchain.fromJSON(cls.blockchain);
      
      blockchain.addBlock({
        type: 'update',
        action: 'name_updated',
        oldName: cls.name,
        newName: name,
        timestamp: Date.now()
      });

      cls.name = name;
      cls.blockchain = blockchain.toJSON();
      cls.updatedAt = Date.now();

      await dataService.saveClasses(classes);
      res.json(cls);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const classes = await dataService.loadClasses();
      const classIndex = classes.findIndex(c => c.id === req.params.id);
      
      if (classIndex === -1) return res.status(404).json({ error: 'Class not found' });

      const cls = classes[classIndex];
      const blockchain = Blockchain.fromJSON(cls.blockchain);
      
      blockchain.addBlock({
        type: 'delete',
        status: 'deleted',
        name: cls.name,
        timestamp: Date.now()
      });

      cls.deleted = true;
      cls.blockchain = blockchain.toJSON();
      cls.deletedAt = Date.now();

      await dataService.saveClasses(classes);
      res.json(cls);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

// Student Controller
class StudentController {
  static async getAll(req, res) {
    try {
      const students = await dataService.loadStudents();
      const { deptId, classId } = req.query;
      
      let filtered = students;
      if (deptId) filtered = filtered.filter(s => s.deptId === deptId);
      if (classId) filtered = filtered.filter(s => s.classId === classId);
      
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const students = await dataService.loadStudents();
      const student = students.find(s => s.id === req.params.id);
      if (!student) return res.status(404).json({ error: 'Student not found' });
      res.json(student);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { name, rollNo, deptId, classId } = req.body;
      if (!name || !rollNo || !deptId || !classId) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const classes = await dataService.loadClasses();
      const cls = classes.find(c => c.id === classId);
      if (!cls) return res.status(404).json({ error: 'Class not found' });

      const classBlockchain = Blockchain.fromJSON(cls.blockchain);
      const students = await dataService.loadStudents();
      
      const newStudent = {
        id: `student${Date.now()}`,
        name,
        rollNo,
        deptId,
        classId,
        blockchain: new Blockchain(
          `Student ${rollNo}`,
          classBlockchain.getLatestBlock().hash
        ).toJSON(),
        createdAt: Date.now()
      };

      students.push(newStudent);
      await dataService.saveStudents(students);
      res.status(201).json(newStudent);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { name, rollNo } = req.body;
      const students = await dataService.loadStudents();
      const studentIndex = students.findIndex(s => s.id === req.params.id);
      
      if (studentIndex === -1) return res.status(404).json({ error: 'Student not found' });

      const student = students[studentIndex];
      const blockchain = Blockchain.fromJSON(student.blockchain);
      
      blockchain.addBlock({
        type: 'update',
        action: 'student_updated',
        oldData: { name: student.name, rollNo: student.rollNo },
        newData: { name, rollNo },
        timestamp: Date.now()
      });

      student.name = name || student.name;
      student.rollNo = rollNo || student.rollNo;
      student.blockchain = blockchain.toJSON();
      student.updatedAt = Date.now();

      await dataService.saveStudents(students);
      res.json(student);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const students = await dataService.loadStudents();
      const studentIndex = students.findIndex(s => s.id === req.params.id);
      
      if (studentIndex === -1) return res.status(404).json({ error: 'Student not found' });

      const student = students[studentIndex];
      const blockchain = Blockchain.fromJSON(student.blockchain);
      
      blockchain.addBlock({
        type: 'delete',
        status: 'deleted',
        name: student.name,
        rollNo: student.rollNo,
        timestamp: Date.now()
      });

      student.deleted = true;
      student.blockchain = blockchain.toJSON();
      student.deletedAt = Date.now();

      await dataService.saveStudents(students);
      res.json(student);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

// Attendance Controller
class AttendanceController {
  static async markAttendance(req, res) {
    try {
      const { studentId, status } = req.body;
      if (!studentId || !status) {
        return res.status(400).json({ error: 'Student ID and status are required' });
      }

      const students = await dataService.loadStudents();
      const studentIndex = students.findIndex(s => s.id === studentId);
      
      if (studentIndex === -1) return res.status(404).json({ error: 'Student not found' });

      const student = students[studentIndex];
      const blockchain = Blockchain.fromJSON(student.blockchain);

      const attendanceRecord = {
        type: 'attendance',
        studentId: student.id,
        studentName: student.name,
        rollNo: student.rollNo,
        deptId: student.deptId,
        classId: student.classId,
        status: status,
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now()
      };

      const block = blockchain.addBlock(attendanceRecord);
      student.blockchain = blockchain.toJSON();

      await dataService.saveStudents(students);
      res.status(201).json({ block, student });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getStudentAttendance(req, res) {
    try {
      const students = await dataService.loadStudents();
      const student = students.find(s => s.id === req.params.studentId);
      
      if (!student) return res.status(404).json({ error: 'Student not found' });

      const blockchain = Blockchain.fromJSON(student.blockchain);
      const attendanceBlocks = blockchain.chain.filter(
        block => block.transactions.type === 'attendance'
      );

      res.json(attendanceBlocks);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

// Validation Controller
class ValidationController {
  static async validateAll(req, res) {
    try {
      const departments = await dataService.loadDepartments();
      const classes = await dataService.loadClasses();
      const students = await dataService.loadStudents();

      const results = {
        departments: [],
        classes: [],
        students: [],
        overall: true
      };

      // Validate departments
      for (const dept of departments) {
        const blockchain = Blockchain.fromJSON(dept.blockchain);
        const valid = blockchain.isValid();
        results.departments.push({ id: dept.id, name: dept.name, valid });
        if (!valid) results.overall = false;
      }

      // Validate classes
      for (const cls of classes) {
        const dept = departments.find(d => d.id === cls.deptId);
        const blockchain = Blockchain.fromJSON(cls.blockchain);
        const deptBlockchain = Blockchain.fromJSON(dept.blockchain);
        
        const valid = blockchain.isValid() && 
                     blockchain.chain[0].prev_hash === deptBlockchain.getLatestBlock().hash;
        
        results.classes.push({ id: cls.id, name: cls.name, valid });
        if (!valid) results.overall = false;
      }

      // Validate students
      for (const student of students) {
        const cls = classes.find(c => c.id === student.classId);
        const blockchain = Blockchain.fromJSON(student.blockchain);
        const classBlockchain = Blockchain.fromJSON(cls.blockchain);
        
        const valid = blockchain.isValid() && 
                     blockchain.chain[0].prev_hash === classBlockchain.getLatestBlock().hash;
        
        results.students.push({ id: student.id, name: student.name, valid });
        if (!valid) results.overall = false;
      }

      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

// ============================================
// ROUTES
// ============================================

// Department Routes
app.get('/api/departments', DepartmentController.getAll);
app.get('/api/departments/:id', DepartmentController.getById);
app.post('/api/departments', DepartmentController.create);
app.put('/api/departments/:id', DepartmentController.update);
app.delete('/api/departments/:id', DepartmentController.delete);

// Class Routes
app.get('/api/classes', ClassController.getAll);
app.get('/api/classes/:id', ClassController.getById);
app.post('/api/classes', ClassController.create);
app.put('/api/classes/:id', ClassController.update);
app.delete('/api/classes/:id', ClassController.delete);

// Student Routes
app.get('/api/students', StudentController.getAll);
app.get('/api/students/:id', StudentController.getById);
app.post('/api/students', StudentController.create);
app.put('/api/students/:id', StudentController.update);
app.delete('/api/students/:id', StudentController.delete);

// Attendance Routes
app.post('/api/attendance', AttendanceController.markAttendance);
app.get('/api/attendance/:studentId', AttendanceController.getStudentAttendance);

// Validation Routes
app.get('/api/validate', ValidationController.validateAll);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'BAMS Backend is running' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 BAMS Backend running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
});