'use client'

import { useState, FormEvent } from 'react'
import { CompanyData } from '@/types/company'

interface CompanyDataModalProps {
  onSubmit: (data: CompanyData) => void
  isOpen: boolean
}

export function CompanyDataModal({ onSubmit, isOpen }: CompanyDataModalProps) {
  const [formData, setFormData] = useState<CompanyData>({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    nit: '',
    employeeCount: undefined,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof CompanyData, string>>>({})

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    // Validación simple
    const newErrors: Partial<Record<keyof CompanyData, string>> = {}

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'El nombre de la empresa es requerido'
    }
    if (!formData.contactName.trim()) {
      newErrors.contactName = 'El nombre del contacto es requerido'
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      newErrors.email = 'El email es requerido y debe ser válido'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido'
    }
    if (!formData.nit || !formData.nit.trim()) {
      newErrors.nit = 'El NIT es requerido'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Datos del Cliente
            </h2>
            <p className="text-sm text-gray-600">
              Ingresa los datos de la empresa para generar la cotización
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre de la empresa */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Empresa *
              </label>
              <input
                type="text"
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tikin-red focus:border-transparent transition-all"
                placeholder="Ej: Acme Corp"
              />
              {errors.companyName && (
                <p className="text-xs text-red-600 mt-1">{errors.companyName}</p>
              )}
            </div>

            {/* Nombre del contacto */}
            <div>
              <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Contacto *
              </label>
              <input
                type="text"
                id="contactName"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tikin-red focus:border-transparent transition-all"
                placeholder="Ej: Juan Pérez"
              />
              {errors.contactName && (
                <p className="text-xs text-red-600 mt-1">{errors.contactName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tikin-red focus:border-transparent transition-all"
                placeholder="Ej: juan@acmecorp.com"
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono *
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tikin-red focus:border-transparent transition-all"
                placeholder="Ej: 3001234567"
              />
              {errors.phone && (
                <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
              )}
            </div>

            {/* NIT */}
            <div>
              <label htmlFor="nit" className="block text-sm font-medium text-gray-700 mb-2">
                NIT *
              </label>
              <input
                type="text"
                id="nit"
                value={formData.nit}
                onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tikin-red focus:border-transparent transition-all"
                placeholder="Ej: 900123456-7"
              />
              {errors.nit && (
                <p className="text-xs text-red-600 mt-1">{errors.nit}</p>
              )}
            </div>

            {/* Botón de submit */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-tikin-red text-white py-3 px-6 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-tikin-red focus:ring-offset-2 transition-all font-medium"
              >
                Continuar al Simulador
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
