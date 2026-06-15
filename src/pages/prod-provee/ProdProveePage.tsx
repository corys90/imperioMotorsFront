import { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import swal from 'sweetalert'
import * as yup from 'yup'
import Layout from '../../components/ui/Layout'
import type { RootState } from '../../store'
import { Product, getProducts } from '../../services/productService'
import { Supplier, getSuppliers } from '../../services/supplierService'
import {
  ProdProvee,
  createProdProvee,
  deleteProdProvee,
  getProdProvees,
  updateProdProvee
} from '../../services/prodProveeService'

const validationSchema = yup.object().shape({
  Id: yup.number().typeError('El ID debe ser numerico').integer('Debe ser entero').required('El ID es obligatorio'),
  id_producto: yup.number().typeError('Seleccione un producto').integer('Debe ser entero').required('El producto es obligatorio'),
  id_proveedor: yup.number().typeError('Seleccione un proveedor').integer('Debe ser entero').required('El proveedor es obligatorio'),
  Item_prod_provee: yup.number().typeError('El item debe ser numerico').integer('Debe ser entero').required('El item es obligatorio'),
  Ultimo_precio_compra: yup.number().typeError('El precio debe ser numerico').min(0, 'El precio no puede ser negativo').required('El precio es obligatorio')
})

const initialFormState = {
  Id: '',
  id_producto: '',
  id_proveedor: '',
  Item_prod_provee: '',
  Ultimo_precio_compra: ''
}

function supplierLabel(supplier: Supplier) {
  return `${supplier.document_number} - ${supplier.company_name}`
}

function productLabel(product: Product) {
  return `${product.id_producto} - ${product.Desc_producto}`
}

function sortSuppliers(suppliers: Supplier[]) {
  return [...suppliers]
    .sort((a, b) => supplierLabel(a).localeCompare(supplierLabel(b), 'es', { sensitivity: 'base' }))
    .slice(0, 10)
}

function sortProducts(products: Product[]) {
  return [...products]
    .sort((a, b) => productLabel(a).localeCompare(productLabel(b), 'es', { sensitivity: 'base' }))
    .slice(0, 10)
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

function ProdProveePage() {
  const { user } = useSelector((state: RootState) => state.auth)

  const [records, setRecords] = useState<ProdProvee[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [loading, setLoading] = useState(false)

  const [supplierOptions, setSupplierOptions] = useState<Supplier[]>([])
  const [productOptions, setProductOptions] = useState<Product[]>([])
  const [supplierQuery, setSupplierQuery] = useState('')
  const [productQuery, setProductQuery] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ProdProvee | null>(null)
  const [form, setForm] = useState<any>(initialFormState)
  const [formSupplierQuery, setFormSupplierQuery] = useState('')
  const [formProductQuery, setFormProductQuery] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const supplierMap = useMemo(() => {
    const map = new Map<number, Supplier>()
    supplierOptions.forEach((supplier) => map.set(supplier.id, supplier))
    return map
  }, [supplierOptions])

  const productMap = useMemo(() => {
    const map = new Map<number, Product>()
    productOptions.forEach((product) => map.set(product.id_producto, product))
    return map
  }, [productOptions])

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

  const loadProducts = async (search?: string) => {
    try {
      const data = await getProducts(1, 100, search || undefined)
      setProductOptions(sortProducts(data.results))
    } catch (error: any) {
      swal('Error', error.message || 'No se pudieron cargar los productos', 'error')
    }
  }

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const data = await getProdProvees(
        page,
        pageSize,
        selectedProduct?.id_producto,
        selectedSupplier?.id
      )
      setRecords(data.results)
      setTotal(data.total)
    } catch (error: any) {
      swal('Error', error.message || 'No se pudieron cargar los productos proveedores', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSuppliers()
    loadProducts()
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => loadSuppliers(supplierQuery), 250)
    return () => window.clearTimeout(timer)
  }, [supplierQuery])

  useEffect(() => {
    const timer = window.setTimeout(() => loadProducts(productQuery), 250)
    return () => window.clearTimeout(timer)
  }, [productQuery])

  useEffect(() => {
    fetchRecords()
  }, [page, selectedSupplier, selectedProduct])

  const resolveSupplier = (value: string) => {
    const normalized = value.trim().toLowerCase()
    return supplierOptions.find((supplier) => supplierLabel(supplier).toLowerCase() === normalized) || null
  }

  const resolveProduct = (value: string) => {
    const normalized = value.trim().toLowerCase()
    return productOptions.find((product) => productLabel(product).toLowerCase() === normalized) || null
  }

  const handleSupplierFilterChange = (value: string) => {
    setSupplierQuery(value)
    const supplier = resolveSupplier(value)
    setSelectedSupplier(supplier)
    setPage(1)
  }

  const handleProductFilterChange = (value: string) => {
    setProductQuery(value)
    const product = resolveProduct(value)
    setSelectedProduct(product)
    setPage(1)
  }

  const handleClearFilters = () => {
    setSupplierQuery('')
    setProductQuery('')
    setSelectedSupplier(null)
    setSelectedProduct(null)
    setPage(1)
  }

  const handleOpenAddModal = () => {
    setEditingRecord(null)
    const supplier = selectedSupplier
    const product = selectedProduct
    setForm({
      ...initialFormState,
      id_proveedor: supplier?.id?.toString() || '',
      id_producto: product?.id_producto?.toString() || '',
      Item_prod_provee: '1'
    })
    setFormSupplierQuery(supplier ? supplierLabel(supplier) : '')
    setFormProductQuery(product ? productLabel(product) : '')
    setErrors({})
    setShowModal(true)
  }

  const handleOpenEditModal = (record: ProdProvee) => {
    setEditingRecord(record)
    const supplier = supplierMap.get(record.id_proveedor)
    const product = productMap.get(record.id_producto)
    setForm({
      Id: record.Id.toString(),
      id_usuario: record.id_usuario,
      id_proveedor: record.id_proveedor.toString(),
      id_producto: record.id_producto.toString(),
      Item_prod_provee: record.Item_prod_provee.toString(),
      Ultimo_precio_compra: record.Ultimo_precio_compra.toString()
    })
    setFormSupplierQuery(
      supplier ? supplierLabel(supplier) : `${record.proveedor?.document_number || record.id_proveedor} - ${record.proveedor?.company_name || 'Proveedor'}`
    )
    setFormProductQuery(
      product ? productLabel(product) : `${record.id_producto} - ${record.producto?.Desc_producto || 'Producto'}`
    )
    setErrors({})
    setShowModal(true)
  }

  const handleFormSupplierChange = (value: string) => {
    setFormSupplierQuery(value)
    setSupplierQuery(value)
    const supplier = resolveSupplier(value)
    setForm({ ...form, id_proveedor: supplier?.id?.toString() || '' })
  }

  const handleFormProductChange = (value: string) => {
    setFormProductQuery(value)
    setProductQuery(value)
    const product = resolveProduct(value)
    setForm({ ...form, id_producto: product?.id_producto?.toString() || '' })
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
        swal('Error de sesion', 'No se encontro el usuario autenticado.', 'error')
        return
      }

      const payload = {
        Id: Number(form.Id),
        id_usuario: user.id,
        id_producto: Number(form.id_producto),
        id_proveedor: Number(form.id_proveedor),
        Item_prod_provee: Number(form.Item_prod_provee),
        Ultimo_precio_compra: Number(form.Ultimo_precio_compra)
      }

      await validationSchema.validate(payload, { abortEarly: false })

      if (editingRecord) {
        const { Id: _ignored, ...updatePayload } = payload
        await updateProdProvee(editingRecord.Id, updatePayload)
        swal('Completado', 'Producto proveedor actualizado exitosamente', 'success')
      } else {
        await createProdProvee(payload)
        swal('Completado', 'Producto proveedor creado exitosamente', 'success')
      }

      setShowModal(false)
      fetchRecords()
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        const formErrors: Record<string, string> = {}
        err.inner.forEach((validationError) => {
          if (validationError.path) formErrors[validationError.path] = validationError.message
        })
        setErrors(formErrors)
      } else {
        swal('Error de Operacion', err.message || 'Ocurrio un error al procesar el producto proveedor', 'error')
      }
    }
  }

  const handleDelete = (record: ProdProvee) => {
    swal({
      title: 'Estas seguro?',
      text: `Eliminaras la relacion del producto "${record.producto?.Desc_producto || record.id_producto}" con el proveedor "${record.proveedor?.company_name || record.id_proveedor}".`,
      icon: 'warning',
      buttons: ['Cancelar', 'Si, eliminar'],
      dangerMode: true
    }).then(async (willDelete) => {
      if (willDelete) {
        try {
          await deleteProdProvee(record.Id)
          swal('Eliminado', 'El producto proveedor ha sido eliminado correctamente', 'success')
          fetchRecords()
        } catch (error: any) {
          swal('Error', error.message || 'No se pudo eliminar el producto proveedor', 'error')
        }
      }
    })
  }

  const totalPages = Math.ceil(total / pageSize) || 1

  return (
    <Layout>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
        <div>
          <h1 className="h2 mb-1 fw-bold text-success-dark">Productos Proveedores</h1>
          <p className="text-muted mb-0">Gestion de productos asociados a proveedores de Imperio Motors</p>
        </div>
        <button 
          type="button" 
          className="btn btn-primary d-flex align-items-center gap-2" 
          onClick={handleOpenAddModal}
          disabled={!selectedSupplier || !selectedProduct}
        >
          <span>+</span> Nuevo Producto Proveedor
        </button>
      </div>

      <div className="card shadow-sm border-0 rounded-4 mb-4">
        <div className="card-body p-3">
          <div className="row g-2">
            <div className="col-12 col-lg-5">
              <label htmlFor="supplier-filter" className="form-label small fw-bold mb-1">Proveedor</label>
              <SearchableDropdown
                id="supplier-filter"
                placeholder="Buscar por NIT o nombre"
                value={supplierQuery}
                onChange={handleSupplierFilterChange}
                options={supplierOptions.map((supplier) => ({ label: supplierLabel(supplier), value: supplier.id.toString() }))}
              />
            </div>
            <div className="col-12 col-lg-5">
              <label htmlFor="product-filter" className="form-label small fw-bold mb-1">Producto</label>
              <SearchableDropdown
                id="product-filter"
                placeholder="Buscar por ID o descripcion"
                value={productQuery}
                onChange={handleProductFilterChange}
                options={productOptions.map((product) => ({ label: productLabel(product), value: product.id_producto.toString() }))}
              />
            </div>
            <div className="col-12 col-lg-2 d-flex align-items-end">
              <button type="button" className="btn btn-outline-secondary w-100" onClick={handleClearFilters}>
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-success bg-opacity-10 text-success-dark">
              <tr>
                <th className="py-3 px-4">Proveedor</th>
                <th className="py-3">Producto</th>
                <th className="py-3 text-center">Item</th>
                <th className="py-3 text-end">Ultimo precio compra</th>
                <th className="py-3">Fecha modificacion</th>
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
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    No se encontraron productos asociados a proveedores.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.Id}>
                    <td className="px-4">
                      <div className="fw-bold">{record.proveedor?.company_name || `Proveedor ${record.id_proveedor}`}</div>
                      <span className="small font-monospace text-muted">
                        NIT {record.proveedor?.document_number || record.id_proveedor}
                      </span>
                    </td>
                    <td>
                      <div className="fw-bold">{record.producto?.Desc_producto || `Producto ${record.id_producto}`}</div>
                      <span className="small text-muted font-monospace">ID {record.id_producto}</span>
                    </td>
                    <td className="text-center">
                      <span className="badge bg-light text-dark border rounded-pill py-2 px-3">
                        {record.Item_prod_provee}
                      </span>
                    </td>
                    <td className="text-end fw-bold">{formatCurrency(record.Ultimo_precio_compra)}</td>
                    <td>
                      <span className="small font-monospace">
                        {record.fec_mod ? new Date(record.fec_mod).toLocaleString() : '-'}
                      </span>
                    </td>
                    <td className="text-center px-4">
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary border-0 rounded-circle p-2"
                          onClick={() => handleOpenEditModal(record)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger border-0 rounded-circle p-2"
                          onClick={() => handleDelete(record)}
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

        {!loading && (
          <div className="card-footer bg-white border-0 d-flex flex-wrap justify-content-between align-items-center gap-3 py-3 px-4">
            <span className="text-muted small">
              Mostrando {records.length} de {total} productos proveedores
            </span>
            {totalPages > 1 && (
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
            )}
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
                    {editingRecord ? 'Editar Producto Proveedor' : 'Nuevo Producto Proveedor'}
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} aria-label="Cerrar"></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body p-4" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                    <h6 className="text-success-dark fw-bold border-bottom pb-2 mb-3">Relacion comercial</h6>

                    <div className="row g-3 mb-4">
                      <div className="col-12 col-md-4">
                        <label htmlFor="Id" className="form-label small fw-bold">ID *</label>
                        <input
                          type="number"
                          className={`form-control ${errors.Id ? 'is-invalid' : ''}`}
                          id="Id"
                          name="Id"
                          value={form.Id}
                          onChange={handleInputChange}
                          disabled={true}
                        />
                        {errors.Id && <div className="invalid-feedback">{errors.Id}</div>}
                      </div>

                      <div className="col-12 col-md-8">
                        <label htmlFor="form-supplier" className="form-label small fw-bold">Proveedor *</label>
                        <SearchableDropdown
                          id="form-supplier"
                          className={errors.id_proveedor ? 'is-invalid' : ''}
                          placeholder="Buscar por NIT o nombre"
                          value={formSupplierQuery}
                          onChange={handleFormSupplierChange}
                          options={supplierOptions.map((supplier) => ({ label: supplierLabel(supplier), value: supplier.id.toString() }))}
                          disabled={true}
                        />
                        {errors.id_proveedor && <div className="invalid-feedback d-block">{errors.id_proveedor}</div>}
                      </div>

                      <div className="col-12">
                        <label htmlFor="form-product" className="form-label small fw-bold">Producto *</label>
                        <SearchableDropdown
                          id="form-product"
                          className={errors.id_producto ? 'is-invalid' : ''}
                          placeholder="Buscar por ID o descripcion"
                          value={formProductQuery}
                          onChange={handleFormProductChange}
                          options={productOptions.map((product) => ({ label: productLabel(product), value: product.id_producto.toString() }))}
                          disabled={true}
                        />
                        {errors.id_producto && <div className="invalid-feedback d-block">{errors.id_producto}</div>}
                      </div>
                    </div>

                    <h6 className="text-success-dark fw-bold border-bottom pb-2 mb-3">Datos de compra</h6>
                    <div className="row g-3">
                      <div className="col-12 col-md-4">
                        <label htmlFor="Item_prod_provee" className="form-label small fw-bold">Item *</label>
                        <input
                          type="number"
                          className={`form-control ${errors.Item_prod_provee ? 'is-invalid' : ''}`}
                          id="Item_prod_provee"
                          name="Item_prod_provee"
                          value={form.Item_prod_provee}
                          onChange={handleInputChange}
                        />
                        {errors.Item_prod_provee && <div className="invalid-feedback">{errors.Item_prod_provee}</div>}
                      </div>

                      <div className="col-12 col-md-8">
                        <label htmlFor="Ultimo_precio_compra" className="form-label small fw-bold">Ultimo precio compra *</label>
                        <div className="input-group">
                          <span className="input-group-text">$</span>
                          <input
                            type="number"
                            step="any"
                            className={`form-control ${errors.Ultimo_precio_compra ? 'is-invalid' : ''}`}
                            id="Ultimo_precio_compra"
                            name="Ultimo_precio_compra"
                            value={form.Ultimo_precio_compra}
                            onChange={handleInputChange}
                          />
                          {errors.Ultimo_precio_compra && <div className="invalid-feedback">{errors.Ultimo_precio_compra}</div>}
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

export default ProdProveePage
