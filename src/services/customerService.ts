export interface Customer {
  id: number
  document_type?: string
  document_number: string
  first_name: string
  last_name?: string
  company_name?: string
  email?: string
  phone?: string
  mobile?: string
  address?: string
  city?: string
  country?: string
  birth_date?: string
  is_active: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export type CustomerCreateInput = Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'is_active'> & {
  is_active?: boolean
}

export type CustomerUpdateInput = Partial<CustomerCreateInput>

export interface CustomerListResponse {
  total: number
  page: number
  page_size: number
  results: Customer[]
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:8000`

export async function getCustomers(
  page: number = 1,
  pageSize: number = 20,
  search?: string,
  isActive?: boolean
): Promise<CustomerListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString()
  })

  if (search) params.append('search', search)
  if (isActive !== undefined) params.append('is_active', isActive.toString())

  const response = await fetch(`${apiBaseUrl}/api/v1/customers/?${params.toString()}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al obtener clientes')
  }
  return response.json()
}

export async function getCustomerById(id: number): Promise<Customer> {
  const response = await fetch(`${apiBaseUrl}/api/v1/customers/${id}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al obtener el cliente')
  }
  return response.json()
}

export async function createCustomer(data: CustomerCreateInput): Promise<Customer> {
  const response = await fetch(`${apiBaseUrl}/api/v1/customers/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al crear el cliente')
  }
  return response.json()
}

export async function updateCustomer(id: number, data: CustomerUpdateInput): Promise<Customer> {
  const response = await fetch(`${apiBaseUrl}/api/v1/customers/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al actualizar el cliente')
  }
  return response.json()
}

export async function deleteCustomer(id: number): Promise<{ message: string }> {
  const response = await fetch(`${apiBaseUrl}/api/v1/customers/${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al eliminar el cliente')
  }
  return response.json()
}

export async function toggleCustomerStatus(id: number): Promise<Customer> {
  const response = await fetch(`${apiBaseUrl}/api/v1/customers/${id}/toggle-status`, {
    method: 'PATCH'
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al cambiar estado del cliente')
  }
  return response.json()
}
