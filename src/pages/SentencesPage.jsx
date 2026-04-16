import { useEffect, useState } from "react";
import { sentenceApi } from "../api/client";

const initialForm = {
  category: "",
  arabicText: "",
  koreanText: "",
  isActive: true
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
    const { name, type, value, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
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
      category: item.category || "",
      arabicText: item.arabicText || "",
      koreanText: item.koreanText || "",
      isActive: typeof item.isActive === "boolean" ? item.isActive : true
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
        <input name="category" placeholder="카테고리 (예: 10과)" value={form.category} onChange={onChange} required />
        <input name="arabicText" placeholder="아랍어 문장" value={form.arabicText} onChange={onChange} required />
        <input name="koreanText" placeholder="해석(한국어)" value={form.koreanText} onChange={onChange} required />
        <label className="row">
          <input name="isActive" type="checkbox" checked={form.isActive} onChange={onChange} />
          학습에 포함
        </label>
        <button type="submit">{editingId ? "수정 저장" : "문장 추가"}</button>
      </form>

      <div className="list">
        {items.map((item) => (
          <article className="card" key={item.id}>
            <h3>{item.arabicText}</h3>
            <p>해석: {item.koreanText}</p>
            <p>카테고리: {item.category || "-"}</p>
            <p>활성화: {item.isActive ? "Y" : "N"}</p>
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
