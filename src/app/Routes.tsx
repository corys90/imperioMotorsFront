import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import LoginPage from '../pages/auth/LoginPage'
import BodegasPage from '../pages/bodegas/BodegasPage'
import CategoriasPage from '../pages/categorias/CategoriasPage'
import CustomersPage from '../pages/customers/CustomersPage'
import EstadosPage from '../pages/estados/EstadosPage'
import HomePage from '../pages/home/HomePage'
import SuppliersPage from '../pages/suppliers/SuppliersPage'
import SucursalesPage from '../pages/sucursales/SucursalesPage'
import TipologiaPage from '../pages/tipologia/TipologiaPage'
import MediosPagoPage from '../pages/medios-pago/MediosPagoPage'
import ProductsPage from '../pages/productos/ProductsPage'
import type { RootState } from '../store'

function AppRoutes() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={isAuthenticated ? <HomePage /> : <Navigate replace to="/login" />} />
      <Route path="/clientes" element={isAuthenticated ? <CustomersPage /> : <Navigate replace to="/login" />} />
      <Route path="/productos" element={isAuthenticated ? <ProductsPage /> : <Navigate replace to="/login" />} />
      <Route path="/estados" element={isAuthenticated ? <EstadosPage /> : <Navigate replace to="/login" />} />
      <Route path="/proveedores" element={isAuthenticated ? <SuppliersPage /> : <Navigate replace to="/login" />} />
      <Route path="/categorias" element={isAuthenticated ? <CategoriasPage /> : <Navigate replace to="/login" />} />
      <Route path="/tipologia" element={isAuthenticated ? <TipologiaPage /> : <Navigate replace to="/login" />} />
      <Route path="/sucursales" element={isAuthenticated ? <SucursalesPage /> : <Navigate replace to="/login" />} />
      <Route path="/bodegas" element={isAuthenticated ? <BodegasPage /> : <Navigate replace to="/login" />} />
      <Route path="/medios-pago" element={isAuthenticated ? <MediosPagoPage /> : <Navigate replace to="/login" />} />
      <Route path="*" element={<Navigate replace to={isAuthenticated ? '/' : '/login'} />} />
    </Routes>
  )
}

export default AppRoutes
