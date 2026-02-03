'use client'

import { useState } from 'react'
import { BonusCompanyData } from '@/types/bonuses'

interface BonusCompanyDataFormProps {
  onSubmit: (data: BonusCompanyData) => void
  onBack: () => void
  initialData?: BonusCompanyData
}

export function BonusCompanyDataForm({ onSubmit, onBack, initialData }: BonusCompanyDataFormProps) {
  const [formData, setFormData] = useState<BonusCompanyData>(
    initialData || {
      companyName: '',
      contactName: '',
      email: '',
      phone: '',
      nit: ''
    }
  )

  const [errors, setErrors] = useState<Partial<Record<keyof BonusCompanyData, string>>>({})

  const handleChange = (field: keyof BonusCompanyData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof BonusCompanyData, string>> = {}

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'El nombre de la empresa es requerido'
    }

    if (!formData.contactName.trim()) {
      newErrors.contactName = 'El nombre del contacto es requerido'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido'
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'El teléfono debe tener 10 dígitos'
    }

    if (!formData.nit.trim()) {
      newErrors.nit = 'El NIT es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Información de la Empresa
        </h2>
        <p className="text-gray-600">
          Ingresa los datos de tu empresa para generar la dispersión de bonos.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Name */}
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Empresa *
            </label>
            <input
              type="text"
              id="companyName"
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              className={`w-full px-4 py-2.5 border ${
                errors.companyName ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-tikin-red focus:border-transparent`}
              placeholder="Ej: Tikin SAS"
            />
            {errors.companyName && (
              <p className="text-red-600 text-sm mt-1">{errors.companyName}</p>
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
              onChange={(e) => handleChange('nit', e.target.value)}
              className={`w-full px-4 py-2.5 border ${
                errors.nit ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-tikin-red focus:border-transparent`}
              placeholder="Ej: 900123456-7"
            />
            {errors.nit && (
              <p className="text-red-600 text-sm mt-1">{errors.nit}</p>
            )}
          </div>

          {/* Contact Name */}
          <div>
            <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Contacto *
            </label>
            <input
              type="text"
              id="contactName"
              value={formData.contactName}
              onChange={(e) => handleChange('contactName', e.target.value)}
              className={`w-full px-4 py-2.5 border ${
                errors.contactName ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-tikin-red focus:border-transparent`}
              placeholder="Ej: Juan Pérez"
            />
            {errors.contactName && (
              <p className="text-red-600 text-sm mt-1">{errors.contactName}</p>
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
              onChange={(e) => handleChange('email', e.target.value)}
              className={`w-full px-4 py-2.5 border ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-tikin-red focus:border-transparent`}
              placeholder="Ej: contacto@empresa.com"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono *
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={`w-full px-4 py-2.5 border ${
                errors.phone ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-tikin-red focus:border-transparent`}
              placeholder="Ej: 3001234567"
            />
            {errors.phone && (
              <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              ← Volver
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-tikin-red text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
            >
              Continuar →
            </button>
          </div>
        </form>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs text-blue-800">
          <strong>Información:</strong> Esta información será utilizada para generar la propuesta de dispersión de bonos.
          Los datos serán tratados de acuerdo con nuestra política de privacidad.
        </p>
      </div>
    </div>
  )
}
