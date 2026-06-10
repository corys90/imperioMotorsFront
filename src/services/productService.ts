export interface Product {
  id_producto: number
  id_usuario: number
  fec_mod: string
  id_categoria: number
  id_estado: number
  Desc_producto: string
  Marca?: string
  Material?: string
  Modelo_aplicable?: string
  Tipo?: string
  Graficos?: string
  ColorPrimario?: string
  ColorSegundario?: string
  ColorVisor?: string
  ColorSpoiler?: string
  Talla?: string
  Acabado?: string
  Precio_gerencia: number
  Stock_min?: number
  Stock_max?: number
  Ubicacion_fisica: string
  EAN?: number
  Url?: string
  impuesto_porc: number
  descuento_porc?: number

  // Nested details populated by backend
  categoria?: {
    id: number
    desc_categoria: string
  }
  estado?: {
    id_estado: number
    desc_estado: string
  }
}

export type ProductCreateInput = Omit<Product, 'id_producto' | 'fec_mod' | 'categoria' | 'estado'>

export type ProductUpdateInput = Partial<ProductCreateInput>

export interface ProductListResponse {
  total: number
  page: number
  page_size: number
  results: Product[]
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:8000`

export async function getProducts(
  page: number = 1,
  pageSize: number = 20,
  search?: string,
  idCategoria?: number,
  idEstado?: number
): Promise<ProductListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString()
  })

  if (search) params.append('search', search)
  if (idCategoria !== undefined && idCategoria !== 0) params.append('id_categoria', idCategoria.toString())
  if (idEstado !== undefined && idEstado !== 0) params.append('id_estado', idEstado.toString())

  const response = await fetch(`${apiBaseUrl}/api/v1/productos/?${params.toString()}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al obtener productos')
  }
  return response.json()
}

export async function getProductById(id: number): Promise<Product> {
  const response = await fetch(`${apiBaseUrl}/api/v1/productos/${id}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al obtener el producto')
  }
  return response.json()
}

export async function createProduct(data: ProductCreateInput): Promise<Product> {
  const response = await fetch(`${apiBaseUrl}/api/v1/productos/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al crear el producto')
  }
  return response.json()
}

export async function updateProduct(id: number, data: ProductUpdateInput): Promise<Product> {
  const response = await fetch(`${apiBaseUrl}/api/v1/productos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al actualizar el producto')
  }
  return response.json()
}

export async function deleteProduct(id: number): Promise<{ message: string }> {
  const response = await fetch(`${apiBaseUrl}/api/v1/productos/${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al eliminar el producto')
  }
  return response.json()
}
