import { CompanyData, TikinCommission } from '@/types/company'
import { SavingsResult } from '@/types/scenarios'
import { formatCOP, formatPercentage } from '@/lib/formatters'
import { ARLRiskLevel } from '@/lib/constants/parafiscales'
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

  const levelLabels: Record<number, string> = {
    1: 'Nivel 1 (4%)',
    2: 'Nivel 2 (3.5%)',
    3: 'Nivel 3 (2.5%)',
    4: 'Nivel 4 (1.8%)',
  }

  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [0, 80, 0, 60],

    header: {
      margin: [0, 0, 0, 0],
      stack: [
        // Barra roja superior
        {
          canvas: [
            {
              type: 'rect',
              x: 0,
              y: 0,
              w: 595,
              h: 8,
              color: '#FF3333'
            }
          ]
        },
        // Logo y título
        {
          margin: [40, 15, 40, 0],
          columns: [
            {
              width: '*',
              stack: [
                { text: 'TIKIN', fontSize: 28, bold: true, color: '#FF3333', margin: [0, 0, 0, 2] },
                {
                  canvas: [
                    {
                      type: 'line',
                      x1: 0,
                      y1: 0,
                      x2: 60,
                      y2: 0,
                      lineWidth: 2,
                      lineColor: '#FF3333'
                    }
                  ]
                }
              ]
            },
            {
              width: 'auto',
              alignment: 'right',
              stack: [
                { text: 'COTIZACIÓN', fontSize: 16, bold: true, color: '#1F2937' },
                { text: today, fontSize: 9, color: '#6B7280', margin: [0, 2, 0, 0] }
              ]
            }
          ]
        }
      ]
    },

    footer: (currentPage: number, pageCount: number) => {
      return {
        stack: [
          // Línea divisoria
          {
            margin: [40, 0, 40, 10],
            canvas: [
              {
                type: 'line',
                x1: 0,
                y1: 0,
                x2: 515,
                y2: 0,
                lineWidth: 0.5,
                lineColor: '#E5E7EB'
              }
            ]
          },
          // Footer content
          {
            margin: [40, 0, 40, 15],
            columns: [
              {
                width: '*',
                stack: [
                  { text: 'www.tikin.co', fontSize: 9, color: '#FF3333', bold: true },
                  { text: 'contacto@tikin.co', fontSize: 8, color: '#6B7280' }
                ]
              },
              {
                width: 'auto',
                text: `Página ${currentPage} de ${pageCount}`,
                fontSize: 8,
                color: '#9CA3AF',
                alignment: 'right'
              }
            ]
          }
        ]
      }
    },

    content: [
      // INFORMACIÓN DEL CLIENTE
      {
        margin: [40, 0, 40, 0],
        stack: [
          {
            text: 'Información del Cliente',
            fontSize: 16,
            bold: true,
            color: '#1F2937',
            margin: [0, 0, 0, 3]
          },
          {
            canvas: [
              {
                type: 'rect',
                x: 0,
                y: 0,
                w: 100,
                h: 3,
                color: '#FF3333'
              }
            ],
            margin: [0, 0, 0, 15]
          },
          {
            table: {
              widths: ['25%', '*'],
              body: [
                [
                  { text: 'Empresa:', fontSize: 10, color: '#6B7280', border: [false, false, false, true], borderColor: ['#E5E7EB', '#E5E7EB', '#E5E7EB', '#E5E7EB'] },
                  { text: data.companyData.companyName, fontSize: 11, bold: true, color: '#FF3333', border: [false, false, false, true], borderColor: ['#E5E7EB', '#E5E7EB', '#E5E7EB', '#E5E7EB'] }
                ],
                [
                  { text: 'Contacto:', fontSize: 10, color: '#6B7280', border: [false, false, false, true], borderColor: ['#E5E7EB', '#E5E7EB', '#E5E7EB', '#E5E7EB'] },
                  { text: data.companyData.contactName, fontSize: 10, color: '#1F2937', border: [false, false, false, true], borderColor: ['#E5E7EB', '#E5E7EB', '#E5E7EB', '#E5E7EB'] }
                ],
                [
                  { text: 'Email:', fontSize: 10, color: '#6B7280', border: [false, false, false, true], borderColor: ['#E5E7EB', '#E5E7EB', '#E5E7EB', '#E5E7EB'] },
                  { text: data.companyData.email, fontSize: 10, color: '#1F2937', border: [false, false, false, true], borderColor: ['#E5E7EB', '#E5E7EB', '#E5E7EB', '#E5E7EB'] }
                ],
                [
                  { text: 'Teléfono:', fontSize: 10, color: '#6B7280', border: [false, false, false, data.companyData.nit ? true : false], borderColor: ['#E5E7EB', '#E5E7EB', '#E5E7EB', '#E5E7EB'] },
                  { text: data.companyData.phone, fontSize: 10, color: '#1F2937', border: [false, false, false, data.companyData.nit ? true : false], borderColor: ['#E5E7EB', '#E5E7EB', '#E5E7EB', '#E5E7EB'] }
                ],
                ...(data.companyData.nit ? [[
                  { text: 'NIT:', fontSize: 10, color: '#6B7280', border: [false, false, false, false] },
                  { text: data.companyData.nit, fontSize: 10, color: '#1F2937', border: [false, false, false, false] }
                ]] : [])
              ]
            },
            layout: {
              paddingLeft: () => 0,
              paddingRight: () => 0,
              paddingTop: () => 10,
              paddingBottom: () => 10
            }
          }
        ]
      },

      // RESUMEN DE NÓMINA
      {
        margin: [40, 25, 40, 0],
        stack: [
          {
            text: 'Resumen de Nómina',
            fontSize: 16,
            bold: true,
            color: '#1F2937',
            margin: [0, 0, 0, 3]
          },
          {
            canvas: [
              {
                type: 'rect',
                x: 0,
                y: 0,
                w: 100,
                h: 3,
                color: '#FF3333'
              }
            ],
            margin: [0, 0, 0, 15]
          },
          {
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
                        h: 80,
                        color: '#FEF2F2',
                        r: 8
                      }
                    ]
                  },
                  {
                    margin: [15, -70, 15, 0],
                    stack: [
                      { text: 'Total Empleados', fontSize: 9, color: '#6B7280', margin: [0, 0, 0, 4] },
                      { text: data.employeeCount.toString(), fontSize: 24, bold: true, color: '#FF3333', margin: [0, 0, 0, 6] },
                      { text: 'División Salario/Bono', fontSize: 9, color: '#6B7280', margin: [0, 0, 0, 4] },
                      { text: `${data.savingsData.tikin.salaryPercentage}% / ${data.savingsData.tikin.bonusPercentage}%`, fontSize: 12, bold: true, color: '#1F2937' }
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
                        h: 80,
                        color: '#F9FAFB',
                        r: 8
                      }
                    ]
                  },
                  {
                    margin: [30, -70, 15, 0],
                    stack: [
                      { text: 'Nómina Mensual', fontSize: 9, color: '#6B7280', margin: [0, 0, 0, 4] },
                      { text: formatCOP(data.totalPayroll), fontSize: 16, bold: true, color: '#1F2937', margin: [0, 0, 0, 6] },
                      { text: 'Nivel ARL', fontSize: 9, color: '#6B7280', margin: [0, 0, 0, 4] },
                      { text: `Clase ${data.arlRiskLevel}`, fontSize: 12, bold: true, color: '#1F2937' }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },

      // ANÁLISIS DE PARAFISCALES
      {
        margin: [40, 25, 40, 0],
        stack: [
          {
            text: 'Análisis de Parafiscales',
            fontSize: 16,
            bold: true,
            color: '#1F2937',
            margin: [0, 0, 0, 3]
          },
          {
            canvas: [
              {
                type: 'rect',
                x: 0,
                y: 0,
                w: 100,
                h: 3,
                color: '#FF3333'
              }
            ],
            margin: [0, 0, 0, 15]
          },
          {
            table: {
              widths: ['40%', '30%', '30%'],
              headerRows: 1,
              body: [
                [
                  { text: 'Concepto', fontSize: 10, bold: true, color: '#FFFFFF', fillColor: '#1F2937' },
                  { text: 'Tradicional', fontSize: 10, bold: true, color: '#FFFFFF', fillColor: '#1F2937', alignment: 'right' },
                  { text: 'Con Tikin', fontSize: 10, bold: true, color: '#FFFFFF', fillColor: '#FF3333', alignment: 'right' }
                ],
                [
                  { text: 'Salud (8.5%)', fontSize: 10, color: '#4B5563' },
                  { text: formatCOP(data.savingsData.traditional.parafiscales.health), fontSize: 10, alignment: 'right', color: '#1F2937' },
                  { text: formatCOP(data.savingsData.tikin.parafiscales.health), fontSize: 10, alignment: 'right', color: '#1F2937' }
                ],
                [
                  { text: 'Pensión (12%)', fontSize: 10, color: '#4B5563', fillColor: '#F9FAFB' },
                  { text: formatCOP(data.savingsData.traditional.parafiscales.pension), fontSize: 10, alignment: 'right', color: '#1F2937', fillColor: '#F9FAFB' },
                  { text: formatCOP(data.savingsData.tikin.parafiscales.pension), fontSize: 10, alignment: 'right', color: '#1F2937', fillColor: '#F9FAFB' }
                ],
                [
                  { text: 'ARL', fontSize: 10, color: '#4B5563' },
                  { text: formatCOP(data.savingsData.traditional.parafiscales.arl), fontSize: 10, alignment: 'right', color: '#1F2937' },
                  { text: formatCOP(data.savingsData.tikin.parafiscales.arl), fontSize: 10, alignment: 'right', color: '#1F2937' }
                ],
                [
                  { text: 'SENA (2%)', fontSize: 10, color: '#4B5563', fillColor: '#F9FAFB' },
                  { text: formatCOP(data.savingsData.traditional.parafiscales.sena), fontSize: 10, alignment: 'right', color: '#1F2937', fillColor: '#F9FAFB' },
                  { text: formatCOP(data.savingsData.tikin.parafiscales.sena), fontSize: 10, alignment: 'right', color: '#1F2937', fillColor: '#F9FAFB' }
                ],
                [
                  { text: 'ICBF (3%)', fontSize: 10, color: '#4B5563' },
                  { text: formatCOP(data.savingsData.traditional.parafiscales.icbf), fontSize: 10, alignment: 'right', color: '#1F2937' },
                  { text: formatCOP(data.savingsData.tikin.parafiscales.icbf), fontSize: 10, alignment: 'right', color: '#1F2937' }
                ],
                [
                  { text: 'Caja (4%)', fontSize: 10, color: '#4B5563', fillColor: '#F9FAFB' },
                  { text: formatCOP(data.savingsData.traditional.parafiscales.caja), fontSize: 10, alignment: 'right', color: '#1F2937', fillColor: '#F9FAFB' },
                  { text: formatCOP(data.savingsData.tikin.parafiscales.caja), fontSize: 10, alignment: 'right', color: '#1F2937', fillColor: '#F9FAFB' }
                ],
                [
                  { text: 'TOTAL MENSUAL', fontSize: 11, bold: true, color: '#1F2937', fillColor: '#E5E7EB' },
                  { text: formatCOP(data.savingsData.traditional.parafiscales.total), fontSize: 11, bold: true, alignment: 'right', color: '#1F2937', fillColor: '#E5E7EB' },
                  { text: formatCOP(data.savingsData.tikin.parafiscales.total), fontSize: 11, bold: true, alignment: 'right', color: '#FF3333', fillColor: '#FEF2F2' }
                ]
              ]
            },
            layout: {
              hLineWidth: (i: number, node: any) => i === 1 || i === node.table.body.length ? 2 : 0,
              vLineWidth: () => 0,
              hLineColor: (i: number) => i === 1 ? '#1F2937' : '#FF3333',
              paddingLeft: () => 12,
              paddingRight: () => 12,
              paddingTop: () => 10,
              paddingBottom: () => 10
            }
          }
        ]
      },

      // AHORRO CON TIKIN - Destacado
      {
        margin: [40, 20, 40, 0],
        stack: [
          {
            canvas: [
              {
                type: 'rect',
                x: 0,
                y: 0,
                w: 515,
                h: 65,
                color: '#DCFCE7',
                r: 8
              },
              {
                type: 'rect',
                x: 0,
                y: 0,
                w: 6,
                h: 65,
                color: '#16A34A',
                r: 8
              }
            ]
          },
          {
            margin: [20, -55, 20, 0],
            columns: [
              {
                width: '*',
                stack: [
                  { text: 'Ahorro Mensual con Tikin', fontSize: 13, bold: true, color: '#16A34A', margin: [0, 0, 0, 6] },
                  { text: formatCOP(data.savingsData.monthlySavings), fontSize: 22, bold: true, color: '#16A34A' }
                ]
              },
              {
                width: 'auto',
                stack: [
                  { text: 'Reducción', fontSize: 10, color: '#6B7280', alignment: 'right', margin: [0, 0, 0, 4] },
                  { text: formatPercentage(data.savingsData.percentageReduction), fontSize: 18, bold: true, color: '#16A34A', alignment: 'right' }
                ]
              }
            ]
          }
        ]
      },

      // INVERSIÓN TIKIN
      {
        margin: [40, 25, 40, 0],
        stack: [
          {
            text: 'Inversión en el Servicio Tikin',
            fontSize: 16,
            bold: true,
            color: '#1F2937',
            margin: [0, 0, 0, 3]
          },
          {
            canvas: [
              {
                type: 'rect',
                x: 0,
                y: 0,
                w: 100,
                h: 3,
                color: '#FF3333'
              }
            ],
            margin: [0, 0, 0, 15]
          },
          {
            table: {
              widths: ['70%', '30%'],
              body: [
                [
                  { text: `Nivel aplicable: ${levelLabels[data.tikinCommission.level]}`, fontSize: 10, color: '#6B7280', border: [false, false, false, true], borderColor: ['#E5E7EB', '#E5E7EB', '#E5E7EB', '#E5E7EB'] },
                  { text: formatCOP(data.tikinCommission.monthlyBonusTotal), fontSize: 9, color: '#9CA3AF', alignment: 'right', border: [false, false, false, true], borderColor: ['#E5E7EB', '#E5E7EB', '#E5E7EB', '#E5E7EB'] }
                ],
                [
                  { text: 'Comisión base', fontSize: 10, color: '#6B7280', border: [false, false, false, true], borderColor: ['#E5E7EB', '#E5E7EB', '#E5E7EB', '#E5E7EB'] },
                  { text: formatCOP(data.tikinCommission.baseCommission), fontSize: 10, color: '#1F2937', alignment: 'right', border: [false, false, false, true], borderColor: ['#E5E7EB', '#E5E7EB', '#E5E7EB', '#E5E7EB'] }
                ],
                [
                  { text: 'IVA (19%)', fontSize: 10, color: '#6B7280', border: [false, false, false, true], borderColor: ['#E5E7EB', '#E5E7EB', '#E5E7EB', '#E5E7EB'] },
                  { text: formatCOP(data.tikinCommission.iva), fontSize: 10, color: '#1F2937', alignment: 'right', border: [false, false, false, true], borderColor: ['#E5E7EB', '#E5E7EB', '#E5E7EB', '#E5E7EB'] }
                ],
                [
                  { text: 'COSTO TOTAL MENSUAL', fontSize: 11, bold: true, color: '#FF3333', fillColor: '#FEF2F2', border: [false, false, false, false] },
                  { text: formatCOP(data.tikinCommission.totalCost), fontSize: 13, bold: true, color: '#FF3333', fillColor: '#FEF2F2', alignment: 'right', border: [false, false, false, false] }
                ]
              ]
            },
            layout: {
              paddingLeft: () => 0,
              paddingRight: () => 0,
              paddingTop: () => 10,
              paddingBottom: () => 10
            }
          }
        ]
      },

      // BENEFICIO NETO - Destacado
      {
        margin: [40, 20, 40, 0],
        pageBreak: netMonthlySavings < 0 ? undefined : undefined,
        stack: [
          {
            canvas: [
              {
                type: 'rect',
                x: 0,
                y: 0,
                w: 515,
                h: 75,
                color: '#D1FAE5',
                r: 8
              },
              {
                type: 'rect',
                x: 0,
                y: 0,
                w: 6,
                h: 75,
                color: '#059669',
                r: 8
              }
            ]
          },
          {
            margin: [20, -60, 20, 0],
            stack: [
              { text: 'BENEFICIO NETO', fontSize: 14, bold: true, color: '#059669', margin: [0, 0, 0, 8] },
              {
                columns: [
                  {
                    width: '50%',
                    stack: [
                      { text: 'Mensual', fontSize: 10, color: '#6B7280', margin: [0, 0, 0, 4] },
                      { text: formatCOP(netMonthlySavings), fontSize: 18, bold: true, color: '#059669' }
                    ]
                  },
                  {
                    width: '50%',
                    stack: [
                      { text: 'Anual', fontSize: 10, color: '#6B7280', margin: [0, 0, 0, 4] },
                      { text: formatCOP(netAnnualSavings), fontSize: 18, bold: true, color: '#059669' }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },

      // CALL TO ACTION
      {
        margin: [40, 25, 40, 0],
        stack: [
          {
            canvas: [
              {
                type: 'rect',
                x: 0,
                y: 0,
                w: 515,
                h: 60,
                color: '#FEF2F2',
                r: 8
              }
            ]
          },
          {
            margin: [20, -45, 20, 0],
            stack: [
              { text: '¿Listo para optimizar tus costos laborales?', fontSize: 14, bold: true, color: '#FF3333', alignment: 'center', margin: [0, 0, 0, 6] },
              { text: 'Contacta con Tikin para dar el siguiente paso', fontSize: 10, color: '#6B7280', alignment: 'center' }
            ]
          }
        ]
      },

      {
        margin: [40, 15, 40, 0],
        text: 'Esta cotización es informativa y está sujeta a validación final.',
        fontSize: 8,
        color: '#9CA3AF',
        alignment: 'center',
        italics: true
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
