import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { useEffect, useState, useRef, useCallback } from "react";
import LabelResults from "./LabelResults";
import { calculateLabelScores, type ScoredLabelInfo } from "./scoreCalculator";
import settingsIcon from "./assets/settings-icon.png";
import "./styles/labelresults.css";

function LabelResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [filteredInfo, setFilteredInfo] = useState<ScoredLabelInfo | null>(null);
  
  // États pour le menu coulissant
  const [drawerHeight, setDrawerHeight] = useState(45);
  const [baseDrawerHeight, setBaseDrawerHeight] = useState(45);
  const [isSnapping, setIsSnapping] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const dragStartHeight = useRef<number>(45);

  useEffect(() => {
    const state = location.state as { labelInfo?: ScoredLabelInfo } | null;
    const originalLabelInfo = state?.labelInfo ? { ...state.labelInfo } : null;

    if (originalLabelInfo) {
      const labelInfoWithScores = calculateLabelScores(originalLabelInfo);
      const savedSettings = localStorage.getItem("ethiCloSettings");

      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        const newInfo: ScoredLabelInfo = {};

        if (labelInfoWithScores.global_score != null) {
          newInfo.global_score = labelInfoWithScores.global_score;
        }

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
        
        setFilteredInfo(newInfo);
      } else {
        setFilteredInfo(labelInfoWithScores);
      }
    }
  }, [location.state]);

  // Calcule la hauteur parfaite pour le menu déroulant !
  const handleUpperSectionRendered = useCallback((bottomPx: number) => {
    const fixedDistancePx = -4; // Le menu démarre toujours 10px sous les scores
    const drawerStartPx = bottomPx + fixedDistancePx;
    const remainingPx = window.innerHeight - drawerStartPx;
    const remainingVh = (remainingPx / window.innerHeight) * 100;
    
    // Garde le menu dans des limites raisonnables (entre 25vh et 85vh)
    const finalVh = Math.min(85, Math.max(25, remainingVh)); 
    setDrawerHeight(finalVh);
    setBaseDrawerHeight(finalVh);
  }, []);

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
    setDrawerHeight(Math.min(85, Math.max(20, newHeight)));
  };

  const onDragEnd = () => {
    if (dragStartY.current === null) return;
    
    const movedEnough = Math.abs(drawerHeight - dragStartHeight.current) > 5;
    
    if (movedEnough) {
      // Retourne au point de base calculé dynamiquement
      const snapUp = drawerHeight > baseDrawerHeight + 10;
      setIsSnapping(true);
      setDrawerHeight(snapUp ? 85 : baseDrawerHeight);
      setTimeout(() => setIsSnapping(false), 300);
    } else {
      setIsSnapping(true);
      setDrawerHeight(dragStartHeight.current);
      setTimeout(() => setIsSnapping(false), 300);
    }
    
    dragStartY.current = null;
  };

  const handleSettingsClick = () => {
    navigate("/settings", {
      state: {
        ...location.state,
        from: location.pathname
      }
    });
  };

  return (
    <div className="app-results">
      <button className="back-button-results" onClick={() => navigate("/scan")}>
        <FaArrowLeft />
      </button>

      <button className="settings-button-results" onClick={handleSettingsClick}>
        <img src={settingsIcon} className="settings-icon-results" alt="settings" />
      </button>

      {filteredInfo ? (
        <LabelResults
          data={filteredInfo}
          drawerHeight={drawerHeight}
          isSnapping={isSnapping}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          onUpperSectionRendered={handleUpperSectionRendered}
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