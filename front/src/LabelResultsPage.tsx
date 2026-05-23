import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { useEffect, useState } from "react";
import LabelResults from "./LabelResults";
import "./styles/labelresults.css";

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

function LabelResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [filteredInfo, setFilteredInfo] = useState<LabelInfo | null>(null);

  useEffect(() => {
    const state = location.state as { labelInfo?: LabelInfo } | null;
    const originalLabelInfo = state?.labelInfo ? { ...state.labelInfo } : null;

    // --- INITIALISATION DE L'IMAGE D'EXEMPLE ---
    if (originalLabelInfo) {
       // originalLabelInfo.imageUrl = "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=500&auto=format&fit=crop"; 
    }

    if (originalLabelInfo) {
      const savedSettings = localStorage.getItem("ethiCloSettings");
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        const newInfo: LabelInfo = {};

        if (originalLabelInfo.imageUrl) newInfo.imageUrl = originalLabelInfo.imageUrl;
        if (settings.brand) newInfo.brand = originalLabelInfo.brand;
        if (settings.size) newInfo.size = originalLabelInfo.size;
        if (settings.material) newInfo.material = originalLabelInfo.material;
        if (settings.care) newInfo.care_instructions = originalLabelInfo.care_instructions;
        if (settings.country) newInfo.country_of_origin = originalLabelInfo.country_of_origin;

        if (settings.detailedScore) {
          if (originalLabelInfo.ethical_score != null) newInfo.ethical_score = originalLabelInfo.ethical_score;
          if (originalLabelInfo.environmental_score != null) newInfo.environmental_score = originalLabelInfo.environmental_score;
        }
        if (settings.globalScore && originalLabelInfo.global_score != null) {
          newInfo.global_score = originalLabelInfo.global_score;
        }
        setFilteredInfo(newInfo);
      } else {
        setFilteredInfo(originalLabelInfo);
      }
    }
  }, [location.state]);

  return (
    <div className="app-results">
      <button className="back-button-results" onClick={() => navigate("/scan")}>
        <FaArrowLeft className="back-icon" />
      </button>

      {filteredInfo ? (
        <LabelResults data={filteredInfo} />
      ) : (
        <div className="empty-state">
          <p>No results found.</p>
          <button className="back-to-scan-btn" onClick={() => navigate("/scan")}>
            <FaArrowLeft className="back-icon" style={{marginRight: '8px'}} /> Return
          </button>
        </div>
      )}
    </div>
  );
}

export default LabelResultsPage;