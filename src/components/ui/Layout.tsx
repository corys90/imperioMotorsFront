import { useState, ReactNode } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { logout } from '../../features/auth/authSlice'
import { clearAuthSession } from '../../services/authService'
import type { RootState } from '../../store'
import imperioMotorsLogo from '../../assets/images/ImperioMotors.png'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false)
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false)

  const handleLogout = () => {
    clearAuthSession()
    dispatch(logout())
    navigate('/login')
  }

  const openMobileMenu = () => {
    setMobileMenuVisible(true)
    window.requestAnimationFrame(() => setMobileMenuOpen(true))
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
    setMobileDropdownOpen(false)
    window.setTimeout(() => setMobileMenuVisible(false), 260)
  }

  const toggleMobileDropdown = () => {
    setMobileDropdownOpen((current) => !current)
  }

  return (
    <div className="landing-page container ">
      <header className="landing-navbar">
        <div className="landing-navbar-inner container d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <button
              type="button"
              className="hamburger-button d-flex d-md-none align-items-center justify-content-center"
              onClick={openMobileMenu}
              aria-label="Abrir menu"
            >
              <span>☰</span>
            </button>
            <Link to="/" className="brand d-flex align-items-center gap-2 text-decoration-none">
              <img className="brand-logo" src={imperioMotorsLogo} alt="Imperio Motors" />
              <span className="brand-text text-center">
                <span>Imperio</span>
                <span>motos S.A.S</span>
              </span>
            </Link>
            <nav className="app-menu d-none d-md-flex align-items-center gap-2">
              <Link to="/" className="menu-item text-decoration-none d-flex align-items-center gap-1">
                <span className="menu-icon" aria-hidden="true">🏠</span>
                <span>Inicio</span>
              </Link>
              <div className="menu-dropdown">
                <button type="button" className="menu-item dropdown-toggle">
                  <span className="menu-icon" aria-hidden="true">⚙️</span>
                  <span>Configuracion</span>
                </button>
                <div className="dropdown-panel">
                  <Link to="/clientes" className="dropdown-item text-decoration-none text-start w-100 d-block">
                    Cliente
                  </Link>
                  <Link to="/proveedores" className="dropdown-item text-decoration-none text-start w-100 d-block">
                    Proveedor
                  </Link>
                  <Link to="/estados" className="dropdown-item text-decoration-none text-start w-100 d-block">
                    Estados
                  </Link>
                  <Link to="/categorias" className="dropdown-item text-decoration-none text-start w-100 d-block">
                    Categorias
                  </Link>
                  <Link to="/sucursales" className="dropdown-item text-decoration-none text-start w-100 d-block">
                    Sucursales
                  </Link>
                  <Link to="/bodegas" className="dropdown-item text-decoration-none text-start w-100 d-block">
                    Bodegas
                  </Link>
                </div>
              </div>
            </nav>
          </div>

          <div className="nav-actions d-flex align-items-center gap-3">
            <span className="text-white opacity-75 d-none d-md-inline small">
              Hola, <strong>{user?.name || user?.email || 'Usuario'}</strong>
            </span>
            <button type="button" className="btn btn-outline-secondary btn-icon" onClick={handleLogout} aria-label="Cerrar sesion">
              <span className="nav-icon" aria-hidden="true">⏻</span>
            </button>
          </div>
        </div>
      </header>

      {mobileMenuVisible && (
        <div className={`mobile-menu-backdrop ${mobileMenuOpen ? 'open' : ''}`} onClick={closeMobileMenu}>
          <div className={`mobile-menu-panel ${mobileMenuOpen ? 'open' : ''}`} onClick={(event) => event.stopPropagation()}>
            <button type="button" className="mobile-menu-close" onClick={closeMobileMenu}>
              ✕
            </button>
            <div className="mobile-menu-items">
              <Link to="/" className="menu-item mobile-menu-item text-decoration-none" onClick={closeMobileMenu}>
                <span className="menu-icon" aria-hidden="true">🏠</span>
                <span>Inicio</span>
              </Link>
              <div className={`mobile-dropdown ${mobileDropdownOpen ? 'open' : ''}`}>
                <button type="button" className="menu-item mobile-menu-item dropdown-toggle" onClick={toggleMobileDropdown}>
                  <span className="menu-icon" aria-hidden="true">⚙️</span>
                  <span>Configuracion</span>
                </button>
                <div className="dropdown-panel mobile-dropdown-panel">
                  <Link
                    to="/clientes"
                    className="dropdown-item text-decoration-none d-block w-100 text-start"
                    onClick={closeMobileMenu}
                  >
                    Cliente
                  </Link>
                  <Link
                    to="/proveedores"
                    className="dropdown-item text-decoration-none d-block w-100 text-start"
                    onClick={closeMobileMenu}
                  >
                    Proveedor
                  </Link>
                  <Link
                    to="/estados"
                    className="dropdown-item text-decoration-none d-block w-100 text-start"
                    onClick={closeMobileMenu}
                  >
                    Estados
                  </Link>
                  <Link
                    to="/categorias"
                    className="dropdown-item text-decoration-none d-block w-100 text-start"
                    onClick={closeMobileMenu}
                  >
                    Categorias
                  </Link>
                  <Link
                    to="/sucursales"
                    className="dropdown-item text-decoration-none d-block w-100 text-start"
                    onClick={closeMobileMenu}
                  >
                    Sucursales
                  </Link>
                  <Link
                    to="/bodegas"
                    className="dropdown-item text-decoration-none d-block w-100 text-start"
                    onClick={closeMobileMenu}
                  >
                    Bodegas
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="container py-5">
        {children}
      </main>
    </div>
  )
}

export default Layout
