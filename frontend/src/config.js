export const API_CONFIG = {
  // BASE_URL: "http://178.205.96.163:8080",
  BASE_URL: "http://localhost:8080",

  ENDPOINTS: {
    VK: {
      AUTH: '/api/vk/auth'
    },
    AUTH: {
      LOGIN: '/users/login',
      REGISTER: '/users/register',
      ME: '/users/me',
      LOGOUT: '/users/logout',
      UPDATE_PROFILE: '/users/me',
      DELETE_ACCOUNT: '/users/me'
    },
    USER_RECORDS: {
      GET_ALL: '/users/:userID/records',
      GET_CONSECUTIVE_DAYS: '/records/users/:userID/consecutive-days'
    },
    RECORDS: {
      UPLOAD: '/records/upload',
      GET_ANALYSIS: '/records/:recordID',
      GET_INSIGHTS: '/records/insights',
      DELETE: '/records/:recordID',
      SET_FEEDBACK: '/records/:recordID/feedback'
    },
    TOTALS: {
      GET: '/totals/:userID',
      RECALCULATE: '/totals/:userID/recalculate/:date',
    
    }
  }
};