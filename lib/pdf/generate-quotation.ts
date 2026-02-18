interface QuotationDataBonos2 {
  datosEmpresa: {
    razonSocial: string
    nit: string
    contactoNombre: string
    contactoEmail: string
    contactoTelefono: string
    sector: string
    cantidadEmpleados: number
  } | null

  arlRiskLevel?: string

  tiposBonoSeleccionados: string[]

  lotes: Array<{
    nombre: string
    cantidad: number
    salarioPorEmpleado: number
    bonos: Record<string, number>
    totalSalarios: number
    totalBonos: number
    totalCompensacion: number
  }>

  resumenFinanciero: {
    totalSalarios: number
    totalBonosMeraLiberalidad: number
    totalBonosAlimentacion: number
    totalBonosDotacion: number
    totalBonosViaticos: number
    totalBonosTotal: number
    totalCompensacion: number
    porcentajeSalarios: number
    porcentajeBonos: number
    cumpleRegla6040: boolean
  }

  validacion: {
    totalEmpleados: number
    empleadosValidos: number
    empleadosConErrores: number
    empleadosConWarnings: number
    puedeAvanzar: boolean
  }

  comisionesTikin: {
    montoBaseMeraLiberalidad: number
    porcentajeFee: number
    feeBaseMeraLiberalidad: number
    montoBaseAlimentacion: number
    feeBaseAlimentacion: number
    montoDotacion: number
    montoBaseViaticos: number
    feeBaseViaticos: number
    feeTotal: number
    iva: number
    totalConIva: number
  }

  ahorrosEstimados: {
    ahorroMensualEstimado: number
    ahorroAnualEstimado: number
    ahorroSeguridadSocial: number
    ahorroParafiscales: number
    ahorroPrestaciones: number
    comisionTikinMensual: number
    comisionTikinAnual: number
    beneficioNetoMensual: number
    beneficioNetoAnual: number
    factoresVariables: string[]
  }

  totalEmpleados: number
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)

const pct = (n: number) => `${n.toFixed(1)}%`

export async function generateQuotationPDF(data: QuotationDataBonos2): Promise<void> {
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
    day: 'numeric',
  })

  const companyName = data.datosEmpresa?.razonSocial || 'Empresa'
  const proposalNumber = `${companyName.substring(0, 3).toUpperCase()}-${Date.now().toString().substring(8)}`
  const validUntil = new Date()
  validUntil.setMonth(validUntil.getMonth() + 1)
  const validUntilDate = validUntil.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  // =====================================================================
  // PAGE 1: PORTADA
  // =====================================================================
  const page1Portada: any = {
    stack: [
      // Red background
      {
        canvas: [
          { type: 'rect', x: 0, y: 0, w: 595, h: 842, color: '#E63946' },
          { type: 'rect', x: 0, y: 0, w: 595, h: 200, color: 'rgba(220, 38, 38, 0.3)' },
          { type: 'ellipse', x: 500, y: 100, r1: 120, r2: 120, color: 'rgba(255, 255, 255, 0.05)' },
          { type: 'ellipse', x: 100, y: 700, r1: 80, r2: 80, color: 'rgba(255, 255, 255, 0.05)' },
          { type: 'rect', x: 400, y: 600, w: 150, h: 150, color: 'rgba(255, 255, 255, 0.03)', r: 20 },
        ],
        absolutePosition: { x: 0, y: 0 },
      },

      // Logo "Tikin." + "2.0" badge
      {
        columns: [
          {
            width: 'auto',
            text: 'Tikin.',
            fontSize: 24,
            bold: true,
            color: '#FFFFFF',
          },
          {
            width: 'auto',
            canvas: [
              { type: 'rect', x: 10, y: 3, w: 36, h: 18, color: 'rgba(255, 255, 255, 0.25)', r: 9 },
            ],
          },
          {
            width: 'auto',
            text: '2.0',
            fontSize: 9,
            bold: true,
            color: '#FFFFFF',
            margin: [14, 7, 0, 0],
          },
        ],
        margin: [40, 40, 0, 0],
      },

      // Main title
      {
        text: 'COTIZACION DE\nBONOS CORPORATIVOS',
        fontSize: 32,
        bold: true,
        color: '#FFFFFF',
        alignment: 'center',
        margin: [40, 260, 40, 0],
        lineHeight: 1.3,
      },

      // Company name
      {
        text: companyName,
        fontSize: 18,
        color: '#FFFFFF',
        alignment: 'center',
        margin: [40, 30, 40, 0],
      },

      // Net annual benefit badge
      {
        margin: [40, 25, 40, 0],
        stack: [
          {
            canvas: [
              { type: 'rect', x: 120, y: 0, w: 355, h: 60, color: 'rgba(255, 255, 255, 0.15)', r: 30 },
            ],
          },
          {
            margin: [135, -48, 135, 0],
            stack: [
              {
                text: 'BENEFICIO NETO ANUAL ESTIMADO',
                fontSize: 9,
                color: 'rgba(255, 255, 255, 0.9)',
                alignment: 'center',
                margin: [0, 0, 0, 5],
              },
              {
                text: fmt(data.ahorrosEstimados.beneficioNetoAnual),
                fontSize: 20,
                bold: true,
                color: '#FFFFFF',
                alignment: 'center',
              },
            ],
          },
        ],
      },

      // Footer with proposal info
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'Propuesta No.', fontSize: 9, color: 'rgba(255,255,255,0.8)' },
              { text: proposalNumber, fontSize: 11, bold: true, color: '#FFFFFF', margin: [0, 2, 0, 10] },
              { text: 'Fecha', fontSize: 9, color: 'rgba(255,255,255,0.8)' },
              { text: today, fontSize: 10, color: '#FFFFFF', margin: [0, 2, 0, 10] },
              { text: 'Oferta valida hasta', fontSize: 9, color: 'rgba(255,255,255,0.8)' },
              { text: validUntilDate, fontSize: 10, color: '#FFFFFF', margin: [0, 2, 0, 0] },
            ],
          },
          {
            width: '*',
            stack: [
              { text: 'Estado', fontSize: 9, color: 'rgba(255,255,255,0.8)' },
              { text: 'Ready', fontSize: 11, bold: true, color: '#FFFFFF', margin: [0, 2, 0, 10] },
              { text: 'Ciudad de', fontSize: 9, color: 'rgba(255,255,255,0.8)' },
              { text: 'Bogota, Colombia', fontSize: 10, color: '#FFFFFF', margin: [0, 2, 0, 0] },
            ],
          },
        ],
        absolutePosition: { x: 40, y: 720 },
      },
    ],
    pageBreak: 'after',
  }

  // =====================================================================
  // PAGE 2: RESUMEN EJECUTIVO
  // =====================================================================
  const companyInfoRows: any[] = []
  if (data.datosEmpresa) {
    const de = data.datosEmpresa
    const infoFields = [
      ['Razon Social', de.razonSocial],
      ['NIT', de.nit],
      ['Contacto', de.contactoNombre],
      ['Email', de.contactoEmail],
      ['Sector', de.sector],
      ['Clase ARL', data.arlRiskLevel || 'N/A'],
    ]
    infoFields.forEach(([label, value], idx) => {
      const bg = idx % 2 === 0 ? '#F9FAFB' : '#FFFFFF'
      companyInfoRows.push([
        { text: label, fontSize: 9, bold: true, color: '#4B5563', fillColor: bg, border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
        { text: value || '-', fontSize: 9, color: '#1F2937', fillColor: bg, border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
      ])
    })
  }

  const cumpleColor = data.resumenFinanciero.cumpleRegla6040 ? '#059669' : '#D97706'
  const cumpleText = data.resumenFinanciero.cumpleRegla6040 ? 'Cumple regla 60/40' : 'No cumple regla 60/40'
  const cumpleIcon = data.resumenFinanciero.cumpleRegla6040 ? 'SI' : 'ATENCION'

  const page2Resumen: any = {
    margin: [40, 40, 40, 40],
    stack: [
      // Logo and date
      {
        columns: [
          { width: 'auto', text: 'Tikin.', fontSize: 20, bold: true, color: '#1F2937' },
          { width: '*', text: '' },
          { width: 'auto', text: today, fontSize: 9, color: '#9CA3AF', margin: [0, 8, 0, 0] },
        ],
        margin: [0, 0, 0, 25],
      },

      // Section title
      {
        text: 'RESUMEN EJECUTIVO',
        fontSize: 22,
        bold: true,
        color: '#FFFFFF',
        fillColor: '#1F2937',
        margin: [-40, 0, -40, 0],
        padding: [40, 12, 40, 12],
        alignment: 'center',
      },

      // Company data box (if available)
      ...(companyInfoRows.length > 0
        ? [
            {
              margin: [0, 20, 0, 0],
              stack: [
                { text: 'Datos de la Empresa', fontSize: 12, bold: true, color: '#1F2937', margin: [0, 0, 0, 10] },
                {
                  table: {
                    widths: ['35%', '65%'],
                    body: companyInfoRows,
                  },
                  layout: {
                    paddingLeft: () => 10,
                    paddingRight: () => 10,
                    paddingTop: () => 6,
                    paddingBottom: () => 6,
                  },
                },
              ],
            },
          ]
        : []),

      // Key metrics grid (4 columns)
      {
        margin: [0, 20, 0, 0],
        columns: [
          {
            width: '25%',
            stack: [
              {
                canvas: [
                  { type: 'rect', x: 0, y: 0, w: 118, h: 75, color: '#FEF2F2', r: 6 },
                ],
              },
              {
                margin: [10, -62, 5, 0],
                stack: [
                  { text: 'Total Empleados', fontSize: 7, color: '#9CA3AF', margin: [0, 0, 0, 4] },
                  { text: data.totalEmpleados.toString(), fontSize: 20, bold: true, color: '#E63946' },
                ],
              },
            ],
          },
          {
            width: '25%',
            stack: [
              {
                canvas: [
                  { type: 'rect', x: 3, y: 0, w: 118, h: 75, color: '#F3F4F6', r: 6 },
                ],
              },
              {
                margin: [13, -62, 5, 0],
                stack: [
                  { text: 'Compensacion Total', fontSize: 7, color: '#9CA3AF', margin: [0, 0, 0, 4] },
                  { text: fmt(data.resumenFinanciero.totalCompensacion), fontSize: 11, bold: true, color: '#1F2937' },
                ],
              },
            ],
          },
          {
            width: '25%',
            stack: [
              {
                canvas: [
                  { type: 'rect', x: 6, y: 0, w: 118, h: 75, color: '#EFF6FF', r: 6 },
                ],
              },
              {
                margin: [16, -62, 5, 0],
                stack: [
                  { text: 'Distribucion', fontSize: 7, color: '#9CA3AF', margin: [0, 0, 0, 4] },
                  {
                    text: `${pct(data.resumenFinanciero.porcentajeSalarios)} Salario`,
                    fontSize: 10,
                    bold: true,
                    color: '#2563EB',
                    margin: [0, 0, 0, 2],
                  },
                  {
                    text: `${pct(data.resumenFinanciero.porcentajeBonos)} Bonos`,
                    fontSize: 10,
                    bold: true,
                    color: '#E63946',
                  },
                ],
              },
            ],
          },
          {
            width: '25%',
            stack: [
              {
                canvas: [
                  { type: 'rect', x: 9, y: 0, w: 118, h: 75, color: '#F0FDF4', r: 6 },
                ],
              },
              {
                margin: [19, -62, 5, 0],
                stack: [
                  { text: 'Tipos de Bono', fontSize: 7, color: '#9CA3AF', margin: [0, 0, 0, 4] },
                  { text: data.tiposBonoSeleccionados.length.toString(), fontSize: 20, bold: true, color: '#059669' },
                ],
              },
            ],
          },
        ],
      },

      // 60/40 compliance indicator
      {
        margin: [0, 20, 0, 0],
        stack: [
          {
            canvas: [
              { type: 'rect', x: 0, y: 0, w: 515, h: 40, color: data.resumenFinanciero.cumpleRegla6040 ? '#F0FDF4' : '#FFFBEB', r: 6 },
            ],
          },
          {
            margin: [15, -30, 15, 0],
            columns: [
              {
                width: 'auto',
                text: cumpleIcon,
                fontSize: 10,
                bold: true,
                color: '#FFFFFF',
                background: cumpleColor,
                margin: [0, 2, 10, 0],
              },
              {
                width: '*',
                stack: [
                  { text: cumpleText, fontSize: 11, bold: true, color: cumpleColor },
                  {
                    text: `Salario ${pct(data.resumenFinanciero.porcentajeSalarios)} / Bonos ${pct(data.resumenFinanciero.porcentajeBonos)}`,
                    fontSize: 8,
                    color: '#6B7280',
                  },
                ],
              },
            ],
          },
        ],
      },

      // Selected bonus types
      {
        margin: [0, 15, 0, 0],
        stack: [
          { text: 'Tipos de Bono Seleccionados', fontSize: 10, bold: true, color: '#1F2937', margin: [0, 0, 0, 8] },
          {
            ul: data.tiposBonoSeleccionados.map((tipo) => ({
              text: tipo,
              fontSize: 9,
              color: '#4B5563',
              margin: [0, 0, 0, 3],
            })),
          },
        ],
      },
    ],
    pageBreak: 'after',
  }

  // =====================================================================
  // PAGE 3: DETALLE DE LOTES Y EMPLEADOS
  // =====================================================================
  const lotesTableBody: any[][] = [
    [
      { text: 'Lote', fontSize: 9, bold: true, color: '#FFFFFF', fillColor: '#1F2937', border: [false, false, false, false] },
      { text: 'Empleados', fontSize: 9, bold: true, color: '#FFFFFF', fillColor: '#1F2937', alignment: 'center', border: [false, false, false, false] },
      { text: 'Salario/Emp', fontSize: 9, bold: true, color: '#FFFFFF', fillColor: '#1F2937', alignment: 'right', border: [false, false, false, false] },
      { text: 'Bonos/Emp', fontSize: 9, bold: true, color: '#FFFFFF', fillColor: '#1F2937', alignment: 'right', border: [false, false, false, false] },
      { text: 'Comp./Emp', fontSize: 9, bold: true, color: '#FFFFFF', fillColor: '#1F2937', alignment: 'right', border: [false, false, false, false] },
    ],
  ]

  if (data.lotes.length > 0) {
    data.lotes.forEach((lote, idx) => {
      const bg = idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'
      const bonosPerEmp = lote.cantidad > 0 ? lote.totalBonos / lote.cantidad : 0
      const compPerEmp = lote.cantidad > 0 ? lote.totalCompensacion / lote.cantidad : 0
      lotesTableBody.push([
        { text: lote.nombre, fontSize: 9, color: '#1F2937', fillColor: bg, border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
        { text: lote.cantidad.toString(), fontSize: 9, color: '#1F2937', fillColor: bg, alignment: 'center', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
        { text: fmt(lote.salarioPorEmpleado), fontSize: 9, color: '#1F2937', fillColor: bg, alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
        { text: fmt(bonosPerEmp), fontSize: 9, color: '#1F2937', fillColor: bg, alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
        { text: fmt(compPerEmp), fontSize: 9, color: '#1F2937', fillColor: bg, alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
      ])
    })

    // Total row
    const totalEmps = data.lotes.reduce((s, l) => s + l.cantidad, 0)
    lotesTableBody.push([
      { text: 'TOTAL', fontSize: 10, bold: true, color: '#1F2937', fillColor: '#E5E7EB', border: [false, false, false, false] },
      { text: totalEmps.toString(), fontSize: 10, bold: true, color: '#1F2937', fillColor: '#E5E7EB', alignment: 'center', border: [false, false, false, false] },
      { text: fmt(data.resumenFinanciero.totalSalarios), fontSize: 10, bold: true, color: '#1F2937', fillColor: '#E5E7EB', alignment: 'right', border: [false, false, false, false] },
      { text: fmt(data.resumenFinanciero.totalBonosTotal), fontSize: 10, bold: true, color: '#E63946', fillColor: '#FEF2F2', alignment: 'right', border: [false, false, false, false] },
      { text: fmt(data.resumenFinanciero.totalCompensacion), fontSize: 10, bold: true, color: '#1F2937', fillColor: '#E5E7EB', alignment: 'right', border: [false, false, false, false] },
    ])
  }

  // Bonus breakdown per lote
  const bonusBreakdownStacks: any[] = []
  if (data.lotes.length > 0) {
    data.lotes.forEach((lote) => {
      const bonusEntries = Object.entries(lote.bonos).filter(([, v]) => v > 0)
      if (bonusEntries.length > 0) {
        const breakdownRows: any[][] = [
          [
            { text: 'Tipo de Bono', fontSize: 8, bold: true, color: '#FFFFFF', fillColor: '#6B7280', border: [false, false, false, false] },
            { text: 'Monto/Emp', fontSize: 8, bold: true, color: '#FFFFFF', fillColor: '#6B7280', alignment: 'right', border: [false, false, false, false] },
          ],
        ]
        bonusEntries.forEach(([key, val]) => {
          breakdownRows.push([
            { text: key, fontSize: 8, color: '#4B5563', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
            { text: fmt(val), fontSize: 8, color: '#1F2937', alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
          ])
        })

        bonusBreakdownStacks.push({
          margin: [0, 10, 0, 0],
          stack: [
            { text: `Bonos - ${lote.nombre}`, fontSize: 9, bold: true, color: '#1F2937', margin: [0, 0, 0, 5] },
            {
              table: {
                widths: ['65%', '35%'],
                body: breakdownRows,
              },
              layout: {
                paddingLeft: () => 8,
                paddingRight: () => 8,
                paddingTop: () => 5,
                paddingBottom: () => 5,
              },
            },
          ],
        })
      }
    })
  }

  const page3Lotes: any = {
    margin: [40, 40, 40, 40],
    stack: [
      // Logo
      { text: 'Tikin.', fontSize: 20, bold: true, color: '#1F2937', margin: [0, 0, 0, 20] },

      // Section title
      {
        text: 'COMPOSICION DE NOMINA',
        fontSize: 22,
        bold: true,
        color: '#FFFFFF',
        fillColor: '#1F2937',
        margin: [-40, 0, -40, 0],
        padding: [40, 12, 40, 12],
        alignment: 'center',
      },

      // Lotes table or fallback
      ...(data.lotes.length > 0
        ? [
            {
              margin: [0, 20, 0, 0],
              table: {
                widths: ['25%', '15%', '20%', '20%', '20%'],
                headerRows: 1,
                body: lotesTableBody,
              },
              layout: {
                paddingLeft: () => 8,
                paddingRight: () => 8,
                paddingTop: () => 7,
                paddingBottom: () => 7,
              },
            },
            ...bonusBreakdownStacks,
          ]
        : [
            {
              margin: [0, 25, 0, 0],
              stack: [
                {
                  canvas: [
                    { type: 'rect', x: 0, y: 0, w: 515, h: 50, color: '#F3F4F6', r: 6 },
                  ],
                },
                {
                  margin: [20, -35, 20, 0],
                  text: `Empleados cargados individualmente: ${data.totalEmpleados}`,
                  fontSize: 12,
                  bold: true,
                  color: '#1F2937',
                },
              ],
            },
          ]),

      // Financial summary cards
      {
        margin: [0, 25, 0, 0],
        stack: [
          { text: 'Resumen de Compensacion', fontSize: 12, bold: true, color: '#1F2937', margin: [0, 0, 0, 10] },
          {
            columns: [
              {
                width: '50%',
                stack: [
                  {
                    canvas: [
                      { type: 'rect', x: 0, y: 0, w: 248, h: 65, color: '#EFF6FF', r: 6 },
                    ],
                  },
                  {
                    margin: [15, -52, 10, 0],
                    stack: [
                      { text: 'Total Salarios', fontSize: 8, color: '#6B7280', margin: [0, 0, 0, 4] },
                      { text: fmt(data.resumenFinanciero.totalSalarios), fontSize: 16, bold: true, color: '#2563EB' },
                    ],
                  },
                ],
              },
              {
                width: '50%',
                stack: [
                  {
                    canvas: [
                      { type: 'rect', x: 7, y: 0, w: 248, h: 65, color: '#FEF2F2', r: 6 },
                    ],
                  },
                  {
                    margin: [22, -52, 10, 0],
                    stack: [
                      { text: 'Total Bonos', fontSize: 8, color: '#6B7280', margin: [0, 0, 0, 4] },
                      { text: fmt(data.resumenFinanciero.totalBonosTotal), fontSize: 16, bold: true, color: '#E63946' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },

      // Bonus type breakdown summary
      {
        margin: [0, 15, 0, 0],
        stack: [
          { text: 'Desglose por Tipo de Bono', fontSize: 10, bold: true, color: '#1F2937', margin: [0, 0, 0, 8] },
          {
            table: {
              widths: ['60%', '40%'],
              body: [
                [
                  { text: 'Tipo', fontSize: 8, bold: true, color: '#FFFFFF', fillColor: '#6B7280', border: [false, false, false, false] },
                  { text: 'Total Mensual', fontSize: 8, bold: true, color: '#FFFFFF', fillColor: '#6B7280', alignment: 'right', border: [false, false, false, false] },
                ],
                ...(data.resumenFinanciero.totalBonosMeraLiberalidad > 0
                  ? [[
                      { text: 'Mera Liberalidad', fontSize: 9, color: '#4B5563', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
                      { text: fmt(data.resumenFinanciero.totalBonosMeraLiberalidad), fontSize: 9, color: '#1F2937', alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
                    ]]
                  : []),
                ...(data.resumenFinanciero.totalBonosAlimentacion > 0
                  ? [[
                      { text: 'Alimentacion', fontSize: 9, color: '#4B5563', fillColor: '#F9FAFB', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
                      { text: fmt(data.resumenFinanciero.totalBonosAlimentacion), fontSize: 9, color: '#1F2937', fillColor: '#F9FAFB', alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
                    ]]
                  : []),
                ...(data.resumenFinanciero.totalBonosDotacion > 0
                  ? [[
                      { text: 'Dotacion', fontSize: 9, color: '#4B5563', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
                      { text: fmt(data.resumenFinanciero.totalBonosDotacion), fontSize: 9, color: '#1F2937', alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
                    ]]
                  : []),
                ...(data.resumenFinanciero.totalBonosViaticos > 0
                  ? [[
                      { text: 'Viaticos', fontSize: 9, color: '#4B5563', fillColor: '#F9FAFB', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
                      { text: fmt(data.resumenFinanciero.totalBonosViaticos), fontSize: 9, color: '#1F2937', fillColor: '#F9FAFB', alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
                    ]]
                  : []),
              ],
            },
            layout: {
              paddingLeft: () => 10,
              paddingRight: () => 10,
              paddingTop: () => 6,
              paddingBottom: () => 6,
            },
          },
        ],
      },
    ],
    pageBreak: 'after',
  }

  // =====================================================================
  // PAGE 4: COMISIONES TIKIN
  // =====================================================================
  const commissionRows: any[][] = [
    [
      { text: 'Concepto', fontSize: 9, bold: true, color: '#FFFFFF', fillColor: '#E63946', border: [false, false, false, false] },
      { text: 'Monto Base', fontSize: 9, bold: true, color: '#FFFFFF', fillColor: '#E63946', alignment: 'right', border: [false, false, false, false] },
      { text: 'Fee %', fontSize: 9, bold: true, color: '#FFFFFF', fillColor: '#E63946', alignment: 'center', border: [false, false, false, false] },
      { text: 'Fee Mensual', fontSize: 9, bold: true, color: '#FFFFFF', fillColor: '#E63946', alignment: 'right', border: [false, false, false, false] },
    ],
  ]

  // Mera Liberalidad
  if (data.comisionesTikin.montoBaseMeraLiberalidad > 0) {
    commissionRows.push([
      { text: 'Mera Liberalidad', fontSize: 9, color: '#4B5563', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
      { text: fmt(data.comisionesTikin.montoBaseMeraLiberalidad), fontSize: 9, color: '#1F2937', alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
      { text: pct(data.comisionesTikin.porcentajeFee), fontSize: 9, color: '#1F2937', alignment: 'center', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
      { text: fmt(data.comisionesTikin.feeBaseMeraLiberalidad), fontSize: 9, color: '#1F2937', alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
    ])
  }

  // Alimentacion
  if (data.comisionesTikin.montoBaseAlimentacion > 0) {
    commissionRows.push([
      { text: 'Alimentacion', fontSize: 9, color: '#4B5563', fillColor: '#F9FAFB', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
      { text: fmt(data.comisionesTikin.montoBaseAlimentacion), fontSize: 9, color: '#1F2937', fillColor: '#F9FAFB', alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
      { text: '1.25%', fontSize: 9, color: '#1F2937', fillColor: '#F9FAFB', alignment: 'center', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
      { text: fmt(data.comisionesTikin.feeBaseAlimentacion), fontSize: 9, color: '#1F2937', fillColor: '#F9FAFB', alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
    ])
  }

  // Viaticos
  if (data.comisionesTikin.montoBaseViaticos > 0) {
    commissionRows.push([
      { text: 'Viaticos', fontSize: 9, color: '#4B5563', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
      { text: fmt(data.comisionesTikin.montoBaseViaticos), fontSize: 9, color: '#1F2937', alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
      { text: '1.25%', fontSize: 9, color: '#1F2937', alignment: 'center', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
      { text: fmt(data.comisionesTikin.feeBaseViaticos), fontSize: 9, color: '#1F2937', alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
    ])
  }

  // Dotacion (obligatoria, no fee)
  if (data.comisionesTikin.montoDotacion > 0) {
    commissionRows.push([
      { text: 'Dotacion (obligatoria)', fontSize: 9, color: '#4B5563', fillColor: '#F9FAFB', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
      { text: fmt(data.comisionesTikin.montoDotacion), fontSize: 9, color: '#1F2937', fillColor: '#F9FAFB', alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
      { text: '-', fontSize: 9, color: '#9CA3AF', fillColor: '#F9FAFB', alignment: 'center', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
      { text: fmt(0), fontSize: 9, color: '#9CA3AF', fillColor: '#F9FAFB', alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
    ])
  }

  // Separator
  commissionRows.push([
    { text: '', colSpan: 4, fillColor: '#E5E7EB', border: [false, false, false, false], fontSize: 1 },
    {},
    {},
    {},
  ])

  // Subtotal Fees
  commissionRows.push([
    { text: 'Subtotal Fees', fontSize: 10, bold: true, color: '#1F2937', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
    { text: '', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
    { text: '', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
    { text: fmt(data.comisionesTikin.feeTotal), fontSize: 10, bold: true, color: '#1F2937', alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
  ])

  // IVA
  commissionRows.push([
    { text: 'IVA (19%)', fontSize: 9, color: '#4B5563', fillColor: '#F9FAFB', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
    { text: '', fillColor: '#F9FAFB', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
    { text: '', fillColor: '#F9FAFB', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
    { text: fmt(data.comisionesTikin.iva), fontSize: 9, color: '#1F2937', fillColor: '#F9FAFB', alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
  ])

  // Total Mensual
  commissionRows.push([
    { text: 'Total Mensual', fontSize: 11, bold: true, color: '#E63946', fillColor: '#FEF2F2', border: [false, false, false, false] },
    { text: '', fillColor: '#FEF2F2', border: [false, false, false, false] },
    { text: '', fillColor: '#FEF2F2', border: [false, false, false, false] },
    { text: fmt(data.comisionesTikin.totalConIva), fontSize: 11, bold: true, color: '#E63946', fillColor: '#FEF2F2', alignment: 'right', border: [false, false, false, false] },
  ])

  // Total Anual
  commissionRows.push([
    { text: 'Total Anual', fontSize: 11, bold: true, color: '#1F2937', fillColor: '#E5E7EB', border: [false, false, false, false] },
    { text: '', fillColor: '#E5E7EB', border: [false, false, false, false] },
    { text: '', fillColor: '#E5E7EB', border: [false, false, false, false] },
    { text: fmt(data.comisionesTikin.totalConIva * 12), fontSize: 11, bold: true, color: '#1F2937', fillColor: '#E5E7EB', alignment: 'right', border: [false, false, false, false] },
  ])

  const page4Comisiones: any = {
    margin: [40, 40, 40, 40],
    stack: [
      // Logo
      { text: 'Tikin.', fontSize: 20, bold: true, color: '#1F2937', margin: [0, 0, 0, 20] },

      // Section title
      {
        text: 'COSTOS DEL SERVICIO TIKIN',
        fontSize: 22,
        bold: true,
        color: '#FFFFFF',
        fillColor: '#1F2937',
        margin: [-40, 0, -40, 0],
        padding: [40, 12, 40, 12],
        alignment: 'center',
      },

      { text: 'Pricing simple y transparente', fontSize: 11, color: '#6B7280', margin: [0, 20, 0, 20], alignment: 'center' },

      // Commission table
      {
        table: {
          widths: ['35%', '25%', '15%', '25%'],
          headerRows: 1,
          body: commissionRows,
        },
        layout: {
          paddingLeft: () => 10,
          paddingRight: () => 10,
          paddingTop: () => 8,
          paddingBottom: () => 8,
        },
      },

      // Net benefit box (green)
      {
        margin: [0, 25, 0, 0],
        stack: [
          {
            canvas: [
              { type: 'rect', x: 0, y: 0, w: 515, h: 90, color: '#D1FAE5', r: 6 },
            ],
          },
          {
            margin: [20, -75, 20, 0],
            stack: [
              { text: 'BENEFICIO NETO PARA TU EMPRESA', fontSize: 13, bold: true, color: '#059669', margin: [0, 0, 0, 12], alignment: 'center' },
              {
                columns: [
                  {
                    width: '50%',
                    stack: [
                      { text: 'Beneficio Neto Mensual', fontSize: 10, color: '#6B7280', margin: [0, 0, 0, 4], alignment: 'center' },
                      { text: fmt(data.ahorrosEstimados.beneficioNetoMensual), fontSize: 18, bold: true, color: '#059669', alignment: 'center' },
                    ],
                  },
                  {
                    width: '50%',
                    stack: [
                      { text: 'Beneficio Neto Anual', fontSize: 10, color: '#6B7280', margin: [0, 0, 0, 4], alignment: 'center' },
                      { text: fmt(data.ahorrosEstimados.beneficioNetoAnual), fontSize: 18, bold: true, color: '#059669', alignment: 'center' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    pageBreak: 'after',
  }

  // =====================================================================
  // PAGE 5: AHORRO ESTIMADO
  // =====================================================================
  const monthlyNet = data.ahorrosEstimados.beneficioNetoMensual
  const projectionBody: any[][] = [
    [
      { text: 'Mes', fontSize: 8, bold: true, color: '#FFFFFF', fillColor: '#1F2937', alignment: 'center', border: [false, false, false, false] },
      { text: 'Ahorro Acumulado', fontSize: 8, bold: true, color: '#FFFFFF', fillColor: '#1F2937', alignment: 'right', border: [false, false, false, false] },
    ],
  ]
  for (let m = 1; m <= 12; m++) {
    const bg = m % 2 === 0 ? '#F9FAFB' : '#FFFFFF'
    const isLast = m === 12
    projectionBody.push([
      {
        text: `Mes ${m}`,
        fontSize: 8,
        color: isLast ? '#059669' : '#4B5563',
        bold: isLast,
        fillColor: isLast ? '#F0FDF4' : bg,
        alignment: 'center',
        border: [false, false, false, true],
        borderColor: ['', '', '', '#E5E7EB'],
      },
      {
        text: fmt(monthlyNet * m),
        fontSize: 8,
        color: isLast ? '#059669' : '#1F2937',
        bold: isLast,
        fillColor: isLast ? '#F0FDF4' : bg,
        alignment: 'right',
        border: [false, false, false, true],
        borderColor: ['', '', '', '#E5E7EB'],
      },
    ])
  }

  const page5Ahorros: any = {
    margin: [40, 40, 40, 40],
    stack: [
      // Logo
      { text: 'Tikin.', fontSize: 20, bold: true, color: '#1F2937', margin: [0, 0, 0, 20] },

      // Section title
      {
        text: 'AHORRO ESTIMADO CON TIKIN',
        fontSize: 22,
        bold: true,
        color: '#FFFFFF',
        fillColor: '#1F2937',
        margin: [-40, 0, -40, 0],
        padding: [40, 12, 40, 12],
        alignment: 'center',
      },

      // Three savings category cards
      {
        margin: [0, 20, 0, 0],
        columns: [
          {
            width: '33%',
            stack: [
              {
                canvas: [
                  { type: 'rect', x: 0, y: 0, w: 160, h: 85, color: '#EFF6FF', r: 6 },
                ],
              },
              {
                margin: [12, -72, 5, 0],
                stack: [
                  { text: 'Seguridad Social', fontSize: 9, bold: true, color: '#2563EB', margin: [0, 0, 0, 3] },
                  { text: 'Salud + Pension + ARL', fontSize: 7, color: '#6B7280', margin: [0, 0, 0, 6] },
                  { text: fmt(data.ahorrosEstimados.ahorroSeguridadSocial), fontSize: 14, bold: true, color: '#2563EB' },
                  { text: '/mes', fontSize: 7, color: '#6B7280' },
                ],
              },
            ],
          },
          {
            width: '33%',
            stack: [
              {
                canvas: [
                  { type: 'rect', x: 5, y: 0, w: 160, h: 85, color: '#F0FDF4', r: 6 },
                ],
              },
              {
                margin: [17, -72, 5, 0],
                stack: [
                  { text: 'Parafiscales', fontSize: 9, bold: true, color: '#059669', margin: [0, 0, 0, 3] },
                  { text: 'SENA + ICBF + Caja', fontSize: 7, color: '#6B7280', margin: [0, 0, 0, 6] },
                  { text: fmt(data.ahorrosEstimados.ahorroParafiscales), fontSize: 14, bold: true, color: '#059669' },
                  { text: '/mes', fontSize: 7, color: '#6B7280' },
                ],
              },
            ],
          },
          {
            width: '33%',
            stack: [
              {
                canvas: [
                  { type: 'rect', x: 10, y: 0, w: 160, h: 85, color: '#FEF2F2', r: 6 },
                ],
              },
              {
                margin: [22, -72, 5, 0],
                stack: [
                  { text: 'Prestaciones Sociales', fontSize: 9, bold: true, color: '#E63946', margin: [0, 0, 0, 3] },
                  { text: 'Prima + Cesantias + Int. + Vac.', fontSize: 7, color: '#6B7280', margin: [0, 0, 0, 6] },
                  { text: fmt(data.ahorrosEstimados.ahorroPrestaciones), fontSize: 14, bold: true, color: '#E63946' },
                  { text: '/mes', fontSize: 7, color: '#6B7280' },
                ],
              },
            ],
          },
        ],
      },

      // Summary box
      {
        margin: [0, 20, 0, 0],
        table: {
          widths: ['60%', '40%'],
          body: [
            [
              { text: 'Ahorro Bruto Mensual', fontSize: 10, color: '#4B5563', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
              { text: fmt(data.ahorrosEstimados.ahorroMensualEstimado), fontSize: 10, color: '#1F2937', alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
            ],
            [
              { text: 'Comision Tikin', fontSize: 10, color: '#E63946', fillColor: '#FEF2F2', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
              { text: `- ${fmt(data.ahorrosEstimados.comisionTikinMensual)}`, fontSize: 10, color: '#E63946', fillColor: '#FEF2F2', alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
            ],
            [
              { text: 'Beneficio Neto Mensual', fontSize: 11, bold: true, color: '#059669', fillColor: '#D1FAE5', border: [false, false, false, false] },
              { text: fmt(data.ahorrosEstimados.beneficioNetoMensual), fontSize: 11, bold: true, color: '#059669', fillColor: '#D1FAE5', alignment: 'right', border: [false, false, false, false] },
            ],
            [
              { text: '', colSpan: 2, border: [false, false, false, false], fontSize: 4 },
              {},
            ],
            [
              { text: 'Ahorro Bruto Anual', fontSize: 10, color: '#4B5563', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
              { text: fmt(data.ahorrosEstimados.ahorroAnualEstimado), fontSize: 10, color: '#1F2937', alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
            ],
            [
              { text: 'Comision Tikin Anual', fontSize: 10, color: '#E63946', fillColor: '#FEF2F2', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
              { text: `- ${fmt(data.ahorrosEstimados.comisionTikinAnual)}`, fontSize: 10, color: '#E63946', fillColor: '#FEF2F2', alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', '#E5E7EB'] },
            ],
            [
              { text: 'Beneficio Neto Anual', fontSize: 12, bold: true, color: '#059669', fillColor: '#D1FAE5', border: [false, false, false, false] },
              { text: fmt(data.ahorrosEstimados.beneficioNetoAnual), fontSize: 12, bold: true, color: '#059669', fillColor: '#D1FAE5', alignment: 'right', border: [false, false, false, false] },
            ],
          ],
        },
        layout: {
          paddingLeft: () => 12,
          paddingRight: () => 12,
          paddingTop: () => 7,
          paddingBottom: () => 7,
        },
      },

      // 12-month projection table
      {
        margin: [0, 20, 0, 0],
        stack: [
          { text: 'Proyeccion Acumulada (12 meses)', fontSize: 11, bold: true, color: '#1F2937', margin: [0, 0, 0, 10] },
          {
            table: {
              widths: ['50%', '50%'],
              headerRows: 1,
              body: projectionBody,
            },
            layout: {
              paddingLeft: () => 10,
              paddingRight: () => 10,
              paddingTop: () => 4,
              paddingBottom: () => 4,
            },
          },
        ],
      },

      // Disclaimer with factoresVariables
      ...(data.ahorrosEstimados.factoresVariables.length > 0
        ? [
            {
              margin: [0, 15, 0, 0],
              stack: [
                {
                  canvas: [
                    { type: 'rect', x: 0, y: 0, w: 515, h: 8 + data.ahorrosEstimados.factoresVariables.length * 14, color: '#FFFBEB', r: 4 },
                  ],
                },
                {
                  margin: [10, -(8 + data.ahorrosEstimados.factoresVariables.length * 14) + 5, 10, 0],
                  stack: [
                    { text: 'Nota: Las estimaciones pueden variar segun:', fontSize: 7, bold: true, color: '#D97706', margin: [0, 0, 0, 3] },
                    ...data.ahorrosEstimados.factoresVariables.map((f: string) => ({
                      text: `- ${f}`,
                      fontSize: 7,
                      color: '#92400E',
                      margin: [0, 0, 0, 2],
                    })),
                  ],
                },
              ],
            },
          ]
        : []),
    ],
    pageBreak: 'after',
  }

  // =====================================================================
  // PAGE 6: TERMINOS Y SIGUIENTE PASO
  // =====================================================================
  const page6Terminos: any = {
    margin: [40, 40, 40, 40],
    stack: [
      // Logo
      { text: 'Tikin.', fontSize: 20, bold: true, color: '#1F2937', margin: [0, 0, 0, 20] },

      // Section title
      {
        text: 'SIGUIENTE PASO',
        fontSize: 22,
        bold: true,
        color: '#FFFFFF',
        fillColor: '#1F2937',
        margin: [-40, 0, -40, 0],
        padding: [40, 12, 40, 12],
        alignment: 'center',
      },

      // Implementation timeline (4 steps)
      {
        margin: [0, 25, 0, 0],
        stack: [
          { text: 'Nuestro proceso de implementacion', fontSize: 12, bold: true, color: '#1F2937', margin: [0, 0, 0, 15] },
          {
            columns: [
              {
                width: '25%',
                stack: [
                  {
                    canvas: [
                      { type: 'ellipse', x: 15, y: 15, r1: 15, r2: 15, color: '#E63946' },
                    ],
                  },
                  { text: '1', fontSize: 11, bold: true, color: '#FFFFFF', alignment: 'center', margin: [0, -22, 0, 0] },
                  { text: 'Analisis', fontSize: 9, bold: true, color: '#1F2937', alignment: 'center', margin: [0, 10, 0, 3] },
                  { text: '1 dia', fontSize: 7, color: '#6B7280', alignment: 'center' },
                ],
              },
              {
                width: '25%',
                stack: [
                  {
                    canvas: [
                      { type: 'ellipse', x: 15, y: 15, r1: 15, r2: 15, color: '#059669' },
                    ],
                  },
                  { text: '2', fontSize: 11, bold: true, color: '#FFFFFF', alignment: 'center', margin: [0, -22, 0, 0] },
                  { text: 'Configuracion', fontSize: 9, bold: true, color: '#1F2937', alignment: 'center', margin: [0, 10, 0, 3] },
                  { text: '2-3 dias', fontSize: 7, color: '#6B7280', alignment: 'center' },
                ],
              },
              {
                width: '25%',
                stack: [
                  {
                    canvas: [
                      { type: 'ellipse', x: 15, y: 15, r1: 15, r2: 15, color: '#2563EB' },
                    ],
                  },
                  { text: '3', fontSize: 11, bold: true, color: '#FFFFFF', alignment: 'center', margin: [0, -22, 0, 0] },
                  { text: 'Implementacion', fontSize: 9, bold: true, color: '#1F2937', alignment: 'center', margin: [0, 10, 0, 3] },
                  { text: '1 dia', fontSize: 7, color: '#6B7280', alignment: 'center' },
                ],
              },
              {
                width: '25%',
                stack: [
                  {
                    canvas: [
                      { type: 'ellipse', x: 15, y: 15, r1: 15, r2: 15, color: '#7C3AED' },
                    ],
                  },
                  { text: '4', fontSize: 11, bold: true, color: '#FFFFFF', alignment: 'center', margin: [0, -22, 0, 0] },
                  { text: 'Seguimiento', fontSize: 9, bold: true, color: '#1F2937', alignment: 'center', margin: [0, 10, 0, 3] },
                  { text: 'Continuo', fontSize: 7, color: '#6B7280', alignment: 'center' },
                ],
              },
            ],
          },
        ],
      },

      // Legal disclaimer
      {
        margin: [0, 30, 0, 0],
        stack: [
          { text: 'Consideraciones Legales', fontSize: 11, bold: true, color: '#1F2937', margin: [0, 0, 0, 10] },
          {
            text: 'Esta propuesta ha sido desarrollada por Tikin y se mantendra bajo su propiedad hasta el momento en que una aceptacion formal se perfeccione. Sus contenidos no podran ser revelados a ningun tercero, asi como tampoco los conceptos originales desarrollados para Tikin podran ser utilizados con fines comerciales.',
            fontSize: 8,
            color: '#6B7280',
            lineHeight: 1.4,
            margin: [0, 0, 0, 8],
          },
          {
            text: 'Los bonos de mera liberalidad estan respaldados por el articulo 128 del Codigo Sustantivo del Trabajo y permiten optimizar la estructura salarial cumpliendo todas las regulaciones colombianas. Las estimaciones presentadas son indicativas y pueden variar segun las condiciones particulares de cada empresa.',
            fontSize: 8,
            color: '#6B7280',
            lineHeight: 1.4,
            margin: [0, 0, 0, 8],
          },
          {
            text: 'AVISO DE PRIVACIDAD: Usted recibe la siguiente oferta comercial por solicitud propia y de esta forma acepta nuestra politica para el tratamiento de datos personales, de lo contrario es importante que reporte inmediatamente el incidente al siguiente correo electronico: info@tikin.co',
            fontSize: 7,
            color: '#9CA3AF',
            lineHeight: 1.3,
            margin: [0, 0, 0, 15],
          },
        ],
      },

      // Contact info
      {
        margin: [0, 10, 0, 0],
        stack: [
          {
            canvas: [
              { type: 'rect', x: 0, y: 0, w: 515, h: 60, color: '#E63946', r: 8 },
            ],
          },
          {
            margin: [30, -45, 30, 0],
            columns: [
              {
                width: '*',
                stack: [
                  { text: 'Contactanos', fontSize: 14, bold: true, color: '#FFFFFF', margin: [0, 0, 0, 5] },
                  { text: 'alejandro@tikin.co | +57 310 458 2460', fontSize: 10, color: 'rgba(255,255,255,0.9)' },
                ],
              },
              {
                width: 'auto',
                stack: [
                  { text: 'Alejandro Almeida', fontSize: 10, bold: true, color: '#FFFFFF', margin: [0, 5, 0, 2] },
                  { text: 'Growth Manager', fontSize: 8, color: 'rgba(255,255,255,0.8)' },
                ],
              },
            ],
          },
        ],
      },

      // Signature space
      {
        margin: [0, 25, 0, 0],
        stack: [
          {
            canvas: [
              { type: 'rect', x: 0, y: 0, w: 515, h: 90, color: '#F9FAFB', r: 6 },
            ],
          },
          {
            margin: [20, -75, 20, 0],
            stack: [
              { text: 'Firma del representante legal', fontSize: 10, color: '#9CA3AF', margin: [0, 0, 0, 40] },
              {
                canvas: [
                  { type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1, lineColor: '#D1D5DB' },
                ],
              },
            ],
          },
        ],
      },

      // Copyright footer
      {
        margin: [0, 25, 0, 0],
        text: '(c) 2026 Tikin. Todos los derechos reservados.',
        fontSize: 8,
        bold: true,
        color: '#E63946',
        alignment: 'center',
      },
    ],
  }

  // =====================================================================
  // DOCUMENT DEFINITION
  // =====================================================================
  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [0, 0, 0, 0],
    content: [
      page1Portada,
      page2Resumen,
      page3Lotes,
      page4Comisiones,
      page5Ahorros,
      page6Terminos,
    ],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
      color: '#1F2937',
    },
  }

  const safeCompanyName = companyName.replace(/\s+/g, '_')
  const dateStr = new Date().toISOString().split('T')[0]
  const filename = `Cotizacion_Tikin_2.0_${safeCompanyName}_${dateStr}.pdf`

  pdfMake.createPdf(docDefinition).download(filename)
}
