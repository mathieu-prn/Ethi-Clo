import React, { useEffect, useState, useRef } from "react";
import type { ScoredLabelInfo } from "./scoreCalculator";
import vekoHappy from "./assets/veko-happy.png";
import vekoNeutral from "./assets/veko-neutral.png";
import vekoSad from "./assets/veko-sad.png";

interface LabelResultsProps {
  data: ScoredLabelInfo;
  drawerHeight: number;
  isSnapping: boolean;
  onDragStart: (e: React.TouchEvent | React.MouseEvent) => void;
  onDragMove: (e: React.TouchEvent | React.MouseEvent) => void;
  onDragEnd: (e: React.TouchEvent | React.MouseEvent) => void;
  onUpperSectionRendered: (bottomPx: number) => void;
}

const getVekoImage = (score: number | null | undefined) => {
  if (score == null) return vekoNeutral
     if (score <= 33) return vekoSad
     if (score <= 66) return vekoNeutral
  return vekoHappy
}

const ScoreBar = ({ score, label }: { score: number; label: string }) => {
  const [width, setWidth] = useState(0);
  const [color, setColor] = useState("#ff4d4d");

  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(score);
      const hue = (score / 100) * 120;
      setColor(`hsl(${hue}, 90%, 45%)`);
    }, 300);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="score-card">
      <div className="score-header">
        <span className="score-label">{label}</span>
        <span className="score-value" style={{ color }}>{score}%</span>
      </div>
      <div className="progress-container">
        <div
          className="progress-fill"
          style={{ width: `${width}%`, backgroundColor: color, boxShadow: `0 0 12px ${color}` }}
        />
      </div>
    </div>
  );
};

const LabelResults = ({ data, drawerHeight, isSnapping, onDragStart, onDragMove, onDragEnd, onUpperSectionRendered }: LabelResultsProps) => {
  const showDualScores = data.ethical_score != null || data.environmental_score != null;
  const showGlobalScore = data.global_score != null;
  const hasScores = showDualScores || showGlobalScore;
  const hasParameters = data.brand || data.size || data.material || data.country_of_origin || data.care_instructions;

  const upperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (upperRef.current) {
        onUpperSectionRendered(upperRef.current.getBoundingClientRect().bottom);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [data, onUpperSectionRendered]);

  return (
    <div className="results-wrapper">
      <div className="results-upper-section" ref={upperRef}>

        <div className="image-placeholder">
          <img
            src={getVekoImage(data.global_score)}
            alt="Veko"
            className="veko-result-image"
          />
        </div>

        <div className="scores-overlay">
          {hasScores ? (
            <div className="scores-stack">
              {showGlobalScore && (
                <div className="scores-grid-1">
                  <ScoreBar score={data.global_score!} label="Global Score" />
                </div>
              )}
              {showDualScores && (
                <div className="scores-grid-2">
                  {data.ethical_score != null && <ScoreBar score={data.ethical_score} label="Ethical" />}
                  {data.environmental_score != null && <ScoreBar score={data.environmental_score} label="Env." />}
                </div>
              )}
            </div>
          ) : (
            <div className="no-data-message">No score available for this item.</div>
          )}
        </div>
      </div>

      <div
        className={`details-drawer ${isSnapping ? "snapping" : ""}`}
        style={{ height: `${drawerHeight}vh` }}
      >
        <div
          className="drawer-handle-area"
          onTouchStart={onDragStart}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
          onMouseDown={onDragStart}
          onMouseMove={onDragMove}
          onMouseUp={onDragEnd}
        >
          <div className="drawer-handle" />
        </div>

        <div className="drawer-content">
          <h3 className="drawer-title">Information Details</h3>
          <div className="parameters-list">
            {hasParameters ? (
              <>
                {data.brand && (
                  <div className="param-item">
                    <span className="param-title">Brand</span>
                    <span className="param-data">{data.brand}</span>
                  </div>
                )}
                {data.size && (
                  <div className="param-item">
                    <span className="param-title">Size</span>
                    <span className="param-data">{data.size}</span>
                  </div>
                )}
                {data.material && (
                  <div className="param-item">
                    <span className="param-title">Material</span>
                    <span className="param-data">{data.material}</span>
                  </div>
                )}
                {data.country_of_origin && (
                  <div className="param-item">
                    <span className="param-title">Origin</span>
                    <span className="param-data">{data.country_of_origin}</span>
                  </div>
                )}
                {data.care_instructions && (
                  <div className="param-item">
                    <span className="param-title">Care</span>
                    <span className="param-data">{data.care_instructions}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="no-data-message">No detailed information available for this item.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabelResults;