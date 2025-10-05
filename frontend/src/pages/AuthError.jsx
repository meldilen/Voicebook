import "./AuthError.css";

const AuthError = () => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="auth-error-page">
      <div className="auth-error-gradient-ball"></div>
      <div className="auth-error-gradient-ball-2"></div>
      <div className="auth-error-gradient-ball-3"></div>
      
      <div className="auth-error-content">
        <div className="auth-error-icon">
          <svg 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>
        
        <h1 className="auth-error-title">
          Ошибка авторизации
        </h1>
        <p className="auth-error-message">
          Не удалось войти через VK. Пожалуйста, попробуйте перезагрузить страницу.
        </p>
        
        <div className="auth-error-buttons">
          <button 
            onClick={handleReload}
            className="auth-error-button primary"
          >
            Перезагрузить
          </button>
        </div>
        
        <div className="auth-error-info">
          <p className="auth-error-info-title">
            Если ошибка повторяется, убедитесь что:
          </p>
          <ul className="auth-error-info-list">
            <li className="auth-error-info-item">Вы используете приложение через VK</li>
            <li className="auth-error-info-item">У вас стабильное интернет-соединение</li>
            <li className="auth-error-info-item">JavaScript включен в браузере</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AuthError;