import React from "react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../features/auth/authSlice";
import {
  useUpdateProfileMutation,
  useGetMeQuery,
} from "../features/auth/authApi";
import "./SettingsPage.css";
import PasswordVisibilityIcon from "../features/auth/components/VisibilityIcon";

const SettingsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const { refetch } = useGetMeQuery();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};

    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        newErrors.newPassword = t("settings.errors.passwordShort");
      } else if (!/[A-Z]/.test(formData.newPassword)) {
        newErrors.newPassword = t("settings.errors.passwordUppercase");
      } else if (!/\d/.test(formData.newPassword)) {
        newErrors.newPassword = t("settings.errors.passwordNumber");
      }

      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = t("settings.errors.passwordsDontMatch");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!validateForm()) {
      return;
    }

    try {
      const updateData = {
        username: formData.username,
        email: formData.email,
        ...(formData.newPassword && { password: formData.newPassword }),
      };

      await updateProfile(updateData).unwrap();
      await refetch();
      navigate("/profile");
    } catch (err) {
      console.error("Failed to update profile:", err);
      let errorMessage = t("settings.errors.updateFailed");

      if (err.data?.detail) {
        if (typeof err.data.detail === "string") {
          errorMessage = err.data.detail;
        } else if (Array.isArray(err.data.detail)) {
          errorMessage = err.data.detail.map((d) => d.msg).join(", ");
        }
      } else if (err.data?.message) {
        errorMessage = err.data.message;
      }
      setApiError(errorMessage);
    }
  };

  const handleBack = () => navigate("/profile");

  return (
    <div className="settings-page">
      <button className="back-button" onClick={handleBack} aria-label={t("common.back")}>
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 18L9 12L15 6"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="settings-container">
        <div className="settings-header">
          <h1>{t("settings.title")}</h1>
          <p>{t("settings.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="settings-card">
            <div className="avatar-section">
              <div className="avatar-wrapper">
                <img
                  src={`https://ui-avatars.com/api/?name=${
                    formData.username || t("common.user")
                  }&background=8b5cf6&color=fff`}
                  alt={t("settings.avatar.alt")}
                  className="avatar"
                />
                <button
                  type="button"
                  className="avatar-edit-button"
                  onClick={() =>
                    alert(t("settings.avatar.comingSoon"))
                  }
                >
                  {t("settings.avatar.changePhoto")}
                </button>
              </div>
            </div>

            {apiError && (
              <div className="error-message api-error">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                    stroke="#ff4d4f"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{apiError}</span>
              </div>
            )}

            <div className="settings-form">
              <div className="form-group">
                <label htmlFor="username">{t("settings.form.nickname")}</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">{t("settings.form.login")}</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">{t("settings.form.newPassword")}</label>
                <div className="password-input-wrapper">
                  <input
                    id="newPassword"
                    name="newPassword"
                    placeholder={t("settings.form.newPasswordPlaceholder")}
                    type={showPassword ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={handleChange}
                    className={`form-input ${
                      errors.newPassword ? "error" : ""
                    }`}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword 
                        ? t("settings.buttons.hidePassword")
                        : t("settings.buttons.showPassword")
                    }
                  >
                    <PasswordVisibilityIcon visible={showPassword} />
                  </button>
                </div>
                {errors.newPassword && (
                  <div className="error-message">
                    <span>{errors.newPassword}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">{t("settings.form.confirmPassword")}</label>
                <div className="password-input-wrapper">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder={t("settings.form.confirmPasswordPlaceholder")}
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`form-input ${
                      errors.confirmPassword ? "error" : ""
                    }`}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={
                      showConfirmPassword 
                        ? t("settings.buttons.hidePassword")
                        : t("settings.buttons.showPassword")
                    }
                  >
                    <PasswordVisibilityIcon visible={showConfirmPassword} />
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="error-message">
                    <span>{errors.confirmPassword}</span>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleBack}
                  disabled={isLoading}
                >
                  {t("settings.buttons.cancel")}
                </button>
                <button type="submit" className="save-btn" disabled={isLoading}>
                  {isLoading ? t("settings.buttons.saving") : t("settings.buttons.save")}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;