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
import ButtonAppBar from '../../components/navbar'
import supabase from '../config/supabase'

type Student = Record<string, unknown>


export default function Students() {
  const [students, setStudents] = useState<Student[]>([])
  const [visibleRowCount, setVisibleRowCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
            <div className="student-count">
              <strong>{(visibleRowCount ?? students.length).toString().padStart(2, '0')}</strong>
              <span>registered students</span>
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
                {students.map((student, rowIndex) => (
                  <TableRow hover key={String(student.id ?? rowIndex)}>
                    {columns.map((column) => (
                      <TableCell key={`${rowIndex}-${column}`}>
                        {formatCellValue(student[column])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
