import React, { useState } from 'react';
import { StudyMaterial } from '../types';
import { CheckCircle, XCircle, RotateCcw, ArrowRight, ArrowLeft } from 'lucide-react';
import PixelCard from './PixelCard';

interface StudySessionProps {
  material: StudyMaterial;
  t: any;
  onExit: () => void;
}

const StudySession: React.FC<StudySessionProps> = ({ material, t, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false); // For Quiz
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isFlipped, setIsFlipped] = useState(false); // For Flashcards
  const [finished, setFinished] = useState(false);

  // --- QUIZ LOGIC ---
  const handleQuizAnswer = (idx: number) => {
    if (showAnswer) return;
    setSelectedOption(idx);
    setShowAnswer(true);
    if (material.quiz && idx === material.quiz[currentIndex].answerIndex) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (material.quiz && currentIndex < material.quiz.length - 1) {
      setCurrentIndex(c => c + 1);
      setShowAnswer(false);
      setSelectedOption(null);
    } else {
      setFinished(true);
    }
  };

  // --- FLASHCARD LOGIC ---
  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
        if (material.flashcards && currentIndex < material.flashcards.length - 1) {
            setCurrentIndex(c => c + 1);
        } else {
            setFinished(true);
        }
    }, 200);
  };
  
  const prevCard = () => {
      setIsFlipped(false);
      setTimeout(() => {
        if (currentIndex > 0) setCurrentIndex(c => c - 1);
      }, 200);
  };

  const restart = () => {
      setCurrentIndex(0);
      setScore(0);
      setFinished(false);
      setShowAnswer(false);
      setSelectedOption(null);
      setIsFlipped(false);
  };

  if (finished) {
    return (
      <div className="text-center animate-fade-in">
        <h2 className="text-4xl text-emerald-400 pixel-font-header mb-6">SESSION COMPLETE!</h2>
        {material.type === 'QUIZ' && (
           <div className="text-2xl text-white mb-8">
               {t.quizScore}: <span className="text-yellow-400 text-4xl">{score}</span> / {material.quiz?.length}
           </div>
        )}
        <div className="flex gap-4 justify-center">
            <button onClick={restart} className="bg-indigo-600 text-white border-4 border-black px-6 py-3 retro-shadow font-bold flex items-center gap-2">
                <RotateCcw /> {t.restart}
            </button>
            <button onClick={onExit} className="bg-gray-700 text-white border-4 border-black px-6 py-3 retro-shadow font-bold">
                {t.back}
            </button>
        </div>
      </div>
    );
  }

  // RENDER QUIZ
  if (material.type === 'QUIZ' && material.quiz) {
    const q = material.quiz[currentIndex];
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between text-gray-400 mb-4 font-bold">
            <span>QUESTION {currentIndex + 1} / {material.quiz.length}</span>
            <span>SCORE: {score}</span>
        </div>
        
        <PixelCard color="blue" className="mb-6 min-h-[200px] flex items-center justify-center">
            <h3 className="text-2xl md:text-3xl text-center text-white">{q.question}</h3>
        </PixelCard>

        <div className="grid gap-4">
            {q.options.map((opt, idx) => {
                let btnClass = "bg-gray-800 border-gray-600 hover:bg-gray-700";
                if (showAnswer) {
                    if (idx === q.answerIndex) btnClass = "bg-emerald-900 border-emerald-500 text-emerald-300";
                    else if (idx === selectedOption) btnClass = "bg-rose-900 border-rose-500 text-rose-300";
                    else btnClass = "bg-gray-900 border-gray-800 text-gray-600 opacity-50";
                }

                return (
                    <button 
                        key={idx}
                        onClick={() => handleQuizAnswer(idx)}
                        disabled={showAnswer}
                        className={`w-full p-4 border-4 text-left font-bold text-lg transition-all ${btnClass} retro-shadow`}
                    >
                        {opt}
                        {showAnswer && idx === q.answerIndex && <CheckCircle className="inline ml-2 w-5 h-5"/>}
                        {showAnswer && idx === selectedOption && idx !== q.answerIndex && <XCircle className="inline ml-2 w-5 h-5"/>}
                    </button>
                )
            })}
        </div>

        {showAnswer && (
            <div className="mt-8 text-center animate-bounce">
                <button onClick={nextQuestion} className="bg-yellow-500 text-black border-4 border-black px-8 py-3 text-xl font-bold retro-shadow hover:bg-yellow-400">
                    {t.nextQ} <ArrowRight className="inline ml-2"/>
                </button>
            </div>
        )}
      </div>
    );
  }

  // RENDER FLASHCARDS
  if (material.type === 'FLASHCARDS' && material.flashcards) {
    const card = material.flashcards[currentIndex];
    return (
       <div className="max-w-2xl mx-auto text-center">
           <div className="text-gray-400 mb-4 font-bold">CARD {currentIndex + 1} / {material.flashcards.length}</div>
           
           <div className="perspective-1000 w-full h-[400px] cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
                <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                    
                    {/* FRONT */}
                    <div className="absolute w-full h-full backface-hidden">
                        <PixelCard color="blue" className="h-full flex flex-col items-center justify-center border-indigo-500">
                            <span className="text-indigo-400 text-sm font-bold uppercase tracking-widest mb-4">FRONT</span>
                            <h3 className="text-3xl md:text-4xl text-white">{card.front}</h3>
                            <p className="mt-8 text-gray-500 text-sm animate-pulse">({t.flipCard})</p>
                        </PixelCard>
                    </div>

                    {/* BACK */}
                    <div className="absolute w-full h-full backface-hidden rotate-y-180">
                         <PixelCard color="green" className="h-full flex flex-col items-center justify-center border-emerald-500 bg-gray-900">
                            <span className="text-emerald-400 text-sm font-bold uppercase tracking-widest mb-4">BACK</span>
                            <h3 className="text-2xl md:text-3xl text-white">{card.back}</h3>
                        </PixelCard>
                    </div>

                </div>
           </div>

           <div className="flex justify-between mt-8">
               <button onClick={prevCard} disabled={currentIndex === 0} className="bg-gray-700 text-white px-6 py-3 border-4 border-black font-bold disabled:opacity-50 retro-shadow">
                   <ArrowLeft />
               </button>
               <button onClick={nextCard} className="bg-indigo-600 text-white px-6 py-3 border-4 border-black font-bold retro-shadow">
                   {currentIndex === material.flashcards.length - 1 ? 'FINISH' : <ArrowRight />}
               </button>
           </div>
       </div>
    );
  }

  return null;
};

export default StudySession;

// CSS Helper required for Flip Card (Add to index.html style block ideally, but putting here works in modern React CSS-in-JS patterns often too, or rely on global CSS)
// Note: Tailwind handles most, but specific 3d transforms need utility classes or arbitrary values.
// I used standard class names above. Assumes global CSS has:
// .perspective-1000 { perspective: 1000px; }
// .transform-style-3d { transform-style: preserve-3d; }
// .backface-hidden { backface-visibility: hidden; }
// .rotate-y-180 { transform: rotateY(180deg); }
