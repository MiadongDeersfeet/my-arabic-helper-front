import { Link, Route, Routes } from "react-router-dom";
import { useMemo, useState } from "react";
import WordsPage from "./pages/WordsPage";
import SentencesPage from "./pages/SentencesPage";
import WordStudyPage from "./pages/WordStudyPage";
import SentenceStudyPage from "./pages/SentenceStudyPage";
import RecordsPage from "./pages/RecordsPage";
import LoginModal from "./components/LoginModal";

// 앱 메인 라우팅/네비게이션 구성
function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authUser, setAuthUser] = useState(() => {
    const raw = localStorage.getItem("auth_user");
    return raw ? JSON.parse(raw) : null;
  });

  const isLoggedIn = useMemo(() => !!localStorage.getItem("access_token"), [authUser]);

  const handleLogout = () => {
    // 로그아웃 시 로컬스토리지 토큰/유저정보 제거
    localStorage.removeItem("access_token");
    localStorage.removeItem("auth_user");
    setAuthUser(null);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>My Arabic Helper</h1>
        <p>아랍어 단어/문장 학습 개인 서비스</p>
        <div className="row auth-row">
          {isLoggedIn ? (
            <>
              <span>{authUser?.userId} 님</span>
              <button type="button" onClick={handleLogout}>
                로그아웃
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setIsModalOpen(true)}>
              로그인
            </button>
          )}
        </div>
      </header>

      {/* 주요 기능 바로가기를 상단에 고정 */}
      <nav className="nav">
        <Link to="/">단어 CRUD</Link>
        <Link to="/sentences">문장 CRUD</Link>
        <Link to="/study/words">단어학습</Link>
        <Link to="/study/sentences">문장학습</Link>
        <Link to="/records">학습기록</Link>
      </nav>

      <main className="main">
        <Routes>
          <Route path="/" element={<WordsPage />} />
          <Route path="/sentences" element={<SentencesPage />} />
          <Route path="/study/words" element={<WordStudyPage />} />
          <Route path="/study/sentences" element={<SentenceStudyPage />} />
          <Route path="/records" element={<RecordsPage />} />
        </Routes>
      </main>

      <LoginModal open={isModalOpen} onClose={() => setIsModalOpen(false)} onLoginSuccess={setAuthUser} />
    </div>
  );
}

export default App;
