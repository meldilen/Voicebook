export const API_CONFIG = {
  // BASE_URL: "http://178.205.96.163:8080",
  BASE_URL: "http://localhost:8000",

  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      ME: '/users/me',
      LOGOUT: '/auth/logout',
      LOGOUT_ALL: '/auth/logout-all',
      REFRESH: '/auth/refresh',
      UPDATE_PROFILE: '/users/me',
      DELETE_ACCOUNT: '/users/me'
    },
    RECORDS: {
      GET_ALL: '/records/',
      UPLOAD: '/records/upload',
      GET_BY_ID: '/records/{recordId}',
      UPDATE: '/records/{recordId}',
      UPDATE_FEEDBACK: '/records/{recordId}/feedback',
      DELETE: '/records/{recordId}',
      STATS: '/records/stats',
      TIMELINE: '/records/timeline'
    },
    USER: {
      SESSIONS: '/users/me/sessions'
    }
  }
};