'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { BonusTypeSelector } from '@/components/bonuses/BonusTypeSelector'
import { BonusCompanyDataForm } from '@/components/bonuses/BonusCompanyDataForm'
import { EmployeeLoader } from '@/components/bonuses/EmployeeLoader'
import { BonusDistribution } from '@/components/bonuses/BonusDistribution'
import { BonusSummary } from '@/components/bonuses/BonusSummary'
import { BonusType, BonusFlowState, BonusCompanyData, BonusConfig, Employee, EmployeeBatch } from '@/types/bonuses'

export default function BonosPage() {
  const [flowState, setFlowState] = useState<BonusFlowState>({
    empleados: [],
    lotes: [],
    totalEmpleados: 0,
    pasoActual: 1
  })

  const handleTipoSeleccionado = (tipo: BonusType) => {
    setFlowState(prev => ({
      ...prev,
      tipoSeleccionado: tipo,
      pasoActual: 2,
      tabActivo: tipo === 'ambos' ? 'mera_liberalidad' : undefined
    }))
  }

  const handleCompanyDataSubmit = (data: BonusCompanyData) => {
    setFlowState(prev => ({
      ...prev,
      companyData: data,
      pasoActual: 3
    }))
  }

  const handleBackToPaso = (paso: number) => {
    setFlowState(prev => ({
      ...prev,
      pasoActual: paso
    }))
  }

  const handleEmpleadosChange = (empleados: Employee[], lotes: EmployeeBatch[]) => {
    setFlowState(prev => ({
      ...prev,
      empleados,
      lotes,
      totalEmpleados: empleados.length
    }))
  }

  const handleContinueFromStep3 = () => {
    setFlowState(prev => ({
      ...prev,
      pasoActual: 4
    }))
  }

  const handleConfigsComplete = (configML?: BonusConfig, configAL?: BonusConfig) => {
    setFlowState(prev => ({
      ...prev,
      configMeraLiberalidad: configML,
      configAlimentacion: configAL,
      pasoActual: 5
    }))
  }

  const handleConfirmDispersion = () => {
    // TODO: Implement dispersion confirmation
    // This could:
    // - Generate PDF proposal
    // - Send to backend API
    // - Show success modal
    // - Redirect to confirmation page
    alert('¡Dispersión confirmada! Próximamente se implementará la generación de propuesta y envío.')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3, 4, 5].map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold ${
                    step === flowState.pasoActual
                      ? 'bg-tikin-red text-white border-tikin-red'
                      : step < flowState.pasoActual
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-gray-400 border-gray-300'
                  }`}
                >
                  {step < flowState.pasoActual ? '✓' : step}
                </div>
                {index < 4 && (
                  <div
                    className={`h-1 w-16 mx-2 ${
                      step < flowState.pasoActual ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-3 text-sm text-gray-600">
            <span className="font-medium">
              {flowState.pasoActual === 1 && 'Tipo de Bono'}
              {flowState.pasoActual === 2 && 'Información de Empresa'}
              {flowState.pasoActual === 3 && 'Agregar Empleados'}
              {flowState.pasoActual === 4 && 'Distribución'}
              {flowState.pasoActual === 5 && 'Resumen y Confirmación'}
            </span>
          </div>
        </div>

        {/* Paso Actual */}
        {flowState.pasoActual === 1 && (
          <BonusTypeSelector onSelect={handleTipoSeleccionado} />
        )}

        {flowState.pasoActual === 2 && (
          <BonusCompanyDataForm
            onSubmit={handleCompanyDataSubmit}
            onBack={() => handleBackToPaso(1)}
            initialData={flowState.companyData}
          />
        )}

        {flowState.pasoActual === 3 && (
          <EmployeeLoader
            empleados={flowState.empleados}
            lotes={flowState.lotes}
            onEmpleadosChange={handleEmpleadosChange}
            onContinue={handleContinueFromStep3}
            onBack={() => handleBackToPaso(2)}
          />
        )}

        {flowState.pasoActual === 4 && flowState.tipoSeleccionado && (
          <BonusDistribution
            empleados={flowState.empleados}
            tipoSeleccionado={flowState.tipoSeleccionado}
            onConfigsComplete={handleConfigsComplete}
            onBack={() => handleBackToPaso(3)}
            initialConfigML={flowState.configMeraLiberalidad}
            initialConfigAL={flowState.configAlimentacion}
          />
        )}

        {flowState.pasoActual === 5 && flowState.tipoSeleccionado && flowState.companyData && (
          <BonusSummary
            tipoSeleccionado={flowState.tipoSeleccionado}
            companyData={flowState.companyData}
            empleados={flowState.empleados}
            configMeraLiberalidad={flowState.configMeraLiberalidad}
            configAlimentacion={flowState.configAlimentacion}
            onBack={() => handleBackToPaso(4)}
            onConfirm={handleConfirmDispersion}
          />
        )}
      </main>

      <Footer />
    </div>
  )
}
