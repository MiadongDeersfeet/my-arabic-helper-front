import { useEffect, useRef, useState } from "react";
import { audioApi, categoryApi, resolveMediaUrl, sentenceCardApi } from "../api/client";

const initialForm = {
  cardNo: 1,
  categoryId: "",
  categoryName: "",
  korText: "",
  korAudioUrl: "",
  arbText: "",
  arbAudioUrl: "",
  countdownSec: 10,
  active: true
};

function SentenceCardCrudPage() {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [cards, setCards] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [recordingTarget, setRecordingTarget] = useState("");
  const [recordingElapsedSec, setRecordingElapsedSec] = useState(0);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  useEffect(() => {
    const loadCategories = async () => {
      const data = await categoryApi.getAll();
      setCategories(data);
      if (data.length > 0) {
        const first = data[0];
        setSelectedCategoryId(first.id);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (!selectedCategoryId) {
      return;
    }
    loadCards(selectedCategoryId);
  }, [selectedCategoryId]);

  useEffect(() => {
    return () => {
      clearInterval(recordingTimerRef.current);
      stopRecordingTracks();
    };
  }, []);

  const loadCards = async (categoryId) => {
    const data = await sentenceCardApi.getByCategory(categoryId);
    setCards(data);
  };

  const stopRecordingTracks = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const formatElapsed = (seconds) => {
    const min = String(Math.floor(seconds / 60)).padStart(2, "0");
    const sec = String(seconds % 60).padStart(2, "0");
    return `${min}:${sec}`;
  };

  const onCategoryChange = (event) => {
    const categoryId = event.target.value;
    setSelectedCategoryId(categoryId);
  };

  const onCategoryNameChange = (event) => {
    const categoryName = event.target.value;
    const matched = categories.find((item) => item.name.toLowerCase() === categoryName.trim().toLowerCase());
    setForm((prev) => ({
      ...prev,
      categoryName,
      categoryId: matched?.id || ""
    }));
  };

  const onInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const buildPayload = () => ({
    cardNo: Number(form.cardNo),
    categoryId: form.categoryId,
    categoryName: form.categoryName,
    kor: {
      text: form.korText,
      audioUrl: form.korAudioUrl
    },
    arb: {
      text: form.arbText,
      audioUrl: form.arbAudioUrl
    },
    flow: {
      countdownSec: Number(form.countdownSec)
    },
    active: form.active
  });

  const resetForm = () => {
    setEditingId(null);
    setForm({
      ...initialForm,
      categoryId: "",
      categoryName: ""
    });
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const payload = buildPayload();
    let targetCategoryId = selectedCategoryId;

    if (editingId) {
      const updated = await sentenceCardApi.update(editingId, payload);
      if (updated?.categoryId) {
        targetCategoryId = updated.categoryId;
        setSelectedCategoryId(updated.categoryId);
      }
    } else {
      const created = await sentenceCardApi.create(payload);
      if (created?.categoryId) {
        targetCategoryId = created.categoryId;
        setSelectedCategoryId(created.categoryId);
      }
    }

    const latestCategories = await categoryApi.getAll();
    setCategories(latestCategories);
    resetForm();
    if (targetCategoryId) {
      await loadCards(targetCategoryId);
    }
  };

  const onEdit = (card) => {
    setEditingId(card.id);
    setForm({
      cardNo: card.cardNo || 1,
      categoryId: card.categoryId || selectedCategoryId,
      categoryName: card.categoryName || "",
      korText: card.kor?.text || "",
      korAudioUrl: card.kor?.audioUrl || "",
      arbText: card.arb?.text || "",
      arbAudioUrl: card.arb?.audioUrl || "",
      countdownSec: card.flow?.countdownSec || 10,
      active: typeof card.active === "boolean" ? card.active : true
    });
  };

  const onDeactivate = async (cardId) => {
    await sentenceCardApi.deactivate(cardId);
    if (editingId === cardId) {
      resetForm();
    }
    await loadCards(selectedCategoryId);
  };

  const startRecording = async (target) => {
    if (recordingTarget) {
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      chunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      setRecordingTarget(target);
      setRecordingElapsedSec(0);
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingElapsedSec((prev) => prev + 1);
      }, 1000);

      mediaRecorder.ondataavailable = (evt) => {
        if (evt.data.size > 0) {
          chunksRef.current.push(evt.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          setIsUploadingAudio(true);
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const file = new File([blob], `${target}-${Date.now()}.webm`, { type: "audio/webm" });
          const result = await audioApi.upload(file);

          setForm((prev) => ({
            ...prev,
            [target === "kor" ? "korAudioUrl" : "arbAudioUrl"]: result.audioUrl
          }));
        } finally {
          clearInterval(recordingTimerRef.current);
          setRecordingElapsedSec(0);
          setIsUploadingAudio(false);
          setRecordingTarget("");
          stopRecordingTracks();
        }
      };

      mediaRecorder.start();
    } catch {
      clearInterval(recordingTimerRef.current);
      setRecordingElapsedSec(0);
      setRecordingTarget("");
      stopRecordingTracks();
      alert("마이크 권한을 확인해주세요.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    clearInterval(recordingTimerRef.current);
  };

  return (
    <section className="crud-layout">
      <article className="card">
        <h2>문장카드 등록/수정</h2>
        <form onSubmit={onSubmit} className="crud-form">
          <div className="row">
            <label>목록 필터 카테고리</label>
            <select value={selectedCategoryId} onChange={onCategoryChange} required>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <input name="cardNo" type="number" min="1" value={form.cardNo} onChange={onInputChange} required />
          <input
            name="categoryName"
            placeholder="카테고리명 직접 입력 (예: 기초회화)"
            value={form.categoryName}
            onChange={onCategoryNameChange}
            required
          />
          <input name="korText" placeholder="한국어 문장" value={form.korText} onChange={onInputChange} required />
          <div className="row">
            <input
              name="korAudioUrl"
              placeholder="한국어 오디오 URL"
              value={form.korAudioUrl}
              onChange={onInputChange}
              required
            />
            <button type="button" onClick={() => startRecording("kor")} disabled={!!recordingTarget || isUploadingAudio}>
              한국어 녹음 시작
            </button>
            <button type="button" onClick={stopRecording} disabled={recordingTarget !== "kor"}>
              한국어 녹음 종료
            </button>
          </div>

          <input name="arbText" placeholder="아랍어 문장" value={form.arbText} onChange={onInputChange} required />
          <div className="row">
            <input
              name="arbAudioUrl"
              placeholder="아랍어 오디오 URL"
              value={form.arbAudioUrl}
              onChange={onInputChange}
              required
            />
            <button type="button" onClick={() => startRecording("arb")} disabled={!!recordingTarget || isUploadingAudio}>
              아랍어 녹음 시작
            </button>
            <button type="button" onClick={stopRecording} disabled={recordingTarget !== "arb"}>
              아랍어 녹음 종료
            </button>
          </div>

          <input
            name="countdownSec"
            type="number"
            min="1"
            value={form.countdownSec}
            onChange={onInputChange}
            required
          />

          <label className="row">
            <input name="active" type="checkbox" checked={form.active} onChange={onInputChange} />
            활성화
          </label>

          <div className="row">
            <button type="submit" disabled={isUploadingAudio}>
              {editingId ? "문장카드 수정" : "문장카드 등록"}
            </button>
            <button type="button" onClick={resetForm}>
              폼 초기화
            </button>
          </div>

          {recordingTarget && (
            <p>
              녹음 중: {recordingTarget === "kor" ? "한국어" : "아랍어"} ({formatElapsed(recordingElapsedSec)})
            </p>
          )}
          {isUploadingAudio && <p>오디오 업로드 중...</p>}
        </form>
      </article>

      <article className="card">
        <h2>카테고리별 문장카드 목록</h2>
        <div className="list">
          {cards.map((card) => (
            <article className="card" key={card.id}>
              <h3>
                {card.cardNo}. {card.kor?.text}
              </h3>
              <p>아랍어: {card.arb?.text}</p>
              <p>카운트다운: {card.flow?.countdownSec}s</p>
              <p>활성화: {card.active ? "Y" : "N"}</p>
              <audio controls src={resolveMediaUrl(card.kor?.audioUrl)} />
              <audio controls src={resolveMediaUrl(card.arb?.audioUrl)} />
              <div className="row">
                <button type="button" onClick={() => onEdit(card)}>
                  수정
                </button>
                <button type="button" onClick={() => onDeactivate(card.id)}>
                  비활성화
                </button>
              </div>
            </article>
          ))}
          {!cards.length && <p>등록된 문장카드가 없습니다.</p>}
        </div>
      </article>
    </section>
  );
}

export default SentenceCardCrudPage;
