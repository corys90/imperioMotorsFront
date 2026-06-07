import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import swal from 'sweetalert'
import * as yup from 'yup'
import Layout from '../../components/ui/Layout'
import type { RootState } from '../../store'
import {
  MediosPago,
  MediosPagoCreateInput,
  MediosPagoUpdateInput,
  createMedioPago,
  deleteMedioPago,
  getMediosPagos,
  updateMedioPago
} from '../../services/mediosPagoService'

const validationSchema = yup.object().shape({
  id_Mpagos: yup
    .number()
    .typeError('El codigo debe ser un numero')
    .integer('Debe ser un numero entero')
    .required('El codigo es obligatorio'),
  Desc_Mpagos: yup.string().required('La descripcion es obligatoria').max(50, 'Maximo 50 caracteres')
})

const initialFormState: MediosPagoCreateInput = {
  id_Mpagos: 0,
  id_usuario: '1',
  Desc_Mpagos: ''
}

function MediosPagoPage() {
  const { user } = useSelector((state: RootState) => state.auth)
  const getUsername = (idUsuario: any) => {
    if (user && String(user.id) === String(idUsuario)) {
      return user.username || 'admin'
    }
    if (String(idUsuario) === '1') return 'admin'
    return idUsuario || '-'
  }
  const [medios, setMedios] = useState<MediosPago[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editingMedio, setEditingMedio] = useState<MediosPago | null>(null)
  const [form, setForm] = useState<MediosPagoCreateInput>(initialFormState)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fetchMedios = async () => {
    setLoading(true)
    try {
      const data = await getMediosPagos(page, pageSize, search || undefined)
      setMedios(data.results)
      setTotal(data.total)
    } catch (error: any) {
      swal('Error', error.message || 'No se pudieron cargar los medios de pago', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMedios()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchMedios()
  }

  const handleOpenAddModal = () => {
    setEditingMedio(null)
    setForm({
      id_Mpagos: 0,
      id_usuario: user?.id?.toString() || '1',
      Desc_Mpagos: ''
    })
    setErrors({})
    setShowModal(true)
  }

  const handleOpenEditModal = (medio: MediosPago) => {
    setEditingMedio(medio)
    setForm({
      id_Mpagos: medio.id_Mpagos,
      id_usuario: user?.id?.toString() || medio.id_usuario,
      Desc_Mpagos: medio.Desc_Mpagos
    })
    setErrors({})
    setShowModal(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm({
      ...form,
      [name]: name === 'id_Mpagos' ? (value === '' ? '' : Number(value)) : value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      await validationSchema.validate(form, { abortEarly: false })

      const payload: MediosPagoCreateInput = {
        id_Mpagos: Number(form.id_Mpagos),
        id_usuario: user?.id?.toString() || '1',
        Desc_Mpagos: form.Desc_Mpagos.trim()
      }

      if (editingMedio) {
        const updatePayload: MediosPagoUpdateInput = {
          id_usuario: payload.id_usuario,
          Desc_Mpagos: payload.Desc_Mpagos
        }
        await updateMedioPago(editingMedio.id_Mpagos, updatePayload)
        swal('Completado', 'Medio de pago actualizado exitosamente', 'success')
      } else {
        await createMedioPago(payload)
        swal('Completado', 'Medio de pago creado exitosamente', 'success')
      }

      setShowModal(false)
      fetchMedios()
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        const formErrors: Record<string, string> = {}
        err.inner.forEach((validationError) => {
          if (validationError.path) formErrors[validationError.path] = validationError.message
        })
        setErrors(formErrors)
      } else {
        swal('Error de Operacion', err.message || 'Ocurrio un error al procesar el medio de pago', 'error')
      }
    }
  }

  const handleDelete = (medio: MediosPago) => {
    swal({
      title: 'Estas seguro?',
      text: `Eliminaras permanentemente el medio de pago "${medio.Desc_Mpagos}".`,
      icon: 'warning',
      buttons: ['Cancelar', 'Si, eliminar'],
      dangerMode: true
    }).then(async (willDelete) => {
      if (willDelete) {
        try {
          await deleteMedioPago(medio.id_Mpagos)
          swal('Eliminado', 'El medio de pago ha sido eliminado correctamente', 'success')
          fetchMedios()
        } catch (error: any) {
          swal('Error', error.message || 'No se pudo eliminar el medio de pago', 'error')
        }
      }
    })
  }

  const totalPages = Math.ceil(total / pageSize) || 1

  return (
    <Layout>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
        <div>
          <h1 className="h2 mb-1 fw-bold text-success-dark">Medios de Pago</h1>
          <p className="text-muted mb-0">Gestion y registro de medios de pago de Imperio Motors</p>
        </div>
        <button type="button" className="btn btn-primary d-flex align-items-center gap-2" onClick={handleOpenAddModal}>
          <span>+</span> Nuevo Medio de Pago
        </button>
      </div>

      <div className="card shadow-sm border-0 rounded-4 mb-4">
        <div className="card-body p-3">
          <form onSubmit={handleSearchSubmit} className="row g-2">
            <div className="col-12 col-md-9 col-lg-10">
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
            <div className="col-12 col-md-3 col-lg-2 d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSearch('')
                  setPage(1)
                  setTimeout(() => fetchMedios(), 50)
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
                <th className="py-3 px-4">#</th>
                <th className="py-3">Codigo (ID)</th>
                <th className="py-3">Descripcion</th>
                <th className="py-3">Usuario</th>
                <th className="py-3">Ultima Modificacion</th>
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
              ) : medios.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    No se encontraron medios de pago registrados.
                  </td>
                </tr>
              ) : (
                medios.map((medio, index) => (
                  <tr key={medio.id_Mpagos}>
                    <td className="px-4">{(page - 1) * pageSize + index + 1}</td>
                    <td><span className="badge bg-light text-dark px-2.5 py-1.5 fs-7 border">{medio.id_Mpagos}</span></td>
                    <td>
                      <div className="fw-bold">{medio.Desc_Mpagos}</div>
                    </td>
                    <td>{getUsername(medio.id_usuario)}</td>
                    <td>{medio.fec_mod ? new Date(medio.fec_mod).toLocaleString() : '-'}</td>
                    <td className="text-center px-4">
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary border-0 rounded-circle p-2"
                          onClick={() => handleOpenEditModal(medio)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger border-0 rounded-circle p-2"
                          onClick={() => handleDelete(medio)}
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
              Mostrando {medios.length} de {total} registros
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
                    {editingMedio ? 'Editar Medio de Pago' : 'Nuevo Medio de Pago'}
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} aria-label="Cerrar"></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body p-4" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                    <h6 className="text-success-dark fw-bold border-bottom pb-2 mb-3">Informacion General</h6>

                    <div className="row g-3 mb-4">
                      <div className="col-12 col-md-4">
                        <label htmlFor="id_Mpagos" className="form-label small fw-bold">Codigo *</label>
                        <input
                          type="number"
                          className={`form-control ${errors.id_Mpagos ? 'is-invalid' : ''}`}
                          id="id_Mpagos"
                          name="id_Mpagos"
                          value={form.id_Mpagos === 0 && !editingMedio ? '' : form.id_Mpagos}
                          onChange={handleInputChange}
                          placeholder="Codigo numerico"
                          disabled={!!editingMedio}
                        />
                        {errors.id_Mpagos && <div className="invalid-feedback d-block">{errors.id_Mpagos}</div>}
                      </div>

                      <div className="col-12 col-md-8">
                        <label htmlFor="Desc_Mpagos" className="form-label small fw-bold">Descripcion *</label>
                        <input
                          type="text"
                          className={`form-control ${errors.Desc_Mpagos ? 'is-invalid' : ''}`}
                          id="Desc_Mpagos"
                          name="Desc_Mpagos"
                          value={form.Desc_Mpagos}
                          onChange={handleInputChange}
                          placeholder="Descripcion del medio de pago"
                          maxLength={50}
                        />
                        {errors.Desc_Mpagos && <div className="invalid-feedback d-block">{errors.Desc_Mpagos}</div>}
                        <small className="text-muted">{form.Desc_Mpagos.length}/50</small>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer bg-light p-3 border-0">
                    <button type="button" className="btn btn-outline-secondary rounded-3" onClick={() => setShowModal(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-success rounded-3">
                      {editingMedio ? 'Actualizar' : 'Crear'} Medio de Pago
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </Layout>
  )
}

export default MediosPagoPage
