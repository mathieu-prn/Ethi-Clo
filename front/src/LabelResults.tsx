import React, { useEffect, useState } from "react";

interface LabelInfo {
  brand?: string | null;
  size?: string | null;
  material?: string | null;
  care_instructions?: string | null;
  country_of_origin?: string | null;
  ethical_score?: number | null;
  environmental_score?: number | null;
  global_score?: number | null;
  imageUrl?: string | null;
}

interface LabelResultsProps {
  data: LabelInfo;
  drawerHeight: number;
  isSnapping: boolean;
  onDragStart: (e: React.TouchEvent | React.MouseEvent) => void;
  onDragMove: (e: React.TouchEvent | React.MouseEvent) => void;
  onDragEnd: (e: React.TouchEvent | React.MouseEvent) => void;
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

const LabelResults = ({ data, drawerHeight, isSnapping, onDragStart, onDragMove, onDragEnd }: LabelResultsProps) => {
  const showDualScores = data.ethical_score != null || data.environmental_score != null;
  const showGlobalScore = data.global_score != null && !showDualScores;
  const hasScores = showDualScores || data.global_score != null;
  const hasParameters = data.brand || data.size || data.material || data.country_of_origin || data.care_instructions;

  return (
    <div className="results-wrapper">
      <div className="results-upper-section">
        <div className="image-placeholder">
          {data.imageUrl ? (
            <img src={data.imageUrl} alt="Item" className="item-image" />
          ) : (
            <span>IMAGE</span>
          )}
        </div>

        <div className="scores-overlay">
          {hasScores ? (
            <>
              {showDualScores && (
                <div className="scores-grid-2">
                  {data.ethical_score != null && <ScoreBar score={data.ethical_score} label="Ethical" />}
                  {data.environmental_score != null && <ScoreBar score={data.environmental_score} label="Env." />}
                </div>
              )}
              {showGlobalScore && (
                <div className="scores-grid-1">
                  <ScoreBar score={data.global_score!} label="Global Score" />
                </div>
              )}
            </>
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