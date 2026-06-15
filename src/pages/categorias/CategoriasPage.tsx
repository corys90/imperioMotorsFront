import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import swal from 'sweetalert'
import * as yup from 'yup'
import Layout from '../../components/ui/Layout'
import type { RootState } from '../../store'
import {
  Categoria,
  CategoriaCreateInput,
  CategoriaUpdateInput,
  createCategoria,
  deleteCategoria,
  getCategorias,
  toggleCategoriaStatus,
  updateCategoria
} from '../../services/categoriaService'

const validationSchema = yup.object().shape({
  desc_categoria: yup.string().required('La descripcion es obligatoria').max(150, 'Maximo 150 caracteres'),
  activo: yup.boolean().optional()
})

const initialFormState: CategoriaCreateInput = {
  id_usuario: 0,
  desc_categoria: '',
  activo: true
}

function CategoriasPage() {
  const { user } = useSelector((state: RootState) => state.auth)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [loading, setLoading] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null)
  const [form, setForm] = useState<CategoriaCreateInput>(initialFormState)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fetchCategorias = async () => {
    setLoading(true)
    try {
      const activeParam = statusFilter === 'all' ? undefined : statusFilter === 'active'
      const data = await getCategorias(page, pageSize, search || undefined, activeParam)
      setCategorias(data.results)
      setTotal(data.total)
    } catch (error: any) {
      swal('Error', error.message || 'No se pudieron cargar las categorias', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategorias()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchCategorias()
  }

  const handleOpenAddModal = () => {
    setEditingCategoria(null)
    setForm({ ...initialFormState, id_usuario: user?.id ?? 0 })
    setErrors({})
    setShowModal(true)
  }

  const handleOpenEditModal = (categoria: Categoria) => {
    setEditingCategoria(categoria)
    setForm({
      id_usuario: user?.id ?? categoria.id_usuario,
      desc_categoria: categoria.desc_categoria,
      activo: categoria.activo
    })
    setErrors({})
    setShowModal(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value
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

      const payload: CategoriaCreateInput = {
        id_usuario: user.id,
        desc_categoria: form.desc_categoria.trim(),
        activo: form.activo
      }

      await validationSchema.validate(payload, { abortEarly: false })

      if (editingCategoria) {
        await updateCategoria(editingCategoria.id, payload as CategoriaUpdateInput)
        swal('Completado', 'Categoria actualizada exitosamente', 'success')
      } else {
        await createCategoria(payload)
        swal('Completado', 'Categoria creada exitosamente', 'success')
      }

      setShowModal(false)
      fetchCategorias()
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        const formErrors: Record<string, string> = {}
        err.inner.forEach((validationError) => {
          if (validationError.path) formErrors[validationError.path] = validationError.message
        })
        setErrors(formErrors)
      } else {
        swal('Error de Operacion', err.message || 'Ocurrio un error al procesar la categoria', 'error')
      }
    }
  }

  const handleDelete = (categoria: Categoria) => {
    swal({
      title: 'Estas seguro?',
      text: `Eliminaras permanentemente la categoria "${categoria.desc_categoria}".`,
      icon: 'warning',
      buttons: ['Cancelar', 'Si, eliminar'],
      dangerMode: true
    }).then(async (willDelete) => {
      if (willDelete) {
        try {
          await deleteCategoria(categoria.id)
          swal('Eliminado', 'La categoria ha sido eliminada correctamente', 'success')
          fetchCategorias()
        } catch (error: any) {
          swal('Error', error.message || 'No se pudo eliminar la categoria', 'error')
        }
      }
    })
  }

  const handleToggleStatus = async (categoria: Categoria) => {
    try {
      await toggleCategoriaStatus(categoria.id)
      fetchCategorias()
    } catch (error: any) {
      swal('Error', error.message || 'No se pudo cambiar el estado de la categoria', 'error')
    }
  }

  const totalPages = Math.ceil(total / pageSize) || 1

  return (
    <Layout>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
        <div>
          <h1 className="h2 mb-1 fw-bold text-success-dark">Categorias</h1>
          <p className="text-muted mb-0">Gestion y registro de categorias de Imperio Motors</p>
        </div>
        <button type="button" className="btn btn-primary d-flex align-items-center gap-2" onClick={handleOpenAddModal}>
          <span>+</span> Nueva Categoria
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
                  setTimeout(() => fetchCategorias(), 50)
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
                <th className="py-3">Descripcion</th>
                <th className="py-3 text-center">Estado</th>
                <th className="py-3 text-center px-4" style={{ width: '150px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-5">
                    <div className="spinner-border text-success" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                  </td>
                </tr>
              ) : categorias.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-5 text-muted">
                    No se encontraron categorias registradas.
                  </td>
                </tr>
              ) : (
                categorias.map((categoria, index) => (
                  <tr key={categoria.id}>
                    <td className="px-4">{(page - 1) * pageSize + index + 1}</td>
                    <td>
                      <div className="fw-bold">{categoria.desc_categoria}</div>
                    </td>
                    <td className="text-center">
                      <span
                        className={`badge cursor-pointer rounded-pill py-2 px-3 ${
                          categoria.activo ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
                        }`}
                        onClick={() => handleToggleStatus(categoria)}
                        title="Hacer clic para cambiar de estado"
                        style={{ cursor: 'pointer' }}
                      >
                        {categoria.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="text-center px-4">
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary border-0 rounded-circle p-2"
                          onClick={() => handleOpenEditModal(categoria)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger border-0 rounded-circle p-2"
                          onClick={() => handleDelete(categoria)}
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
              Mostrando {categorias.length} de {total} categorias
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
            <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
              <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
                <div className="modal-header bg-success text-white p-3 border-0">
                  <h5 className="modal-title fw-bold">
                    {editingCategoria ? 'Editar Categoria' : 'Nueva Categoria'}
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} aria-label="Cerrar"></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body p-4" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                    <h6 className="text-success-dark fw-bold border-bottom pb-2 mb-3">Informacion General</h6>

                    <div className="row g-3 mb-4">
                      <div className="col-12">
                        <label htmlFor="desc_categoria" className="form-label small fw-bold">Descripcion *</label>
                        <input
                          type="text"
                          className={`form-control ${errors.desc_categoria ? 'is-invalid' : ''}`}
                          id="desc_categoria"
                          name="desc_categoria"
                          value={form.desc_categoria}
                          onChange={handleInputChange}
                          placeholder="Descripcion de la categoria"
                          maxLength={150}
                        />
                        {errors.desc_categoria && <div className="invalid-feedback d-block">{errors.desc_categoria}</div>}
                        <small className="text-muted">{form.desc_categoria.length}/150</small>
                      </div>

                      <div className="col-12">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="activoCheckbox"
                            name="activo"
                            checked={form.activo}
                            onChange={handleInputChange}
                          />
                          <label className="form-check-label fw-bold" htmlFor="activoCheckbox">
                            Activo
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer bg-light p-3 border-0">
                    <button type="button" className="btn btn-outline-secondary rounded-3" onClick={() => setShowModal(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-success rounded-3">
                      {editingCategoria ? 'Actualizar' : 'Crear'} Categoria
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

export default CategoriasPage
