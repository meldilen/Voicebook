import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  useRegisterMutation,
  useLoginMutation,
  useGetMeQuery,
} from "../features/auth/authApi.js";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials, setError } from "../features/auth/authSlice.js";
import "./AuthPage.css";
import AuthForm from "../features/auth/components/AuthForm.jsx";
import AuthToggle from "../features/auth/components/AuthToggle.jsx";
import { useTranslation } from "react-i18next";

function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { error: authError, user } = useSelector((state) => state.auth);
  const { refetch: refetchMe } = useGetMeQuery();

  const [register] = useRegisterMutation();
  const [login] = useLoginMutation();

  const isLogin = location.pathname === "/login";

  const { t } = useTranslation();

  useEffect(() => {
    if (user) {
      navigate("/homepage");
    }
  }, [user, navigate]);

  const toggleAuthMode = () => {
    navigate(isLogin ? "/signup" : "/login");
  };

  const handleSubmit = async (e, formData) => {
    e.preventDefault();
    dispatch(setError(null));

    try {
      if (isLogin) {
        await login({
          email: formData.email,
          password: formData.password,
        }).unwrap();

        const { data: userData } = await refetchMe();

        dispatch(setCredentials(userData));
      } else {
        await register({
          email: formData.email,
          password: formData.password,
          username: formData.username,
        }).unwrap();

        const { data: userData } = await refetchMe();
        dispatch(setCredentials(userData));
      }
      navigate("/homepage");
    } catch (err) {
      let errorMessage = "Authentication failed";

      if (err.data) {
        console.error("AuthPage: Error data:", err.data);
        if (typeof err.data === "string") {
          errorMessage = err.data;
        } else if (err.data.detail) {
          if (Array.isArray(err.data.detail)) {
            errorMessage = err.data.detail.map((d) => d.msg).join(", ");
          } else if (typeof err.data.detail === "string") {
            errorMessage = err.data.detail;
          }
        } else if (err.data.error) {
          errorMessage = err.data.error;
        } else if (err.data.message) {
          errorMessage = err.data.message;
        }
      }

      console.error("AuthPage: Final error message:", errorMessage);
      dispatch(setError(errorMessage));
    }
  };

  return (
    <div className="auth">
      <div className="gradient-ball" />
      <div className="gradient-ball-2" />
      <div className="gradient-ball-3" />
      <div className="gradient-ball-4" />
      <div className="auth-left">
        <button
          className="back-button"
          onClick={() => navigate("/onboarding")}
          aria-label="Go back"
        >
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
        <h2 className={isLogin ? "login-title" : "signup-title"}>
          {isLogin ? t("auth.signIn") : t("auth.signUp")}
        </h2>
        <AuthForm
          isLogin={isLogin}
          onSubmit={handleSubmit}
          authError={authError}
        />
        <AuthToggle isLogin={isLogin} onToggle={toggleAuthMode} />
      </div>
    </div>
  );
}

export default AuthPage;
