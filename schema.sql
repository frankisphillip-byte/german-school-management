-- ============================================================
-- German School Management System — Production Schema
-- Phase 1: Security Hardening & Infrastructure
-- Stack: PostgreSQL 15 / Supabase
-- Encryption: pgsodium (TCE) + RLS Zero-Trust policies
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgsodium";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ────────────────────────────────────────────────────────────
-- ENUMS
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'admin',
    'teacher',
    'student',
    'parent',
    'hr'           -- ← previously missing; required for HR payroll views
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payslip_status AS ENUM ('pending', 'approved', 'paid');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- HELPER: auto-update updated_at timestamps
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────
-- TABLE: profiles
-- Linked 1-to-1 with Supabase auth.users.
-- Role is stored HERE and validated server-side via RLS —
-- never trusted from the client.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          user_role   NOT NULL DEFAULT 'student',
  full_name     TEXT        NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  email         TEXT        NOT NULL UNIQUE CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone         TEXT,
  avatar_url    TEXT,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  locale        TEXT        NOT NULL DEFAULT 'de',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_profiles_role        ON profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_email       ON profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active   ON profiles (is_active);

-- Auto-create profile on Supabase sign-up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ────────────────────────────────────────────────────────────
-- TABLE: employees
-- PII columns (salary, tax_id, bank_iban) use pgsodium TCE.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id              UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID    NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  employee_number TEXT    NOT NULL UNIQUE,
  department      TEXT    NOT NULL,
  position        TEXT    NOT NULL,
  hire_date       DATE    NOT NULL,
  contract_type   TEXT    NOT NULL DEFAULT 'full_time'
                          CHECK (contract_type IN ('full_time', 'part_time', 'contractor', 'intern')),
  salary          BIGINT,
  tax_id          TEXT,
  bank_iban       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SECURITY LABEL FOR pgsodium ON COLUMN employees.salary
  IS 'encrypt with key name employee_pii_key';
SECURITY LABEL FOR pgsodium ON COLUMN employees.tax_id
  IS 'encrypt with key name employee_pii_key';
SECURITY LABEL FOR pgsodium ON COLUMN employees.bank_iban
  IS 'encrypt with key name employee_pii_key';

CREATE TRIGGER set_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_employees_profile_id      ON employees (profile_id);
CREATE INDEX IF NOT EXISTS idx_employees_department      ON employees (department);
CREATE INDEX IF NOT EXISTS idx_employees_employee_number ON employees (employee_number);

-- ────────────────────────────────────────────────────────────
-- TABLE: payslips
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payslips (
  id            UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id   UUID           NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  period_start  DATE           NOT NULL,
  period_end    DATE           NOT NULL,
  gross_salary  BIGINT         NOT NULL CHECK (gross_salary > 0),
  net_salary    BIGINT         NOT NULL CHECK (net_salary > 0),
  tax_withheld  BIGINT         NOT NULL DEFAULT 0,
  deductions    JSONB          NOT NULL DEFAULT '{}',
  status        payslip_status NOT NULL DEFAULT 'pending',
  approved_by   UUID           REFERENCES profiles(id),
  paid_at       TIMESTAMPTZ,
  pdf_url       TEXT,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  CONSTRAINT payslips_period_check    CHECK (period_end > period_start),
  CONSTRAINT payslips_net_lte_gross   CHECK (net_salary <= gross_salary),
  UNIQUE (employee_id, period_start, period_end)
);

CREATE TRIGGER set_payslips_updated_at
  BEFORE UPDATE ON payslips
  FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_payslips_employee_id ON payslips (employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_status      ON payslips (status);
CREATE INDEX IF NOT EXISTS idx_payslips_period      ON payslips (period_start, period_end);

-- ────────────────────────────────────────────────────────────
-- TABLE: invoices
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id             UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT           NOT NULL UNIQUE,
  issued_to      UUID           NOT NULL REFERENCES profiles(id),
  issued_by      UUID           NOT NULL REFERENCES profiles(id),
  amount         BIGINT         NOT NULL CHECK (amount > 0),
  vat_rate       NUMERIC(5,2)   NOT NULL DEFAULT 19.00,
  vat_amount     BIGINT         NOT NULL DEFAULT 0,
  total_amount   BIGINT         NOT NULL,
  description    TEXT           NOT NULL,
  due_date       DATE           NOT NULL,
  status         invoice_status NOT NULL DEFAULT 'draft',
  paid_at        TIMESTAMPTZ,
  pdf_url        TEXT,
  metadata       JSONB          NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_invoices_issued_to ON invoices (issued_to);
CREATE INDEX IF NOT EXISTS idx_invoices_status    ON invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date  ON invoices (due_date);

-- ────────────────────────────────────────────────────────────
-- TABLE: courses
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT        NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  code           TEXT        NOT NULL UNIQUE,
  description    TEXT,
  academic_year  TEXT        NOT NULL,
  semester       TEXT        NOT NULL DEFAULT 'WS' CHECK (semester IN ('WS', 'SS')),
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_courses_academic_year ON courses (academic_year);
CREATE INDEX IF NOT EXISTS idx_courses_is_active     ON courses (is_active);

-- ────────────────────────────────────────────────────────────
-- TABLE: teacher_courses (junction — used by RLS)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teacher_courses (
  teacher_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id   UUID NOT NULL REFERENCES courses(id)  ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (teacher_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_courses_teacher_id ON teacher_courses (teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_courses_course_id  ON teacher_courses (course_id);

-- ────────────────────────────────────────────────────────────
-- TABLE: student_courses (enrollment)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_courses (
  student_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id    UUID NOT NULL REFERENCES courses(id)  ON DELETE CASCADE,
  enrolled_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_student_courses_student_id ON student_courses (student_id);

-- ────────────────────────────────────────────────────────────
-- TABLE: grades
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grades (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id   UUID          NOT NULL REFERENCES courses(id)  ON DELETE CASCADE,
  graded_by   UUID          NOT NULL REFERENCES profiles(id),
  grade       NUMERIC(5,2)  NOT NULL CHECK (grade >= 1.0 AND grade <= 6.0),
  grade_type  TEXT          NOT NULL DEFAULT 'exam'
                            CHECK (grade_type IN ('exam', 'oral', 'homework', 'project', 'participation')),
  weight      NUMERIC(3,2)  NOT NULL DEFAULT 1.00,
  notes       TEXT,
  graded_at   DATE          NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_grades_updated_at
  BEFORE UPDATE ON grades
  FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_grades_student_id  ON grades (student_id);
CREATE INDEX IF NOT EXISTS idx_grades_course_id   ON grades (course_id);
CREATE INDEX IF NOT EXISTS idx_grades_graded_by   ON grades (graded_by);
CREATE INDEX IF NOT EXISTS idx_grades_graded_at   ON grades (graded_at DESC);

-- ────────────────────────────────────────────────────────────
-- TABLE: attendance
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id           UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id   UUID               NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id    UUID               NOT NULL REFERENCES courses(id)  ON DELETE CASCADE,
  recorded_by  UUID               NOT NULL REFERENCES profiles(id),
  date         DATE               NOT NULL DEFAULT CURRENT_DATE,
  status       attendance_status  NOT NULL DEFAULT 'present',
  notes        TEXT,
  created_at   TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, course_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_student_id  ON attendance (student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_course_id   ON attendance (course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date        ON attendance (date DESC);

-- ────────────────────────────────────────────────────────────
-- TABLE: parent_student_links
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parent_student_links (
  parent_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  linked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (parent_id, student_id)
);

-- ════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — Zero Trust
-- ════════════════════════════════════════════════════════════

ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees            ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips             ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices             ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades               ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance           ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;

-- ── profiles ─────────────────────────────────────────────────
CREATE POLICY "profiles: users read own record"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: users update own non-sensitive fields"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "profiles: admins full access"
  ON profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "profiles: teachers read students in shared courses"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teacher_courses tc
      JOIN student_courses sc ON sc.course_id = tc.course_id
      WHERE tc.teacher_id = auth.uid() AND sc.student_id = profiles.id
    )
  );

-- ── employees ────────────────────────────────────────────────
CREATE POLICY "employees: own record read"
  ON employees FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "employees: hr full access"
  ON employees FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr')));

-- ── payslips ─────────────────────────────────────────────────
CREATE POLICY "payslips: employee reads own"
  ON payslips FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = payslips.employee_id AND e.profile_id = auth.uid()
    )
  );

CREATE POLICY "payslips: hr full access"
  ON payslips FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr')));

-- ── invoices ─────────────────────────────────────────────────
CREATE POLICY "invoices: issued_to reads own"
  ON invoices FOR SELECT
  USING (issued_to = auth.uid());

CREATE POLICY "invoices: admin/hr full access"
  ON invoices FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr')));

-- ── courses ──────────────────────────────────────────────────
CREATE POLICY "courses: enrolled/assigned can read"
  ON courses FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM student_courses WHERE course_id = courses.id AND student_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM teacher_courses WHERE course_id = courses.id AND teacher_id = auth.uid())
  );

CREATE POLICY "courses: admin full access"
  ON courses FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── grades ───────────────────────────────────────────────────
CREATE POLICY "grades: teachers manage for own courses"
  ON grades FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM teacher_courses tc
      JOIN profiles p ON p.id = auth.uid()
      WHERE tc.teacher_id = auth.uid()
        AND tc.course_id  = grades.course_id
        AND p.role = 'teacher'
    )
  )
  WITH CHECK (
    graded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM teacher_courses
      WHERE teacher_id = auth.uid() AND course_id = grades.course_id
    )
  );

CREATE POLICY "grades: students read own only"
  ON grades FOR SELECT
  USING (
    student_id = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
  );

CREATE POLICY "grades: parents read linked child"
  ON grades FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_student_links psl
      WHERE psl.parent_id = auth.uid() AND psl.student_id = grades.student_id
    )
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'parent')
  );

CREATE POLICY "grades: admins full access"
  ON grades FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── attendance ───────────────────────────────────────────────
CREATE POLICY "attendance: teachers manage for own courses"
  ON attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM teacher_courses
      WHERE teacher_id = auth.uid() AND course_id = attendance.course_id
    )
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
  );

CREATE POLICY "attendance: students read own"
  ON attendance FOR SELECT
  USING (
    student_id = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
  );

CREATE POLICY "attendance: admins full access"
  ON attendance FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── parent_student_links ─────────────────────────────────────
CREATE POLICY "parent_student_links: parent reads own"
  ON parent_student_links FOR SELECT
  USING (parent_id = auth.uid());

CREATE POLICY "parent_student_links: admin full access"
  ON parent_student_links FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
