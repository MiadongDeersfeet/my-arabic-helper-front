import { useEffect, useState } from "react";
import { sentenceApi } from "../api/client";

const initialForm = {
  arabic: "",
  translation: "",
  pronunciation: "",
  topic: ""
};

// 문장 CRUD 화면
function SentencesPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const loadSentences = async () => {
    const { data } = await sentenceApi.getAll();
    setItems(data);
  };

  useEffect(() => {
    loadSentences();
  }, []);

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (editingId) {
      await sentenceApi.update(editingId, form);
    } else {
      await sentenceApi.create(form);
    }

    setEditingId(null);
    setForm(initialForm);
    await loadSentences();
  };

  const onEdit = (item) => {
    setEditingId(item.id);
    setForm({
      arabic: item.arabic || "",
      translation: item.translation || "",
      pronunciation: item.pronunciation || "",
      topic: item.topic || ""
    });
  };

  const onDelete = async (id) => {
    await sentenceApi.remove(id);
    await loadSentences();
  };

  return (
    <section>
      <h2>문장 CRUD</h2>
      <form className="card" onSubmit={onSubmit}>
        <input name="arabic" placeholder="아랍어 문장" value={form.arabic} onChange={onChange} required />
        <input name="translation" placeholder="해석(한국어)" value={form.translation} onChange={onChange} required />
        <input name="pronunciation" placeholder="발음" value={form.pronunciation} onChange={onChange} />
        <input name="topic" placeholder="주제/태그" value={form.topic} onChange={onChange} />
        <button type="submit">{editingId ? "수정 저장" : "문장 추가"}</button>
      </form>

      <div className="list">
        {items.map((item) => (
          <article className="card" key={item.id}>
            <h3>{item.arabic}</h3>
            <p>해석: {item.translation}</p>
            <p>발음: {item.pronunciation || "-"}</p>
            <p>주제: {item.topic || "-"}</p>
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

export default SentencesPage;
