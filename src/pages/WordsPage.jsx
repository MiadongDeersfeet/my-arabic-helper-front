import { useEffect, useState } from "react";
import { wordApi } from "../api/client";

const initialForm = {
  arabic: "",
  pronunciation: "",
  meaning: "",
  example: "",
  level: ""
};

// 단어 CRUD 화면
function WordsPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const loadWords = async () => {
    const { data } = await wordApi.getAll();
    setItems(data);
  };

  useEffect(() => {
    loadWords();
  }, []);

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    // 수정 모드/생성 모드를 한 폼에서 공용 처리
    if (editingId) {
      await wordApi.update(editingId, form);
    } else {
      await wordApi.create(form);
    }

    setEditingId(null);
    setForm(initialForm);
    await loadWords();
  };

  const onEdit = (item) => {
    setEditingId(item.id);
    setForm({
      arabic: item.arabic || "",
      pronunciation: item.pronunciation || "",
      meaning: item.meaning || "",
      example: item.example || "",
      level: item.level || ""
    });
  };

  const onDelete = async (id) => {
    await wordApi.remove(id);
    await loadWords();
  };

  return (
    <section>
      <h2>단어 CRUD</h2>
      <form className="card" onSubmit={onSubmit}>
        <input name="arabic" placeholder="아랍어" value={form.arabic} onChange={onChange} required />
        <input name="pronunciation" placeholder="발음" value={form.pronunciation} onChange={onChange} />
        <input name="meaning" placeholder="뜻(한국어)" value={form.meaning} onChange={onChange} required />
        <input name="example" placeholder="예문" value={form.example} onChange={onChange} />
        <input name="level" placeholder="난이도" value={form.level} onChange={onChange} />
        <button type="submit">{editingId ? "수정 저장" : "단어 추가"}</button>
      </form>

      <div className="list">
        {items.map((item) => (
          <article className="card" key={item.id}>
            <h3>{item.arabic}</h3>
            <p>뜻: {item.meaning}</p>
            <p>발음: {item.pronunciation || "-"}</p>
            <p>예문: {item.example || "-"}</p>
            <p>난이도: {item.level || "-"}</p>
            <div className="row">
              <button type="button" onClick={() => onEdit(item)}>
                수정
              </button>
              <button type="button" onClick={() => onDelete(item.id)}>
                삭제
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default WordsPage;
