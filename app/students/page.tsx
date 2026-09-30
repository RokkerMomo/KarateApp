'use client'

import { useEffect, useState } from 'react'
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

type Student = Record<string, unknown>


export default function Students() {
  const [students, setStudents] = useState<Student[]>([])
  const [visibleRowCount, setVisibleRowCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    const loadStudents = async () => {
      const { data, error: queryError } = await supabase
        .from('alumnos')
        .select('*', { count: 'exact' })

      if (queryError) {
        setError(queryError.message)
      } else {
        setStudents((data ?? []) as Student[])
        setVisibleRowCount(data?.length ?? 0)
      }

      setLoading(false)
    }

    loadStudents()
  }, [])

  const columns = students.length > 0 ? Object.keys(students[0]) : []
  const activeSortColumn = sortColumn || columns[0] || ''
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase()
  const filteredStudents = students
    .filter((student) =>
      normalizedSearch
        ? columns.some((column) => formatCellValue(student[column]).toLocaleLowerCase().includes(normalizedSearch))
        : true,
    )
    .sort((firstStudent, secondStudent) => {
      if (!activeSortColumn) return 0

      const firstValue = formatCellValue(firstStudent[activeSortColumn])
      const secondValue = formatCellValue(secondStudent[activeSortColumn])
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
                    {column.replaceAll('_', ' ')}
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
                      {columns.map((column) => (
                        <TableCell key={column}>{column.replaceAll('_', ' ')}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedStudents.map((student, rowIndex) => (
                      <TableRow
                        component={Link}
                        href={`/students/${String(student.id)}`}
                        hover
                        key={String(student.id ?? rowIndex)}
                        className="student-row-link"
                      >
                        {columns.map((column) => (
                          <TableCell key={`${rowIndex}-${column}`}>
                            {column === 'estado' ? (
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
