import { useState, useEffect } from 'react'
import swal from 'sweetalert'
import * as yup from 'yup'
import Layout from '../../components/ui/Layout'
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  toggleSupplierStatus,
  Supplier,
  SupplierCreateInput,
  SupplierUpdateInput
} from '../../services/supplierService'

const validationSchema = yup.object().shape({
  company_name: yup.string().required('La razón social es obligatoria').max(150, 'Máximo 150 caracteres'),
  document_number: yup.string().required('El número de documento es obligatorio').max(30, 'Máximo 30 caracteres'),
  document_type: yup.string().max(20, 'Máximo 20 caracteres').optional(),
  contact_name: yup.string().max(150, 'Máximo 150 caracteres').optional(),
  email: yup.string().email('Debe ser un correo electrónico válido').max(120, 'Máximo 120 caracteres').optional(),
  phone: yup.string().max(30, 'Máximo 30 caracteres').optional(),
  mobile: yup.string().max(30, 'Máximo 30 caracteres').optional(),
  address: yup.string().max(255, 'Máximo 255 caracteres').optional(),
  city: yup.string().max(100, 'Máximo 100 caracteres').optional(),
  country: yup.string().max(100, 'Máximo 100 caracteres').optional(),
  website: yup.string().max(255, 'Máximo 255 caracteres').optional(),
  bank_name: yup.string().max(100, 'Máximo 100 caracteres').optional(),
  bank_account: yup.string().max(100, 'Máximo 100 caracteres').optional(),
  is_active: yup.boolean().optional(),
  notes: yup.string().optional()
})

const initialFormState: SupplierCreateInput = {
  company_name: '',
  document_number: '',
  document_type: 'RUC',
  contact_name: '',
  email: '',
  phone: '',
  mobile: '',
  address: '',
  city: '',
  country: '',
  website: '',
  bank_name: '',
  bank_account: '',
  is_active: true,
  notes: ''
}

function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [loading, setLoading] = useState(false)

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [form, setForm] = useState<SupplierCreateInput>(initialFormState)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const activeParam =
        statusFilter === 'all' ? undefined : statusFilter === 'active'

      const data = await getSuppliers(page, pageSize, search || undefined, activeParam)
      setSuppliers(data.results)
      setTotal(data.total)
    } catch (error: any) {
      swal('Error', error.message || 'No se pudieron cargar los proveedores', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [page, statusFilter])

  // Buscar con retraso (debounce simple de teclado)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchSuppliers()
  }

  const handleOpenAddModal = () => {
    setEditingSupplier(null)
    setForm(initialFormState)
    setErrors({})
    setShowModal(true)
  }

  const handleOpenEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setForm({
      company_name: supplier.company_name,
      document_number: supplier.document_number,
      document_type: supplier.document_type || 'RUC',
      contact_name: supplier.contact_name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      mobile: supplier.mobile || '',
      address: supplier.address || '',
      city: supplier.city || '',
      country: supplier.country || '',
      website: supplier.website || '',
      bank_name: supplier.bank_name || '',
      bank_account: supplier.bank_account || '',
      is_active: supplier.is_active,
      notes: supplier.notes || ''
    })
    setErrors({})
    setShowModal(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setForm({ ...form, [name]: val })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      // Validar esquema
      await validationSchema.validate(form, { abortEarly: false })

      // Limpiar campos vacíos para enviar null al backend
      const payload: any = {}
      Object.keys(form).forEach((key) => {
        const value = (form as any)[key]
        payload[key] = value === '' ? undefined : value
      })

      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, payload as SupplierUpdateInput)
        swal('Completado', 'Proveedor actualizado exitosamente', 'success')
      } else {
        await createSupplier(payload as SupplierCreateInput)
        swal('Completado', 'Proveedor creado exitosamente', 'success')
      }

      setShowModal(false)
      fetchSuppliers()
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        const formErrors: Record<string, string> = {}
        err.inner.forEach((validationError) => {
          if (validationError.path) {
            formErrors[validationError.path] = validationError.message
          }
        })
        setErrors(formErrors)
      } else {
        swal('Error de Operación', err.message || 'Ocurrió un error al procesar el proveedor', 'error')
      }
    }
  }

  const handleDelete = (supplier: Supplier) => {
    swal({
      title: '¿Estás seguro?',
      text: `Eliminarás permanentemente al proveedor "${supplier.company_name}"`,
      icon: 'warning',
      buttons: ['Cancelar', 'Sí, eliminar'],
      dangerMode: true
    }).then(async (willDelete) => {
      if (willDelete) {
        try {
          await deleteSupplier(supplier.id)
          swal('Eliminado', 'El proveedor ha sido eliminado correctamente', 'success')
          fetchSuppliers()
        } catch (error: any) {
          swal('Error', error.message || 'No se pudo eliminar el proveedor', 'error')
        }
      }
    })
  }

  const handleToggleStatus = async (supplier: Supplier) => {
    try {
      await toggleSupplierStatus(supplier.id)
      fetchSuppliers()
    } catch (error: any) {
      swal('Error', error.message || 'No se pudo cambiar el estado del proveedor', 'error')
    }
  }

  const totalPages = Math.ceil(total / pageSize) || 1

  return (
    <Layout>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
        <div>
          <h1 className="h2 mb-1 fw-bold text-success-dark">Proveedores</h1>
          <p className="text-muted mb-0">Gestión y registro de socios comerciales de Imperio Motors</p>
        </div>
        <button type="button" className="btn btn-primary d-flex align-items-center gap-2" onClick={handleOpenAddModal}>
          <span>➕</span> Nuevo Proveedor
        </button>
      </div>

      {/* Panel de filtros */}
      <div className="card shadow-sm border-0 rounded-4 mb-4">
        <div className="card-body p-3">
          <form onSubmit={handleSearchSubmit} className="row g-2">
            <div className="col-12 col-md-6 col-lg-7">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por razón social, documento, contacto, ciudad..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button className="btn btn-primary px-4" type="submit">
                  🔍 Buscar
                </button>
              </div>
            </div>
            <div className="col-6 col-md-3 col-lg-2">
              <select
                className="form-select rounded-3"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{ height: '100%', borderRadius: '1rem' }}
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
            <div className="col-6 col-md-3 col-lg-3 d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('all')
                  setPage(1)
                  setTimeout(() => fetchSuppliers(), 50)
                }}
              >
                Limpiar filtros
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Listado de Proveedores */}
      <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-success bg-opacity-10 text-success-dark">
              <tr>
                <th className="py-3 px-4">Razón Social / Contacto</th>
                <th className="py-3">Identificación</th>
                <th className="py-3">Datos de Contacto</th>
                <th className="py-3">Ubicación</th>
                <th className="py-3">Banco / Cuenta</th>
                <th className="py-3 text-center">Estado</th>
                <th className="py-3 text-center px-4" style={{ width: '150px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <div className="spinner-border text-success" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted">
                    No se encontraron proveedores registrados.
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td className="px-4">
                      <div className="fw-bold">{supplier.company_name}</div>
                      {supplier.contact_name && <span className="small text-muted">{supplier.contact_name}</span>}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border me-1 small">
                        {supplier.document_type || 'DOC'}
                      </span>
                      <span className="small font-monospace">{supplier.document_number}</span>
                    </td>
                    <td>
                      <div className="small">{supplier.email || '-'}</div>
                      <div className="small text-muted">
                        {supplier.phone || supplier.mobile || '-'}
                      </div>
                    </td>
                    <td>
                      <div>{supplier.city || '-'}</div>
                      <div className="small text-muted">{supplier.country || '-'}</div>
                    </td>
                    <td>
                      <div className="small font-monospace">{supplier.bank_name || '-'}</div>
                      <div className="small text-muted font-monospace">{supplier.bank_account || '-'}</div>
                    </td>
                    <td className="text-center">
                      <span
                        className={`badge cursor-pointer rounded-pill py-2 px-3 ${
                          supplier.is_active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
                        }`}
                        onClick={() => handleToggleStatus(supplier)}
                        title="Hacer clic para cambiar de estado"
                        style={{ cursor: 'pointer' }}
                      >
                        {supplier.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="text-center px-4">
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary border-0 rounded-circle p-2"
                          onClick={() => handleOpenEditModal(supplier)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger border-0 rounded-circle p-2"
                          onClick={() => handleDelete(supplier)}
                          title="Eliminar"
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

        {/* Paginación */}
        {!loading && totalPages > 1 && (
          <div className="card-footer bg-white border-0 d-flex justify-content-between align-items-center py-3 px-4">
            <span className="text-muted small">
              Mostrando {suppliers.length} de {total} proveedores
            </span>
            <nav aria-label="Page navigation">
              <ul className="pagination pagination-sm mb-0 gap-1">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button className="page-link rounded-3 px-3 py-2" onClick={() => setPage(page - 1)}>
                    Anterior
                  </button>
                </li>
                <li className="page-item disabled">
                  <span className="page-link rounded-3 px-3 py-2 bg-light text-dark">
                    Página {page} de {totalPages}
                  </span>
                </li>
                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link rounded-3 px-3 py-2" onClick={() => setPage(page + 1)}>
                    Siguiente
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>

      {/* Modal React-Bootstrap para Agregar/Editar */}
      {showModal && (
        <>
          <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(15, 46, 24, 0.45)', backdropFilter: 'blur(4px)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
              <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
                <div className="modal-header bg-success text-white p-3 border-0">
                  <h5 className="modal-title fw-bold">
                    {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} aria-label="Cerrar"></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body p-4" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                    <h6 className="text-success-dark fw-bold border-bottom pb-2 mb-3">Información General</h6>
                    
                    <div className="row g-3 mb-4">
                      <div className="col-12 col-md-8">
                        <label htmlFor="company_name" className="form-label small fw-bold">Razón Social *</label>
                        <input
                          type="text"
                          className={`form-control ${errors.company_name ? 'is-invalid' : ''}`}
                          id="company_name"
                          name="company_name"
                          value={form.company_name}
                          onChange={handleInputChange}
                        />
                        {errors.company_name && <div className="invalid-feedback">{errors.company_name}</div>}
                      </div>

                      <div className="col-12 col-md-4">
                        <label htmlFor="document_type" className="form-label small fw-bold">Tipo Documento</label>
                        <select
                          className="form-select"
                          id="document_type"
                          name="document_type"
                          value={form.document_type}
                          onChange={handleInputChange}
                        >
                          <option value="RUC">RUC</option>
                          <option value="NIT">NIT</option>
                          <option value="DNI">DNI</option>
                          <option value="Pasaporte">Pasaporte</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>

                      <div className="col-12 col-md-6">
                        <label htmlFor="document_number" className="form-label small fw-bold">Número de Documento *</label>
                        <input
                          type="text"
                          className={`form-control ${errors.document_number ? 'is-invalid' : ''}`}
                          id="document_number"
                          name="document_number"
                          value={form.document_number}
                          onChange={handleInputChange}
                        />
                        {errors.document_number && <div className="invalid-feedback">{errors.document_number}</div>}
                      </div>

                      <div className="col-12 col-md-6">
                        <label htmlFor="contact_name" className="form-label small fw-bold">Nombre del Contacto</label>
                        <input
                          type="text"
                          className="form-control"
                          id="contact_name"
                          name="contact_name"
                          value={form.contact_name}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <h6 className="text-success-dark fw-bold border-bottom pb-2 mb-3">Información de Contacto</h6>
                    <div className="row g-3 mb-4">
                      <div className="col-12 col-md-6">
                        <label htmlFor="email" className="form-label small fw-bold">Correo Electrónico</label>
                        <input
                          type="email"
                          className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                          id="email"
                          name="email"
                          value={form.email}
                          onChange={handleInputChange}
                        />
                        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                      </div>

                      <div className="col-6 col-md-3">
                        <label htmlFor="phone" className="form-label small fw-bold">Teléfono Fijo</label>
                        <input
                          type="text"
                          className="form-control"
                          id="phone"
                          name="phone"
                          value={form.phone}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-6 col-md-3">
                        <label htmlFor="mobile" className="form-label small fw-bold">Móvil / Celular</label>
                        <input
                          type="text"
                          className="form-control"
                          id="mobile"
                          name="mobile"
                          value={form.mobile}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-12 col-md-8">
                        <label htmlFor="address" className="form-label small fw-bold">Dirección</label>
                        <input
                          type="text"
                          className="form-control"
                          id="address"
                          name="address"
                          value={form.address}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-6 col-md-2">
                        <label htmlFor="city" className="form-label small fw-bold">Ciudad</label>
                        <input
                          type="text"
                          className="form-control"
                          id="city"
                          name="city"
                          value={form.city}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-6 col-md-2">
                        <label htmlFor="country" className="form-label small fw-bold">País</label>
                        <input
                          type="text"
                          className="form-control"
                          id="country"
                          name="country"
                          value={form.country}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-12">
                        <label htmlFor="website" className="form-label small fw-bold">Sitio Web</label>
                        <input
                          type="url"
                          className="form-control"
                          id="website"
                          name="website"
                          value={form.website}
                          onChange={handleInputChange}
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>

                    <h6 className="text-success-dark fw-bold border-bottom pb-2 mb-3">Información Financiera y Adicional</h6>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label htmlFor="bank_name" className="form-label small fw-bold">Nombre del Banco</label>
                        <input
                          type="text"
                          className="form-control"
                          id="bank_name"
                          name="bank_name"
                          value={form.bank_name}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label htmlFor="bank_account" className="form-label small fw-bold">Número de Cuenta Bancaria</label>
                        <input
                          type="text"
                          className="form-control"
                          id="bank_account"
                          name="bank_account"
                          value={form.bank_account}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-12">
                        <label htmlFor="notes" className="form-label small fw-bold">Notas Adicionales</label>
                        <textarea
                          className="form-control"
                          id="notes"
                          name="notes"
                          rows={3}
                          value={form.notes}
                          onChange={handleInputChange}
                        ></textarea>
                      </div>

                      <div className="col-12">
                        <div className="form-check form-switch mt-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="is_active"
                            name="is_active"
                            checked={form.is_active}
                            onChange={handleInputChange}
                          />
                          <label className="form-check-label small fw-bold" htmlFor="is_active">
                            Proveedor Activo
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer bg-light border-0 p-3">
                    <button type="button" className="btn btn-outline-secondary px-4" onClick={() => setShowModal(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary px-4">
                      Guardar
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

export default SuppliersPage
