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
          // Fondo rojo con gradiente (simulado con rectángulos superpuestos)
          {
            canvas: [
              {
                type: 'rect',
                x: 0,
                y: 0,
                w: 595,
                h: 842,
                color: '#E63946'
              },
              // Efecto de gradiente oscuro en la parte superior
              {
                type: 'rect',
                x: 0,
                y: 0,
                w: 595,
                h: 200,
                color: 'rgba(220, 38, 38, 0.3)'
              },
              // Patrones geométricos decorativos
              {
                type: 'ellipse',
                x: 500,
                y: 100,
                r1: 120,
                r2: 120,
                color: 'rgba(255, 255, 255, 0.05)'
              },
              {
                type: 'ellipse',
                x: 100,
                y: 700,
                r1: 80,
                r2: 80,
                color: 'rgba(255, 255, 255, 0.05)'
              },
              {
                type: 'rect',
                x: 400,
                y: 600,
                w: 150,
                h: 150,
                color: 'rgba(255, 255, 255, 0.03)',
                r: 20
              }
            ],
            absolutePosition: { x: 0, y: 0 }
          },

          // Logo Tikin arriba izquierda con badge
          {
            columns: [
              {
                width: 'auto',
                text: 'Tikin.',
                fontSize: 24,
                bold: true,
                color: '#FFFFFF'
              },
              {
                width: 'auto',
                canvas: [
                  { type: 'rect', x: 10, y: 3, w: 50, h: 18, color: 'rgba(255, 255, 255, 0.2)', r: 9 }
                ],
                margin: [0, 0, 0, 0]
              },
              {
                width: 'auto',
                text: 'PREMIUM',
                fontSize: 8,
                bold: true,
                color: '#FFFFFF',
                margin: [12, 7, 0, 0]
              }
            ],
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

          // Badge de ahorro destacado
          {
            margin: [40, 25, 40, 0],
            stack: [
              {
                canvas: [
                  { type: 'rect', x: 150, y: 0, w: 295, h: 55, color: 'rgba(255, 255, 255, 0.15)', r: 27.5 }
                ]
              },
              {
                margin: [165, -43, 165, 0],
                stack: [
                  { text: 'AHORRO ANUAL ESTIMADO', fontSize: 9, color: 'rgba(255, 255, 255, 0.9)', alignment: 'center', margin: [0, 0, 0, 5] },
                  { text: formatCOP(netAnnualSavings), fontSize: 18, bold: true, color: '#FFFFFF', alignment: 'center' }
                ]
              }
            ]
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
            margin: [0, 0, 0, 25],
            lineHeight: 1.5
          },

          // Timeline del proceso
          {
            margin: [0, 0, 0, 20],
            stack: [
              { text: 'Nuestro proceso de implementación', fontSize: 10, bold: true, color: '#1F2937', margin: [0, 0, 0, 15] },

              // 4 pasos en timeline horizontal
              {
                columns: [
                  {
                    width: '25%',
                    stack: [
                      {
                        canvas: [
                          { type: 'ellipse', x: 15, y: 15, r1: 15, r2: 15, color: '#E63946' }
                        ]
                      },
                      { text: '1', fontSize: 11, bold: true, color: '#FFFFFF', alignment: 'center', margin: [0, -22, 0, 0] },
                      { text: 'Análisis', fontSize: 9, bold: true, color: '#1F2937', alignment: 'center', margin: [0, 10, 0, 3] },
                      { text: '1 día', fontSize: 7, color: '#6B7280', alignment: 'center' }
                    ]
                  },
                  {
                    width: '25%',
                    stack: [
                      {
                        canvas: [
                          { type: 'ellipse', x: 15, y: 15, r1: 15, r2: 15, color: '#059669' }
                        ]
                      },
                      { text: '2', fontSize: 11, bold: true, color: '#FFFFFF', alignment: 'center', margin: [0, -22, 0, 0] },
                      { text: 'Configuración', fontSize: 9, bold: true, color: '#1F2937', alignment: 'center', margin: [0, 10, 0, 3] },
                      { text: '2-3 días', fontSize: 7, color: '#6B7280', alignment: 'center' }
                    ]
                  },
                  {
                    width: '25%',
                    stack: [
                      {
                        canvas: [
                          { type: 'ellipse', x: 15, y: 15, r1: 15, r2: 15, color: '#2563EB' }
                        ]
                      },
                      { text: '3', fontSize: 11, bold: true, color: '#FFFFFF', alignment: 'center', margin: [0, -22, 0, 0] },
                      { text: 'Activación', fontSize: 9, bold: true, color: '#1F2937', alignment: 'center', margin: [0, 10, 0, 3] },
                      { text: '1 día', fontSize: 7, color: '#6B7280', alignment: 'center' }
                    ]
                  },
                  {
                    width: '25%',
                    stack: [
                      {
                        canvas: [
                          { type: 'ellipse', x: 15, y: 15, r1: 15, r2: 15, color: '#7C3AED' }
                        ]
                      },
                      { text: '4', fontSize: 11, bold: true, color: '#FFFFFF', alignment: 'center', margin: [0, -22, 0, 0] },
                      { text: 'Ahorro', fontSize: 9, bold: true, color: '#1F2937', alignment: 'center', margin: [0, 10, 0, 3] },
                      { text: 'Inmediato', fontSize: 7, color: '#6B7280', alignment: 'center' }
                    ]
                  }
                ]
              }
            ]
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
          },

          // Sección de social proof (métricas de confianza)
          {
            margin: [0, 40, 0, 0],
            stack: [
              {
                text: 'Empresas que ya confían en Tikin',
                fontSize: 12,
                bold: true,
                color: '#1F2937',
                alignment: 'center',
                margin: [0, 0, 0, 20]
              },

              // Métricas en badges
              {
                columns: [
                  {
                    width: '33%',
                    stack: [
                      {
                        canvas: [
                          {
                            type: 'rect',
                            x: 10,
                            y: 0,
                            w: 150,
                            h: 65,
                            color: '#FEF2F2',
                            r: 6
                          }
                        ]
                      },
                      {
                        margin: [20, -50, 10, 0],
                        stack: [
                          { text: '500+', fontSize: 24, bold: true, color: '#E63946', alignment: 'center', margin: [0, 0, 0, 4] },
                          { text: 'Empresas activas', fontSize: 9, color: '#6B7280', alignment: 'center' }
                        ]
                      }
                    ]
                  },
                  {
                    width: '33%',
                    stack: [
                      {
                        canvas: [
                          {
                            type: 'rect',
                            x: 10,
                            y: 0,
                            w: 150,
                            h: 65,
                            color: '#DCFCE7',
                            r: 6
                          }
                        ]
                      },
                      {
                        margin: [20, -50, 10, 0],
                        stack: [
                          { text: '$5B+', fontSize: 24, bold: true, color: '#059669', alignment: 'center', margin: [0, 0, 0, 4] },
                          { text: 'Ahorros generados', fontSize: 9, color: '#6B7280', alignment: 'center' }
                        ]
                      }
                    ]
                  },
                  {
                    width: '33%',
                    stack: [
                      {
                        canvas: [
                          {
                            type: 'rect',
                            x: 10,
                            y: 0,
                            w: 150,
                            h: 65,
                            color: '#EFF6FF',
                            r: 6
                          }
                        ]
                      },
                      {
                        margin: [20, -50, 10, 0],
                        stack: [
                          { text: '98%', fontSize: 24, bold: true, color: '#2563EB', alignment: 'center', margin: [0, 0, 0, 4] },
                          { text: 'Satisfacción', fontSize: 9, color: '#6B7280', alignment: 'center' }
                        ]
                      }
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

          // Gráfico de dona: distribución de parafiscales
          {
            margin: [0, 25, 0, 0],
            columns: [
              {
                width: '60%',
                stack: [
                  { text: 'Distribución de Parafiscales', fontSize: 11, bold: true, color: '#1F2937', margin: [0, 0, 0, 10] },
                  {
                    stack: [
                      { text: 'Pensión', fontSize: 8, color: '#6B7280', margin: [0, 5, 0, 2] },
                      {
                        canvas: [
                          { type: 'rect', x: 0, y: 0, w: 10, h: 10, color: '#E63946' }
                        ],
                        margin: [0, 0, 0, -12]
                      },
                      { text: ' 12.0% - ' + formatCOP(data.savingsData.traditional.parafiscales.pension), fontSize: 8, color: '#1F2937', margin: [15, -10, 0, 0] }
                    ]
                  },
                  {
                    stack: [
                      { text: 'Salud', fontSize: 8, color: '#6B7280', margin: [0, 8, 0, 2] },
                      {
                        canvas: [
                          { type: 'rect', x: 0, y: 0, w: 10, h: 10, color: '#2563EB' }
                        ],
                        margin: [0, 0, 0, -12]
                      },
                      { text: ' 8.5% - ' + formatCOP(data.savingsData.traditional.parafiscales.health), fontSize: 8, color: '#1F2937', margin: [15, -10, 0, 0] }
                    ]
                  },
                  {
                    stack: [
                      { text: 'Caja', fontSize: 8, color: '#6B7280', margin: [0, 8, 0, 2] },
                      {
                        canvas: [
                          { type: 'rect', x: 0, y: 0, w: 10, h: 10, color: '#059669' }
                        ],
                        margin: [0, 0, 0, -12]
                      },
                      { text: ' 4.0% - ' + formatCOP(data.savingsData.traditional.parafiscales.caja), fontSize: 8, color: '#1F2937', margin: [15, -10, 0, 0] }
                    ]
                  },
                  {
                    stack: [
                      { text: 'ICBF', fontSize: 8, color: '#6B7280', margin: [0, 8, 0, 2] },
                      {
                        canvas: [
                          { type: 'rect', x: 0, y: 0, w: 10, h: 10, color: '#F59E0B' }
                        ],
                        margin: [0, 0, 0, -12]
                      },
                      { text: ' 3.0% - ' + formatCOP(data.savingsData.traditional.parafiscales.icbf), fontSize: 8, color: '#1F2937', margin: [15, -10, 0, 0] }
                    ]
                  },
                  {
                    stack: [
                      { text: 'SENA', fontSize: 8, color: '#6B7280', margin: [0, 8, 0, 2] },
                      {
                        canvas: [
                          { type: 'rect', x: 0, y: 0, w: 10, h: 10, color: '#7C3AED' }
                        ],
                        margin: [0, 0, 0, -12]
                      },
                      { text: ' 2.0% - ' + formatCOP(data.savingsData.traditional.parafiscales.sena), fontSize: 8, color: '#1F2937', margin: [15, -10, 0, 0] }
                    ]
                  },
                  {
                    stack: [
                      { text: 'ARL', fontSize: 8, color: '#6B7280', margin: [0, 8, 0, 2] },
                      {
                        canvas: [
                          { type: 'rect', x: 0, y: 0, w: 10, h: 10, color: '#EC4899' }
                        ],
                        margin: [0, 0, 0, -12]
                      },
                      { text: ' ' + formatPercentage(ARL_RATES[data.arlRiskLevel] * 100) + ' - ' + formatCOP(data.savingsData.traditional.parafiscales.arl), fontSize: 8, color: '#1F2937', margin: [15, -10, 0, 0] }
                    ]
                  }
                ]
              },
              {
                width: '40%',
                stack: [
                  {
                    canvas: [
                      // Círculo exterior (fondo)
                      { type: 'ellipse', x: 80, y: 80, r1: 70, r2: 70, color: '#F3F4F6' },
                      // Círculo interior (dona)
                      { type: 'ellipse', x: 80, y: 80, r1: 45, r2: 45, color: '#FFFFFF' },
                      // Segmentos de colores (simulando un donut chart simplificado)
                      // Pensión (12% = 43.2°) - Rojo
                      { type: 'ellipse', x: 80, y: 80, r1: 70, r2: 70, color: '#E63946', lineWidth: 25 },
                      // Nota: En un PDF real, esto es una simplificación visual
                      // Los arcs completos requerirían más canvas API complexity
                    ],
                    margin: [0, 0, 0, 0]
                  },
                  {
                    text: formatPercentage((data.savingsData.traditional.parafiscales.total / data.totalPayroll) * 100),
                    fontSize: 16,
                    bold: true,
                    color: '#1F2937',
                    alignment: 'center',
                    margin: [0, -88, 0, 0]
                  },
                  {
                    text: 'Total parafiscales',
                    fontSize: 7,
                    color: '#6B7280',
                    alignment: 'center',
                    margin: [0, 2, 0, 0]
                  }
                ]
              }
            ]
          },

          // Gráfico de barras comparativo
          {
            margin: [0, 25, 0, 0],
            stack: [
              { text: 'Comparación Visual de Costos Mensuales', fontSize: 11, bold: true, color: '#1F2937', margin: [0, 0, 0, 15] },

              // Barra Tradicional
              {
                margin: [0, 0, 0, 12],
                stack: [
                  { text: 'Tradicional (100%)', fontSize: 9, color: '#6B7280', margin: [0, 0, 0, 5] },
                  {
                    canvas: [
                      {
                        type: 'rect',
                        x: 0,
                        y: 0,
                        w: 515, // Barra completa (100%)
                        h: 32,
                        color: '#6B7280',
                        r: 4
                      }
                    ]
                  },
                  {
                    text: formatCOP(data.savingsData.traditional.parafiscales.total),
                    fontSize: 11,
                    bold: true,
                    color: '#FFFFFF',
                    margin: [10, -23, 0, 0]
                  }
                ]
              },

              // Barra Tikin
              {
                margin: [0, 0, 0, 5],
                stack: [
                  { text: 'Con Tikin', fontSize: 9, color: '#E63946', margin: [0, 0, 0, 5] },
                  {
                    canvas: [
                      {
                        type: 'rect',
                        x: 0,
                        y: 0,
                        w: 515 * (data.savingsData.tikin.parafiscales.total / data.savingsData.traditional.parafiscales.total), // Proporcional
                        h: 32,
                        color: '#E63946',
                        r: 4
                      }
                    ]
                  },
                  {
                    text: formatCOP(data.savingsData.tikin.parafiscales.total),
                    fontSize: 11,
                    bold: true,
                    color: '#FFFFFF',
                    margin: [10, -23, 0, 0]
                  }
                ]
              }
            ]
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

          // Proyección de ahorros 12 meses
          {
            margin: [0, 25, 0, 0],
            stack: [
              { text: 'Proyección de Ahorros Acumulados (12 meses)', fontSize: 11, bold: true, color: '#1F2937', margin: [0, 0, 0, 15] },

              // Gráfico de línea simplificado (puntos clave)
              {
                canvas: [
                  // Línea ascendente de acumulación
                  { type: 'line', x1: 0, y1: 80, x2: 85, y2: 68, lineWidth: 2, lineColor: '#059669' },
                  { type: 'line', x1: 85, y1: 68, x2: 170, y2: 56, lineWidth: 2, lineColor: '#059669' },
                  { type: 'line', x1: 170, y1: 56, x2: 255, y2: 44, lineWidth: 2, lineColor: '#059669' },
                  { type: 'line', x1: 255, y1: 44, x2: 340, y2: 32, lineWidth: 2, lineColor: '#059669' },
                  { type: 'line', x1: 340, y1: 32, x2: 425, y2: 20, lineWidth: 2, lineColor: '#059669' },
                  { type: 'line', x1: 425, y1: 20, x2: 515, y2: 8, lineWidth: 2, lineColor: '#059669' },

                  // Puntos en la línea
                  { type: 'ellipse', x: 0, y: 80, r1: 4, r2: 4, color: '#059669' },
                  { type: 'ellipse', x: 85, y: 68, r1: 4, r2: 4, color: '#059669' },
                  { type: 'ellipse', x: 170, y: 56, r1: 4, r2: 4, color: '#059669' },
                  { type: 'ellipse', x: 255, y: 44, r1: 4, r2: 4, color: '#059669' },
                  { type: 'ellipse', x: 340, y: 32, r1: 4, r2: 4, color: '#059669' },
                  { type: 'ellipse', x: 425, y: 20, r1: 4, r2: 4, color: '#059669' },
                  { type: 'ellipse', x: 515, y: 8, r1: 4, r2: 4, color: '#059669' }
                ]
              },

              // Etiquetas de meses
              {
                margin: [0, 5, 0, 0],
                columns: [
                  { width: '14.28%', text: 'Mes 1', fontSize: 7, color: '#9CA3AF', alignment: 'left' },
                  { width: '14.28%', text: 'Mes 3', fontSize: 7, color: '#9CA3AF', alignment: 'center' },
                  { width: '14.28%', text: 'Mes 5', fontSize: 7, color: '#9CA3AF', alignment: 'center' },
                  { width: '14.28%', text: 'Mes 7', fontSize: 7, color: '#9CA3AF', alignment: 'center' },
                  { width: '14.28%', text: 'Mes 9', fontSize: 7, color: '#9CA3AF', alignment: 'center' },
                  { width: '14.28%', text: 'Mes 11', fontSize: 7, color: '#9CA3AF', alignment: 'center' },
                  { width: '14.28%', text: 'Año 1', fontSize: 7, color: '#059669', alignment: 'right', bold: true }
                ]
              },

              // Milestone markers
              {
                margin: [0, 10, 0, 0],
                columns: [
                  {
                    width: '50%',
                    stack: [
                      {
                        canvas: [
                          { type: 'rect', x: 0, y: 0, w: 240, h: 35, color: '#F0FDF4', r: 4 }
                        ]
                      },
                      {
                        margin: [10, -28, 10, 0],
                        stack: [
                          { text: 'Mes 6', fontSize: 8, color: '#6B7280', margin: [0, 0, 0, 2] },
                          { text: formatCOP(netMonthlySavings * 6), fontSize: 12, bold: true, color: '#059669' }
                        ]
                      }
                    ]
                  },
                  { width: 15, text: '' },
                  {
                    width: '*',
                    stack: [
                      {
                        canvas: [
                          { type: 'rect', x: 0, y: 0, w: 240, h: 35, color: '#DCFCE7', r: 4 }
                        ]
                      },
                      {
                        margin: [10, -28, 10, 0],
                        stack: [
                          { text: 'Año completo', fontSize: 8, color: '#6B7280', margin: [0, 0, 0, 2] },
                          { text: formatCOP(netAnnualSavings), fontSize: 12, bold: true, color: '#059669' }
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
            margin: [0, 20, 0, 0],
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

      // ============ PÁGINA 7: ROI Y VALOR ============
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
            text: 'EL VALOR DE DECIDIR HOY',
            fontSize: 22,
            bold: true,
            color: '#FFFFFF',
            fillColor: '#1F2937',
            margin: [-40, 0, -40, 0],
            padding: [40, 12, 40, 12],
            alignment: 'center'
          },

          // ROI Calculator visual
          {
            margin: [0, 25, 0, 0],
            stack: [
              { text: 'Retorno de Inversión (ROI)', fontSize: 12, bold: true, color: '#1F2937', margin: [0, 0, 0, 15] },

              {
                columns: [
                  {
                    width: '48%',
                    stack: [
                      {
                        canvas: [
                          { type: 'rect', x: 0, y: 0, w: 240, h: 100, color: '#FEF2F2', r: 8 }
                        ]
                      },
                      {
                        margin: [20, -85, 20, 0],
                        stack: [
                          { text: 'INVERSIÓN MENSUAL', fontSize: 9, color: '#9CA3AF', margin: [0, 0, 0, 5] },
                          { text: formatCOP(data.tikinCommission.totalCost), fontSize: 18, bold: true, color: '#E63946', margin: [0, 0, 0, 8] },
                          { text: 'Comisión Tikin', fontSize: 8, color: '#6B7280' }
                        ]
                      }
                    ]
                  },
                  {
                    width: '4%',
                    stack: [
                      { text: '→', fontSize: 24, color: '#059669', alignment: 'center', margin: [0, 35, 0, 0] }
                    ]
                  },
                  {
                    width: '48%',
                    stack: [
                      {
                        canvas: [
                          { type: 'rect', x: 0, y: 0, w: 240, h: 100, color: '#DCFCE7', r: 8 }
                        ]
                      },
                      {
                        margin: [20, -85, 20, 0],
                        stack: [
                          { text: 'RETORNO MENSUAL', fontSize: 9, color: '#9CA3AF', margin: [0, 0, 0, 5] },
                          { text: formatCOP(netMonthlySavings), fontSize: 18, bold: true, color: '#059669', margin: [0, 0, 0, 8] },
                          { text: 'Ahorro neto', fontSize: 8, color: '#6B7280' }
                        ]
                      }
                    ]
                  }
                ]
              },

              // ROI percentage badge
              {
                margin: [0, 15, 0, 0],
                stack: [
                  {
                    canvas: [
                      { type: 'rect', x: 0, y: 0, w: 515, h: 50, color: '#EFF6FF', r: 6 }
                    ]
                  },
                  {
                    margin: [20, -38, 20, 0],
                    columns: [
                      {
                        width: 'auto',
                        text: '📈',
                        fontSize: 24,
                        margin: [0, 5, 15, 0]
                      },
                      {
                        width: '*',
                        stack: [
                          { text: 'ROI del ' + formatPercentage((netMonthlySavings / data.tikinCommission.totalCost) * 100) + ' mensual', fontSize: 14, bold: true, color: '#2563EB', margin: [0, 0, 0, 3] },
                          { text: 'Por cada peso invertido en Tikin, recuperas ' + (netMonthlySavings / data.tikinCommission.totalCost).toFixed(2) + ' pesos', fontSize: 9, color: '#6B7280' }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },

          // Costo de no hacer nada
          {
            margin: [0, 30, 0, 0],
            stack: [
              { text: 'El costo de NO decidir', fontSize: 12, bold: true, color: '#1F2937', margin: [0, 0, 0, 15] },

              {
                canvas: [
                  { type: 'rect', x: 0, y: 0, w: 515, h: 120, color: '#FEF2F2', r: 8 }
                ]
              },
              {
                margin: [25, -105, 25, 0],
                stack: [
                  { text: '⚠️ Si no implementas Tikin hoy:', fontSize: 11, bold: true, color: '#E63946', margin: [0, 0, 0, 10] },
                  {
                    ul: [
                      { text: 'Perderás ' + formatCOP(netMonthlySavings) + ' cada mes en sobrecostos', fontSize: 9, color: '#4B5563', margin: [0, 0, 0, 5] },
                      { text: 'En 6 meses: ' + formatCOP(netMonthlySavings * 6) + ' en oportunidades perdidas', fontSize: 9, color: '#4B5563', margin: [0, 0, 0, 5] },
                      { text: 'En 1 año: ' + formatCOP(netAnnualSavings) + ' que podrían reinvertirse', fontSize: 9, color: '#4B5563', margin: [0, 0, 0, 5] },
                      { text: 'Competidores ya están optimizando y obteniendo ventaja', fontSize: 9, color: '#4B5563' }
                    ],
                    margin: [0, 0, 0, 0]
                  }
                ]
              }
            ]
          },

          // Qué puedes hacer con el ahorro
          {
            margin: [0, 25, 0, 0],
            stack: [
              { text: '¿Qué puedes hacer con ' + formatCOP(netAnnualSavings) + ' al año?', fontSize: 12, bold: true, color: '#1F2937', margin: [0, 0, 0, 15] },

              {
                columns: [
                  {
                    width: '33%',
                    stack: [
                      {
                        canvas: [
                          { type: 'rect', x: 5, y: 0, w: 155, h: 80, color: '#F0FDF4', r: 6 }
                        ]
                      },
                      {
                        margin: [15, -68, 10, 0],
                        stack: [
                          { text: '👥', fontSize: 24, alignment: 'center', margin: [0, 0, 0, 6] },
                          { text: 'Contratar', fontSize: 9, bold: true, color: '#1F2937', alignment: 'center', margin: [0, 0, 0, 3] },
                          { text: '2-3 empleados nuevos', fontSize: 8, color: '#6B7280', alignment: 'center' }
                        ]
                      }
                    ]
                  },
                  {
                    width: '33%',
                    stack: [
                      {
                        canvas: [
                          { type: 'rect', x: 5, y: 0, w: 155, h: 80, color: '#EFF6FF', r: 6 }
                        ]
                      },
                      {
                        margin: [15, -68, 10, 0],
                        stack: [
                          { text: '💻', fontSize: 24, alignment: 'center', margin: [0, 0, 0, 6] },
                          { text: 'Invertir en', fontSize: 9, bold: true, color: '#1F2937', alignment: 'center', margin: [0, 0, 0, 3] },
                          { text: 'Software y tecnología', fontSize: 8, color: '#6B7280', alignment: 'center' }
                        ]
                      }
                    ]
                  },
                  {
                    width: '33%',
                    stack: [
                      {
                        canvas: [
                          { type: 'rect', x: 5, y: 0, w: 155, h: 80, color: '#FEF2F2', r: 6 }
                        ]
                      },
                      {
                        margin: [15, -68, 10, 0],
                        stack: [
                          { text: '🎁', fontSize: 24, alignment: 'center', margin: [0, 0, 0, 6] },
                          { text: 'Mejorar', fontSize: 9, bold: true, color: '#1F2937', alignment: 'center', margin: [0, 0, 0, 3] },
                          { text: 'Beneficios del equipo', fontSize: 8, color: '#6B7280', alignment: 'center' }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ],
        pageBreak: 'after'
      },

      // ============ PÁGINA 8: FAQ ============
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

          // Título
          {
            text: 'PREGUNTAS FRECUENTES',
            fontSize: 22,
            bold: true,
            color: '#FFFFFF',
            fillColor: '#1F2937',
            margin: [-40, 0, -40, 0],
            padding: [40, 12, 40, 12],
            alignment: 'center'
          },

          // FAQ items
          {
            margin: [0, 25, 0, 0],
            stack: [
              // FAQ 1
              {
                margin: [0, 0, 0, 15],
                stack: [
                  {
                    canvas: [
                      { type: 'rect', x: 0, y: 0, w: 515, h: 70, color: '#F9FAFB', r: 6 }
                    ]
                  },
                  {
                    margin: [20, -58, 20, 0],
                    stack: [
                      { text: '❓ ¿Es legal implementar bonos de mera liberalidad?', fontSize: 10, bold: true, color: '#1F2937', margin: [0, 0, 0, 6] },
                      { text: 'Sí, es 100% legal. Los bonos de mera liberalidad están respaldados por el artículo 128 del Código Sustantivo del Trabajo y permiten optimizar la estructura salarial cumpliendo todas las regulaciones colombianas.', fontSize: 8, color: '#4B5563', lineHeight: 1.4 }
                    ]
                  }
                ]
              },

              // FAQ 2
              {
                margin: [0, 0, 0, 15],
                stack: [
                  {
                    canvas: [
                      { type: 'rect', x: 0, y: 0, w: 515, h: 70, color: '#F9FAFB', r: 6 }
                    ]
                  },
                  {
                    margin: [20, -58, 20, 0],
                    stack: [
                      { text: '⏱️ ¿Cuánto tarda la implementación?', fontSize: 10, bold: true, color: '#1F2937', margin: [0, 0, 0, 6] },
                      { text: 'El proceso completo toma entre 4-5 días hábiles: análisis (1 día), configuración (2-3 días) y activación (1 día). Puedes comenzar a ahorrar desde el primer mes de implementación.', fontSize: 8, color: '#4B5563', lineHeight: 1.4 }
                    ]
                  }
                ]
              },

              // FAQ 3
              {
                margin: [0, 0, 0, 15],
                stack: [
                  {
                    canvas: [
                      { type: 'rect', x: 0, y: 0, w: 515, h: 70, color: '#F9FAFB', r: 6 }
                    ]
                  },
                  {
                    margin: [20, -58, 20, 0],
                    stack: [
                      { text: '💼 ¿Afecta los beneficios de mis empleados?', fontSize: 10, bold: true, color: '#1F2937', margin: [0, 0, 0, 6] },
                      { text: 'No, el salario neto que reciben tus empleados se mantiene igual o aumenta. La optimización ocurre en la estructura de compensación, reduciendo las cargas parafiscales para la empresa sin afectar el ingreso de los trabajadores.', fontSize: 8, color: '#4B5563', lineHeight: 1.4 }
                    ]
                  }
                ]
              },

              // FAQ 4
              {
                margin: [0, 0, 0, 15],
                stack: [
                  {
                    canvas: [
                      { type: 'rect', x: 0, y: 0, w: 515, h: 70, color: '#F9FAFB', r: 6 }
                    ]
                  },
                  {
                    margin: [20, -58, 20, 0],
                    stack: [
                      { text: '🔒 ¿Qué tan segura es la plataforma?', fontSize: 10, bold: true, color: '#1F2937', margin: [0, 0, 0, 6] },
                      { text: 'Utilizamos encriptación de nivel bancario, cumplimos con GDPR y normativas colombianas de protección de datos. Tus datos y los de tus empleados están completamente protegidos con respaldos diarios automáticos.', fontSize: 8, color: '#4B5563', lineHeight: 1.4 }
                    ]
                  }
                ]
              },

              // FAQ 5
              {
                margin: [0, 0, 0, 0],
                stack: [
                  {
                    canvas: [
                      { type: 'rect', x: 0, y: 0, w: 515, h: 70, color: '#F9FAFB', r: 6 }
                    ]
                  },
                  {
                    margin: [20, -58, 20, 0],
                    stack: [
                      { text: '🔄 ¿Puedo cancelar en cualquier momento?', fontSize: 10, bold: true, color: '#1F2937', margin: [0, 0, 0, 6] },
                      { text: 'Sí, no hay permanencia mínima. Puedes cancelar cuando quieras sin penalizaciones. Estamos seguros de que los beneficios te harán querer quedarte, pero la decisión siempre es tuya.', fontSize: 8, color: '#4B5563', lineHeight: 1.4 }
                    ]
                  }
                ]
              }
            ]
          },

          // CTA final en FAQ
          {
            margin: [0, 25, 0, 0],
            stack: [
              {
                canvas: [
                  { type: 'rect', x: 0, y: 0, w: 515, h: 50, color: '#DCFCE7', r: 6 }
                ]
              },
              {
                margin: [20, -38, 20, 0],
                columns: [
                  {
                    width: '*',
                    stack: [
                      { text: '¿Tienes más preguntas?', fontSize: 12, bold: true, color: '#059669', margin: [0, 0, 0, 3] },
                      { text: 'Contáctanos y resolveremos todas tus dudas personalmente', fontSize: 9, color: '#6B7280' }
                    ]
                  },
                  {
                    width: 'auto',
                    text: '💬',
                    fontSize: 24,
                    margin: [10, 5, 0, 0]
                  }
                ]
              }
            ]
          }
        ],
        pageBreak: 'after'
      },

      // ============ PÁGINA 9: APROBACIÓN ============
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
            margin: [0, 0, 0, 10]
          },

          // Badge de urgencia
          {
            stack: [
              {
                canvas: [
                  {
                    type: 'rect',
                    x: 0,
                    y: 0,
                    w: 515,
                    h: 45,
                    color: '#FEF2F2',
                    r: 6
                  }
                ]
              },
              {
                margin: [15, -33, 15, 0],
                columns: [
                  {
                    width: 'auto',
                    text: '⏰',
                    fontSize: 20,
                    margin: [0, 3, 10, 0]
                  },
                  {
                    width: '*',
                    stack: [
                      { text: 'Oferta válida hasta: ' + validUntilDate, fontSize: 11, bold: true, color: '#E63946', margin: [0, 0, 0, 3] },
                      { text: 'Aprueba hoy y comienza a ahorrar desde el próximo mes', fontSize: 9, color: '#6B7280' }
                    ]
                  }
                ]
              }
            ],
            margin: [0, 0, 0, 25]
          },

          // Texto de aprobación
          {
            text: [
              { text: 'Esta propuesta puede ser aprobada instantáneamente añadiendo firma electrónica.\n\n', fontSize: 10, color: '#4B5563' },
              { text: 'Registrando tu firma aceptas los términos y condiciones de este documento, el uso de la firma electrónica equivale a una firma en documento físico con pluma y papel.', fontSize: 10, color: '#4B5563' }
            ],
            lineHeight: 1.5,
            margin: [0, 0, 0, 25]
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

          // CTA prominente para contacto
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
                    h: 60,
                    color: '#E63946',
                    r: 8
                  }
                ]
              },
              {
                margin: [30, -45, 30, 0],
                columns: [
                  {
                    width: '*',
                    stack: [
                      { text: '📞 ¿Listo para ahorrar?', fontSize: 14, bold: true, color: '#FFFFFF', margin: [0, 0, 0, 3] },
                      { text: 'Contáctanos al +57 310 458 2460 o alejandro@tikin.co', fontSize: 10, color: 'rgba(255,255,255,0.9)' }
                    ]
                  },
                  {
                    width: 'auto',
                    stack: [
                      {
                        canvas: [
                          {
                            type: 'rect',
                            x: 0,
                            y: 0,
                            w: 80,
                            h: 32,
                            color: '#FFFFFF',
                            r: 4
                          }
                        ]
                      },
                      {
                        text: 'CONTACTAR',
                        fontSize: 9,
                        bold: true,
                        color: '#E63946',
                        alignment: 'center',
                        margin: [0, -23, 0, 0]
                      }
                    ],
                    margin: [0, 5, 0, 0]
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
