import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import swal from 'sweetalert'
import * as yup from 'yup'
import Layout from '../../components/ui/Layout'
import type { RootState } from '../../store'
import {
  Estado,
  EstadoCreateInput,
  EstadoUpdateInput,
  createEstado,
  deleteEstado,
  getEstados,
  toggleEstadoStatus,
  updateEstado
} from '../../services/estadoService'

const validationSchema = yup.object().shape({
  id_usuario: yup
    .number()
    .typeError('El usuario es obligatorio')
    .integer('El usuario debe ser un numero entero')
    .positive('El usuario debe ser mayor que cero')
    .required('El usuario es obligatorio'),
  desc_estado: yup.string().required('La descripcion es obligatoria').max(100, 'Maximo 100 caracteres'),
  activo: yup.boolean().optional()
})

const initialFormState: EstadoCreateInput = {
  id_usuario: 1,
  desc_estado: '',
  activo: true
}

function EstadosPage() {
  const { user } = useSelector((state: RootState) => state.auth)
  const getUsername = (idUsuario: any) => {
    if (user && String(user.id) === String(idUsuario)) {
      return user.username || 'admin'
    }
    if (String(idUsuario) === '1') return 'admin'
    return idUsuario || '-'
  }
  const [estados, setEstados] = useState<Estado[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [loading, setLoading] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editingEstado, setEditingEstado] = useState<Estado | null>(null)
  const [form, setForm] = useState<EstadoCreateInput>(initialFormState)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fetchEstados = async () => {
    setLoading(true)
    try {
      const activeParam = statusFilter === 'all' ? undefined : statusFilter === 'active'
      const data = await getEstados(page, pageSize, search || undefined, activeParam)
      setEstados(data.results)
      setTotal(data.total)
    } catch (error: any) {
      swal('Error', error.message || 'No se pudieron cargar los estados', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEstados()
  }, [page, statusFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchEstados()
  }

  const handleOpenAddModal = () => {
    setEditingEstado(null)
    setForm({ ...initialFormState, id_usuario: user?.id ?? 0 })
    setErrors({})
    setShowModal(true)
  }

  const handleOpenEditModal = (estado: Estado) => {
    setEditingEstado(estado)
    setForm({
      id_usuario: user?.id ?? estado.id_usuario,
      desc_estado: estado.desc_estado,
      activo: estado.activo
    })
    setErrors({})
    setShowModal(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setForm({ ...form, [name]: val })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      if (!user?.id) {
        swal('Error de sesion', 'No se encontro el usuario autenticado. Inicia sesion nuevamente.', 'error')
        return
      }

      const payload: any = {
        id_usuario: user.id,
        desc_estado: form.desc_estado.trim(),
        activo: form.activo
      }

      await validationSchema.validate(payload, { abortEarly: false })

      if (editingEstado) {
        await updateEstado(editingEstado.id_estado, payload as EstadoUpdateInput)
        swal('Completado', 'Estado actualizado exitosamente', 'success')
      } else {
        await createEstado(payload as EstadoCreateInput)
        swal('Completado', 'Estado creado exitosamente', 'success')
      }

      setShowModal(false)
      fetchEstados()
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        const formErrors: Record<string, string> = {}
        err.inner.forEach((validationError) => {
          if (validationError.path) formErrors[validationError.path] = validationError.message
        })
        setErrors(formErrors)
      } else {
        swal('Error de Operacion', err.message || 'Ocurrio un error al procesar el estado', 'error')
      }
    }
  }

  const handleDelete = (estado: Estado) => {
    swal({
      title: 'Estas seguro?',
      text: `Eliminaras permanentemente el estado "${estado.desc_estado}".`,
      icon: 'warning',
      buttons: ['Cancelar', 'Si, eliminar'],
      dangerMode: true
    }).then(async (willDelete) => {
      if (willDelete) {
        try {
          await deleteEstado(estado.id_estado)
          swal('Eliminado', 'El estado ha sido eliminado correctamente', 'success')
          fetchEstados()
        } catch (error: any) {
          swal('Error', error.message || 'No se pudo eliminar el estado', 'error')
        }
      }
    })
  }

  const handleToggleStatus = async (estado: Estado) => {
    try {
      await toggleEstadoStatus(estado.id_estado)
      fetchEstados()
    } catch (error: any) {
      swal('Error', error.message || 'No se pudo cambiar el estado', 'error')
    }
  }

  const formatDate = (value?: string) => {
    if (!value) return '-'
    return new Date(value).toLocaleString()
  }

  const totalPages = Math.ceil(total / pageSize) || 1

  return (
    <Layout>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
        <div>
          <h1 className="h2 mb-1 fw-bold text-success-dark">Estados</h1>
          <p className="text-muted mb-0">Gestion de estados generales de configuracion</p>
        </div>
        <button type="button" className="btn btn-primary d-flex align-items-center gap-2" onClick={handleOpenAddModal}>
          <span>+</span> Nuevo Estado
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
                  placeholder="Buscar por descripcion..."
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
                  setTimeout(() => fetchEstados(), 50)
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
                <th className="py-3 px-4">Descripcion</th>
                <th className="py-3">Usuario</th>
                <th className="py-3">Fecha creacion</th>
                <th className="py-3">Fecha modificacion</th>
                <th className="py-3 text-center">Estado</th>
                <th className="py-3 text-center px-4" style={{ width: '150px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-5">
                    <div className="spinner-border text-success" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                  </td>
                </tr>
              ) : estados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    No se encontraron estados registrados.
                  </td>
                </tr>
              ) : (
                estados.map((estado) => (
                  <tr key={estado.id_estado}>
                    <td className="px-4">
                      <div className="fw-bold">{estado.desc_estado}</div>
                      <span className="small text-muted">ID {estado.id_estado}</span>
                    </td>
                    <td className="small font-monospace">{getUsername(estado.id_usuario)}</td>
                    <td className="small font-monospace">{formatDate(estado.fec_creacion)}</td>
                    <td className="small font-monospace">{formatDate(estado.fec_mod)}</td>
                    <td className="text-center">
                      <span
                        className={`badge cursor-pointer rounded-pill py-2 px-3 ${
                          estado.activo ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
                        }`}
                        onClick={() => handleToggleStatus(estado)}
                        title="Hacer clic para cambiar de estado"
                        style={{ cursor: 'pointer' }}
                      >
                        {estado.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="text-center px-4">
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary border-0 rounded-circle p-2"
                          onClick={() => handleOpenEditModal(estado)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger border-0 rounded-circle p-2"
                          onClick={() => handleDelete(estado)}
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

        {!loading && totalPages > 1 && (
          <div className="card-footer bg-white border-0 d-flex justify-content-between align-items-center py-3 px-4">
            <span className="text-muted small">
              Mostrando {estados.length} de {total} estados
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
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
                <div className="modal-header bg-success text-white p-3 border-0">
                  <h5 className="modal-title fw-bold">
                    {editingEstado ? 'Editar Estado' : 'Nuevo Estado'}
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} aria-label="Cerrar"></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body p-4">
                    <div className="row g-3">
                      <div className="col-12">
                        <label htmlFor="desc_estado" className="form-label small fw-bold">Descripcion *</label>
                        <input
                          type="text"
                          className={`form-control ${errors.desc_estado ? 'is-invalid' : ''}`}
                          id="desc_estado"
                          name="desc_estado"
                          value={form.desc_estado}
                          onChange={handleInputChange}
                        />
                        {errors.desc_estado && <div className="invalid-feedback">{errors.desc_estado}</div>}
                      </div>

                      <div className="col-12">
                        <div className="form-check form-switch mt-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="activo"
                            name="activo"
                            checked={form.activo}
                            onChange={handleInputChange}
                          />
                          <label className="form-check-label small fw-bold" htmlFor="activo">
                            Estado Activo
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

export default EstadosPage
