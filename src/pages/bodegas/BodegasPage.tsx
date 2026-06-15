import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import swal from 'sweetalert'
import * as yup from 'yup'
import Layout from '../../components/ui/Layout'
import type { RootState } from '../../store'
import {
  Bodega,
  BodegaCreateInput,
  BodegaUpdateInput,
  createBodega,
  deleteBodega,
  getBodegas,
  toggleBodegaStatus,
  updateBodega
} from '../../services/bodegaService'
import { Sucursal, getSucursales } from '../../services/sucursalService'

const validationSchema = yup.object().shape({
  id_usuario: yup
    .number()
    .typeError('El usuario es obligatorio')
    .integer('El usuario debe ser un numero entero')
    .positive('El usuario debe ser mayor que cero')
    .required('El usuario es obligatorio'),
  id_sucursal: yup
    .number()
    .typeError('La sucursal es obligatoria')
    .integer('La sucursal debe ser un numero entero')
    .positive('La sucursal debe ser mayor que cero')
    .required('La sucursal es obligatoria'),
  desc_bodega: yup.string().required('La descripcion es obligatoria').max(250, 'Maximo 250 caracteres'),
  activo: yup.boolean().optional()
})

const initialFormState: BodegaCreateInput = {
  id_usuario: 1,
  id_sucursal: 0,
  desc_bodega: '',
  activo: true
}

function BodegasPage() {
  const { user } = useSelector((state: RootState) => state.auth)
  const getUsername = (idUsuario: any) => {
    if (user && String(user.id) === String(idUsuario)) {
      return user.username || 'admin'
    }
    if (String(idUsuario) === '1') return 'admin'
    return idUsuario || '-'
  }
  const [bodegas, setBodegas] = useState<Bodega[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sucursalFilter, setSucursalFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editingBodega, setEditingBodega] = useState<Bodega | null>(null)
  const [form, setForm] = useState<BodegaCreateInput>(initialFormState)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fetchBodegas = async () => {
    setLoading(true)
    try {
      const activeParam = statusFilter === 'all' ? undefined : statusFilter === 'active'
      const sucursalParam = sucursalFilter === 'all' ? undefined : Number(sucursalFilter)
      const data = await getBodegas(page, pageSize, search || undefined, activeParam, sucursalParam)
      setBodegas(data.results)
      setTotal(data.total)
    } catch (error: any) {
      swal('Error', error.message || 'No se pudieron cargar las bodegas', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchSucursales = async () => {
    try {
      const data = await getSucursales(1, 100)
      setSucursales(data.results)
      return data.results
    } catch (error: any) {
      swal('Error', error.message || 'No se pudieron cargar las sucursales', 'error')
      return []
    }
  }

  useEffect(() => {
    fetchSucursales()
  }, [])

  useEffect(() => {
    fetchBodegas()
  }, [page, statusFilter, sucursalFilter])

  useEffect(() => {
    if (showModal && !editingBodega && sucursales.length > 0 && form.id_sucursal === 0) {
      setForm((prev) => ({ ...prev, id_sucursal: sucursales[0].id_sucursal }))
    }
  }, [showModal, editingBodega, sucursales, form.id_sucursal])

  const getSucursalName = (idSucursal: number) => {
    return sucursales.find((sucursal) => sucursal.id_sucursal === idSucursal)?.nom_sucursal || `Sucursal ${idSucursal}`
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchBodegas()
  }

  const handleOpenAddModal = async () => {
    let availableSucursales = sucursales
    if (!availableSucursales.length) {
      availableSucursales = await fetchSucursales()
    }

    if (!availableSucursales.length) {
      swal('Error', 'No hay sucursales disponibles. Agrega una sucursal primero.', 'error')
      return
    }

    setEditingBodega(null)
    setForm({
      ...initialFormState,
      id_usuario: user?.id ?? 0,
      id_sucursal: availableSucursales[0].id_sucursal
    })
    setErrors({})
    setShowModal(true)
  }

  const handleOpenEditModal = (bodega: Bodega) => {
    setEditingBodega(bodega)
    setForm({
      id_usuario: user?.id ?? bodega.id_usuario,
      id_sucursal: bodega.id_sucursal,
      desc_bodega: bodega.desc_bodega,
      activo: bodega.activo
    })
    setErrors({})
    setShowModal(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setForm({
      ...form,
      [name]: name === 'id_sucursal' ? Number(val) : val
    })
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
        id_sucursal: Number(form.id_sucursal),
        desc_bodega: form.desc_bodega.trim(),
        activo: form.activo
      }

      if (!payload.id_sucursal || payload.id_sucursal <= 0) {
        setErrors({ id_sucursal: 'Selecciona una sucursal valida' })
        return
      }

      await validationSchema.validate(payload, { abortEarly: false })

      if (editingBodega) {
        await updateBodega(editingBodega.id_bodega, payload as BodegaUpdateInput)
        swal('Completado', 'Bodega actualizada exitosamente', 'success')
      } else {
        await createBodega(payload as BodegaCreateInput)
        swal('Completado', 'Bodega creada exitosamente', 'success')
      }

      setShowModal(false)
      fetchBodegas()
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        const formErrors: Record<string, string> = {}
        err.inner.forEach((validationError) => {
          if (validationError.path) formErrors[validationError.path] = validationError.message
        })
        setErrors(formErrors)
      } else {
        swal('Error de Operacion', err.message || 'Ocurrio un error al procesar la bodega', 'error')
      }
    }
  }

  const handleDelete = (bodega: Bodega) => {
    swal({
      title: 'Estas seguro?',
      text: `Eliminaras permanentemente la bodega "${bodega.desc_bodega}".`,
      icon: 'warning',
      buttons: ['Cancelar', 'Si, eliminar'],
      dangerMode: true
    }).then(async (willDelete) => {
      if (willDelete) {
        try {
          await deleteBodega(bodega.id_bodega)
          swal('Eliminado', 'La bodega ha sido eliminada correctamente', 'success')
          fetchBodegas()
        } catch (error: any) {
          swal('Error', error.message || 'No se pudo eliminar la bodega', 'error')
        }
      }
    })
  }

  const handleToggleStatus = async (bodega: Bodega) => {
    try {
      await toggleBodegaStatus(bodega.id_bodega)
      fetchBodegas()
    } catch (error: any) {
      swal('Error', error.message || 'No se pudo cambiar el estado de la bodega', 'error')
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
          <h1 className="h2 mb-1 fw-bold text-success-dark">Bodegas</h1>
          <p className="text-muted mb-0">Gestion de bodegas por sucursal de Imperio Motors</p>
        </div>
        <button type="button" className="btn btn-primary d-flex align-items-center gap-2" onClick={handleOpenAddModal}>
          <span>+</span> Nueva Bodega
        </button>
      </div>

      <div className="card shadow-sm border-0 rounded-4 mb-4">
        <div className="card-body p-3">
          <form onSubmit={handleSearchSubmit} className="row g-2">
            <div className="col-12 col-md-5 col-lg-6">
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
                value={sucursalFilter}
                onChange={(e) => setSucursalFilter(e.target.value)}
                style={{ height: '100%', borderRadius: '1rem' }}
              >
                <option value="all">Todas las sucursales</option>
                {sucursales.map((sucursal) => (
                  <option key={sucursal.id_sucursal} value={sucursal.id_sucursal}>
                    {sucursal.nom_sucursal}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-2 col-lg-2">
              <select
                className="form-select rounded-3"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{ height: '100%', borderRadius: '1rem' }}
              >
                <option value="all">Todos</option>
                <option value="active">Activas</option>
                <option value="inactive">Inactivas</option>
              </select>
            </div>
            <div className="col-12 col-md-2 col-lg-2 d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('all')
                  setSucursalFilter('all')
                  setPage(1)
                  setTimeout(() => fetchBodegas(), 50)
                }}
              >
                Limpiar
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
                <th className="py-3">Sucursal</th>
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
                  <td colSpan={7} className="text-center py-5">
                    <div className="spinner-border text-success" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                  </td>
                </tr>
              ) : bodegas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted">
                    No se encontraron bodegas registradas.
                  </td>
                </tr>
              ) : (
                bodegas.map((bodega) => (
                  <tr key={bodega.id_bodega}>
                    <td className="px-4">
                      <div className="fw-bold">{bodega.desc_bodega}</div>
                      <span className="small text-muted">ID {bodega.id_bodega}</span>
                    </td>
                    <td>{getSucursalName(bodega.id_sucursal)}</td>
                    <td className="small font-monospace">{getUsername(bodega.id_usuario)}</td>
                    <td className="small font-monospace">{formatDate(bodega.fecha_creacion)}</td>
                    <td className="small font-monospace">{formatDate(bodega.fecha_mod)}</td>
                    <td className="text-center">
                      <span
                        className={`badge cursor-pointer rounded-pill py-2 px-3 ${
                          bodega.activo ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
                        }`}
                        onClick={() => handleToggleStatus(bodega)}
                        title="Hacer clic para cambiar de estado"
                        style={{ cursor: 'pointer' }}
                      >
                        {bodega.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="text-center px-4">
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary border-0 rounded-circle p-2"
                          onClick={() => handleOpenEditModal(bodega)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger border-0 rounded-circle p-2"
                          onClick={() => handleDelete(bodega)}
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
              Mostrando {bodegas.length} de {total} bodegas
            </span>
            <nav aria-label="Page navigation">
              <ul className="pagination pagination-sm mb-0 gap-1">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button className="page-link rounded-3 px-2.5 py-2" onClick={() => setPage(1)} title="Primera página">
                    «
                  </button>
                </li>
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button className="page-link rounded-3 px-2.5 py-2" onClick={() => setPage(page - 1)} title="Anterior">
                    &lt;
                  </button>
                </li>
                <li className="page-item disabled">
                  <span className="page-link rounded-3 px-3 py-2 bg-light text-dark">
                    Pagina {page} de {totalPages}
                  </span>
                </li>
                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link rounded-3 px-2.5 py-2" onClick={() => setPage(page + 1)} title="Siguiente">
                    &gt;
                  </button>
                </li>
                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link rounded-3 px-2.5 py-2" onClick={() => setPage(totalPages)} title="Última página">
                    »
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
                    {editingBodega ? 'Editar Bodega' : 'Nueva Bodega'}
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} aria-label="Cerrar"></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body p-4">
                    <div className="row g-3">
                      <div className="col-12">
                        <label htmlFor="id_sucursal" className="form-label small fw-bold">Sucursal *</label>
                        <select
                          className={`form-select ${errors.id_sucursal ? 'is-invalid' : ''}`}
                          id="id_sucursal"
                          name="id_sucursal"
                          value={form.id_sucursal}
                          onChange={handleInputChange}
                        >
                          <option value={0}>Selecciona una sucursal</option>
                          {sucursales.map((sucursal) => (
                            <option key={sucursal.id_sucursal} value={sucursal.id_sucursal}>
                              {sucursal.nom_sucursal}
                            </option>
                          ))}
                        </select>
                        {errors.id_sucursal && <div className="invalid-feedback">{errors.id_sucursal}</div>}
                      </div>

                      <div className="col-12">
                        <label htmlFor="desc_bodega" className="form-label small fw-bold">Descripcion *</label>
                        <input
                          type="text"
                          className={`form-control ${errors.desc_bodega ? 'is-invalid' : ''}`}
                          id="desc_bodega"
                          name="desc_bodega"
                          value={form.desc_bodega}
                          onChange={handleInputChange}
                        />
                        {errors.desc_bodega && <div className="invalid-feedback">{errors.desc_bodega}</div>}
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
                            Bodega Activa
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

export default BodegasPage
