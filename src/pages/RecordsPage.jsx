import { useEffect, useState } from "react";
import { studyApi } from "../api/client";

// 학습 기록 조회 화면
function RecordsPage() {
  const [records, setRecords] = useState([]);

  const loadRecords = async () => {
    const { data } = await studyApi.getRecords();
    setRecords(data);
  };

  useEffect(() => {
    loadRecords();
  }, []);

  return (
    <section>
      <h2>학습기록</h2>
      <button type="button" onClick={loadRecords}>
        새로고침
      </button>

      <div className="list">
        {records.map((record) => (
          <article className="card" key={record.id}>
            <h3>{record.studyType}</h3>
            <p>
              정답/총문제: {record.correctCount} / {record.totalCount}
            </p>
            <p>점수: {record.score}</p>
            <p>메모: {record.memo || "-"}</p>
            <p>일시: {record.createdAt ? new Date(record.createdAt).toLocaleString() : "-"}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default RecordsPage;
