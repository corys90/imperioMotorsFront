import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import swal from 'sweetalert'
import * as yup from 'yup'
import Layout from '../../components/ui/Layout'
import type { RootState } from '../../store'
import {
  Tipologia,
  TipologiaCreateInput,
  TipologiaUpdateInput,
  createTipologia,
  deleteTipologia,
  getTipologias,
  updateTipologia
} from '../../services/tipologiaService'

const validationSchema = yup.object().shape({
  id_tipos: yup.string().required('El codigo es obligatorio').max(5, 'Maximo 5 caracteres'),
  Desc_tipo: yup.string().required('La descripcion es obligatoria').max(250, 'Maximo 250 caracteres')
})

const initialFormState: TipologiaCreateInput = {
  id_tipos: '',
  id_usuario: '1',
  Desc_tipo: ''
}

function TipologiaPage() {
  const { user } = useSelector((state: RootState) => state.auth)
  const getUsername = (idUsuario: any) => {
    if (user && String(user.id) === String(idUsuario)) {
      return user.username || 'admin'
    }
    if (String(idUsuario) === '1') return 'admin'
    return idUsuario || '-'
  }
  const [tipologias, setTipologias] = useState<Tipologia[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editingTipologia, setEditingTipologia] = useState<Tipologia | null>(null)
  const [form, setForm] = useState<TipologiaCreateInput>(initialFormState)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fetchTipologias = async () => {
    setLoading(true)
    try {
      const data = await getTipologias(page, pageSize, search || undefined)
      setTipologias(data.results)
      setTotal(data.total)
    } catch (error: any) {
      swal('Error', error.message || 'No se pudieron cargar las tipologias', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTipologias()
  }, [page])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchTipologias()
  }

  const handleOpenAddModal = () => {
    setEditingTipologia(null)
    setForm(initialFormState)
    setErrors({})
    setShowModal(true)
  }

  const handleOpenEditModal = (tipologia: Tipologia) => {
    setEditingTipologia(tipologia)
    setForm({
      id_tipos: tipologia.id_tipos,
      id_usuario: tipologia.id_usuario,
      Desc_tipo: tipologia.Desc_tipo
    })
    setErrors({})
    setShowModal(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      await validationSchema.validate(form, { abortEarly: false })
      const payload: any = {}
      Object.keys(form).forEach((key) => {
        const value = (form as any)[key]
        if (key !== 'id_usuario') {
          payload[key] = value === '' ? undefined : value
        }
      })

      if (editingTipologia) {
        await updateTipologia(editingTipologia.id_tipos, payload as TipologiaUpdateInput)
        swal('Completado', 'Tipologia actualizada exitosamente', 'success')
      } else {
        payload.id_usuario = user?.id?.toString() || '1'
        await createTipologia(payload as TipologiaCreateInput)
        swal('Completado', 'Tipologia creada exitosamente', 'success')
      }

      setShowModal(false)
      fetchTipologias()
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        const formErrors: Record<string, string> = {}
        err.inner.forEach((validationError) => {
          if (validationError.path) formErrors[validationError.path] = validationError.message
        })
        setErrors(formErrors)
      } else {
        swal('Error de Operacion', err.message || 'Ocurrio un error al procesar la tipologia', 'error')
      }
    }
  }

  const handleDelete = (tipologia: Tipologia) => {
    swal({
      title: 'Estas seguro?',
      text: `Eliminaras permanentemente la tipologia "${tipologia.Desc_tipo}".`,
      icon: 'warning',
      buttons: ['Cancelar', 'Si, eliminar'],
      dangerMode: true
    }).then(async (willDelete) => {
      if (willDelete) {
        try {
          await deleteTipologia(tipologia.id_tipos)
          swal('Eliminado', 'La tipologia ha sido eliminada correctamente', 'success')
          fetchTipologias()
        } catch (error: any) {
          swal('Error', error.message || 'No se pudo eliminar la tipologia', 'error')
        }
      }
    })
  }

  const totalPages = Math.ceil(total / pageSize) || 1

  return (
    <Layout>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
        <div>
          <h1 className="h2 mb-1 fw-bold text-success-dark">Tipologia</h1>
          <p className="text-muted mb-0">Gestion y registro de tipologias de Imperio Motors</p>
        </div>
        <button type="button" className="btn btn-primary d-flex align-items-center gap-2" onClick={handleOpenAddModal}>
          <span>+</span> Nueva Tipologia
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
                  placeholder="Buscar por codigo o descripcion..."
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
                  setTimeout(() => fetchTipologias(), 50)
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
                <th className="py-3">Codigo</th>
                <th className="py-3">Descripcion</th>
                <th className="py-3">Usuario</th>
                <th className="py-3">Modificacion</th>
                <th className="py-3 text-center px-4 action-column">Acciones</th>
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
              ) : tipologias.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    No se encontraron tipologias registradas.
                  </td>
                </tr>
              ) : (
                tipologias.map((tipologia, index) => (
                  <tr key={tipologia.id_tipos}>
                    <td className="px-4">{(page - 1) * pageSize + index + 1}</td>
                    <td>{tipologia.id_tipos}</td>
                    <td>{tipologia.Desc_tipo}</td>
                    <td>{getUsername(tipologia.id_usuario)}</td>
                    <td>{new Date(tipologia.fec_mod).toLocaleString()}</td>
                    <td className="text-center px-4">
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary border-0 rounded-circle p-2"
                          onClick={() => handleOpenEditModal(tipologia)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger border-0 rounded-circle p-2"
                          onClick={() => handleDelete(tipologia)}
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
              Mostrando {tipologias.length} de {total} tipologias
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
          <div className="modal show d-block tipologia-modal-backdrop" tabIndex={-1} role="dialog">
            <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
              <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
                <div className="modal-header bg-success text-white p-3 border-0">
                  <h5 className="modal-title fw-bold">
                    {editingTipologia ? 'Editar Tipologia' : 'Nueva Tipologia'}
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} aria-label="Cerrar"></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body p-4 tipologia-modal-body">
                    <h6 className="text-success-dark fw-bold border-bottom pb-2 mb-3">Informacion General</h6>
                    <div className="row g-3 mb-4">
                      <div className="col-12 col-md-4">
                        <label htmlFor="id_tipos" className="form-label small fw-bold">Codigo *</label>
                        <input
                          type="text"
                          className={`form-control ${errors.id_tipos ? 'is-invalid' : ''}`}
                          id="id_tipos"
                          name="id_tipos"
                          value={form.id_tipos}
                          onChange={handleInputChange}
                          placeholder="Codigo de tipologia"
                          maxLength={5}
                          disabled={!!editingTipologia}
                        />
                        {errors.id_tipos && <div className="invalid-feedback d-block">{errors.id_tipos}</div>}
                      </div>
                      <div className="col-12 col-md-8">
                        <label htmlFor="Desc_tipo" className="form-label small fw-bold">Descripcion *</label>
                        <input
                          type="text"
                          className={`form-control ${errors.Desc_tipo ? 'is-invalid' : ''}`}
                          id="Desc_tipo"
                          name="Desc_tipo"
                          value={form.Desc_tipo}
                          onChange={handleInputChange}
                          placeholder="Descripcion de la tipologia"
                          maxLength={250}
                        />
                        {errors.Desc_tipo && <div className="invalid-feedback d-block">{errors.Desc_tipo}</div>}
                        <small className="text-muted">{form.Desc_tipo.length}/250</small>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer bg-light p-3 border-0">
                    <button type="button" className="btn btn-outline-secondary rounded-3" onClick={() => setShowModal(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-success rounded-3">
                      {editingTipologia ? 'Actualizar' : 'Crear'} Tipologia
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

export default TipologiaPage
