import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import swal from 'sweetalert'
import Layout from '../../components/ui/Layout'
import type { RootState } from '../../store'
import { Supplier, getSuppliers } from '../../services/supplierService'

interface RemisionItem {
  id: string // ID único temporal generado en el cliente
  item_id: string
  descripcion: string
  graficos: string
  color_prim: string
  color_sec: string
  visor: string
  talla: string
  ean: string
  pedido: string
  remision: string
  cantidad: number
  um: string
  valor_unitario: number
  descuento_1: string
  descuento_2: string
  descuento_3: string
  valor_descuento: string
  total: number
}

function supplierLabel(supplier: Supplier) {
  return `${supplier.document_number} - ${supplier.company_name}`
}

function sortSuppliers(suppliers: Supplier[]) {
  return [...suppliers]
    .sort((a, b) => supplierLabel(a).localeCompare(supplierLabel(b), 'es', { sensitivity: 'base' }))
    .slice(0, 10)
}

function parseMoney(val: any): number {
  if (val === undefined || val === null) return 0
  if (typeof val === 'number') return val
  let s = val.toString().replace(/[\$\s]/g, '')
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(/,/g, '.')
  } else if (s.includes(',')) {
    const parts = s.split(',')
    if (parts[1].length === 2) {
      s = s.replace(/,/g, '.')
    } else {
      s = s.replace(/,/g, '')
    }
  } else if (s.includes('.')) {
    const parts = s.split('.')
    if (parts[1].length !== 2) {
      s = s.replace(/\./g, '')
    }
  }
  const parsed = parseFloat(s)
  return isNaN(parsed) ? 0 : parsed
}

function parseQty(val: any): number {
  if (val === undefined || val === null) return 0
  if (typeof val === 'number') return val
  const cleaned = val.toString().replace(/[^0-9]/g, '')
  const parsed = parseInt(cleaned, 10)
  return isNaN(parsed) ? 0 : parsed
}

interface SearchableDropdownProps {
  id: string
  value: string
  onChange: (value: string) => void
  options: { label: string; value: string }[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

function SearchableDropdown({
  id,
  value,
  onChange,
  options,
  placeholder,
  className,
  disabled
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="position-relative" ref={wrapperRef}>
      <input
        id={id}
        type="text"
        className={`form-control ${className || ''}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        autoComplete="off"
        disabled={disabled}
      />
      {isOpen && options.length > 0 && !disabled && (
        <ul
          className="dropdown-menu show w-100 position-absolute shadow-sm"
          style={{ maxHeight: '200px', overflowY: 'auto', zIndex: 1050, marginTop: '4px' }}
        >
          {options.map((opt, index) => (
            <li key={index}>
              <button
                type="button"
                className="dropdown-item text-truncate"
                onClick={() => {
                  onChange(opt.label)
                  setIsOpen(false)
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:8000`

const initialItemFormState = {
  item_id: '',
  descripcion: '',
  graficos: '',
  color_prim: '',
  color_sec: '',
  visor: '',
  talla: '',
  ean: '',
  pedido: '',
  remision: '',
  cantidad: '',
  um: '',
  valor_unitario: '',
  descuento_1: '',
  descuento_2: '',
  descuento_3: '',
  valor_descuento: ''
}

export default function ProcesarRemisionesPage() {
  const { user } = useSelector((state: RootState) => state.auth)

  // Proveedores
  const [supplierOptions, setSupplierOptions] = useState<Supplier[]>([])
  const [supplierQuery, setSupplierQuery] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  // Archivo PDF
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estado general
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<RemisionItem[]>([])
  const [encabezado, setEncabezado] = useState<any>(null)
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [tableSearch, setTableSearch] = useState('')

  // Modales y Edición
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<RemisionItem | null>(null)
  const [form, setForm] = useState<any>(initialItemFormState)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(value || 0)

  const loadSuppliers = async (search?: string) => {
    try {
      const data = await getSuppliers(1, 100, search || undefined, true)
      setSupplierOptions(sortSuppliers(data.results))
    } catch (error: any) {
      swal('Error', error.message || 'No se pudieron cargar los proveedores', 'error')
    }
  }

  useEffect(() => {
    loadSuppliers()
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => loadSuppliers(supplierQuery), 250)
    return () => window.clearTimeout(timer)
  }, [supplierQuery])

  useEffect(() => {
    setPage(1)
  }, [tableSearch])

  const resolveSupplier = (value: string) => {
    const normalized = value.trim().toLowerCase()
    return supplierOptions.find((supplier) => supplierLabel(supplier).toLowerCase() === normalized) || null
  }

  const handleSupplierChange = (value: string) => {
    setSupplierQuery(value)
    const supplier = resolveSupplier(value)
    setSelectedSupplier(supplier)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
        swal('Formato no válido', 'Por favor selecciona un archivo PDF.', 'warning')
        setFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }
      setFile(selectedFile)
    }
  }

  const handleProcessPdf = async () => {
    if (!file) {
      swal('Atención', 'Por favor selecciona un archivo PDF primero.', 'warning')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${apiBaseUrl}/api/v1/procesarRemisionPdf/procesa-remision`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.detail || 'Error al procesar el archivo PDF')
      }

      const data = await response.json()
      setEncabezado(data.encabezado)

      // Convertir detalles a RemisionItem con datos numéricos parsed
      const detailsList: RemisionItem[] = (data.detalle || []).map((det: any, index: number) => {
        const qty = parseQty(det.cantidad)
        const unitVal = parseMoney(det.valor_unitario)
        return {
          id: `raw-${index}-${Date.now()}`,
          item_id: det.item_id || '',
          descripcion: det.descripcion || '',
          graficos: det.graficos || '',
          color_prim: det.color_prim || '',
          color_sec: det.color_sec || '',
          visor: det.visor || '',
          talla: det.talla || '',
          ean: det.ean || '',
          pedido: det.pedido || '',
          remision: det.remision || '',
          cantidad: qty,
          um: det.um || '',
          valor_unitario: unitVal,
          descuento_1: det.descuento_1 || '',
          descuento_2: det.descuento_2 || '',
          descuento_3: det.descuento_3 || '',
          valor_descuento: det.valor_descuento || '',
          total: qty * unitVal
        }
      })

      setRecords(detailsList)
      setPage(1)
      swal('Procesado', 'El PDF ha sido procesado exitosamente.', 'success')
    } catch (error: any) {
      swal('Error de Operación', error.message || 'Ocurrió un error al procesar el archivo', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleClearAll = () => {
    setSelectedSupplier(null)
    setSupplierQuery('')
    setFile(null)
    setRecords([])
    setEncabezado(null)
    setPage(1)
    if (fileInputRef.current) fileInputRef.current.value = ''
    swal('Limpiado', 'Todos los campos y resultados han sido limpiados.', 'success')
  }

  const handleSaveRemision = () => {
    swal({
      title: 'Guardar Remisión',
      text: 'Esta funcionalidad de persistencia no está implementada en el backend todavía.',
      icon: 'info',
      buttons: ['Aceptar', false]
    })
  }

  const handleDeleteRow = (item: RemisionItem) => {
    swal({
      title: '¿Estás seguro?',
      text: `Eliminarás la fila con el producto "${item.descripcion || item.item_id}" de esta tabla.`,
      icon: 'warning',
      buttons: ['Cancelar', 'Sí, eliminar'],
      dangerMode: true
    }).then((willDelete) => {
      if (willDelete) {
        setRecords((current) => {
          const updated = current.filter((r) => r.id !== item.id)
          const newTotalPages = Math.ceil(updated.length / pageSize) || 1
          setPage((prevPage) => (prevPage > newTotalPages ? newTotalPages : prevPage))
          return updated
        })
        swal('Eliminado', 'La fila ha sido removida de la tabla.', 'success')
      }
    })
  }

  const handleOpenAddModal = () => {
    setEditingItem(null)
    setForm(initialItemFormState)
    setErrors({})
    setShowModal(true)
  }

  const handleOpenEditModal = (item: RemisionItem) => {
    setEditingItem(item)
    setForm({
      item_id: item.item_id,
      descripcion: item.descripcion,
      graficos: item.graficos,
      color_prim: item.color_prim,
      color_sec: item.color_sec,
      visor: item.visor,
      talla: item.talla,
      ean: item.ean,
      pedido: item.pedido,
      remision: item.remision,
      cantidad: item.cantidad.toString(),
      um: item.um,
      valor_unitario: item.valor_unitario.toString(),
      descuento_1: item.descuento_1,
      descuento_2: item.descuento_2,
      descuento_3: item.descuento_3,
      valor_descuento: item.valor_descuento
    })
    setErrors({})
    setShowModal(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((current: any) => ({ ...current, [name]: value }))
  }

  const validateForm = () => {
    const tempErrors: Record<string, string> = {}
    if (!form.item_id.trim()) tempErrors.item_id = 'El ID del ítem es obligatorio'
    if (!form.descripcion.trim()) tempErrors.descripcion = 'La descripción es obligatoria'
    
    const qty = parseInt(form.cantidad, 10)
    if (isNaN(qty) || qty <= 0) {
      tempErrors.cantidad = 'La cantidad debe ser un número entero mayor que 0'
    }

    const price = parseFloat(form.valor_unitario)
    if (isNaN(price) || price < 0) {
      tempErrors.valor_unitario = 'El precio unitario debe ser un número positivo'
    }

    setErrors(tempErrors)
    return Object.keys(tempErrors).length === 0
  }

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const parsedQty = parseInt(form.cantidad, 10)
    const parsedPrice = parseFloat(form.valor_unitario)

    if (editingItem) {
      // Editar item existente
      setRecords((current) =>
        current.map((rec) => {
          if (rec.id === editingItem.id) {
            return {
              ...rec,
              item_id: form.item_id,
              descripcion: form.descripcion,
              graficos: form.graficos,
              color_prim: form.color_prim,
              color_sec: form.color_sec,
              visor: form.visor,
              talla: form.talla,
              ean: form.ean,
              pedido: form.pedido,
              remision: form.remision,
              cantidad: parsedQty,
              um: form.um,
              valor_unitario: parsedPrice,
              descuento_1: form.descuento_1,
              descuento_2: form.descuento_2,
              descuento_3: form.descuento_3,
              valor_descuento: form.valor_descuento,
              total: parsedQty * parsedPrice
            }
          }
          return rec
        })
      )
      swal('Fila Actualizada', 'Los datos del ítem se han modificado.', 'success')
    } else {
      // Agregar nuevo item
      const newItem: RemisionItem = {
        id: `new-${Date.now()}`,
        item_id: form.item_id,
        descripcion: form.descripcion,
        graficos: form.graficos,
        color_prim: form.color_prim,
        color_sec: form.color_sec,
        visor: form.visor,
        talla: form.talla,
        ean: form.ean,
        pedido: form.pedido,
        remision: form.remision,
        cantidad: parsedQty,
        um: form.um || 'UN',
        valor_unitario: parsedPrice,
        descuento_1: form.descuento_1,
        descuento_2: form.descuento_2,
        descuento_3: form.descuento_3,
        valor_descuento: form.valor_descuento,
        total: parsedQty * parsedPrice
      }
      setRecords((current) => [...current, newItem])
      swal('Fila Agregada', 'Se ha agregado el nuevo ítem al detalle.', 'success')
    }

    setShowModal(false)
  }

  // Totales de la remisión
  const calculatedGrandTotal = records.reduce((acc, curr) => acc + curr.total, 0)
  const calculatedTotalItems = records.reduce((acc, curr) => acc + curr.cantidad, 0)
  const filteredRecords = records.filter((rec) => {
    if (!tableSearch.trim()) return true
    const query = tableSearch.toLowerCase()
    return (
      (rec.item_id || '').toLowerCase().includes(query) ||
      (rec.descripcion || '').toLowerCase().includes(query) ||
      (rec.ean || '').toLowerCase().includes(query) ||
      (rec.talla || '').toLowerCase().includes(query)
    )
  })
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1
  const displayedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize)

  return (
    <Layout>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
        <div>
          <h1 className="h2 mb-1 fw-bold text-success-dark">Procesar Remisiones</h1>
          <p className="text-muted mb-0">Gestión, validación y edición de remisiones desde archivos PDF</p>
        </div>
      </div>

      {/* Tarjeta de Configuración/Carga */}
      <div className="card shadow-sm border-0 rounded-4 mb-4">
        <div className="card-body p-4">
          <div className="row g-3">
            {/* Columna Proveedor */}
            <div className="col-12 col-md-5">
              <label htmlFor="supplier-select" className="form-label small fw-bold mb-1">
                Proveedor *
              </label>
              <SearchableDropdown
                id="supplier-select"
                placeholder="Buscar por NIT o nombre del proveedor"
                value={supplierQuery}
                onChange={handleSupplierChange}
                options={supplierOptions.map((supplier) => ({
                  label: supplierLabel(supplier),
                  value: supplier.id.toString()
                }))}
              />
              {selectedSupplier && (
                <div className="mt-2 small text-success">
                  <strong>Proveedor Seleccionado:</strong> {selectedSupplier.company_name} (NIT: {selectedSupplier.document_number})
                </div>
              )}
            </div>

            {/* Columna Archivo PDF */}
            <div className="col-12 col-md-5">
              <label htmlFor="pdf-file" className="form-label small fw-bold mb-1">
                Archivo de Remisión (PDF) *
              </label>
              <input
                id="pdf-file"
                type="file"
                className="form-control"
                accept=".pdf"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
              {file && (
                <div className="mt-2 small text-muted">
                  <strong>Archivo cargado:</strong> {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            {/* Botón de Procesamiento */}
            <div className="col-12 col-md-2 d-flex align-items-end">
              <button
                type="button"
                className="btn btn-success w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={handleProcessPdf}
                disabled={loading || !file}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <span>⚙️</span>
                    <span>Procesar PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Datos del encabezado extraído */}
      {encabezado && (
        <div className="card shadow-sm border-0 rounded-4 mb-4 bg-light">
          <div className="card-body p-4">
            <h5 className="fw-bold text-success-dark mb-3">Datos del PDF Extraídos</h5>
            <div className="row g-3 small">
              <div className="col-12 col-sm-6 col-md-4">
                <strong>Proveedor en PDF:</strong> {encabezado.proveedor || '-'}
              </div>
              <div className="col-12 col-sm-6 col-md-4">
                <strong>NIT Proveedor:</strong> {encabezado.nit_proveedor || '-'}
              </div>
              <div className="col-12 col-sm-6 col-md-4">
                <strong>Factura/Remisión No:</strong> {encabezado.factura_no || '-'}
              </div>
              <div className="col-12 col-sm-6 col-md-4">
                <strong>Fecha Generación:</strong> {encabezado.fecha_generacion || '-'}
              </div>
              <div className="col-12 col-sm-6 col-md-4">
                <strong>Forma de Pago:</strong> {encabezado.forma_pago || '-'}
              </div>
              <div className="col-12 col-sm-6 col-md-4">
                <strong>Valor Bruto:</strong> {encabezado.valor_bruto || '-'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla del detalle */}
      <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
        <div className="card-header bg-white border-0 py-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 className="mb-0 fw-bold text-success-dark">Detalle de la Remisión</h5>
          <div className="d-flex align-items-center gap-2 flex-grow-1 justify-content-md-end" style={{ maxWidth: '400px' }}>
            <input
              type="text"
              className="form-control form-control-sm rounded-3"
              placeholder="Buscar por ID, descripción o referencia..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
            />
            {tableSearch && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-3"
                onClick={() => setTableSearch('')}
              >
                Limpiar
              </button>
            )}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-primary d-flex align-items-center gap-1 rounded-3"
            onClick={handleOpenAddModal}
          >
            <span>+</span> Agregar Fila
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-success bg-opacity-10 text-success-dark">
              <tr>
                <th className="py-3 px-4">Item</th>
                <th className="py-3">Referencia / EAN</th>
                <th className="py-3">Descripción</th>
                <th className="py-3">Gráficos</th>
                <th className="py-3 text-center">Talla</th>
                <th className="py-3 text-center">Cantidad</th>
                <th className="py-3 text-end">Valor Unitario</th>
                <th className="py-3 text-end">Total</th>
                <th className="py-3 text-center px-4" style={{ width: '130px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-5">
                    <div className="spinner-border text-success" role="status">
                      <span className="visually-hidden">Cargando datos...</span>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted">
                    No hay ítems cargados en esta remisión. Carga un archivo PDF o haz clic en "+ Agregar Fila".
                  </td>
                </tr>
              ) : (
                displayedRecords.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 fw-bold">{item.item_id}</td>
                    <td><span className="font-monospace text-muted small">{item.ean || '-'}</span></td>
                    <td className="fw-semibold">{item.descripcion}</td>
                    <td>{item.graficos || '-'}</td>
                    <td className="text-center">
                      <span className="badge bg-light text-dark border py-1 px-2">{item.talla || '-'}</span>
                    </td>
                    <td className="text-center fw-bold">{item.cantidad}</td>
                    <td className="text-end font-monospace">{formatCurrency(item.valor_unitario)}</td>
                    <td className="text-end fw-bold font-monospace text-success-dark">
                      {formatCurrency(item.total)}
                    </td>
                    <td className="text-center px-4">
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary border-0 rounded-circle p-2"
                          onClick={() => handleOpenEditModal(item)}
                          title="Editar Fila"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger border-0 rounded-circle p-2"
                          onClick={() => handleDeleteRow(item)}
                          title="Eliminar Fila"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Resumen / Footer de la tarjeta de la tabla */}
        {records.length > 0 && (
          <div className="card-footer bg-light border-0 py-3 px-4 d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div className="d-flex gap-4 align-items-center flex-wrap">
              <span className="small text-muted">
                Total Ítems: <strong className="text-dark">{records.length}</strong>
              </span>
              <span className="small text-muted">
                Cantidad Total: <strong className="text-dark">{calculatedTotalItems}</strong>
              </span>
              <span className="small text-muted">
                Mostrando {displayedRecords.length} de {filteredRecords.length} registros {tableSearch && `(filtrados de ${records.length})`}
              </span>
            </div>
            {totalPages > 1 && (
              <nav aria-label="Page navigation">
                <ul className="pagination pagination-sm mb-0 gap-1">
                  <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                    <button type="button" className="page-link rounded-3 px-2.5 py-2" onClick={() => setPage(1)} title="Primera página">
                      «
                    </button>
                  </li>
                  <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                    <button type="button" className="page-link rounded-3 px-2.5 py-2" onClick={() => setPage(page - 1)} title="Anterior">
                      &lt;
                    </button>
                  </li>
                  <li className="page-item disabled">
                    <span className="page-link rounded-3 px-3 py-2 bg-light text-dark">
                      Página {page} de {totalPages}
                    </span>
                  </li>
                  <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                    <button type="button" className="page-link rounded-3 px-2.5 py-2" onClick={() => setPage(page + 1)} title="Siguiente">
                      &gt;
                    </button>
                  </li>
                  <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                    <button type="button" className="page-link rounded-3 px-2.5 py-2" onClick={() => setPage(totalPages)} title="Última página">
                      »
                    </button>
                  </li>
                </ul>
              </nav>
            )}
            <div className="fs-5 fw-bold text-success-dark">
              Total General: <span className="font-monospace">{formatCurrency(calculatedGrandTotal)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Botones de Acción de Pie de Página */}
      <div className="d-flex justify-content-end gap-3 mb-5">
        <button
          type="button"
          className="btn btn-outline-secondary px-4 rounded-3 py-2 fw-semibold"
          onClick={handleClearAll}
          disabled={loading || (records.length === 0 && !selectedSupplier && !file)}
        >
          Limpiar Todo
        </button>
        <button
          type="button"
          className="btn btn-success px-5 rounded-3 py-2 fw-bold shadow-sm"
          onClick={handleSaveRemision}
          disabled={loading || records.length === 0}
        >
          Guardar Remisión
        </button>
      </div>

      {/* Modal Agregar / Editar */}
      {showModal && (
        <>
          <div
            className="modal show d-block"
            tabIndex={-1}
            role="dialog"
            style={{ backgroundColor: 'rgba(15, 46, 24, 0.45)', backdropFilter: 'blur(4px)' }}
          >
            <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
              <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
                <div className="modal-header bg-success text-white p-3 border-0">
                  <h5 className="modal-title fw-bold">
                    {editingItem ? 'Editar Fila de Remisión' : 'Agregar Fila a la Remisión'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowModal(false)}
                    aria-label="Cerrar"
                  ></button>
                </div>
                <form onSubmit={handleModalSubmit}>
                  <div className="modal-body p-4" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                    <h6 className="text-success-dark fw-bold border-bottom pb-2 mb-3">
                      Información General del Ítem
                    </h6>

                    <div className="row g-3 mb-4">
                      {/* ID del Ítem */}
                      <div className="col-12 col-md-4">
                        <label htmlFor="item_id" className="form-label small fw-bold">
                          Item ID *
                        </label>
                        <input
                          type="text"
                          className={`form-control ${errors.item_id ? 'is-invalid' : ''}`}
                          id="item_id"
                          name="item_id"
                          value={form.item_id}
                          onChange={handleInputChange}
                        />
                        {errors.item_id && <div className="invalid-feedback">{errors.item_id}</div>}
                      </div>

                      {/* EAN */}
                      <div className="col-12 col-md-4">
                        <label htmlFor="ean" className="form-label small fw-bold">
                          Referencia / EAN
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="ean"
                          name="ean"
                          value={form.ean}
                          onChange={handleInputChange}
                        />
                      </div>

                      {/* Talla */}
                      <div className="col-12 col-md-4">
                        <label htmlFor="talla" className="form-label small fw-bold">
                          Talla
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="talla"
                          name="talla"
                          value={form.talla}
                          onChange={handleInputChange}
                        />
                      </div>

                      {/* Descripción */}
                      <div className="col-12">
                        <label htmlFor="descripcion" className="form-label small fw-bold">
                          Descripción *
                        </label>
                        <input
                          type="text"
                          className={`form-control ${errors.descripcion ? 'is-invalid' : ''}`}
                          id="descripcion"
                          name="descripcion"
                          value={form.descripcion}
                          onChange={handleInputChange}
                        />
                        {errors.descripcion && <div className="invalid-feedback">{errors.descripcion}</div>}
                      </div>
                    </div>

                    <h6 className="text-success-dark fw-bold border-bottom pb-2 mb-3">
                      Variantes e Identificación
                    </h6>
                    <div className="row g-3 mb-4">
                      {/* Gráficos */}
                      <div className="col-12 col-md-4">
                        <label htmlFor="graficos" className="form-label small fw-bold">
                          Gráficos
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="graficos"
                          name="graficos"
                          value={form.graficos}
                          onChange={handleInputChange}
                        />
                      </div>

                      {/* Color Primario */}
                      <div className="col-12 col-md-4">
                        <label htmlFor="color_prim" className="form-label small fw-bold">
                          Color Primario
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="color_prim"
                          name="color_prim"
                          value={form.color_prim}
                          onChange={handleInputChange}
                        />
                      </div>

                      {/* Color Secundario */}
                      <div className="col-12 col-md-4">
                        <label htmlFor="color_sec" className="form-label small fw-bold">
                          Color Secundario
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="color_sec"
                          name="color_sec"
                          value={form.color_sec}
                          onChange={handleInputChange}
                        />
                      </div>

                      {/* Visor */}
                      <div className="col-12 col-md-4">
                        <label htmlFor="visor" className="form-label small fw-bold">
                          Visor
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="visor"
                          name="visor"
                          value={form.visor}
                          onChange={handleInputChange}
                        />
                      </div>

                      {/* Pedido */}
                      <div className="col-12 col-md-4">
                        <label htmlFor="pedido" className="form-label small fw-bold">
                          Pedido
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="pedido"
                          name="pedido"
                          value={form.pedido}
                          onChange={handleInputChange}
                        />
                      </div>

                      {/* Remisión */}
                      <div className="col-12 col-md-4">
                        <label htmlFor="remision" className="form-label small fw-bold">
                          Remisión
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="remision"
                          name="remision"
                          value={form.remision}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <h6 className="text-success-dark fw-bold border-bottom pb-2 mb-3">
                      Cantidades y Valores
                    </h6>
                    <div className="row g-3">
                      {/* Cantidad */}
                      <div className="col-12 col-md-4">
                        <label htmlFor="cantidad" className="form-label small fw-bold">
                          Cantidad *
                        </label>
                        <input
                          type="number"
                          className={`form-control ${errors.cantidad ? 'is-invalid' : ''}`}
                          id="cantidad"
                          name="cantidad"
                          value={form.cantidad}
                          onChange={handleInputChange}
                        />
                        {errors.cantidad && <div className="invalid-feedback">{errors.cantidad}</div>}
                      </div>

                      {/* Valor Unitario */}
                      <div className="col-12 col-md-4">
                        <label htmlFor="valor_unitario" className="form-label small fw-bold">
                          Valor Unitario *
                        </label>
                        <div className="input-group">
                          <span className="input-group-text">$</span>
                          <input
                            type="number"
                            step="any"
                            className={`form-control ${errors.valor_unitario ? 'is-invalid' : ''}`}
                            id="valor_unitario"
                            name="valor_unitario"
                            value={form.valor_unitario}
                            onChange={handleInputChange}
                          />
                          {errors.valor_unitario && <div className="invalid-feedback">{errors.valor_unitario}</div>}
                        </div>
                      </div>

                      {/* Unidad de Medida */}
                      <div className="col-12 col-md-4">
                        <label htmlFor="um" className="form-label small fw-bold">
                          Unidad Medida (UM)
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="um"
                          name="um"
                          value={form.um}
                          onChange={handleInputChange}
                          placeholder="UN"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer bg-light border-0 p-3">
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-4"
                      onClick={() => setShowModal(false)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary px-4">
                      Guardar Fila
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" style={{ zIndex: 1040 }}></div>
        </>
      )}
    </Layout>
  )
}
