'use client'

import { useState, useEffect, useRef } from 'react'
import { useBonosStore } from '@/store/bonosStore'
import type { RegimenParafiscales } from '@/lib/bonos/types'

/**
 * Paso 0: Datos de la Empresa
 * Recopila información de la empresa para la cotización.
 * Todos los campos son opcionales — el usuario puede avanzar sin llenar.
 * ARL se configura por lote en el paso de carga de empleados.
 */
export function CompanyDataStep() {
  const { datosEmpresa, setDatosEmpresa, siguientePaso } = useBonosStore()

  const firstInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    razonSocial: datosEmpresa?.razonSocial || '',
    nit: datosEmpresa?.nit || '',
    contactoNombre: datosEmpresa?.contactoNombre || '',
    contactoEmail: datosEmpresa?.contactoEmail || '',
    contactoTelefono: datosEmpresa?.contactoTelefono || '',
  })

  const [regimen, setRegimen] = useState<RegimenParafiscales>(
    datosEmpresa?.regimenParafiscales || 'exonerado'
  )

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Sync form state when Zustand hydrates from localStorage
  useEffect(() => {
    if (datosEmpresa) {
      setForm({
        razonSocial: datosEmpresa.razonSocial || '',
        nit: datosEmpresa.nit || '',
        contactoNombre: datosEmpresa.contactoNombre || '',
        contactoEmail: datosEmpresa.contactoEmail || '',
        contactoTelefono: datosEmpresa.contactoTelefono || '',
      })
      setRegimen(datosEmpresa.regimenParafiscales || 'exonerado')
    }
  }, [datosEmpresa])

  // Auto-focus on first field
  useEffect(() => {
    firstInputRef.current?.focus()
  }, [])

  const updateField = (field: string, value: string | number | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  /**
   * Format NIT as user types: XXX.XXX.XXX-X
   */
  const handleNitChange = (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, '')
    const limited = digits.slice(0, 10)

    let formatted = ''
    for (let i = 0; i < limited.length; i++) {
      if (i === 3 || i === 6) formatted += '.'
      if (i === 9) formatted += '-'
      formatted += limited[i]
    }

    updateField('nit', formatted)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Only validate format if a value was entered (all fields optional)
    if (form.contactoEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactoEmail)) {
      newErrors.contactoEmail = 'Formato de email no válido'
    }

    if (form.nit) {
      const nitDigits = form.nit.replace(/\D/g, '')
      if (nitDigits.length > 0 && nitDigits.length < 9) {
        newErrors.nit = 'El NIT debe tener al menos 9 dígitos'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinuar = () => {
    if (validateForm()) {
      setDatosEmpresa({
        razonSocial: form.razonSocial.trim(),
        nit: form.nit.trim(),
        contactoNombre: form.contactoNombre.trim(),
        contactoEmail: form.contactoEmail.trim(),
        contactoTelefono: form.contactoTelefono.trim(),
        sector: '',
        cantidadEmpleados: 0,
        obligadoParafiscales: regimen === 'general',
        regimenParafiscales: regimen,
      })
      siguientePaso()
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Título */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Datos de la Empresa
        </h2>
        <p className="text-gray-600">
          Ingresa la información de tu empresa para personalizar la cotización
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Todos los campos son opcionales — puedes completarlos después
        </p>
      </div>

      {/* Card: Datos de la Empresa */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Información de la Empresa</h3>
            <p className="text-sm text-gray-500">Datos generales y de contacto</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Razón Social */}
          <div className="md:col-span-2">
            <label htmlFor="razonSocial" className="block text-sm font-medium text-gray-700 mb-1.5">
              Razón Social
            </label>
            <input
              ref={firstInputRef}
              id="razonSocial"
              type="text"
              value={form.razonSocial}
              onChange={(e) => updateField('razonSocial', e.target.value)}
              placeholder="Nombre legal de la empresa"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-tikin-red/20 focus:border-tikin-red"
            />
          </div>

          {/* NIT */}
          <div>
            <label htmlFor="nit" className="block text-sm font-medium text-gray-700 mb-1.5">
              NIT
            </label>
            <input
              id="nit"
              type="text"
              value={form.nit}
              onChange={(e) => handleNitChange(e.target.value)}
              placeholder="900.123.456-7"
              className={`w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-tikin-red/20 focus:border-tikin-red ${
                errors.nit ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
              }`}
            />
            {errors.nit && (
              <p className="mt-1 text-sm text-red-600">{errors.nit}</p>
            )}
          </div>

          {/* Nombre de Contacto */}
          <div>
            <label htmlFor="contactoNombre" className="block text-sm font-medium text-gray-700 mb-1.5">
              Persona de Contacto
            </label>
            <input
              id="contactoNombre"
              type="text"
              value={form.contactoNombre}
              onChange={(e) => updateField('contactoNombre', e.target.value)}
              placeholder="Nombre del responsable"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-tikin-red/20 focus:border-tikin-red"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="contactoEmail" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              id="contactoEmail"
              type="email"
              value={form.contactoEmail}
              onChange={(e) => updateField('contactoEmail', e.target.value)}
              placeholder="correo@empresa.com"
              className={`w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-tikin-red/20 focus:border-tikin-red ${
                errors.contactoEmail ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
              }`}
            />
            {errors.contactoEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.contactoEmail}</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label htmlFor="contactoTelefono" className="block text-sm font-medium text-gray-700 mb-1.5">
              Teléfono
            </label>
            <input
              id="contactoTelefono"
              type="tel"
              value={form.contactoTelefono}
              onChange={(e) => updateField('contactoTelefono', e.target.value)}
              placeholder="+57 300 123 4567"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-tikin-red/20 focus:border-tikin-red"
            />
          </div>

        </div>
      </div>

      {/* Card: Regimen de Parafiscales */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Regimen de Contribucion Parafiscal</h3>
            <p className="text-sm text-gray-500">Art. 114-1 del Estatuto Tributario</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Exonerado */}
          <label
            className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              regimen === 'exonerado'
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="regimen"
              value="exonerado"
              checked={regimen === 'exonerado'}
              onChange={() => setRegimen('exonerado')}
              className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <span className="font-medium text-gray-900">Exonerado (Art. 114-1 E.T.)</span>
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                Recomendado
              </span>
              <p className="text-sm text-gray-600 mt-1">
                Empresas declarantes de renta (SAS, LTDA, S.A.): exoneradas de Salud (8.5%), SENA (2%) e ICBF (3%) para empleados con IBC menor a 10 SMMLV ($17.509.050).
              </p>
            </div>
          </label>

          {/* General */}
          <label
            className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              regimen === 'general'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="regimen"
              value="general"
              checked={regimen === 'general'}
              onChange={() => setRegimen('general')}
              className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="font-medium text-gray-900">Regimen General</span>
              <p className="text-sm text-gray-600 mt-1">
                Entidades sin animo de lucro, cooperativas, personas naturales con empleados, y empresas no declarantes de renta: pagan todos los aportes parafiscales.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Errores de formato */}
      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-800">
            Corrige los errores de formato marcados antes de continuar.
          </p>
        </div>
      )}

      {/* Botón de navegación — Paso 0 no tiene "Volver" */}
      <div className="flex justify-end">
        <button
          onClick={handleContinuar}
          className="px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 bg-tikin-red text-white hover:bg-red-700"
        >
          Continuar
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
