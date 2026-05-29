const SocialLoginButtons = () => {
  return (
    <div className="row g-2 mb-4">
      <div className="col-12 col-sm-6">
        <button type="button" className="btn btn-outline-secondary w-100" disabled>
          Google
        </button>
      </div>
      <div className="col-12 col-sm-6">
        <button type="button" className="btn btn-outline-secondary w-100" disabled>
          Microsoft
        </button>
      </div>
    </div>
  )
}

export default SocialLoginButtons
