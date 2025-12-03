import PasswordVisibilityIcon from './VisibilityIcon';
import './Auth.css'

const PasswordInput = ({
  id,
  name,
  value,
  onChange,
  onBlur,
  onKeyDown,
  placeholder,
  showPassword,
  togglePasswordVisibility,
  hasError,
  errorId,
}) => (
  <div className="password-input-wrapper">
    <input
      id={id}
      name={name}
      type={showPassword ? "text" : "password"}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      className={hasError ? "error" : ""}
      aria-describedby={hasError ? errorId : undefined}
    />
    <button
      type="button"
      className="password-toggle"
      onClick={togglePasswordVisibility}
      aria-label={showPassword ? "Hide password" : "Show password"}
      tabIndex="-1"
    >
      <PasswordVisibilityIcon visible={showPassword} />
    </button>
  </div>
);

export default PasswordInput;