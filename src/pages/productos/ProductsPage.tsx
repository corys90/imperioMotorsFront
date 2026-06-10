import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import swal from 'sweetalert'
import * as yup from 'yup'
import Layout from '../../components/ui/Layout'
import type { RootState } from '../../store'
import { Categoria, getCategorias } from '../../services/categoriaService'
import { Estado, getEstados } from '../../services/estadoService'
import {
  Product,
  ProductCreateInput,
  ProductUpdateInput,
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct
} from '../../services/productService'

const validationSchema = yup.object().shape({
  id_categoria: yup
    .number()
    .typeError('La categoria es obligatoria')
    .integer('Debe ser un ID entero')
    .required('La categoria es obligatoria'),
  id_estado: yup
    .number()
    .typeError('El estado es obligatorio')
    .integer('Debe ser un ID entero')
    .required('El estado es obligatorio'),
  Desc_producto: yup
    .string()
    .required('La descripcion es obligatoria')
    .max(250, 'Maximo 250 caracteres'),
  Precio_gerencia: yup
    .number()
    .typeError('El precio debe ser un numero')
    .required('El precio es obligatorio')
    .min(0, 'El precio no puede ser negativo'),
  Ubicacion_fisica: yup
    .string()
    .required('La ubicacion fisica es obligatoria')
    .max(200, 'Maximo 200 caracteres'),
  impuesto_porc: yup
    .number()
    .typeError('El impuesto debe ser un numero')
    .required('El impuesto es obligatorio')
    .min(0, 'El impuesto no puede ser negativo'),
  Marca: yup.string().max(45, 'Maximo 45 caracteres').nullable().optional(),
  Material: yup.string().max(45, 'Maximo 45 caracteres').nullable().optional(),
  Modelo_aplicable: yup.string().max(256, 'Maximo 256 caracteres').nullable().optional(),
  Tipo: yup.string().max(50, 'Maximo 50 caracteres').nullable().optional(),
  Graficos: yup.string().max(50, 'Maximo 50 caracteres').nullable().optional(),
  ColorPrimario: yup.string().max(5, 'Maximo 5 caracteres').nullable().optional(),
  ColorSegundario: yup.string().max(5, 'Maximo 5 caracteres').nullable().optional(),
  ColorVisor: yup.string().max(5, 'Maximo 5 caracteres').nullable().optional(),
  ColorSpoiler: yup.string().max(5, 'Maximo 5 caracteres').nullable().optional(),
  Talla: yup.string().max(5, 'Maximo 5 caracteres').nullable().optional(),
  Acabado: yup.string().max(50, 'Maximo 50 caracteres').nullable().optional(),
  Stock_min: yup
    .number()
    .typeError('Stock minimo debe ser un numero')
    .integer('Debe ser entero')
    .nullable()
    .optional(),
  Stock_max: yup
    .number()
    .typeError('Stock maximo debe ser un numero')
    .integer('Debe ser entero')
    .nullable()
    .optional(),
  EAN: yup
    .number()
    .typeError('EAN debe ser un numero')
    .integer('Debe ser entero')
    .nullable()
    .optional(),
  Url: yup.string().max(300, 'Maximo 300 caracteres').nullable().optional(),
  descuento_porc: yup
    .number()
    .typeError('El descuento debe ser un numero')
    .min(0, 'El descuento no puede ser negativo')
    .nullable()
    .optional()
})

const initialFormState = {
  id_categoria: '',
  id_estado: '',
  Desc_producto: '',
  Marca: '',
  Material: '',
  Modelo_aplicable: '',
  Tipo: '',
  Graficos: '',
  ColorPrimario: '',
  ColorSegundario: '',
  ColorVisor: '',
  ColorSpoiler: '',
  Talla: '',
  Acabado: '',
  Precio_gerencia: '0',
  Stock_min: '',
  Stock_max: '',
  Ubicacion_fisica: 'PASILLO',
  EAN: '',
  Url: '',
  impuesto_porc: '19',
  descuento_porc: ''
}

function ProductsPage() {
  const { user } = useSelector((state: RootState) => state.auth)

  const getUsername = (idUsuario: any) => {
    if (user && String(user.id) === String(idUsuario)) {
      return user.username || 'admin'
    }
    if (String(idUsuario) === '1') return 'admin'
    return idUsuario || '-'
  }

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Categoria[]>([])
  const [states, setStates] = useState<Estado[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<number>(0)
  const [stateFilter, setStateFilter] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<any>(initialFormState)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch categories and states for filters and forms
  const loadDependencies = async () => {
    try {
      const catsRes = await getCategorias(1, 100)
      setCategories(catsRes.results)
      const statesRes = await getEstados(1, 100)
      setStates(statesRes.results)
    } catch (error: any) {
      console.error('Error al cargar dependencias:', error)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const data = await getProducts(
        page,
        pageSize,
        search || undefined,
        catFilter || undefined,
        stateFilter || undefined
      )
      setProducts(data.results)
      setTotal(data.total)
    } catch (error: any) {
      swal('Error', error.message || 'No se pudieron cargar los productos', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDependencies()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [page, catFilter, stateFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchProducts()
  }

  const handleOpenAddModal = () => {
    setEditingProduct(null)
    setForm({
      ...initialFormState,
      id_categoria: categories[0]?.id?.toString() || '',
      id_estado: states[0]?.id_estado?.toString() || ''
    })
    setErrors({})
    setShowModal(true)
  }

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product)
    setForm({
      id_categoria: product.id_categoria.toString(),
      id_estado: product.id_estado.toString(),
      Desc_producto: product.Desc_producto,
      Marca: product.Marca || '',
      Material: product.Material || '',
      Modelo_aplicable: product.Modelo_aplicable || '',
      Tipo: product.Tipo || '',
      Graficos: product.Graficos || '',
      ColorPrimario: product.ColorPrimario || '',
      ColorSegundario: product.ColorSegundario || '',
      ColorVisor: product.ColorVisor || '',
      ColorSpoiler: product.ColorSpoiler || '',
      Talla: product.Talla || '',
      Acabado: product.Acabado || '',
      Precio_gerencia: product.Precio_gerencia.toString(),
      Stock_min: product.Stock_min?.toString() || '',
      Stock_max: product.Stock_max?.toString() || '',
      Ubicacion_fisica: product.Ubicacion_fisica,
      EAN: product.EAN?.toString() || '',
      Url: product.Url || '',
      impuesto_porc: product.impuesto_porc.toString(),
      descuento_porc: product.descuento_porc?.toString() || ''
    })
    setErrors({})
    setShowModal(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      if (!user?.id) {
        swal('Error de sesion', 'No se encontro el usuario autenticado.', 'error')
        return
      }

      // Prepare payload and enforce types
      const payload: any = {
        id_usuario: user.id,
        id_categoria: Number(form.id_categoria),
        id_estado: Number(form.id_estado),
        Desc_producto: form.Desc_producto.trim(),
        Precio_gerencia: Number(form.Precio_gerencia),
        impuesto_porc: Number(form.impuesto_porc),
        Ubicacion_fisica: form.Ubicacion_fisica.trim() || 'PASILLO',
        
        Marca: form.Marca.trim() || null,
        Material: form.Material.trim() || null,
        Modelo_aplicable: form.Modelo_aplicable.trim() || null,
        Tipo: form.Tipo.trim() || null,
        Graficos: form.Graficos.trim() || null,
        ColorPrimario: form.ColorPrimario.trim() || null,
        ColorSegundario: form.ColorSegundario.trim() || null,
        ColorVisor: form.ColorVisor.trim() || null,
        ColorSpoiler: form.ColorSpoiler.trim() || null,
        Talla: form.Talla.trim() || null,
        Acabado: form.Acabado.trim() || null,
        Stock_min: form.Stock_min ? Number(form.Stock_min) : null,
        Stock_max: form.Stock_max ? Number(form.Stock_max) : null,
        EAN: form.EAN ? Number(form.EAN) : null,
        Url: form.Url.trim() || null,
        descuento_porc: form.descuento_porc ? Number(form.descuento_porc) : null
      }

      await validationSchema.validate(payload, { abortEarly: false })

      if (editingProduct) {
        await updateProduct(editingProduct.id_producto, payload as ProductUpdateInput)
        swal('Completado', 'Producto actualizado exitosamente', 'success')
      } else {
        await createProduct(payload as ProductCreateInput)
        swal('Completado', 'Producto creado exitosamente', 'success')
      }

      setShowModal(false)
      fetchProducts()
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        const formErrors: Record<string, string> = {}
        err.inner.forEach((validationError) => {
          if (validationError.path) formErrors[validationError.path] = validationError.message
        })
        setErrors(formErrors)
      } else {
        swal('Error de Operacion', err.message || 'Ocurrio un error al procesar el producto', 'error')
      }
    }
  }

  const handleDelete = (product: Product) => {
    swal({
      title: '¿Estas seguro?',
      text: `Eliminaras permanentemente el producto "${product.Desc_producto}".`,
      icon: 'warning',
      buttons: ['Cancelar', 'Si, eliminar'],
      dangerMode: true
    }).then(async (willDelete) => {
      if (willDelete) {
        try {
          await deleteProduct(product.id_producto)
          swal('Eliminado', 'El producto ha sido eliminado correctamente', 'success')
          fetchProducts()
        } catch (error: any) {
          swal('Error', error.message || 'No se pudo eliminar el producto', 'error')
        }
      }
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
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
          <h1 className="h2 mb-1 fw-bold text-success-dark">Productos</h1>
          <p className="text-muted mb-0">Gestion y catalogo de productos de Imperio Motors</p>
        </div>
        <button type="button" className="btn btn-primary d-flex align-items-center gap-2" onClick={handleOpenAddModal}>
          <span>+</span> Nuevo Producto
        </button>
      </div>

      <div className="card shadow-sm border-0 rounded-4 mb-4">
        <div className="card-body p-3">
          <form onSubmit={handleSearchSubmit} className="row g-2">
            <div className="col-12 col-md-5 col-lg-5">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por descripcion, marca, material..."
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
                value={catFilter}
                onChange={(e) => setCatFilter(Number(e.target.value))}
                style={{ height: '100%' }}
              >
                <option value={0}>Todas las categorias</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.desc_categoria}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-2 col-lg-2">
              <select
                className="form-select rounded-3"
                value={stateFilter}
                onChange={(e) => setStateFilter(Number(e.target.value))}
                style={{ height: '100%' }}
              >
                <option value={0}>Todos los estados</option>
                {states.map((s) => (
                  <option key={s.id_estado} value={s.id_estado}>
                    {s.desc_estado}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-2 col-lg-3 d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSearch('')
                  setCatFilter(0)
                  setStateFilter(0)
                  setPage(1)
                  setTimeout(() => fetchProducts(), 50)
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
                <th className="py-3 px-4">Producto</th>
                <th className="py-3">Categoria</th>
                <th className="py-3">Especificaciones</th>
                <th className="py-3">Ubicacion / EAN</th>
                <th className="py-3">Precios</th>
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
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted">
                    No se encontraron productos registrados.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id_producto}>
                    <td className="px-4">
                      <div className="d-flex align-items-center gap-3">
                        {p.Url && (
                          <img
                            src={p.Url}
                            alt={p.Desc_producto}
                            className="rounded border"
                            style={{ width: '45px', height: '45px', objectFit: 'cover' }}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none'
                            }}
                          />
                        )}
                        <div>
                          <div className="fw-bold">{p.Desc_producto}</div>
                          <div className="small text-muted">ID {p.id_producto} {p.Marca && `• ${p.Marca}`}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-success-subtle text-success border-0 rounded-3 px-2 py-1 small">
                        {p.categoria?.desc_categoria || `Cat ${p.id_categoria}`}
                      </span>
                    </td>
                    <td>
                      <div className="small">
                        {p.Tipo && <div><strong>Tipo:</strong> {p.Tipo}</div>}
                        {p.Talla && <div><strong>Talla:</strong> {p.Talla}</div>}
                        {p.Material && <div><strong>Material:</strong> {p.Material}</div>}
                      </div>
                    </td>
                    <td>
                      <div className="small font-monospace">{p.Ubicacion_fisica}</div>
                      {p.EAN && <div className="small text-muted font-monospace">EAN: {p.EAN}</div>}
                    </td>
                    <td>
                      <div className="fw-bold">{formatCurrency(p.Precio_gerencia)}</div>
                      <div className="small text-muted">
                        Impuesto: {p.impuesto_porc}% 
                        {p.descuento_porc ? ` • Desc: ${p.descuento_porc}%` : ''}
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="badge bg-light text-dark border rounded-pill py-2 px-3 small">
                        {p.estado?.desc_estado || `Est ${p.id_estado}`}
                      </span>
                    </td>
                    <td className="text-center px-4">
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary border-0 rounded-circle p-2"
                          onClick={() => handleOpenEditModal(p)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger border-0 rounded-circle p-2"
                          onClick={() => handleDelete(p)}
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
              Mostrando {products.length} de {total} productos
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
                    {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} aria-label="Cerrar"></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body p-4" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                    <h6 className="text-success-dark fw-bold border-bottom pb-2 mb-3">Informacion General</h6>

                    <div className="row g-3 mb-4">
                      <div className="col-12 col-md-6">
                        <label htmlFor="Desc_producto" className="form-label small fw-bold">Descripcion del Producto *</label>
                        <input
                          type="text"
                          className={`form-control ${errors.Desc_producto ? 'is-invalid' : ''}`}
                          id="Desc_producto"
                          name="Desc_producto"
                          value={form.Desc_producto}
                          onChange={handleInputChange}
                        />
                        {errors.Desc_producto && <div className="invalid-feedback">{errors.Desc_producto}</div>}
                      </div>

                      <div className="col-12 col-md-3">
                        <label htmlFor="id_categoria" className="form-label small fw-bold">Categoria *</label>
                        <select
                          className={`form-select ${errors.id_categoria ? 'is-invalid' : ''}`}
                          id="id_categoria"
                          name="id_categoria"
                          value={form.id_categoria}
                          onChange={handleInputChange}
                        >
                          <option value="">Seleccione...</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.desc_categoria}
                            </option>
                          ))}
                        </select>
                        {errors.id_categoria && <div className="invalid-feedback">{errors.id_categoria}</div>}
                      </div>

                      <div className="col-12 col-md-3">
                        <label htmlFor="id_estado" className="form-label small fw-bold">Estado *</label>
                        <select
                          className={`form-select ${errors.id_estado ? 'is-invalid' : ''}`}
                          id="id_estado"
                          name="id_estado"
                          value={form.id_estado}
                          onChange={handleInputChange}
                        >
                          <option value="">Seleccione...</option>
                          {states.map((s) => (
                            <option key={s.id_estado} value={s.id_estado}>
                              {s.desc_estado}
                            </option>
                          ))}
                        </select>
                        {errors.id_estado && <div className="invalid-feedback">{errors.id_estado}</div>}
                      </div>

                      <div className="col-6 col-md-3">
                        <label htmlFor="Marca" className="form-label small fw-bold">Marca</label>
                        <input
                          type="text"
                          className="form-control"
                          id="Marca"
                          name="Marca"
                          value={form.Marca}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-6 col-md-3">
                        <label htmlFor="Material" className="form-label small fw-bold">Material</label>
                        <input
                          type="text"
                          className="form-control"
                          id="Material"
                          name="Material"
                          value={form.Material}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label htmlFor="Modelo_aplicable" className="form-label small fw-bold">Modelo aplicable (Moto/Carro sirviente)</label>
                        <input
                          type="text"
                          className="form-control"
                          id="Modelo_aplicable"
                          name="Modelo_aplicable"
                          placeholder="Ej. Apache 200, Pulsar NS200"
                          value={form.Modelo_aplicable}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <h6 className="text-success-dark fw-bold border-bottom pb-2 mb-3">Especificaciones Tecnicas y Diseño</h6>
                    <div className="row g-3 mb-4">
                      <div className="col-6 col-md-3">
                        <label htmlFor="Tipo" className="form-label small fw-bold">Tipo</label>
                        <input
                          type="text"
                          className="form-control"
                          id="Tipo"
                          name="Tipo"
                          placeholder="Ej. ABATIBLE, INTEGRAL..."
                          value={form.Tipo}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-6 col-md-3">
                        <label htmlFor="Talla" className="form-label small fw-bold">Talla</label>
                        <input
                          type="text"
                          className="form-control"
                          id="Talla"
                          name="Talla"
                          placeholder="Ej. M, L, XL"
                          value={form.Talla}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-6 col-md-3">
                        <label htmlFor="Acabado" className="form-label small fw-bold">Acabado</label>
                        <input
                          type="text"
                          className="form-control"
                          id="Acabado"
                          name="Acabado"
                          placeholder="Ej. MATE, BRILLANTE..."
                          value={form.Acabado}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-6 col-md-3">
                        <label htmlFor="Graficos" className="form-label small fw-bold">Graficos</label>
                        <input
                          type="text"
                          className="form-control"
                          id="Graficos"
                          name="Graficos"
                          value={form.Graficos}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-6 col-md-3">
                        <label htmlFor="ColorPrimario" className="form-label small fw-bold">Color Primario</label>
                        <input
                          type="text"
                          className="form-control"
                          id="ColorPrimario"
                          name="ColorPrimario"
                          placeholder="Cod."
                          value={form.ColorPrimario}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-6 col-md-3">
                        <label htmlFor="ColorSegundario" className="form-label small fw-bold">Color Secundario</label>
                        <input
                          type="text"
                          className="form-control"
                          id="ColorSegundario"
                          name="ColorSegundario"
                          placeholder="Cod."
                          value={form.ColorSegundario}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-6 col-md-3">
                        <label htmlFor="ColorVisor" className="form-label small fw-bold">Color Visor</label>
                        <input
                          type="text"
                          className="form-control"
                          id="ColorVisor"
                          name="ColorVisor"
                          placeholder="Cod."
                          value={form.ColorVisor}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-6 col-md-3">
                        <label htmlFor="ColorSpoiler" className="form-label small fw-bold">Color Spoiler</label>
                        <input
                          type="text"
                          className="form-control"
                          id="ColorSpoiler"
                          name="ColorSpoiler"
                          placeholder="Cod."
                          value={form.ColorSpoiler}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <h6 className="text-success-dark fw-bold border-bottom pb-2 mb-3">Precios y Descuentos</h6>
                    <div className="row g-3 mb-4">
                      <div className="col-12 col-md-4">
                        <label htmlFor="Precio_gerencia" className="form-label small fw-bold">Precio Publico *</label>
                        <div className="input-group">
                          <span className="input-group-text">$</span>
                          <input
                            type="number"
                            step="any"
                            className={`form-control ${errors.Precio_gerencia ? 'is-invalid' : ''}`}
                            id="Precio_gerencia"
                            name="Precio_gerencia"
                            value={form.Precio_gerencia}
                            onChange={handleInputChange}
                          />
                          {errors.Precio_gerencia && <div className="invalid-feedback">{errors.Precio_gerencia}</div>}
                        </div>
                      </div>

                      <div className="col-6 col-md-4">
                        <label htmlFor="impuesto_porc" className="form-label small fw-bold">Impuesto % *</label>
                        <input
                          type="number"
                          step="any"
                          className={`form-control ${errors.impuesto_porc ? 'is-invalid' : ''}`}
                          id="impuesto_porc"
                          name="impuesto_porc"
                          value={form.impuesto_porc}
                          onChange={handleInputChange}
                        />
                        {errors.impuesto_porc && <div className="invalid-feedback">{errors.impuesto_porc}</div>}
                      </div>

                      <div className="col-6 col-md-4">
                        <label htmlFor="descuento_porc" className="form-label small fw-bold">Descuento %</label>
                        <input
                          type="number"
                          step="any"
                          className={`form-control ${errors.descuento_porc ? 'is-invalid' : ''}`}
                          id="descuento_porc"
                          name="descuento_porc"
                          placeholder="Si aplica"
                          value={form.descuento_porc}
                          onChange={handleInputChange}
                        />
                        {errors.descuento_porc && <div className="invalid-feedback">{errors.descuento_porc}</div>}
                      </div>
                    </div>

                    <h6 className="text-success-dark fw-bold border-bottom pb-2 mb-3">Inventario y Ubicacion</h6>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label htmlFor="Ubicacion_fisica" className="form-label small fw-bold">Ubicacion Fisica *</label>
                        <input
                          type="text"
                          className={`form-control ${errors.Ubicacion_fisica ? 'is-invalid' : ''}`}
                          id="Ubicacion_fisica"
                          name="Ubicacion_fisica"
                          placeholder="PASILLO 2, ESTANTE B..."
                          value={form.Ubicacion_fisica}
                          onChange={handleInputChange}
                        />
                        {errors.Ubicacion_fisica && <div className="invalid-feedback">{errors.Ubicacion_fisica}</div>}
                      </div>

                      <div className="col-6 col-md-3">
                        <label htmlFor="Stock_min" className="form-label small fw-bold">Stock Minimo</label>
                        <input
                          type="number"
                          className="form-control"
                          id="Stock_min"
                          name="Stock_min"
                          value={form.Stock_min}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-6 col-md-3">
                        <label htmlFor="Stock_max" className="form-label small fw-bold">Stock Maximo</label>
                        <input
                          type="number"
                          className="form-control"
                          id="Stock_max"
                          name="Stock_max"
                          value={form.Stock_max}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-12 col-md-4">
                        <label htmlFor="EAN" className="form-label small fw-bold">Codigo de Barras (EAN)</label>
                        <input
                          type="number"
                          className="form-control"
                          id="EAN"
                          name="EAN"
                          value={form.EAN}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-12 col-md-8">
                        <label htmlFor="Url" className="form-label small fw-bold">URL Imagen del Producto</label>
                        <input
                          type="text"
                          className="form-control"
                          id="Url"
                          name="Url"
                          placeholder="http://..."
                          value={form.Url}
                          onChange={handleInputChange}
                        />
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

export default ProductsPage
