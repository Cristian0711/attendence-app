import Cookies from 'js-cookie';

export const TokenStorage = {
  saveRefreshToken(token: string) {
    localStorage.setItem("refreshToken", token);
    
    Cookies.set("refreshToken", token, {
      secure: true,
      sameSite: 'strict',
      expires: 7, 
      path: '/' 
    });
  },

  getRefreshToken(): string | null {
    return localStorage.getItem("refreshToken") || Cookies.get("refreshToken") || null;
  },

  removeRefreshToken() {
    localStorage.removeItem("refreshToken");
    Cookies.remove("refreshToken", { path: '/' });
  }
};