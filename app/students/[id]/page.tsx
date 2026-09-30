'use client'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import ButtonAppBar from '../../../components/navbar'
import supabase from '../../config/supabase'

type StudentForm = {
  nombre: string
  apellido: string
  cedula_dni: string
  fecha_nacimiento: string
  telefono: string
  email: string
  cinta: string
  estado: string
  fecha_ingreso: string
}

const beltOptions = [
  ['blanco', 'White'],
  ['amarillo', 'Yellow'],
  ['naranja', 'Orange'],
  ['verde', 'Green'],
  ['azul', 'Blue'],
  ['marron', 'Brown'],
  ['negro', 'Black'],
]

export default function StudentProfile() {
  const params = useParams<{ id: string }>()
  const studentId = params.id
  const router = useRouter()
  const [form, setForm] = useState<StudentForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStudent = async () => {
      const { data, error: queryError } = await supabase
        .from('alumnos')
        .select('nombre, apellido, cedula_dni, fecha_nacimiento, telefono, email, cinta, estado, fecha_ingreso')
        .eq('id', studentId)
        .single()

      if (queryError) {
        setError(queryError.message)
      } else {
        setForm({
          nombre: data.nombre,
          apellido: data.apellido,
          cedula_dni: data.cedula_dni,
          fecha_nacimiento: data.fecha_nacimiento,
          telefono: data.telefono ?? '',
          email: data.email ?? '',
          cinta: data.cinta ?? 'blanco',
          estado: data.estado ?? 'activo',
          fecha_ingreso: data.fecha_ingreso,
        })
      }

      setLoading(false)
    }

    loadStudent()
  }, [studentId])

  const updateField = (field: keyof StudentForm, value: string) => {
    setForm((current) => current ? { ...current, [field]: value } : current)
  }

  const updateStudent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form) return

    setSaving(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('alumnos')
      .update({
        ...form,
        email: form.email || null,
        telefono: form.telefono || null,
      })
      .eq('id', studentId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    router.push('/students')
  }

  return (
    <main className="site-shell new-student-shell">
      <ButtonAppBar />
      <section className="new-student-content" aria-labelledby="student-profile-title">
        <div className="new-student-intro">
          <p className="eyebrow">Admin / Students</p>
          <h1 id="student-profile-title">Student profile</h1>
          <Link className="back-link" href="/students">
            Cancel and return to students
          </Link>
        </div>

        {loading && (
          <div className="students-state">
            <CircularProgress size={28} sx={{ color: 'var(--mainred)' }} />
            <span>Loading student profile...</span>
          </div>
        )}

        {!loading && error && (
          <Alert severity="error" className="students-alert">
            Could not load student: {error}
          </Alert>
        )}

        {!loading && !error && form && (
          <form className="new-student-form" onSubmit={updateStudent}>
            <div className="form-heading">
              <span>Edit student details</span>
              <span>ID {studentId}</span>
            </div>

            <div className="student-form-grid">
              <div className="student-form-field">
                <label htmlFor="nombre">First name *</label>
                <input id="nombre" maxLength={100} required value={form.nombre} onChange={(event) => updateField('nombre', event.target.value)} />
              </div>
              <div className="student-form-field">
                <label htmlFor="apellido">Last name *</label>
                <input id="apellido" maxLength={100} required value={form.apellido} onChange={(event) => updateField('apellido', event.target.value)} />
              </div>
              <div className="student-form-field">
                <label htmlFor="cedula_dni">ID / DNI *</label>
                <input id="cedula_dni" maxLength={20} required value={form.cedula_dni} onChange={(event) => updateField('cedula_dni', event.target.value)} />
              </div>
              <div className="student-form-field">
                <label htmlFor="fecha_nacimiento">Date of birth *</label>
                <input id="fecha_nacimiento" type="date" required value={form.fecha_nacimiento} onChange={(event) => updateField('fecha_nacimiento', event.target.value)} />
              </div>
              <div className="student-form-field">
                <label htmlFor="telefono">Phone</label>
                <input id="telefono" maxLength={25} type="tel" value={form.telefono} onChange={(event) => updateField('telefono', event.target.value)} />
              </div>
              <div className="student-form-field">
                <label htmlFor="email">Email</label>
                <input id="email" maxLength={150} type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} />
              </div>
              <div className="student-form-field">
                <label htmlFor="cinta">Belt</label>
                <select id="cinta" value={form.cinta} onChange={(event) => updateField('cinta', event.target.value)}>
                  {beltOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div className="student-form-field">
                <label htmlFor="estado">Status</label>
                <select id="estado" value={form.estado} onChange={(event) => updateField('estado', event.target.value)}>
                  <option value="activo">Active</option>
                  <option value="inactivo">Inactive</option>
                </select>
              </div>
              <div className="student-form-field">
                <label htmlFor="fecha_ingreso">Enrollment date</label>
                <input id="fecha_ingreso" type="date" required value={form.fecha_ingreso} onChange={(event) => updateField('fecha_ingreso', event.target.value)} />
              </div>
            </div>

            {error && <Alert severity="error" className="new-student-alert">Could not save changes: {error}</Alert>}

            <Button className="mainbutton" variant="contained" type="submit" disabled={saving}>
              {saving ? 'Saving changes...' : 'Save changes'}
            </Button>
          </form>
        )}
      </section>
    </main>
  )
}
