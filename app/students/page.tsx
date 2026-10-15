'use client'

import { useEffect, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Link from 'next/link'
import ButtonAppBar from '../../components/navbar'
import supabase from '../config/supabase'
import PeopleIcon from '@mui/icons-material/People';
import CheckIcon from '@mui/icons-material/Check';
import BasicModal from '../../components/modal'

type Student = Record<string, unknown>

type PaymentCharge = {
  id?: string | number
  alumno_id: string | number
  fecha_vencimiento: string
  estado: string
  monto: number | string | null
  pagos?: { monto_pagado: number | string | null }[] | null
}

type Payment = {
  monto_pagado: number | string | null
  fecha_pago: string
}

type PaymentStatus = 'up_to_date' | 'overdue' | 'unknown'

export default function Students() {
  const [students, setStudents] = useState<Student[]>([])
  const [charges, setCharges] = useState<PaymentCharge[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentStatusByStudent, setPaymentStatusByStudent] = useState<Record<string, PaymentStatus>>({})
  const [visibleRowCount, setVisibleRowCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [refreshIndex, setRefreshIndex] = useState(0)

  useEffect(() => {
    let isMounted = true

    const loadStudents = async () => {
      const currentMonthStart = new Date()
      currentMonthStart.setDate(1)
      currentMonthStart.setHours(0, 0, 0, 0)
      const nextMonthStart = new Date(currentMonthStart)
      nextMonthStart.setMonth(nextMonthStart.getMonth() + 1)

      const [
        { data, error: queryError },
        { data: charges, error: chargesError },
        { data: payments, error: paymentsError },
      ] = await Promise.all([
        supabase.from('alumnos').select('*', { count: 'exact' }),
        supabase.from('cargos').select('id, alumno_id, fecha_vencimiento, estado, monto, pagos(monto_pagado)'),
        supabase
          .from('pagos')
          .select('monto_pagado, fecha_pago')
          .gte('fecha_pago', currentMonthStart.toISOString())
          .lt('fecha_pago', nextMonthStart.toISOString()),
      ])

      if (!isMounted) return

      if (queryError) {
        setError(queryError.message)
      } else {
        setStudents((data ?? []) as Student[])
        setVisibleRowCount(data?.length ?? 0)
      }

      if (chargesError) {
        setError((currentError) => currentError ?? `Could not load payment status: ${chargesError.message}`)
      } else {
        setCharges((charges ?? []) as PaymentCharge[])
        const today = new Date()
        const statusByStudent = ((charges ?? []) as PaymentCharge[]).reduce<Record<string, PaymentStatus>>(
          (statuses, charge) => {
            const studentKey = String(charge.alumno_id)
            const paid = Array.isArray(charge.pagos)
              ? charge.pagos.reduce((total, p) => total + Number(p.monto_pagado ?? 0), 0)
              : 0
            const remaining = charge.estado?.toLocaleLowerCase() === 'pagado'
              ? 0
              : Math.max(0, Number(charge.monto ?? 0) - paid)
            const isOverdue = remaining > 0 && new Date(charge.fecha_vencimiento) <= today

            if (isOverdue) statuses[studentKey] = 'overdue'
            else if (!statuses[studentKey]) statuses[studentKey] = 'up_to_date'

            return statuses
          },
          {},
        )

        setPaymentStatusByStudent(statusByStudent)
      }

      if (paymentsError) {
        setError((currentError) => currentError ?? `Could not load monthly payments: ${paymentsError.message}`)
      } else {
        setPayments((payments ?? []) as Payment[])
      }

      setLoading(false)
    }

    loadStudents()

    return () => {
      isMounted = false
    }
  }, [refreshIndex])

  const debtByStudent = useMemo(() => {
    return charges.reduce<Record<string, number>>((debts, charge) => {
      const studentKey = String(charge.alumno_id)
      const paid = Array.isArray(charge.pagos)
        ? charge.pagos.reduce((total, p) => total + Number(p.monto_pagado ?? 0), 0)
        : 0
      const remaining = charge.estado?.toLocaleLowerCase() === 'pagado'
        ? 0
        : Math.max(0, Number(charge.monto ?? 0) - paid)

      debts[studentKey] = (debts[studentKey] ?? 0) + remaining
      return debts
    }, {})
  }, [charges])

  const studentColumns = students.length > 0 ? Object.keys(students[0]) : []
  const visibleStudentColumns = studentColumns.filter((column) => !['id', 'creado_en'].includes(column))
  const columns = [...visibleStudentColumns, 'debt', 'payment_status']
  const tableColumns = [
    'student_identity',
    ...visibleStudentColumns.filter((column) => !['nombre', 'apellido', 'cedula_dni'].includes(column)),
    'debt',
    'payment_status',
  ]
  const activeSortColumn = sortColumn || columns[0] || ''
  const summary = useMemo(() => {
    const activeStudents = students.filter((student) => String(student.estado ?? '').toLocaleLowerCase() === 'activo').length
    const upToDateStudents = students.filter((student) => paymentStatusByStudent[String(student.id)] === 'up_to_date').length
    const overdueStudents = students.filter((student) => paymentStatusByStudent[String(student.id)] === 'overdue').length
    const collected = payments.reduce((total, payment) => total + Number(payment.monto_pagado ?? 0), 0)
    const outstanding = charges.reduce((total, charge) => {
      const paid = Array.isArray(charge.pagos)
        ? charge.pagos.reduce((sum, p) => sum + Number(p.monto_pagado ?? 0), 0)
        : 0
      if (charge.estado?.toLocaleLowerCase() === 'pagado') return total
      return total + Math.max(0, Number(charge.monto ?? 0) - paid)
    }, 0)

    return { activeStudents, upToDateStudents, overdueStudents, collected, outstanding }
  }, [charges, payments, paymentStatusByStudent, students])
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase()
  const filteredStudents = students
    .filter((student) =>
      normalizedSearch
        ? columns.some((column) => formatCellValue(getCellValue(student, column, paymentStatusByStudent, debtByStudent)).toLocaleLowerCase().includes(normalizedSearch))
        : true,
    )
    .sort((firstStudent, secondStudent) => {
      if (!activeSortColumn) return 0

      if (activeSortColumn === 'debt') {
        const debtA = debtByStudent[String(firstStudent.id)] ?? 0
        const debtB = debtByStudent[String(secondStudent.id)] ?? 0
        return sortDirection === 'asc' ? debtA - debtB : debtB - debtA
      }

      const firstValue = formatCellValue(getCellValue(firstStudent, activeSortColumn, paymentStatusByStudent, debtByStudent))
      const secondValue = formatCellValue(getCellValue(secondStudent, activeSortColumn, paymentStatusByStudent, debtByStudent))
      const comparison = firstValue.localeCompare(secondValue, undefined, { numeric: true, sensitivity: 'base' })

      return sortDirection === 'asc' ? comparison : -comparison
    })
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / rowsPerPage))
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  )

  return (
    <main className="site-shell students-shell">
      <ButtonAppBar />
      <section className="students-content" aria-labelledby="students-title">
        <div className="students-heading">
          <div>
            <p className="eyebrow">Dojo records / 03</p>
            <Typography component="h1" id="students-title">
              Students<span>.</span>
            </Typography>
            <p className="students-description">
              A clear view of everyone training at Kenshu Kan.
            </p>
          </div>
          {!loading && !error && (
            <div className="students-heading-actions">
              <div className="student-count">
                <strong>{(visibleRowCount ?? students.length).toString().padStart(2, '0')}</strong>
                <span>registered students</span>
              </div>
              <Button
                className="mainbutton"
                component={Link}
                href="/students/new"
                variant="contained"
              >
                Add student
              </Button>
            </div>
          )}
        </div>

        {!loading && !error && students.length > 0 && (
          <div className="students-summary" aria-label="Student payment summary">
            <article className="students-summary-card">
              <div>
                <span className="students-summary-label">Active students</span>
                <strong>{summary.activeStudents}</strong>
                <small>Registered in dojo</small>
              </div>
              <span className="students-summary-mark" aria-hidden="true"><PeopleIcon /></span>
            </article>
            <article className="students-summary-card students-summary-card-positive">
              <div>
                <span className="students-summary-label">Up to date</span>
                <strong>{summary.upToDateStudents}</strong>
                <small>{summary.activeStudents ? Math.round((summary.upToDateStudents / summary.activeStudents) * 100) : 0}% of active students</small>
              </div>
              <span className="students-summary-mark" aria-hidden="true"><CheckIcon /></span>
            </article>
            <article className="students-summary-card students-summary-card-alert">
              <div>
                <span className="students-summary-label">Payment overdue</span>
                <strong>{summary.overdueStudents}</strong>
                <small>Require follow-up</small>
              </div>
              <span className="students-summary-mark" aria-hidden="true">!</span>
            </article>
            <article className="students-summary-card students-summary-card-balance">
              <div>
                <span className="students-summary-label">Monthly balance</span>
                <strong>${summary.collected.toFixed(2)}</strong>
                <small>Outstanding: ${summary.outstanding.toFixed(2)}</small>
              </div>
              <span className="students-summary-mark" aria-hidden="true">$</span>
            </article>
          </div>
        )}

        {loading && (
          <div className="students-state">
            <CircularProgress size={28} sx={{ color: 'var(--mainred)' }} />
            <span>Loading student records...</span>
          </div>
        )}

        {error && (
          <Alert severity="error" className="students-alert">
            Could not load students: {error}
          </Alert>
        )}

        {!loading && !error && students.length === 0 && (
          <div className="students-state">
            <span>
              No visible rows were returned from alumnos. Check the table data
              and its Supabase Row Level Security SELECT policy for the anon role.
            </span>
          </div>
        )}

        {!loading && !error && students.length > 0 && (
          <>
            <div className="students-controls" aria-label="Student table controls">
              <label htmlFor="student-search">Search students</label>
              <input
                id="student-search"
                type="search"
                placeholder="Search by any student detail"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value)
                  setCurrentPage(1)
                }}
              />

              <label htmlFor="student-sort">Sort by</label>
              <select
                id="student-sort"
                value={activeSortColumn}
                onChange={(event) => {
                  setSortColumn(event.target.value)
                  setCurrentPage(1)
                }}
              >
                {columns.map((column) => (
                  <option key={column} value={column}>
                    {formatColumnLabel(column)}
                  </option>
                ))}
              </select>

              <button
                className="sort-direction"
                type="button"
                onClick={() => {
                  setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc')
                  setCurrentPage(1)
                }}
                aria-label={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
              >
                {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
              </button>

              <label htmlFor="student-page-size">Rows</label>
              <select
                id="student-page-size"
                value={rowsPerPage}
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value))
                  setCurrentPage(1)
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>

              <span className="students-result-count">
                Showing {filteredStudents.length} of {students.length}
              </span>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="students-state">
                <span>No students match your search.</span>
              </div>
            ) : (
              <TableContainer component={Paper} className="students-table-container">
                <Table stickyHeader aria-label="Students table">
                  <TableHead>
                    <TableRow>
                      {tableColumns.map((column) => (
                        <TableCell key={column}>{formatColumnLabel(column)}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedStudents.map((student, rowIndex) => (
                      <TableRow
                        key={String(student.id ?? rowIndex)}
                        // component={Link}
                        // href={`/students/${String(student.id)}`}
                        // hover
                        // key={String(student.id ?? rowIndex)}
                        // className="student-row-link"
                      >
                        {tableColumns.map((column) => (
                          <TableCell key={`${rowIndex}-${column}`}>
                            {column === 'student_identity' ? (
                              <Link
                                className="student-identity-cell"
                                href={`/students/${String(student.id)}`}
                              >
                                <span className="student-avatar" aria-hidden="true">
                                  {getStudentInitials(student)}
                                </span>
                                <div className="student-identity-details">
                                  <strong>{formatCellValue(student.nombre)} {formatCellValue(student.apellido)}</strong>
                                  <span>{formatCellValue(student.cedula_dni)}</span>
                                </div>
                              </Link>
                            ) : column === 'debt' ? (
                              <span className={`student-debt ${(debtByStudent[String(student.id)] ?? 0) > 0 ? 'student-debt-overdue' : 'student-debt-clear'}`}>
                                {formatCurrency(debtByStudent[String(student.id)] ?? 0)}
                              </span>
                            ) : column === 'payment_status' ? (
                              <span className={`student-status student-payment-${getPaymentStatusClass(paymentStatusByStudent[String(student.id)])}`}>
                                <span className="student-status-dot" aria-hidden="true" />
                                <BasicModal
                                  status={formatPaymentStatus(paymentStatusByStudent[String(student.id)])}
                                  studentId={String(student.id)}
                                  studentName={`${formatCellValue(student.nombre)} ${formatCellValue(student.apellido)}`}
                                  onPaymentSuccess={() => setRefreshIndex((idx) => idx + 1)}
                                />
                              </span>
                            ) : column === 'estado' ? (
                              <span className={`student-status student-status-${getStatusClass(student[column])}`}>
                                <span className="student-status-dot" aria-hidden="true" />
                                {formatCellValue(student[column])}
                              </span>
                            ) : column === 'cinta' ? (
                              <span className={`student-status student-belt-${getBeltClass(student[column])}`}>
                                <span className="student-status-dot" aria-hidden="true" />
                                {formatCellValue(student[column])}
                              </span>
                            ) : (
                              formatCellValue(student[column])
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {filteredStudents.length > 0 && (
              <div className="students-pagination" aria-label="Student table pagination">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}

function formatCellValue(value: unknown) {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`
}

function formatColumnLabel(column: string) {
  if (column === 'student_identity') return 'Student'
  if (column === 'payment_status') return 'Payment status'
  if (column === 'debt') return 'Debt'
  return column.replaceAll('_', ' ')
}

function getStudentInitials(student: Student) {
  const firstName = formatCellValue(student.nombre).trim()
  const lastName = formatCellValue(student.apellido).trim()

  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toLocaleUpperCase()
}

function getCellValue(
  student: Student,
  column: string,
  paymentStatusByStudent: Record<string, PaymentStatus>,
  debtByStudent: Record<string, number>,
) {
  if (column === 'payment_status') return formatPaymentStatus(paymentStatusByStudent[String(student.id)])
  if (column === 'debt') return formatCurrency(debtByStudent[String(student.id)] ?? 0)
  return student[column]
}

function formatPaymentStatus(status: PaymentStatus | undefined) {
  if (status === 'up_to_date') return 'Up to date'
  if (status === 'overdue') return 'Payment overdue'
  return 'No payment data'
}

function getPaymentStatusClass(status: PaymentStatus | undefined) {
  if (status === 'up_to_date') return 'up-to-date'
  if (status === 'overdue') return 'overdue'
  return 'unknown'
}

function getStatusClass(value: unknown) {
  const status = String(value ?? '').toLocaleLowerCase()

  if (status === 'activo') return 'active'
  if (status === 'inactivo') return 'inactive'
  if (status === 'suspendido') return 'suspended'
  return 'unknown'
}

function getBeltClass(value: unknown) {
  const belt = String(value ?? '')
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (belt === 'blanco') return 'white'
  if (belt === 'amarillo') return 'yellow'
  if (belt === 'naranja') return 'orange'
  if (belt === 'verde') return 'green'
  if (belt === 'azul') return 'blue'
  if (belt === 'marron') return 'brown'
  if (belt === 'negro') return 'black'
  return 'unknown'
}
