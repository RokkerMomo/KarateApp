 'use client'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ButtonAppBar from '../../../components/navbar'
import supabase from '../../config/supabase'

export default function NewStudent() {
  const router = useRouter()
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    cedula_dni: '',
    fecha_nacimiento: '',
    email: '',
    telefono: '',
    cinta: 'blanco',
    estado: 'activo',
    fecha_ingreso: new Date().toISOString().split('T')[0],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const addStudent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    const { error: insertError } = await supabase.from('alumnos').insert({
      ...form,
      email: form.email || null,
      telefono: form.telefono || null,
    })

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    router.push('/students')
  }

  return (
    <main className="site-shell new-student-shell">
      <ButtonAppBar />
      <section className="new-student-content" aria-labelledby="new-student-title">
        <div className="new-student-intro">
          <p className="eyebrow">Admin / Students</p>
          <h1 id="new-student-title">New student</h1>
          <Link className="back-link" href="/students">
            Cancel and return to students
          </Link>
        </div>

        <form className="new-student-form" onSubmit={addStudent}>
          <div className="form-heading">
            <span>Student details</span>
            <span>Required fields marked *</span>
          </div>

          <div className="student-form-grid">
            <div className="student-form-field">
              <label htmlFor="nombre">First name *</label>
              <input
                id="nombre"
                name="nombre"
                maxLength={100}
                required
                value={form.nombre}
                onChange={(event) => updateField('nombre', event.target.value)}
              />
            </div>

            <div className="student-form-field">
              <label htmlFor="apellido">Last name *</label>
              <input
                id="apellido"
                name="apellido"
                maxLength={100}
                required
                value={form.apellido}
                onChange={(event) => updateField('apellido', event.target.value)}
              />
            </div>

            <div className="student-form-field">
              <label htmlFor="cedula_dni">ID / DNI *</label>
              <input
                id="cedula_dni"
                name="cedula_dni"
                maxLength={20}
                required
                value={form.cedula_dni}
                onChange={(event) => updateField('cedula_dni', event.target.value)}
              />
            </div>

            <div className="student-form-field">
              <label htmlFor="fecha_nacimiento">Date of birth *</label>
              <input
                id="fecha_nacimiento"
                name="fecha_nacimiento"
                type="date"
                max={new Date().toISOString().split('T')[0]}
                required
                value={form.fecha_nacimiento}
                onChange={(event) => updateField('fecha_nacimiento', event.target.value)}
              />
            </div>

            <div className="student-form-field">
              <label htmlFor="telefono">Phone</label>
              <input
                id="telefono"
                name="telefono"
                maxLength={25}
                type="tel"
                value={form.telefono}
                onChange={(event) => updateField('telefono', event.target.value)}
              />
            </div>

            <div className="student-form-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                maxLength={150}
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
              />
            </div>

            <div className="student-form-field">
              <label htmlFor="cinta">Belt</label>
              <select id="cinta" name="cinta" value={form.cinta} onChange={(event) => updateField('cinta', event.target.value)}>
                <option value="blanco">White</option>
                <option value="amarillo">Yellow</option>
                <option value="naranja">Orange</option>
                <option value="verde">Green</option>
                <option value="azul">Blue</option>
                <option value="marron">Brown</option>
                <option value="negro">Black</option>
              </select>
            </div>

            <div className="student-form-field">
              <label htmlFor="estado">Status</label>
              <select id="estado" name="estado" value={form.estado} onChange={(event) => updateField('estado', event.target.value)}>
                <option value="activo">Active</option>
                <option value="inactivo">Inactive</option>
              </select>
            </div>

            <div className="student-form-field">
              <label htmlFor="fecha_ingreso">Enrollment date</label>
              <input
                id="fecha_ingreso"
                name="fecha_ingreso"
                type="date"
                required
                value={form.fecha_ingreso}
                onChange={(event) => updateField('fecha_ingreso', event.target.value)}
              />
            </div>
          </div>

          {error && <Alert severity="error" className="new-student-alert">Could not add student: {error}</Alert>}

          <Button className="mainbutton" variant="contained" type="submit" disabled={saving}>
            {saving ? 'Adding student...' : 'Add student'}
          </Button>
        </form>
      </section>
    </main>
  )
}