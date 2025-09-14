import "./Auth.css";
import { useTranslation } from "react-i18next";

const AuthToggle = ({ isLogin, onToggle }) => {
  const { t } = useTranslation();
  return (
    <p className="auth-toggle-text">
      {isLogin ? t("auth.dontHaveAccount") : t("auth.alreadyHaveAccount")}{" "}
      <button type="button" onClick={onToggle} className="auth-toggle-btn">
        {isLogin ? t("auth.signUp") : t("auth.signIn")}
      </button>
    </p>
  );
};

export default AuthToggle;
