import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import swal from 'sweetalert'
import * as yup from 'yup'
import Layout from '../../components/ui/Layout'
import type { RootState } from '../../store'
import {
  Sucursal,
  SucursalCreateInput,
  SucursalUpdateInput,
  createSucursal,
  deleteSucursal,
  getSucursales,
  updateSucursal
} from '../../services/sucursalService'

const validationSchema = yup.object().shape({
  id_usuario: yup
    .number()
    .typeError('El usuario es obligatorio')
    .integer('El usuario debe ser un numero entero')
    .positive('El usuario debe ser mayor que cero')
    .required('El usuario es obligatorio'),
  nom_sucursal: yup.string().required('El nombre de la sucursal es obligatorio').max(250, 'Maximo 250 caracteres'),
  dir_sucursal: yup.string().max(250, 'Maximo 250 caracteres').nullable().optional(),
  tel_cel: yup.string().max(25, 'Maximo 25 caracteres').nullable().optional(),
})

const initialFormState: SucursalCreateInput = {
  id_usuario: 1,
  nom_sucursal: '',
  dir_sucursal: '',
  tel_cel: ''
}

function SucursalesPage() {
  const { user } = useSelector((state: RootState) => state.auth)
  const getUsername = (idUsuario: any) => {
    if (user && String(user.id) === String(idUsuario)) {
      return user.username || 'admin'
    }
    if (String(idUsuario) === '1') return 'admin'
    return idUsuario || '-'
  }
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null)
  const [form, setForm] = useState<SucursalCreateInput>(initialFormState)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fetchSucursales = async () => {
    setLoading(true)
    try {
      const data = await getSucursales(page, pageSize, search || undefined)
      setSucursales(data.results)
      setTotal(data.total)
    } catch (error: any) {
      swal('Error', error.message || 'No se pudieron cargar las sucursales', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSucursales()
  }, [page])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchSucursales()
  }

  const handleOpenAddModal = () => {
    setEditingSucursal(null)
    setForm({ ...initialFormState, id_usuario: user?.id ?? 0 })
    setErrors({})
    setShowModal(true)
  }

  const handleOpenEditModal = (sucursal: Sucursal) => {
    setEditingSucursal(sucursal)
    setForm({
      id_usuario: user?.id ?? sucursal.id_usuario,
      nom_sucursal: sucursal.nom_sucursal,
      dir_sucursal: sucursal.dir_sucursal || '',
      tel_cel: sucursal.tel_cel || ''
    })
    setErrors({})
    setShowModal(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
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
        nom_sucursal: form.nom_sucursal.trim(),
        dir_sucursal: form.dir_sucursal?.trim() || null,
        tel_cel: form.tel_cel?.trim() || null
      }

      await validationSchema.validate(payload, { abortEarly: false })

      if (editingSucursal) {
        await updateSucursal(editingSucursal.id_sucursal, payload as SucursalUpdateInput)
        swal('Completado', 'Sucursal actualizada exitosamente', 'success')
      } else {
        await createSucursal(payload as SucursalCreateInput)
        swal('Completado', 'Sucursal creada exitosamente', 'success')
      }

      setShowModal(false)
      fetchSucursales()
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        const formErrors: Record<string, string> = {}
        err.inner.forEach((validationError) => {
          if (validationError.path) formErrors[validationError.path] = validationError.message
        })
        setErrors(formErrors)
      } else {
        swal('Error de Operacion', err.message || 'Ocurrio un error al procesar la sucursal', 'error')
      }
    }
  }

  const handleDelete = (sucursal: Sucursal) => {
    swal({
      title: 'Estas seguro?',
      text: `Eliminaras permanentemente la sucursal "${sucursal.nom_sucursal}".`,
      icon: 'warning',
      buttons: ['Cancelar', 'Si, eliminar'],
      dangerMode: true
    }).then(async (willDelete) => {
      if (willDelete) {
        try {
          await deleteSucursal(sucursal.id_sucursal)
          swal('Eliminado', 'La sucursal ha sido eliminada correctamente', 'success')
          fetchSucursales()
        } catch (error: any) {
          swal('Error', error.message || 'No se pudo eliminar la sucursal', 'error')
        }
      }
    })
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
          <h1 className="h2 mb-1 fw-bold text-success-dark">Sucursales</h1>
          <p className="text-muted mb-0">Gestion de las sucursales de Imperio Motors</p>
        </div>
        <button type="button" className="btn btn-primary d-flex align-items-center gap-2" onClick={handleOpenAddModal}>
          <span>+</span> Nueva Sucursal
        </button>
      </div>

      <div className="card shadow-sm border-0 rounded-4 mb-4">
        <div className="card-body p-3">
          <form onSubmit={handleSearchSubmit} className="row g-2">
            <div className="col-12 col-md-8 col-lg-9">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por nombre, direccion o telefono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-4 col-lg-3 d-flex gap-2">
              <button className="btn btn-primary px-4 w-100" type="submit">
                Buscar
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSearch('')
                  setPage(1)
                  setTimeout(() => fetchSucursales(), 50)
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
                <th className="py-3 px-4">Nombre</th>
                <th className="py-3">Dirección</th>
                <th className="py-3">Teléfono/Celular</th>
                 <th className="py-3">Usuario</th>
                 <th className="py-3">Fecha modificación</th>
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
              ) : sucursales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    No se encontraron sucursales registradas.
                  </td>
                </tr>
              ) : (
                sucursales.map((sucursal) => (
                  <tr key={sucursal.id_sucursal}>
                    <td className="px-4">
                      <div className="fw-bold">{sucursal.nom_sucursal}</div>
                      <span className="small text-muted">ID {sucursal.id_sucursal}</span>
                    </td>
                    <td>{sucursal.dir_sucursal || '-'}</td>
                    <td className="small font-monospace">{sucursal.tel_cel || '-'}</td>
                     <td className="small font-monospace">{getUsername(sucursal.id_usuario)}</td>
                     <td className="small font-monospace">{formatDate(sucursal.fec_mod)}</td>
                    <td className="text-center px-4">
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary border-0 rounded-circle p-2"
                          onClick={() => handleOpenEditModal(sucursal)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger border-0 rounded-circle p-2"
                          onClick={() => handleDelete(sucursal)}
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
              Mostrando {sucursales.length} de {total} sucursales
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
                    {editingSucursal ? 'Editar Sucursal' : 'Nueva Sucursal'}
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} aria-label="Cerrar"></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body p-4">
                    <div className="row g-3">
                      <div className="col-12">
                        <label htmlFor="nom_sucursal" className="form-label small fw-bold">Nombre *</label>
                        <input
                          type="text"
                          className={`form-control ${errors.nom_sucursal ? 'is-invalid' : ''}`}
                          id="nom_sucursal"
                          name="nom_sucursal"
                          value={form.nom_sucursal}
                          onChange={handleInputChange}
                        />
                        {errors.nom_sucursal && <div className="invalid-feedback">{errors.nom_sucursal}</div>}
                      </div>

                      <div className="col-12">
                        <label htmlFor="dir_sucursal" className="form-label small fw-bold">Dirección</label>
                        <input
                          type="text"
                          className={`form-control ${errors.dir_sucursal ? 'is-invalid' : ''}`}
                          id="dir_sucursal"
                          name="dir_sucursal"
                          value={form.dir_sucursal}
                          onChange={handleInputChange}
                        />
                        {errors.dir_sucursal && <div className="invalid-feedback">{errors.dir_sucursal}</div>}
                      </div>

                      <div className="col-12">
                        <label htmlFor="tel_cel" className="form-label small fw-bold">Teléfono / Celular</label>
                        <input
                          type="text"
                          className={`form-control ${errors.tel_cel ? 'is-invalid' : ''}`}
                          id="tel_cel"
                          name="tel_cel"
                          value={form.tel_cel}
                          onChange={handleInputChange}
                        />
                        {errors.tel_cel && <div className="invalid-feedback">{errors.tel_cel}</div>}
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

export default SucursalesPage
