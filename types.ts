/**
 * types.ts
 *
 * Domain types for the German School Management System.
 *
 * Security rules enforced here:
 *  1. NO `password` fields anywhere — authentication is 100% managed by
 *     Supabase Auth. Passwords never touch application code.
 *  2. Sensitive PII (salary, tax_id, bank_iban) are marked with a
 *     `EncryptedField<T>` branded type to make it obvious they require
 *     special handling before display.
 *  3. `UserRole` is a string union so it can be used as a discriminant
 *     in exhaustive switch statements.
 */

// ── Branded types ─────────────────────────────────────────────────────────────
export type EncryptedField<T extends string = string> = T & {
  readonly __encrypted: unique symbol;
};

// ── Enums / Unions ────────────────────────────────────────────────────────────
export type UserRole         = 'admin' | 'teacher' | 'student' | 'parent' | 'hr';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type GradeType        = 'exam' | 'oral' | 'homework' | 'project' | 'participation';
export type ContractType     = 'full_time' | 'part_time' | 'contractor' | 'intern';
export type PayslipStatus    = 'pending' | 'approved' | 'paid';
export type InvoiceStatus    = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

// ── Core entities ─────────────────────────────────────────────────────────────

export interface Profile {
  id:          string;
  role:        UserRole;
  full_name:   string;
  email:       string;
  phone?:      string;
  avatar_url?: string;
  is_active:   boolean;
  locale:      string;
  created_at:  string;
  updated_at:  string;
}

/**
 * Employee — NO password field.
 * PII columns branded as EncryptedField — decrypt before display.
 */
export interface Employee {
  id:              string;
  profile_id:      string;
  employee_number: string;
  department:      string;
  position:        string;
  hire_date:       string;
  contract_type:   ContractType;
  salary?:         EncryptedField<string>;
  tax_id?:         EncryptedField<string>;
  bank_iban?:      EncryptedField<string>;
  created_at:      string;
  updated_at:      string;
  profile?:        Profile;
}

export interface Course {
  id:            string;
  name:          string;
  code:          string;
  description?:  string;
  academic_year: string;
  semester:      'WS' | 'SS';
  is_active:     boolean;
  created_at:    string;
  updated_at:    string;
}

export interface Grade {
  id:         string;
  student_id: string;
  course_id:  string;
  graded_by:  string;
  grade:      number;
  grade_type: GradeType;
  weight:     number;
  notes?:     string;
  graded_at:  string;
  created_at: string;
  updated_at: string;
  student?:   Profile;
  course?:    Course;
  grader?:    Profile;
}

export interface Attendance {
  id:          string;
  student_id:  string;
  course_id:   string;
  recorded_by: string;
  date:        string;
  status:      AttendanceStatus;
  notes?:      string;
  created_at:  string;
  student?:    Profile;
  course?:     Course;
}

export interface Payslip {
  id:           string;
  employee_id:  string;
  period_start: string;
  period_end:   string;
  gross_salary: number;
  net_salary:   number;
  tax_withheld: number;
  deductions:   Record<string, number>;
  status:       PayslipStatus;
  approved_by?: string;
  paid_at?:     string;
  pdf_url?:     string;
  created_at:   string;
  updated_at:   string;
  employee?:    Employee;
}

export interface Invoice {
  id:             string;
  invoice_number: string;
  issued_to:      string;
  issued_by:      string;
  amount:         number;
  vat_rate:       number;
  vat_amount:     number;
  total_amount:   number;
  description:    string;
  due_date:       string;
  status:         InvoiceStatus;
  paid_at?:       string;
  pdf_url?:       string;
  metadata:       Record<string, unknown>;
  created_at:     string;
  updated_at:     string;
  recipient?:     Profile;
  issuer?:        Profile;
}

// ── API / form shapes ─────────────────────────────────────────────────────────

export interface GradeEntryPayload {
  student_id:  string;
  course_id:   string;
  grade:       number;
  grade_type:  GradeType;
  weight?:     number;
  notes?:      string;
  graded_at?:  string;
}

export interface AttendanceBulkPayload {
  course_id: string;
  date:      string;
  records:   Array<{
    student_id: string;
    status:     AttendanceStatus;
    notes?:     string;
  }>;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

export function formatEuros(cents: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency', currency: 'EUR',
  }).format(cents / 100);
}

export function isUserRole(value: unknown): value is UserRole {
  return ['admin', 'teacher', 'student', 'parent', 'hr'].includes(value as string);
}
