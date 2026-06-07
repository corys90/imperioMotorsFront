import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import swal from 'sweetalert'
import * as yup from 'yup'
import { loginStart, loginSuccess, loginFailure } from '../../features/auth/authSlice'
import { login as loginApi, saveAuthSession } from '../../services/authService'
import type { LoginCredentials, LoginResponse } from '../../services/authService'
import SocialLoginButtons from '../../components/auth/SocialLoginButtons'
import AlertMessage from '../../components/ui/AlertMessage'
import type { RootState } from '../../store'
import imperioMotorsLogo from '../../assets/images/ImperioMotors.png'

const schema = yup.object().shape({
  username: yup.string().required('El nombre de usuario es obligatorio'),
  password: yup.string().required('La contraseña es obligatoria')
})

function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector((state: RootState) => state.auth)

  const [form, setForm] = useState<LoginCredentials>({ username: '', password: '' })
  const [validationError, setValidationError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setValidationError('')

    try {
      await schema.validate(form, { abortEarly: false })
      dispatch(loginStart())

      const data: LoginResponse = await loginApi(form)

      if (data.success) {
        const session = saveAuthSession(data, rememberMe)
        dispatch(loginSuccess(session))
        navigate('/')
      } else {
        const message = data.message || data.mensaje || 'Error de autenticación'
        dispatch(loginFailure(message))
        swal(`Error de inicio de sesión`, message, 'error')
      }
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        setValidationError(err.errors.join(', '))
      } else {
        const message = 'No se pudo conectar con la API'
        dispatch(loginFailure(message))
        swal(`Error de inicio de sesión`, message, 'error')
      }
    }
  }

  return (
    <div className="login-page d-flex align-items-center justify-content-center">
      <div className="shadow-lg rounded-4 overflow-hidden login-card row g-0">
        <div className="login-side login-side--info text-white d-none d-lg-flex flex-column justify-content-center p-5 col-lg-6">
          <div>
            <div className="text-center mb-3">
              <img className="login-brand-logo" src={imperioMotorsLogo} alt="Imperio Motors" />
            </div>
            <h1 className="display-3 fw-bold text-white mb-3 text-center login-brand-title">Imperio motos S.A.S</h1>
            <h2 className="display-6 fw-bold mb-3">Bienvenido de nuevo</h2>
            <p className="opacity-85 mb-4">
              Inicia sesión para acceder a tu panel de control, ver métricas y gestionar tu flota desde un único lugar.
            </p>
          </div>
        </div>

        <div className="login-side login-side--form p-4 p-lg-5 bg-white col-12 col-lg-6">
          <div className="login-mobile-brand text-center mb-4 d-lg-none">
            <img className="login-mobile-logo" src={imperioMotorsLogo} alt="Imperio Motors" />
          </div>
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h2 className="h4 mb-1">Inicia sesión</h2>
              <p className="text-muted mb-0">Ingresa tus datos para continuar</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control form-control-lg"
                id="username"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Usuario"
              />
              <label htmlFor="username">Usuario</label>
            </div>

            <div className="form-floating mb-3">
              <input
                type="password"
                className="form-control form-control-lg"
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Contraseña"
              />
              <label htmlFor="password">Contraseña</label>
            </div>

            <div className="row gx-2 gy-2 align-items-center mb-4">
              <div className="col-12 col-sm-auto">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                  />
                  <label className="form-check-label" htmlFor="rememberMe">
                    Recuérdame
                  </label>
                </div>
              </div>
              <div className="col-12 col-sm-auto">
                <button type="button" className="btn btn-link text-decoration-none p-0 text-primary">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            {validationError && <AlertMessage variant="warning">{validationError}</AlertMessage>}

            <button className="btn btn-primary btn-lg w-100 mb-3" type="submit" disabled={loading}>
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
          </form>

          <div className="text-center text-muted my-3">o inicia sesión con</div>
          <SocialLoginButtons />

          <div className="text-center text-muted small">
            ¿Aún no tienes cuenta? <span className="text-primary">Regístrate</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
