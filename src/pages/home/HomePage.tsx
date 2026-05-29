import { useSelector } from 'react-redux'
import type { RootState } from '../../store'
import Layout from '../../components/ui/Layout'

function HomePage() {
  const { user } = useSelector((state: RootState) => state.auth)

  return (
    <Layout>
      <section className="landing-hero card shadow-sm mb-4">
        <div className="card-body">
          <div className="row align-items-center gy-4">
            <div className="col-lg-7">
              <h1 className="display-5 fw-bold">Bienvenido a Imperio</h1>
              <p className="lead text-muted">
                Tu panel de control con estilo moderno, seguridad JWT y una navegación adaptada para todos los dispositivos.
              </p>
              <div className="d-flex flex-wrap gap-2 mt-4">
                <button type="button" className="btn btn-primary">Ver estadísticas</button>
                <button type="button" className="btn btn-outline-secondary">Explorar funciones</button>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="hero-panel p-4 rounded-4">
                <h2 className="h4">Hola, {user?.name || 'Usuario'}</h2>
                <p className="text-muted mb-3">Has iniciado sesión con éxito en la plataforma PrjMotors.</p>
                <ul className="list-unstyled mb-0">
                  <li>• Autenticación moderna con JWT</li>
                  <li>• Refresh tokens para sesiones seguras</li>
                  <li>• Menú responsive y elegante</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="row gx-4 gy-4 mb-4">
        <div className="col-md-6">
          <div className="card feature-card h-100">
            <div className="card-body d-flex flex-column justify-content-between">
              <div>
                <div className="feature-icon">🛒</div>
                <h5 className="card-title">Producto</h5>
                <p className="card-text text-muted">Accede a la gestión de productos, inventario y datos relevantes en un solo lugar.</p>
              </div>
              <button type="button" className="btn btn-outline-secondary mt-3">Ir a Producto</button>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card feature-card h-100">
            <div className="card-body d-flex flex-column justify-content-between">
              <div>
                <div className="feature-icon">⚙️</div>
                <h5 className="card-title">Configuración</h5>
                <p className="card-text text-muted">Configura tu cuenta, ajustes del sistema y preferencias de la aplicación.</p>
              </div>
              <button type="button" className="btn btn-outline-secondary mt-3">Ir a Configuración</button>
            </div>
          </div>
        </div>
      </section>

      <section className="row gx-4 gy-4">
        <div className="col-md-4">
          <div className="card feature-card h-100">
            <div className="card-body">
              <div className="feature-icon">🚀</div>
              <h5 className="card-title">Rendimiento</h5>
              <p className="card-text text-muted">Carga rápido con una arquitectura limpia y moderna.</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card feature-card h-100">
            <div className="card-body">
              <div className="feature-icon">🔐</div>
              <h5 className="card-title">Seguridad</h5>
              <p className="card-text text-muted">JWT y refresh token para una sesión protegida.</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card feature-card h-100">
            <div className="card-body">
              <div className="feature-icon">📱</div>
              <h5 className="card-title">Responsive</h5>
              <p className="card-text text-muted">El menú se contrae en pantallas pequeñas y mantiene solo iconos.</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}

export default HomePage
