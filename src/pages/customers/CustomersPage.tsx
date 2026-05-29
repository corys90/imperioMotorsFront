import { useEffect, useState } from 'react'
import swal from 'sweetalert'
import * as yup from 'yup'
import Layout from '../../components/ui/Layout'
import {
  Customer,
  CustomerCreateInput,
  CustomerUpdateInput,
  createCustomer,
  deleteCustomer,
  getCustomers,
  toggleCustomerStatus,
  updateCustomer
} from '../../services/customerService'

const validationSchema = yup.object().shape({
  first_name: yup.string().required('El nombre es obligatorio').max(100, 'Maximo 100 caracteres'),
  last_name: yup.string().max(100, 'Maximo 100 caracteres').optional(),
  company_name: yup.string().max(150, 'Maximo 150 caracteres').optional(),
  document_number: yup.string().required('El numero de documento es obligatorio').max(30, 'Maximo 30 caracteres'),
  document_type: yup.string().max(20, 'Maximo 20 caracteres').optional(),
  email: yup.string().email('Debe ser un correo electronico valido').max(120, 'Maximo 120 caracteres').optional(),
  phone: yup.string().max(30, 'Maximo 30 caracteres').optional(),
  mobile: yup.string().max(30, 'Maximo 30 caracteres').optional(),
  address: yup.string().max(255, 'Maximo 255 caracteres').optional(),
  city: yup.string().max(100, 'Maximo 100 caracteres').optional(),
  country: yup.string().max(100, 'Maximo 100 caracteres').optional(),
  birth_date: yup.string().optional(),
  is_active: yup.boolean().optional(),
  notes: yup.string().optional()
})

const initialFormState: CustomerCreateInput = {
  document_type: 'DNI',
  document_number: '',
  first_name: '',
  last_name: '',
  company_name: '',
  email: '',
  phone: '',
  mobile: '',
  address: '',
  city: '',
  country: '',
  birth_date: '',
  is_active: true,
  notes: ''
}

function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [loading, setLoading] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [form, setForm] = useState<CustomerCreateInput>(initialFormState)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const activeParam = statusFilter === 'all' ? undefined : statusFilter === 'active'
      const data = await getCustomers(page, pageSize, search || undefined, activeParam)
      setCustomers(data.results)
      setTotal(data.total)
    } catch (error: any) {
      swal('Error', error.message || 'No se pudieron cargar los clientes', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [page, statusFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchCustomers()
  }

  const handleOpenAddModal = () => {
    setEditingCustomer(null)
    setForm(initialFormState)
    setErrors({})
    setShowModal(true)
  }

  const handleOpenEditModal = (customer: Customer) => {
    setEditingCustomer(customer)
    setForm({
      document_type: customer.document_type || 'DNI',
      document_number: customer.document_number,
      first_name: customer.first_name,
      last_name: customer.last_name || '',
      company_name: customer.company_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      mobile: customer.mobile || '',
      address: customer.address || '',
      city: customer.city || '',
      country: customer.country || '',
      birth_date: customer.birth_date || '',
      is_active: customer.is_active,
      notes: customer.notes || ''
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
      await validationSchema.validate(form, { abortEarly: false })

      const payload: any = {}
      Object.keys(form).forEach((key) => {
        const value = (form as any)[key]
        payload[key] = value === '' ? undefined : value
      })

      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, payload as CustomerUpdateInput)
        swal('Completado', 'Cliente actualizado exitosamente', 'success')
      } else {
        await createCustomer(payload as CustomerCreateInput)
        swal('Completado', 'Cliente creado exitosamente', 'success')
      }

      setShowModal(false)
      fetchCustomers()
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        const formErrors: Record<string, string> = {}
        err.inner.forEach((validationError) => {
          if (validationError.path) formErrors[validationError.path] = validationError.message
        })
        setErrors(formErrors)
      } else {
        swal('Error de Operacion', err.message || 'Ocurrio un error al procesar el cliente', 'error')
      }
    }
  }

  const handleDelete = (customer: Customer) => {
    swal({
      title: 'Estas seguro?',
      text: `Eliminaras permanentemente al cliente "${customer.first_name} ${customer.last_name || ''}".`,
      icon: 'warning',
      buttons: ['Cancelar', 'Si, eliminar'],
      dangerMode: true
    }).then(async (willDelete) => {
      if (willDelete) {
        try {
          await deleteCustomer(customer.id)
          swal('Eliminado', 'El cliente ha sido eliminado correctamente', 'success')
          fetchCustomers()
        } catch (error: any) {
          swal('Error', error.message || 'No se pudo eliminar el cliente', 'error')
        }
      }
    })
  }

  const handleToggleStatus = async (customer: Customer) => {
    try {
      await toggleCustomerStatus(customer.id)
      fetchCustomers()
    } catch (error: any) {
      swal('Error', error.message || 'No se pudo cambiar el estado del cliente', 'error')
    }
  }

  const totalPages = Math.ceil(total / pageSize) || 1

  return (
    <Layout>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
        <div>
          <h1 className="h2 mb-1 fw-bold text-success-dark">Clientes</h1>
          <p className="text-muted mb-0">Gestion y registro de clientes de Imperio Motors</p>
        </div>
        <button type="button" className="btn btn-primary d-flex align-items-center gap-2" onClick={handleOpenAddModal}>
          <span>+</span> Nuevo Cliente
        </button>
      </div>

      <div className="card shadow-sm border-0 rounded-4 mb-4">
        <div className="card-body p-3">
          <form onSubmit={handleSearchSubmit} className="row g-2">
            <div className="col-12 col-md-6 col-lg-7">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por nombre, documento, empresa, ciudad..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button className="btn btn-primary px-4" type="submit">
                  Buscar
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
                  setTimeout(() => fetchCustomers(), 50)
                }}
              >
                Limpiar filtros
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-success bg-opacity-10 text-success-dark">
              <tr>
                <th className="py-3 px-4">Cliente / Empresa</th>
                <th className="py-3">Identificacion</th>
                <th className="py-3">Datos de Contacto</th>
                <th className="py-3">Ubicacion</th>
                <th className="py-3">Nacimiento</th>
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
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted">
                    No se encontraron clientes registrados.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-4">
                      <div className="fw-bold">{customer.first_name} {customer.last_name || ''}</div>
                      {customer.company_name && <span className="small text-muted">{customer.company_name}</span>}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border me-1 small">
                        {customer.document_type || 'DOC'}
                      </span>
                      <span className="small font-monospace">{customer.document_number}</span>
                    </td>
                    <td>
                      <div className="small">{customer.email || '-'}</div>
                      <div className="small text-muted">{customer.phone || customer.mobile || '-'}</div>
                    </td>
                    <td>
                      <div>{customer.city || '-'}</div>
                      <div className="small text-muted">{customer.country || '-'}</div>
                    </td>
                    <td>
                      <span className="small font-monospace">{customer.birth_date || '-'}</span>
                    </td>
                    <td className="text-center">
                      <span
                        className={`badge cursor-pointer rounded-pill py-2 px-3 ${
                          customer.is_active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
                        }`}
                        onClick={() => handleToggleStatus(customer)}
                        title="Hacer clic para cambiar de estado"
                        style={{ cursor: 'pointer' }}
                      >
                        {customer.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="text-center px-4">
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary border-0 rounded-circle p-2"
                          onClick={() => handleOpenEditModal(customer)}
                          title="Editar"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger border-0 rounded-circle p-2"
                          onClick={() => handleDelete(customer)}
                          title="Eliminar"
                        >
                          Borrar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalPages > 1 && (
          <div className="card-footer bg-white border-0 d-flex justify-content-between align-items-center py-3 px-4">
            <span className="text-muted small">
              Mostrando {customers.length} de {total} clientes
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
                    Pagina {page} de {totalPages}
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

      {showModal && (
        <>
          <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(15, 46, 24, 0.45)', backdropFilter: 'blur(4px)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
              <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
                <div className="modal-header bg-success text-white p-3 border-0">
                  <h5 className="modal-title fw-bold">
                    {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} aria-label="Cerrar"></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body p-4" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                    <h6 className="text-success-dark fw-bold border-bottom pb-2 mb-3">Informacion General</h6>

                    <div className="row g-3 mb-4">
                      <div className="col-12 col-md-6">
                        <label htmlFor="first_name" className="form-label small fw-bold">Nombre *</label>
                        <input
                          type="text"
                          className={`form-control ${errors.first_name ? 'is-invalid' : ''}`}
                          id="first_name"
                          name="first_name"
                          value={form.first_name}
                          onChange={handleInputChange}
                        />
                        {errors.first_name && <div className="invalid-feedback">{errors.first_name}</div>}
                      </div>

                      <div className="col-12 col-md-6">
                        <label htmlFor="last_name" className="form-label small fw-bold">Apellido</label>
                        <input
                          type="text"
                          className="form-control"
                          id="last_name"
                          name="last_name"
                          value={form.last_name}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-12 col-md-8">
                        <label htmlFor="company_name" className="form-label small fw-bold">Empresa</label>
                        <input
                          type="text"
                          className="form-control"
                          id="company_name"
                          name="company_name"
                          value={form.company_name}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-12 col-md-4">
                        <label htmlFor="birth_date" className="form-label small fw-bold">Fecha de Nacimiento</label>
                        <input
                          type="date"
                          className="form-control"
                          id="birth_date"
                          name="birth_date"
                          value={form.birth_date}
                          onChange={handleInputChange}
                        />
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
                          <option value="DNI">DNI</option>
                          <option value="CC">CC</option>
                          <option value="CE">CE</option>
                          <option value="NIT">NIT</option>
                          <option value="Pasaporte">Pasaporte</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>

                      <div className="col-12 col-md-8">
                        <label htmlFor="document_number" className="form-label small fw-bold">Numero de Documento *</label>
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
                    </div>

                    <h6 className="text-success-dark fw-bold border-bottom pb-2 mb-3">Informacion de Contacto</h6>
                    <div className="row g-3 mb-4">
                      <div className="col-12 col-md-6">
                        <label htmlFor="email" className="form-label small fw-bold">Correo Electronico</label>
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
                        <label htmlFor="phone" className="form-label small fw-bold">Telefono Fijo</label>
                        <input type="text" className="form-control" id="phone" name="phone" value={form.phone} onChange={handleInputChange} />
                      </div>

                      <div className="col-6 col-md-3">
                        <label htmlFor="mobile" className="form-label small fw-bold">Movil / Celular</label>
                        <input type="text" className="form-control" id="mobile" name="mobile" value={form.mobile} onChange={handleInputChange} />
                      </div>

                      <div className="col-12 col-md-8">
                        <label htmlFor="address" className="form-label small fw-bold">Direccion</label>
                        <input type="text" className="form-control" id="address" name="address" value={form.address} onChange={handleInputChange} />
                      </div>

                      <div className="col-6 col-md-2">
                        <label htmlFor="city" className="form-label small fw-bold">Ciudad</label>
                        <input type="text" className="form-control" id="city" name="city" value={form.city} onChange={handleInputChange} />
                      </div>

                      <div className="col-6 col-md-2">
                        <label htmlFor="country" className="form-label small fw-bold">Pais</label>
                        <input type="text" className="form-control" id="country" name="country" value={form.country} onChange={handleInputChange} />
                      </div>
                    </div>

                    <h6 className="text-success-dark fw-bold border-bottom pb-2 mb-3">Informacion Adicional</h6>
                    <div className="row g-3">
                      <div className="col-12">
                        <label htmlFor="notes" className="form-label small fw-bold">Notas Adicionales</label>
                        <textarea className="form-control" id="notes" name="notes" rows={3} value={form.notes} onChange={handleInputChange}></textarea>
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
                            Cliente Activo
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

export default CustomersPage
