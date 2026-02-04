'use client'

import { useState, useEffect } from 'react'

interface DisclaimerModalProps {
  onAccept: () => void
}

export function DisclaimerModal({ onAccept }: DisclaimerModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Verificar si el usuario ya aceptó el disclaimer en esta sesión
    const hasAccepted = sessionStorage.getItem('tikin-disclaimer-accepted')
    if (!hasAccepted) {
      setIsOpen(true)
    } else {
      onAccept()
    }
  }, [onAccept])

  const handleAccept = () => {
    sessionStorage.setItem('tikin-disclaimer-accepted', 'true')
    setIsOpen(false)
    onAccept()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 animate-slide-up">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Aviso Legal Importante
          </h2>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-8">
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
            <p className="text-gray-800 leading-relaxed">
              <strong className="text-amber-900">Esta herramienta es un cotizador comercial de servicios Tikin.</strong>
            </p>
          </div>

          <div className="space-y-3 text-gray-700">
            <p className="flex items-start gap-2">
              <span className="text-tikin-red font-bold mt-1">•</span>
              <span>No constituye asesoría legal, contable, laboral o tributaria de ningún tipo.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-tikin-red font-bold mt-1">•</span>
              <span>Los cálculos mostrados son estimaciones basadas únicamente en la información que usted ingrese.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-tikin-red font-bold mt-1">•</span>
              <span>Los valores finales pueden variar según circunstancias específicas de su empresa.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-tikin-red font-bold mt-1">•</span>
              <span>Se recomienda consultar con su asesor legal, contable o laboral antes de tomar decisiones basadas en esta herramienta.</span>
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mt-6">
            <p className="text-sm text-gray-600 text-center">
              Al continuar, usted acepta que comprende que esta es una herramienta comercial informativa
              y no constituye asesoría profesional de ningún tipo.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center">
          <button
            onClick={handleAccept}
            className="bg-tikin-red hover:bg-red-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:shadow-lg transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-300"
          >
            Entiendo y Acepto
          </button>
        </div>
      </div>
    </div>
  )
}
