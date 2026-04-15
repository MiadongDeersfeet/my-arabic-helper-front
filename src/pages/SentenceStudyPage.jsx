import { useEffect, useMemo, useState } from "react";
import { studyApi } from "../api/client";

// 문장 학습(해석 보기/정답 체크/기록 저장) 화면
function SentenceStudyPage() {
  const [quizItems, setQuizItems] = useState([]);
  const [showAnswerMap, setShowAnswerMap] = useState({});
  const [correctMap, setCorrectMap] = useState({});

  const loadQuiz = async () => {
    const { data } = await studyApi.randomSentences(10);
    setQuizItems(data);
    setShowAnswerMap({});
    setCorrectMap({});
  };

  useEffect(() => {
    loadQuiz();
  }, []);

  const score = useMemo(() => {
    const total = quizItems.length || 1;
    const correctCount = Object.values(correctMap).filter(Boolean).length;
    return {
      correctCount,
      totalCount: quizItems.length,
      score: Math.round((correctCount / total) * 100)
    };
  }, [quizItems.length, correctMap]);

  const saveRecord = async () => {
    await studyApi.createRecord({
      studyType: "SENTENCE",
      correctCount: score.correctCount,
      totalCount: score.totalCount,
      score: score.score,
      memo: "문장 학습 결과"
    });
    alert("학습 기록을 저장했습니다.");
  };

  return (
    <section>
      <h2>문장 학습</h2>
      <div className="row">
        <button type="button" onClick={loadQuiz}>
          새 문제 뽑기
        </button>
        <button type="button" onClick={saveRecord} disabled={!quizItems.length}>
          기록 저장
        </button>
      </div>
      <p>
        정답: {score.correctCount} / {score.totalCount} (점수 {score.score})
      </p>

      <div className="list">
        {quizItems.map((item) => (
          <article className="card" key={item.id}>
            <h3>{item.arabic}</h3>
            <p>발음: {item.pronunciation || "-"}</p>
            <div className="row">
              <button
                type="button"
                onClick={() => setShowAnswerMap((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
              >
                {showAnswerMap[item.id] ? "해석 숨기기" : "해석 보기"}
              </button>
              <button type="button" onClick={() => setCorrectMap((prev) => ({ ...prev, [item.id]: true }))}>
                맞음
              </button>
              <button type="button" onClick={() => setCorrectMap((prev) => ({ ...prev, [item.id]: false }))}>
                틀림
              </button>
            </div>
            {showAnswerMap[item.id] && <p>해석: {item.translation}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}

export default SentenceStudyPage;
