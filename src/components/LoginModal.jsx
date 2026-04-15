import { useState } from "react";
import { authApi } from "../api/client";

const loginInitial = { userId: "", password: "" };
const signUpInitial = { userId: "", password: "", role: "user" };

// 로그인/회원가입 모달 컴포넌트
function LoginModal({ open, onClose, onLoginSuccess }) {
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState(loginInitial);
  const [signUpForm, setSignUpForm] = useState(signUpInitial);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!open) return null;

  const onChangeLogin = (event) => {
    setLoginForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const onChangeSignUp = (event) => {
    setSignUpForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");
    try {
      const { data } = await authApi.login(loginForm);
      // 로그인 성공 시 토큰/사용자 정보를 로컬스토리지에 저장
      localStorage.setItem("access_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify({ userId: data.userId, role: data.role }));
      onLoginSuccess({ userId: data.userId, role: data.role });
      onClose();
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || "로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");
    try {
      const { data } = await authApi.signUp(signUpForm);
      // 회원가입 직후 자동 로그인 상태로 전환
      localStorage.setItem("access_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify({ userId: data.userId, role: data.role }));
      onLoginSuccess({ userId: data.userId, role: data.role });
      onClose();
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || "회원가입 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="row modal-top">
          <h3>{mode === "login" ? "로그인" : "회원가입"}</h3>
          <button type="button" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="row">
          <button type="button" onClick={() => setMode("login")} className={mode === "login" ? "active-btn" : ""}>
            로그인
          </button>
          <button type="button" onClick={() => setMode("signup")} className={mode === "signup" ? "active-btn" : ""}>
            회원가입
          </button>
        </div>

        {errorMessage && <p className="error-text">{errorMessage}</p>}

        {mode === "login" ? (
          <form className="card" onSubmit={handleLogin}>
            <input name="userId" placeholder="아이디" value={loginForm.userId} onChange={onChangeLogin} required />
            <input
              name="password"
              type="password"
              placeholder="비밀번호"
              value={loginForm.password}
              onChange={onChangeLogin}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "처리 중..." : "로그인"}
            </button>
          </form>
        ) : (
          <form className="card" onSubmit={handleSignUp}>
            <input name="userId" placeholder="아이디" value={signUpForm.userId} onChange={onChangeSignUp} required />
            <input
              name="password"
              type="password"
              placeholder="비밀번호"
              value={signUpForm.password}
              onChange={onChangeSignUp}
              required
            />
            <select name="role" value={signUpForm.role} onChange={onChangeSignUp}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
            <button type="submit" disabled={loading}>
              {loading ? "처리 중..." : "회원가입"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default LoginModal;
