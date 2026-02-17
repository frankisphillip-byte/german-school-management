
export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
  HR = 'hr'
}

export enum CEFRLevel {
  A1 = 'A1',
  A2 = 'A2',
  B1 = 'B1',
  B2 = 'B2',
  C1 = 'C1',
  C2 = 'C2'
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  cefr_level: CEFRLevel;
  teacher_id: string;
  google_classroom_id?: string;
  created_at: string;
}

export interface Attachment {
  url: string;
  type: 'pdf' | 'infographic';
  label?: string;
}

export interface Homework {
  id: string;
  course_id: string;
  teacher_id: string;
  title: string;
  description: string;
  due_date: string;
  attachments?: Attachment[];
  created_at: string;
}

export interface StudentAssignment {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_text?: string;
  submission_url?: string;
  submitted_at: string;
}

export interface Employee {
  id: string;
  full_name: string;
  role: 'Teacher' | 'Admin' | 'Support' | 'HR';
  salary: number;
  tax_id?: string;
  email?: string;
  password?: string;
  phone?: string;
  address?: string;
  education_level?: string;
  id_document_url?: string;
  license_document_url?: string;
  joined_at: string;
}

export interface PermissionSet {
  view_grades: boolean;
  submit_homework: boolean;
  enroll_courses: boolean;
  view_attendance: boolean;
  edit_profile: boolean;
  manage_finance: boolean;
  manage_hr: boolean;
  manage_employee_data: boolean;
  generate_payroll: boolean;
  manage_attendance_hr: boolean;
}

export interface SecurityProfile {
  id: string;
  name: string;
  description: string;
  permissions: PermissionSet;
}

export interface StudentAccount {
  id: string;
  full_name: string;
  email: string;
  password?: string;
  security_profile_id: string;
  joined_at: string;
}

export interface Payslip {
  id: string;
  employee_id: string;
  period: string;
  base_salary: number;
  overtime: number;
  allowance: number;
  tax_deduction: number;
  other_deductions: number;
  leave_days_used: number;
  net_pay: number;
  created_at: string;
}

export interface InvoiceItem {
  description: string;
  amount: number;
  quantity: number;
}

export interface Invoice {
  id: string;
  student_id: string;
  student_name: string;
  items: InvoiceItem[];
  total: number;
  status: 'paid' | 'pending';
  created_at: string;
}

export interface Payment {
  id: string;
  student_id: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending';
}

export interface Enrollment {
  id: string;
  course_id: string;
  student_id: string;
  status: 'Active' | 'Completed';
  joined_at: string;
}

export interface EmployeeAttendance {
  id: string;
  employee_id: string;
  date: string;
  status: 'present' | 'absent' | 'sick' | 'vacation';
}

export type AssessmentType = 'Written' | 'Speaking' | 'Listening' | 'Reading';
export type AttendanceStatus = 'present' | 'absent' | 'sick' | 'transferred';

export interface Grade {
  id: string;
  student_id: string;
  course_id: string;
  grade_value: number;
  feedback?: string;
  graded_at: string;
  type: AssessmentType;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  course_id: string;
  date: string;
  status: AttendanceStatus;
}

export interface Expense {
  id: string;
  category: 'Salaries' | 'Rent' | 'Supplies' | 'Maintenance' | 'Marketing';
  amount: number;
  date: string;
  description: string;
  status: 'paid' | 'pending';
}
