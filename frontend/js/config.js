export const CONFIG = {
  API_BASE_URL: `${window.location.origin}/api`,
  STORAGE_KEYS: {
    TOKEN: 'vocalis_jwt_token',
    USER: 'vocalis_user_profile',
    ACTIVE_SESSION: 'vocalis_active_session_id'
  },
  DEFAULT_VOICE: {
    rate: 1.0,
    pitch: 1.0,
    autoPlay: true
  }
};