import { Link, Route, Routes } from "react-router-dom";
import SentenceLearningMvpPage from "./pages/SentenceLearningMvpPage";
import SentenceCardCrudPage from "./pages/SentenceCardCrudPage";

// 앱 메인 라우팅/네비게이션 구성
function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>My Arabic Helper</h1>
        <p>오디오 기반 한국어-아랍어 문장 학습 MVP</p>
      </header>

      <nav className="nav">
        <Link to="/">문장 학습</Link>
        <Link to="/sentence-cards">문장카드 CRUD</Link>
      </nav>

      <main className="main">
        <Routes>
          <Route path="/" element={<SentenceLearningMvpPage />} />
          <Route path="/sentence-cards" element={<SentenceCardCrudPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
