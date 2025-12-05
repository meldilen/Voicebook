import React from "react";
import { useState, useEffect, useCallback } from "react";
import "./Auth.css";
import ErrorIcon from "./ErrorIcon.jsx";
import HintIcon from "./HintIcon.jsx";
import PasswordInput from "./PasswordInput.jsx";
import { useTranslation } from "react-i18next";

const AuthForm = ({ isLogin, onSubmit, authError }) => {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    repeatPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  const { t } = useTranslation();

  const validateForm = useCallback(() => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email) {
      newErrors.email = t("auth.errors.emailRequired");
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = t("auth.errors.emailInvalid");
    }

    if (!isLogin) {
      if (!formData.username) {
        newErrors.username = t("auth.errors.usernameRequired");
      } else if (formData.username.length < 3) {
        newErrors.username = t("auth.errors.usernameShort");
      }
    }

    if (!formData.password) {
      newErrors.password = t("auth.errors.passwordRequired");
    } else if (formData.password.length < 6) {
      newErrors.password = t("auth.errors.passwordShort");
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = t("auth.errors.passwordUppercase");
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = t("auth.errors.passwordNumber");
    }

    if (!isLogin) {
      if (!formData.repeatPassword) {
        newErrors.repeatPassword = t("auth.errors.repeatPasswordRequired");
      } else if (formData.password !== formData.repeatPassword) {
        newErrors.repeatPassword = t("auth.errors.passwordsDontMatch");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isLogin, t]);

  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      validateForm();
    }
  }, [validateForm, touched]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const form = e.target.form;
      const inputs = Array.from(
        form.querySelectorAll('input:not([type="hidden"])')
      );
      const isLastInput = inputs.indexOf(e.target) === inputs.length - 1;

      if (isLastInput) {
        handleSubmit(e);
      } else {
        const index = Array.prototype.indexOf.call(form.elements, e.target);
        form.elements[index + 1]?.focus();
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    if (validateForm()) {
      onSubmit(e, formData);
    } else {
      setTimeout(() => {
        const firstError = Object.keys(errors)[0];
        if (firstError) {
          const element = document.querySelector(`[name="${firstError}"]`);
          if (element) {
            window.scrollTo({
              top: element.offsetTop - 100,
              behavior: "smooth",
            });
          }
        }
      }, 50);
    }
  };

  const hasError = (field) => touched[field] && errors[field];

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {authError && (
        <div className="auth-error-message">
          <ErrorIcon />
          <span>{authError}</span>
        </div>
      )}
      <div className={`form-group ${hasError("email") ? "has-error" : ""}`}>
        <label htmlFor="email">{t("auth.email")}</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder={t("auth.emailPlaceholder")}
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          aria-describedby={hasError("email") ? "email-error" : undefined}
        />
        {hasError("email") && (
          <div id="email-error" className="error-message">
            <ErrorIcon />
            <span>{errors.email}</span>
          </div>
        )}
      </div>

      {!isLogin && (
        <div
          className={`form-group ${hasError("username") ? "has-error" : ""}`}
        >
          <label htmlFor="username">{t("auth.username")}</label>
          <input
            id="username"
            name="username"
            type="text"
            placeholder={t("auth.usernamePlaceholder")}
            value={formData.username}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            aria-describedby={
              hasError("username") ? "username-error" : undefined
            }
          />
          {hasError("username") && (
            <div id="username-error" className="error-message">
              <ErrorIcon />
              <span>{errors.username}</span>
            </div>
          )}
        </div>
      )}

      <div className={`form-group ${hasError("password") ? "has-error" : ""}`}>
        <label htmlFor="password">{t("auth.password")}</label>
        <PasswordInput
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={t("auth.passwordPlaceholder")}
          showPassword={showPassword}
          togglePasswordVisibility={() => setShowPassword(!showPassword)}
          errorId="password-error"
        />
        {hasError("password") ? (
          <div id="password-error" className="error-message">
            <ErrorIcon />
            <span>{errors.password}</span>
          </div>
        ) : (
          !isLogin && (
            <div className="password-hint">
              <HintIcon />
              <span>{t("auth.hints.passwordHint")}</span>
            </div>
          )
        )}
      </div>

      {!isLogin && (
        <div
          className={`form-group ${
            hasError("repeatPassword") ? "has-error" : ""
          }`}
        >
          <label htmlFor="repeatPassword">{t("auth.repeatPassword")}</label>
          <PasswordInput
            id="repeatPassword"
            name="repeatPassword"
            value={formData.repeatPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={t("auth.repeatPasswordPlaceholder")}
            showPassword={showRepeatPassword}
            togglePasswordVisibility={() =>
              setShowRepeatPassword(!showRepeatPassword)
            }
            errorId="repeatPassword-error"
          />
          {hasError("repeatPassword") && (
            <div id="repeatPassword-error" className="error-message">
              <ErrorIcon />
              <span>{errors.repeatPassword}</span>
            </div>
          )}
        </div>
      )}

      <button type="submit" className="auth-submit-btn">
        {isLogin ? t("auth.signIn") : t("auth.signUp")}
      </button>
    </form>
  );
};

export default AuthForm;
