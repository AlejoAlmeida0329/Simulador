import { CompanyData, TikinCommission } from '@/types/company'
import { SavingsResult } from '@/types/scenarios'
import { formatCOP, formatPercentage } from '@/lib/formatters'
import { ARLRiskLevel, ARL_RATES } from '@/lib/constants/parafiscales'
import { saveQuotation } from '@/lib/supabase/quotations'
import { QuotationInsert } from '@/types/quotation'

interface QuotationData {
  companyData: CompanyData
  savingsData: SavingsResult
  tikinCommission: TikinCommission
  arlRiskLevel: ARLRiskLevel
  employeeCount: number
  totalPayroll: number
}

export async function generateQuotationPDF(data: QuotationData) {
  // @ts-ignore
  const pdfMake = (await import('pdfmake/build/pdfmake')).default
  // @ts-ignore
  const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default

  if (pdfFonts?.pdfMake?.vfs) {
    pdfMake.vfs = pdfFonts.pdfMake.vfs
  }

  const today = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const netMonthlySavings = data.savingsData.monthlySavings - data.tikinCommission.totalCost
  const netAnnualSavings = netMonthlySavings * 12

  // Número de propuesta único
  const proposalNumber = `${data.companyData.companyName.substring(0, 3).toUpperCase()}-${Date.now().toString().substring(8)}`
  const validUntil = new Date()
  validUntil.setMonth(validUntil.getMonth() + 1)
  const validUntilDate = validUntil.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' })

  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [0, 0, 0, 0],

    content: [
      // ============ PORTADA ============
      {
        stack: [
          // Fondo rojo completo
          {
            canvas: [
              {
                type: 'rect',
                x: 0,
                y: 0,
                w: 595,
                h: 842,
                color: '#E63946'
              }
            ],
            absolutePosition: { x: 0, y: 0 }
          },

          // Logo Tikin arriba izquierda
          {
            text: 'Tikin.',
            fontSize: 24,
            bold: true,
            color: '#FFFFFF',
            margin: [40, 40, 0, 0]
          },

          // Título principal centrado
          {
            text: 'CALCULADORA DE AHORROS EN\nPARAFISCALES',
            fontSize: 32,
            bold: true,
            color: '#FFFFFF',
            alignment: 'center',
            margin: [40, 280, 40, 0],
            lineHeight: 1.3
          },

          // Nombre de la empresa
          {
            text: data.companyData.companyName,
            fontSize: 18,
            color: '#FFFFFF',
            alignment: 'center',
            margin: [40, 30, 40, 0]
          },

          // Información del footer de portada
          {
            columns: [
              {
                width: '*',
                stack: [
                  { text: 'Propuesta No.', fontSize: 9, color: 'rgba(255,255,255,0.8)' },
                  { text: proposalNumber, fontSize: 11, bold: true, color: '#FFFFFF', margin: [0, 2, 0, 10] },
                  { text: 'Última modificación', fontSize: 9, color: 'rgba(255,255,255,0.8)' },
                  { text: today, fontSize: 10, color: '#FFFFFF', margin: [0, 2, 0, 10] },
                  { text: 'Oferta válida hasta', fontSize: 9, color: 'rgba(255,255,255,0.8)' },
                  { text: validUntilDate, fontSize: 10, color: '#FFFFFF', margin: [0, 2, 0, 0] }
                ]
              },
              {
                width: '*',
                stack: [
                  { text: 'Estado', fontSize: 9, color: 'rgba(255,255,255,0.8)' },
                  { text: 'Ready', fontSize: 11, bold: true, color: '#FFFFFF', margin: [0, 2, 0, 10] },
                  { text: 'Ciudad de', fontSize: 9, color: 'rgba(255,255,255,0.8)' },
                  { text: 'Bogotá, Colombia', fontSize: 10, color: '#FFFFFF', margin: [0, 2, 0, 0] }
                ]
              }
            ],
            absolutePosition: { x: 40, y: 720 }
          }
        ],
        pageBreak: 'after'
      },

      // ============ PÁGINA 2: CARTA DE PRESENTACIÓN ============
      {
        margin: [40, 40, 40, 40],
        stack: [
          // Logo
          {
            text: 'Tikin.',
            fontSize: 20,
            bold: true,
            color: '#1F2937',
            margin: [0, 0, 0, 30]
          },

          // Información de contacto Tikin (esquina superior derecha)
          {
            columns: [
              { width: '*', text: '' },
              {
                width: 'auto',
                stack: [
                  { text: 'Alejandro Almeida', fontSize: 10, color: '#6B7280' },
                  { text: 'Growth Manager', fontSize: 9, color: '#9CA3AF' },
                  { text: 'alejandro@tikin.co', fontSize: 9, color: '#E63946', margin: [0, 2, 0, 0] }
                ],
                alignment: 'right'
              }
            ],
            margin: [0, -50, 0, 0]
          },

          // Título
          {
            text: 'Estás a un paso de completarte',
            fontSize: 22,
            bold: true,
            color: '#1F2937',
            margin: [0, 40, 0, 5]
          },
          {
            text: 'Cotización',
            fontSize: 14,
            color: '#6B7280',
            margin: [0, 0, 0, 5]
          },
          {
            text: 'Calculadora de Ahorros en Parafiscales',
            fontSize: 16,
            bold: true,
            color: '#1F2937',
            margin: [0, 0, 0, 25]
          },

          // Carta personalizada
          {
            text: [
              { text: `Hola ${data.companyData.contactName},\n\n`, fontSize: 11, color: '#1F2937', bold: true },
              { text: `Mi nombre es Alejandro Almeida / Growth Manager de Tikin y es un gusto tener la oportunidad de presentar nuestra propuesta en respuesta a los requerimientos entregados, espero que sea de su agrado.\n\n`, fontSize: 10, color: '#4B5563' },
              { text: 'Quedas a tu disposición, para cualquier duda o aclaración puedes contactarme vía WhatsApp al número: ', fontSize: 10, color: '#4B5563' },
              { text: '+57 310 458 2460', fontSize: 10, color: '#E63946', bold: true },
              { text: ' y responderé a la brevedad posible.', fontSize: 10, color: '#4B5563' }
            ],
            margin: [0, 0, 0, 30],
            lineHeight: 1.5
          },

          // Firma
          {
            columns: [
              {
                width: 60,
                stack: [
                  {
                    canvas: [
                      {
                        type: 'ellipse',
                        x: 25,
                        y: 25,
                        r1: 25,
                        r2: 25,
                        color: '#E5E7EB'
                      }
                    ]
                  }
                ]
              },
              {
                width: '*',
                stack: [
                  { text: 'Head of Growth', fontSize: 9, color: '#6B7280', margin: [0, 10, 0, 2] },
                  { text: 'Alejandro Almeida', fontSize: 12, bold: true, color: '#1F2937' }
                ],
                margin: [10, 0, 0, 0]
              }
            ],
            margin: [0, 20, 0, 0]
          },

          // Aviso de privacidad
          {
            text: 'AVISO DE PRIVACIDAD: Usted recibe la siguiente oferta comercial por solicitud propia y de esta forma acepta nuestra política para el tratamiento de datos personales, de lo contrario es importante que reporte inmediatamente el incidente al siguiente correo electrónico: info@tikin.co',
            fontSize: 7,
            color: '#9CA3AF',
            margin: [0, 40, 0, 0],
            lineHeight: 1.3
          }
        ],
        pageBreak: 'after'
      },

      // ============ PÁGINA 3: BENEFICIOS QUE ENAMORAN ============
      {
        margin: [40, 40, 40, 40],
        stack: [
          // Logo
          {
            text: 'Tikin.',
            fontSize: 20,
            bold: true,
            color: '#1F2937',
            margin: [0, 0, 0, 20]
          },

          // Título de sección
          {
            text: 'BENEFICIOS QUE ENAMORAN',
            fontSize: 24,
            bold: true,
            color: '#FFFFFF',
            fillColor: '#1F2937',
            margin: [-40, 0, -40, 0],
            padding: [40, 15, 40, 15],
            alignment: 'center'
          },

          // Grid de beneficios (3x2)
          {
            margin: [0, 30, 0, 0],
            stack: [
              // Fila 1
              {
                columns: [
                  {
                    width: '33%',
                    stack: [
                      { text: '🔒', fontSize: 32, alignment: 'center', margin: [0, 0, 0, 10] },
                      { text: 'Plataforma segura', fontSize: 12, bold: true, color: '#1F2937', alignment: 'center', margin: [0, 0, 0, 5] },
                      { text: 'Implementamos tecnología de seguridad avanzada para mantener tu cuenta siempre protegida', fontSize: 9, color: '#6B7280', alignment: 'center', lineHeight: 1.4 }
                    ]
                  },
                  {
                    width: '33%',
                    stack: [
                      { text: '⚡', fontSize: 32, alignment: 'center', margin: [0, 0, 0, 10] },
                      { text: 'Procesos Ágiles', fontSize: 12, bold: true, color: '#1F2937', alignment: 'center', margin: [0, 0, 0, 5] },
                      { text: 'Olvídate de trámites extensos o innecesarios optimizando tu tiempo', fontSize: 9, color: '#6B7280', alignment: 'center', lineHeight: 1.4 }
                    ]
                  },
                  {
                    width: '33%',
                    stack: [
                      { text: '💡', fontSize: 32, alignment: 'center', margin: [0, 0, 0, 10] },
                      { text: 'Ahorros inteligentes', fontSize: 12, bold: true, color: '#1F2937', alignment: 'center', margin: [0, 0, 0, 5] },
                      { text: 'Encuentra ahorros y optimiza tus finanzas mientras mejoras la cultura de tu empresa', fontSize: 9, color: '#6B7280', alignment: 'center', lineHeight: 1.4 }
                    ]
                  }
                ]
              },

              // Fila 2
              {
                columns: [
                  {
                    width: '33%',
                    stack: [
                      { text: '🎯', fontSize: 32, alignment: 'center', margin: [0, 20, 0, 10] },
                      { text: 'Soporte personalizado', fontSize: 12, bold: true, color: '#1F2937', alignment: 'center', margin: [0, 0, 0, 5] },
                      { text: 'Estamos aquí para brindarte soporte personalizado, resolver tus dudas y acompañarte en cada paso del camino', fontSize: 9, color: '#6B7280', alignment: 'center', lineHeight: 1.4 }
                    ]
                  },
                  {
                    width: '33%',
                    stack: [
                      { text: '🔓', fontSize: 32, alignment: 'center', margin: [0, 20, 0, 10] },
                      { text: 'Sin permanencias', fontSize: 12, bold: true, color: '#1F2937', alignment: 'center', margin: [0, 0, 0, 5] },
                      { text: 'No tenemos mínimo de permanencia, con nuestros beneficios y facilidades seguro vas a querer quedarte', fontSize: 9, color: '#6B7280', alignment: 'center', lineHeight: 1.4 }
                    ]
                  },
                  {
                    width: '33%',
                    stack: [
                      { text: '📊', fontSize: 32, alignment: 'center', margin: [0, 20, 0, 10] },
                      { text: 'Pricing transparente', fontSize: 12, bold: true, color: '#1F2937', alignment: 'center', margin: [0, 0, 0, 5] },
                      { text: 'Soluciones diseñadas a tu medida como las necesitas', fontSize: 9, color: '#6B7280', alignment: 'center', lineHeight: 1.4 }
                    ]
                  }
                ]
              }
            ]
          }
        ],
        pageBreak: 'after'
      },

      // ============ PÁGINA 4: ANÁLISIS Y COSTOS ============
      {
        margin: [40, 40, 40, 40],
        stack: [
          // Logo
          {
            text: 'Tikin.',
            fontSize: 20,
            bold: true,
            color: '#1F2937',
            margin: [0, 0, 0, 20]
          },

          // Título de sección
          {
            text: 'ANÁLISIS DE PARAFISCALES',
            fontSize: 22,
            bold: true,
            color: '#FFFFFF',
            fillColor: '#1F2937',
            margin: [-40, 0, -40, 0],
            padding: [40, 12, 40, 12],
            alignment: 'center'
          },

          // Resumen ejecutivo
          {
            margin: [0, 25, 0, 0],
            columns: [
              {
                width: '50%',
                stack: [
                  {
                    canvas: [
                      {
                        type: 'rect',
                        x: 0,
                        y: 0,
                        w: 240,
                        h: 90,
                        color: '#FEF2F2',
                        r: 6
                      }
                    ]
                  },
                  {
                    margin: [20, -75, 20, 0],
                    stack: [
                      { text: 'EMPRESA', fontSize: 9, color: '#9CA3AF', margin: [0, 0, 0, 4] },
                      { text: data.companyData.companyName, fontSize: 14, bold: true, color: '#E63946', margin: [0, 0, 0, 10] },
                      { text: 'Total Empleados', fontSize: 9, color: '#6B7280', margin: [0, 0, 0, 3] },
                      { text: data.employeeCount.toString(), fontSize: 16, bold: true, color: '#1F2937' }
                    ]
                  }
                ]
              },
              {
                width: '50%',
                stack: [
                  {
                    canvas: [
                      {
                        type: 'rect',
                        x: 15,
                        y: 0,
                        w: 240,
                        h: 90,
                        color: '#F3F4F6',
                        r: 6
                      }
                    ]
                  },
                  {
                    margin: [35, -75, 20, 0],
                    stack: [
                      { text: 'NÓMINA MENSUAL', fontSize: 9, color: '#9CA3AF', margin: [0, 0, 0, 4] },
                      { text: formatCOP(data.totalPayroll), fontSize: 14, bold: true, color: '#1F2937', margin: [0, 0, 0, 10] },
                      { text: 'Configuración', fontSize: 9, color: '#6B7280', margin: [0, 0, 0, 3] },
                      { text: `${data.savingsData.tikin.salaryPercentage}% Salario + ${data.savingsData.tikin.bonusPercentage}% Bono`, fontSize: 11, bold: true, color: '#1F2937' }
                    ]
                  }
                ]
              }
            ]
          },

          // Tabla comparativa
          {
            margin: [0, 25, 0, 0],
            table: {
              widths: ['40%', '30%', '30%'],
              headerRows: 1,
              body: [
                [
                  { text: 'Concepto', fontSize: 10, bold: true, color: '#FFFFFF', fillColor: '#1F2937', border: [false, false, false, false] },
                  { text: 'Tradicional (100%)', fontSize: 10, bold: true, color: '#FFFFFF', fillColor: '#6B7280', alignment: 'right', border: [false, false, false, false] },
                  { text: 'Con Tikin', fontSize: 10, bold: true, color: '#FFFFFF', fillColor: '#E63946', alignment: 'right', border: [false, false, false, false] }
                ],
                [
                  { text: 'Salud (8.5%)', fontSize: 9, color: '#4B5563', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
                  { text: formatCOP(data.savingsData.traditional.parafiscales.health), fontSize: 9, alignment: 'right', color: '#1F2937', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
                  { text: formatCOP(data.savingsData.tikin.parafiscales.health), fontSize: 9, alignment: 'right', color: '#1F2937', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] }
                ],
                [
                  { text: 'Pensión (12%)', fontSize: 9, color: '#4B5563', fillColor: '#F9FAFB', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
                  { text: formatCOP(data.savingsData.traditional.parafiscales.pension), fontSize: 9, alignment: 'right', color: '#1F2937', fillColor: '#F9FAFB', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
                  { text: formatCOP(data.savingsData.tikin.parafiscales.pension), fontSize: 9, alignment: 'right', color: '#1F2937', fillColor: '#F9FAFB', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] }
                ],
                [
                  { text: `ARL (${formatPercentage(ARL_RATES[data.arlRiskLevel] * 100)} - Clase ${data.arlRiskLevel})`, fontSize: 9, color: '#4B5563', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
                  { text: formatCOP(data.savingsData.traditional.parafiscales.arl), fontSize: 9, alignment: 'right', color: '#1F2937', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
                  { text: formatCOP(data.savingsData.tikin.parafiscales.arl), fontSize: 9, alignment: 'right', color: '#1F2937', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] }
                ],
                [
                  { text: 'SENA (2%)', fontSize: 9, color: '#4B5563', fillColor: '#F9FAFB', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
                  { text: formatCOP(data.savingsData.traditional.parafiscales.sena), fontSize: 9, alignment: 'right', color: '#1F2937', fillColor: '#F9FAFB', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
                  { text: formatCOP(data.savingsData.tikin.parafiscales.sena), fontSize: 9, alignment: 'right', color: '#1F2937', fillColor: '#F9FAFB', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] }
                ],
                [
                  { text: 'ICBF (3%)', fontSize: 9, color: '#4B5563', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
                  { text: formatCOP(data.savingsData.traditional.parafiscales.icbf), fontSize: 9, alignment: 'right', color: '#1F2937', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
                  { text: formatCOP(data.savingsData.tikin.parafiscales.icbf), fontSize: 9, alignment: 'right', color: '#1F2937', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] }
                ],
                [
                  { text: 'Caja Compensación (4%)', fontSize: 9, color: '#4B5563', fillColor: '#F9FAFB', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
                  { text: formatCOP(data.savingsData.traditional.parafiscales.caja), fontSize: 9, alignment: 'right', color: '#1F2937', fillColor: '#F9FAFB', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
                  { text: formatCOP(data.savingsData.tikin.parafiscales.caja), fontSize: 9, alignment: 'right', color: '#1F2937', fillColor: '#F9FAFB', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] }
                ],
                [
                  { text: 'TOTAL MENSUAL', fontSize: 11, bold: true, color: '#1F2937', fillColor: '#E5E7EB', border: [false, false, false, false] },
                  { text: formatCOP(data.savingsData.traditional.parafiscales.total), fontSize: 11, bold: true, alignment: 'right', color: '#1F2937', fillColor: '#E5E7EB', border: [false, false, false, false] },
                  { text: formatCOP(data.savingsData.tikin.parafiscales.total), fontSize: 11, bold: true, alignment: 'right', color: '#E63946', fillColor: '#FEF2F2', border: [false, false, false, false] }
                ]
              ]
            },
            layout: {
              paddingLeft: () => 10,
              paddingRight: () => 10,
              paddingTop: () => 8,
              paddingBottom: () => 8
            }
          },

          // Ahorro destacado
          {
            margin: [0, 20, 0, 0],
            stack: [
              {
                canvas: [
                  {
                    type: 'rect',
                    x: 0,
                    y: 0,
                    w: 515,
                    h: 70,
                    color: '#DCFCE7',
                    r: 6
                  }
                ]
              },
              {
                margin: [20, -55, 20, 0],
                columns: [
                  {
                    width: '*',
                    stack: [
                      { text: 'AHORRO MENSUAL CON TIKIN', fontSize: 12, bold: true, color: '#059669', margin: [0, 0, 0, 5] },
                      { text: formatCOP(data.savingsData.monthlySavings), fontSize: 22, bold: true, color: '#059669' }
                    ]
                  },
                  {
                    width: 'auto',
                    stack: [
                      { text: 'Reducción', fontSize: 10, color: '#6B7280', alignment: 'right', margin: [0, 0, 0, 3] },
                      { text: formatPercentage(data.savingsData.percentageReduction), fontSize: 18, bold: true, color: '#059669', alignment: 'right' }
                    ]
                  }
                ]
              }
            ]
          }
        ],
        pageBreak: 'after'
      },

      // ============ PÁGINA 5: COSTOS DEL SERVICIO ============
      {
        margin: [40, 40, 40, 40],
        stack: [
          // Logo
          {
            text: 'Tikin.',
            fontSize: 20,
            bold: true,
            color: '#1F2937',
            margin: [0, 0, 0, 20]
          },

          // Título de sección
          {
            text: 'COSTOS DEL SERVICIO',
            fontSize: 22,
            bold: true,
            color: '#FFFFFF',
            fillColor: '#1F2937',
            margin: [-40, 0, -40, 0],
            padding: [40, 12, 40, 12],
            alignment: 'center'
          },

          // Descripción
          {
            text: 'Pricing simple y transparente',
            fontSize: 11,
            color: '#6B7280',
            margin: [0, 20, 0, 20],
            alignment: 'center'
          },

          // Tabla de comisión Tikin
          {
            table: {
              widths: ['60%', '40%'],
              body: [
                [
                  { text: 'CONCEPTO', fontSize: 9, bold: true, color: '#FFFFFF', fillColor: '#E63946', border: [false, false, false, false] },
                  { text: 'MONTO', fontSize: 9, bold: true, color: '#FFFFFF', fillColor: '#E63946', alignment: 'right', border: [false, false, false, false] }
                ],
                [
                  { text: `Comisión Tikin (Nivel ${data.tikinCommission.level} - ${data.tikinCommission.percentage}%)`, fontSize: 10, color: '#4B5563', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
                  { text: formatCOP(data.tikinCommission.monthlyBonusTotal), fontSize: 9, color: '#9CA3AF', alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] }
                ],
                [
                  { text: 'Base mensual', fontSize: 10, color: '#4B5563', fillColor: '#F9FAFB', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
                  { text: formatCOP(data.tikinCommission.baseCommission), fontSize: 10, color: '#1F2937', fillColor: '#F9FAFB', alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] }
                ],
                [
                  { text: 'IVA (19%)', fontSize: 10, color: '#4B5563', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
                  { text: formatCOP(data.tikinCommission.iva), fontSize: 10, color: '#1F2937', alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] }
                ],
                [
                  { text: 'TOTAL MENSUAL', fontSize: 12, bold: true, color: '#E63946', fillColor: '#FEF2F2', border: [false, false, false, false] },
                  { text: formatCOP(data.tikinCommission.totalCost), fontSize: 13, bold: true, color: '#E63946', fillColor: '#FEF2F2', alignment: 'right', border: [false, false, false, false] }
                ]
              ]
            },
            layout: {
              paddingLeft: () => 15,
              paddingRight: () => 15,
              paddingTop: () => 10,
              paddingBottom: () => 10
            }
          },

          // Beneficio neto
          {
            margin: [0, 25, 0, 0],
            stack: [
              {
                canvas: [
                  {
                    type: 'rect',
                    x: 0,
                    y: 0,
                    w: 515,
                    h: 85,
                    color: '#D1FAE5',
                    r: 6
                  }
                ]
              },
              {
                margin: [20, -70, 20, 0],
                stack: [
                  { text: 'BENEFICIO NETO PARA TU EMPRESA', fontSize: 13, bold: true, color: '#059669', margin: [0, 0, 0, 10], alignment: 'center' },
                  {
                    columns: [
                      {
                        width: '50%',
                        stack: [
                          { text: 'Ahorro Mensual Neto', fontSize: 10, color: '#6B7280', margin: [0, 0, 0, 4], alignment: 'center' },
                          { text: formatCOP(netMonthlySavings), fontSize: 18, bold: true, color: '#059669', alignment: 'center' }
                        ]
                      },
                      {
                        width: '50%',
                        stack: [
                          { text: 'Ahorro Anual Neto', fontSize: 10, color: '#6B7280', margin: [0, 0, 0, 4], alignment: 'center' },
                          { text: formatCOP(netAnnualSavings), fontSize: 18, bold: true, color: '#059669', alignment: 'center' }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },

          // Información adicional
          {
            margin: [0, 25, 0, 0],
            stack: [
              { text: 'Información importante:', fontSize: 10, bold: true, color: '#1F2937', margin: [0, 0, 0, 8] },
              { text: '• No tenemos mínimo de permanencia', fontSize: 9, color: '#4B5563', margin: [0, 0, 0, 4] },
              { text: '• Soporte personalizado incluido', fontSize: 9, color: '#4B5563', margin: [0, 0, 0, 4] },
              { text: '• Plataforma 100% segura y confiable', fontSize: 9, color: '#4B5563', margin: [0, 0, 0, 4] },
              { text: '• Proceso de implementación ágil', fontSize: 9, color: '#4B5563' }
            ]
          }
        ],
        pageBreak: 'after'
      },

      // ============ PÁGINA 6: APROBACIÓN ============
      {
        margin: [40, 40, 40, 40],
        stack: [
          // Logo
          {
            text: 'Tikin.',
            fontSize: 20,
            bold: true,
            color: '#1F2937',
            margin: [0, 0, 0, 30]
          },

          // Título
          {
            text: 'APROBACIÓN',
            fontSize: 24,
            bold: true,
            color: '#1F2937',
            margin: [0, 0, 0, 20]
          },

          // Texto de aprobación
          {
            text: [
              { text: 'Esta propuesta puede ser aprobada instantáneamente añadiendo firma electrónica.\n\n', fontSize: 10, color: '#4B5563' },
              { text: 'Registrando tu firma aceptas los términos y condiciones de este documento, el uso de la firma electrónica equivale a una firma en documento físico con pluma y papel.', fontSize: 10, color: '#4B5563' }
            ],
            lineHeight: 1.5,
            margin: [0, 0, 0, 30]
          },

          // Espacio para firma
          {
            canvas: [
              {
                type: 'rect',
                x: 0,
                y: 0,
                w: 515,
                h: 100,
                color: '#F9FAFB',
                r: 6
              }
            ]
          },
          {
            margin: [20, -85, 20, 0],
            stack: [
              { text: 'Firma del representante legal', fontSize: 10, color: '#9CA3AF', margin: [0, 0, 0, 50] },
              {
                canvas: [
                  {
                    type: 'line',
                    x1: 0,
                    y1: 0,
                    x2: 200,
                    y2: 0,
                    lineWidth: 1,
                    lineColor: '#D1D5DB'
                  }
                ]
              }
            ]
          },

          // Consideraciones
          {
            margin: [0, 40, 0, 0],
            stack: [
              { text: 'Consideraciones:', fontSize: 11, bold: true, color: '#1F2937', margin: [0, 0, 0, 10] },

              { text: 'Esta propuesta ha sido desarrollada por Tikin y se mantendrá bajo su propiedad hasta el momento en que una aceptación formal se perfeccione, de esta forma, sus contenidos no podrán ser revelados a ningún tercero, así como tampoco los conceptos originales desarrollados para Tikin podrán ser utilizados con fines comerciales.', fontSize: 8, color: '#6B7280', lineHeight: 1.4, margin: [0, 0, 0, 8] },

              { text: 'Tikin cree en la sostenibilidad, por esta razón presentamos propuestas electrónicas en pro del medio ambiente, antes de imprimir este documento, considere si es realmente necesario.', fontSize: 8, color: '#6B7280', lineHeight: 1.4, margin: [0, 0, 0, 15] },

              { text: 'Copyright Tikin ®2025', fontSize: 8, bold: true, color: '#E63946', alignment: 'center' }
            ]
          },

          // Badges finales
          {
            margin: [0, 25, 0, 0],
            columns: [
              { text: 'Confiable', fontSize: 10, bold: true, color: '#4B5563', alignment: 'center' },
              { text: 'Seguro', fontSize: 10, bold: true, color: '#4B5563', alignment: 'center' },
              { text: 'Eficiente', fontSize: 10, bold: true, color: '#4B5563', alignment: 'center' },
              { text: 'Disruptivo', fontSize: 10, bold: true, color: '#4B5563', alignment: 'center' }
            ]
          }
        ]
      }
    ],

    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
      color: '#1F2937'
    }
  }

  const filename = `Cotizacion_Tikin_${data.companyData.companyName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`

  // Guardar cotización en Supabase
  const quotationRecord: QuotationInsert = {
    company_name: data.companyData.companyName,
    contact_name: data.companyData.contactName,
    email: data.companyData.email,
    phone: data.companyData.phone,
    nit: data.companyData.nit,
    employee_count: data.employeeCount,
    total_payroll: data.totalPayroll,
    arl_risk_level: data.arlRiskLevel,
    salary_percentage: data.savingsData.tikin.salaryPercentage,
    bonus_percentage: data.savingsData.tikin.bonusPercentage,
    monthly_bonus_total: data.savingsData.tikin.totalBonusAmount,
    monthly_savings: data.savingsData.monthlySavings,
    annual_savings: data.savingsData.monthlySavings * 12,
    percentage_reduction: data.savingsData.percentageReduction,
    commission_level: data.tikinCommission.level,
    commission_percentage: data.tikinCommission.percentage,
    base_commission: data.tikinCommission.baseCommission,
    iva: data.tikinCommission.iva,
    total_commission: data.tikinCommission.totalCost,
    net_monthly_savings: netMonthlySavings,
    net_annual_savings: netAnnualSavings,
    pdf_filename: filename,
  }

  // Intentar guardar en DB (no bloquea la descarga del PDF si falla)
  const saveResult = await saveQuotation(quotationRecord)

  if (saveResult.success) {
    console.log('✅ Cotización guardada en Supabase')
  } else {
    console.warn('⚠️ No se pudo guardar en Supabase:', saveResult.error)
  }

  // Generar y descargar PDF
  pdfMake.createPdf(docDefinition).download(filename)

  return saveResult
}
