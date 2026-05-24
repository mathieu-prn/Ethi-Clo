import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { useEffect, useState, useRef } from "react";
import LabelResults from "./LabelResults";
import { calculateLabelScores, type ScoredLabelInfo } from "./scoreCalculator";
import "./styles/labelresults.css";

function LabelResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [filteredInfo, setFilteredInfo] = useState<ScoredLabelInfo | null>(null);
  const [drawerHeight, setDrawerHeight] = useState(50);
  const [isSnapping, setIsSnapping] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const dragStartHeight = useRef<number>(55);

  useEffect(() => {
    const state = location.state as { labelInfo?: ScoredLabelInfo } | null;
    const originalLabelInfo = state?.labelInfo ? { ...state.labelInfo } : null;

    if (originalLabelInfo) {
      const labelInfoWithScores = calculateLabelScores(originalLabelInfo);
      const savedSettings = localStorage.getItem("ethiCloSettings");

      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        const newInfo: ScoredLabelInfo = {};

        if (labelInfoWithScores.imageUrl) newInfo.imageUrl = labelInfoWithScores.imageUrl;
        if (settings.brand) newInfo.brand = labelInfoWithScores.brand;
        if (settings.size) newInfo.size = labelInfoWithScores.size;
        if (settings.material) newInfo.material = labelInfoWithScores.material;
        if (settings.care) newInfo.care_instructions = labelInfoWithScores.care_instructions;
        if (settings.country) newInfo.country_of_origin = labelInfoWithScores.country_of_origin;

        if (settings.detailedScore) {
          if (labelInfoWithScores.ethical_score != null) newInfo.ethical_score = labelInfoWithScores.ethical_score;
          if (labelInfoWithScores.environmental_score != null) newInfo.environmental_score = labelInfoWithScores.environmental_score;
        }
        if (settings.globalScore && labelInfoWithScores.global_score != null) {
          newInfo.global_score = labelInfoWithScores.global_score;
        }
        setFilteredInfo(newInfo);
      } else {
        setFilteredInfo(labelInfoWithScores);
      }
    }
  }, [location.state]);

  const onDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    const y = "touches" in e ? e.touches[0].clientY : e.clientY;
    dragStartY.current = y;
    dragStartHeight.current = drawerHeight;
    setIsSnapping(false);
  };

  const onDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (dragStartY.current === null) return;
    const y = "touches" in e ? e.touches[0].clientY : e.clientY;
    const diff = dragStartY.current - y;
    const viewportHeight = window.innerHeight;
    const newHeight = dragStartHeight.current + (diff / viewportHeight) * 100;
    setDrawerHeight(Math.min(92, Math.max(20, newHeight)));
  };

  const onDragEnd = () => {
  if (dragStartY.current === null) return;
  
  const movedEnough = Math.abs(drawerHeight - dragStartHeight.current) > 5;
  
  if (movedEnough) {
    const snapUp = drawerHeight > 68;
    setIsSnapping(true);
    setDrawerHeight(snapUp ? 92 : 50);
    setTimeout(() => setIsSnapping(false), 300);
  } else {
    // Pas assez de mouvement, on remet à la position de départ
    setIsSnapping(true);
    setDrawerHeight(dragStartHeight.current);
    setTimeout(() => setIsSnapping(false), 300);
  }
  
  dragStartY.current = null;
  };

  return (
    <div className="app-results">
      <button className="back-button-results" onClick={() => navigate("/scan")}>
        <FaArrowLeft />
      </button>

      {filteredInfo ? (
        <LabelResults
          data={filteredInfo}
          drawerHeight={drawerHeight}
          isSnapping={isSnapping}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
        />
      ) : (
        <div className="empty-state">
          <p>No results found.</p>
          <button className="back-to-scan-btn" onClick={() => navigate("/scan")}>
            <FaArrowLeft className="back-icon" style={{ marginRight: "8px" }} /> Return
          </button>
        </div>
      )}
    </div>
  );
}

export default LabelResultsPage;