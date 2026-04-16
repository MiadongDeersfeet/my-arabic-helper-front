import { useEffect, useMemo, useRef, useState } from "react";
import { categoryApi, resolveMediaUrl, sentenceCardApi } from "../api/client";

const PHASE = {
  KOR_SHOW: "KOR_SHOW",
  KOR_AUDIO_PLAY: "KOR_AUDIO_PLAY",
  COUNTDOWN: "COUNTDOWN",
  ARB_SHOW: "ARB_SHOW",
  ARB_AUDIO_PLAY: "ARB_AUDIO_PLAY",
  DONE: "DONE"
};

function SentenceLearningMvpPage() {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentCard, setCurrentCard] = useState(null);
  const [phase, setPhase] = useState(PHASE.KOR_SHOW);
  const [countdown, setCountdown] = useState(0);
  const [isKorVisible, setIsKorVisible] = useState(false);
  const [isArbVisible, setIsArbVisible] = useState(false);

  const countdownTimerRef = useRef(null);
  const phaseTimerRef = useRef(null);
  const audioRef = useRef(null);

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );

  useEffect(() => {
    const loadCategories = async () => {
      const data = await categoryApi.getAll();
      setCategories(data);
      if (data.length > 0) {
        setSelectedCategoryId(data[0].id);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (!selectedCategoryId) {
      return;
    }
    const loadCards = async () => {
      const data = await sentenceCardApi.getByCategory(selectedCategoryId);
      setCards(data);
      setCurrentIndex(0);
      setCurrentCard(data[0] || null);
    };
    loadCards();
  }, [selectedCategoryId]);

  useEffect(() => {
    setCurrentCard(cards[currentIndex] || null);
  }, [cards, currentIndex]);

  useEffect(() => {
    setPhase(PHASE.KOR_SHOW);
    setIsKorVisible(false);
    setIsArbVisible(false);
    setCountdown(currentCard?.flow?.countdownSec || 0);
  }, [currentCard]);

  useEffect(() => {
    if (!currentCard) {
      return;
    }

    clearTimeout(phaseTimerRef.current);
    clearInterval(countdownTimerRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (phase === PHASE.KOR_SHOW) {
      setIsKorVisible(true);
      setIsArbVisible(false);
      phaseTimerRef.current = setTimeout(() => setPhase(PHASE.KOR_AUDIO_PLAY), 300);
    } else if (phase === PHASE.KOR_AUDIO_PLAY) {
      playAudio(resolveMediaUrl(currentCard.kor?.audioUrl), () => setPhase(PHASE.COUNTDOWN));
    } else if (phase === PHASE.COUNTDOWN) {
      setCountdown(currentCard.flow?.countdownSec || 10);
      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current);
            setPhase(PHASE.ARB_SHOW);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (phase === PHASE.ARB_SHOW) {
      setIsArbVisible(true);
      phaseTimerRef.current = setTimeout(() => setPhase(PHASE.ARB_AUDIO_PLAY), 300);
    } else if (phase === PHASE.ARB_AUDIO_PLAY) {
      playAudio(resolveMediaUrl(currentCard.arb?.audioUrl), () => setPhase(PHASE.DONE));
    }

    return () => {
      clearTimeout(phaseTimerRef.current);
      clearInterval(countdownTimerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [currentCard, phase]);

  const playAudio = (audioUrl, onEnded) => {
    if (!audioUrl) {
      onEnded?.();
      return;
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onended = () => onEnded?.();
    audio.onerror = () => onEnded?.();
    audio.play().catch(() => onEnded?.());
  };

  const onSelectCard = (index) => {
    setCurrentIndex(index);
  };

  const onNextCard = () => {
    setCurrentIndex((prev) => {
      if (prev >= cards.length - 1) {
        return prev;
      }
      return prev + 1;
    });
  };

  const onReplay = () => {
    setPhase(PHASE.KOR_SHOW);
  };

  return (
    <section className="learning-layout">
      <article className="card">
        <h2>카테고리 선택</h2>
        <select value={selectedCategoryId} onChange={(event) => setSelectedCategoryId(event.target.value)}>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <p>{selectedCategory?.description || "카테고리를 선택하세요."}</p>
      </article>

      <article className="card">
        <h2>문장카드 목록</h2>
        <div className="list compact-list">
          {cards.map((card, index) => (
            <button
              key={card.id}
              type="button"
              className={index === currentIndex ? "active-btn" : ""}
              onClick={() => onSelectCard(index)}
            >
              {card.cardNo}. {card.kor?.text}
            </button>
          ))}
          {!cards.length && <p>해당 카테고리에 문장카드가 없습니다.</p>}
        </div>
      </article>

      <article className="card flow-card">
        <h2>문장 학습</h2>
        {!currentCard ? (
          <p>문장카드를 선택하세요.</p>
        ) : (
          <>
            <p>
              카드 {currentIndex + 1}/{cards.length} | Phase: {phase}
            </p>
            <p>카운트다운: {countdown}s</p>
            {isKorVisible && (
              <div className="lang-card kor-card">
                <h3>한국어</h3>
                <p>{currentCard.kor?.text}</p>
              </div>
            )}
            {isArbVisible && (
              <div className="lang-card arb-card">
                <h3>아랍어</h3>
                <p>{currentCard.arb?.text}</p>
              </div>
            )}
            <div className="row">
              <button type="button" onClick={onReplay}>
                다시 듣기
              </button>
              <button type="button" onClick={onNextCard} disabled={currentIndex >= cards.length - 1}>
                다음 카드
              </button>
            </div>
          </>
        )}
      </article>
    </section>
  );
}

export default SentenceLearningMvpPage;
