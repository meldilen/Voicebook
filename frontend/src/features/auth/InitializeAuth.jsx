import { useEffect } from "react";
import { useGetMeQuery } from "./authApi";
import { useDispatch } from "react-redux";
import { setCredentials, logout } from "./authSlice";

const InitializeAuth = () => {
  const { data, error} = useGetMeQuery();
  const dispatch = useDispatch();

  useEffect(() => {
    if (data) {
      dispatch(setCredentials({ user: data }));
    } else if (error) {
      console.error("Auth check failed:", error);
      dispatch(logout());
    }
  }, [data, error, dispatch]);

  return null;
};

export default InitializeAuth;