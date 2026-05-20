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
}

function LabelResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { labelInfo?: LabelInfo } | null;
  const originalLabelInfo = state?.labelInfo;

  const [filteredInfo, setFilteredInfo] = useState<LabelInfo | null>(null);

  useEffect(() => {
    if (originalLabelInfo) {
      const savedSettings = localStorage.getItem('ethiCloSettings');
      
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        const newInfo: LabelInfo = {};

        if (settings.brand && originalLabelInfo.brand) newInfo.brand = originalLabelInfo.brand;
        if (settings.size && originalLabelInfo.size) newInfo.size = originalLabelInfo.size;
        if (settings.material && originalLabelInfo.material) newInfo.material = originalLabelInfo.material;
        if (settings.care && originalLabelInfo.care_instructions) newInfo.care_instructions = originalLabelInfo.care_instructions;
        if (settings.country && originalLabelInfo.country_of_origin) newInfo.country_of_origin = originalLabelInfo.country_of_origin;

        if (settings.detailedScore) {
          if (originalLabelInfo.ethical_score) newInfo.ethical_score = originalLabelInfo.ethical_score;
          if (originalLabelInfo.environmental_score) newInfo.environmental_score = originalLabelInfo.environmental_score;
        }
        
        if (settings.globalScore && originalLabelInfo.global_score) {
          newInfo.global_score = originalLabelInfo.global_score;
        }

        setFilteredInfo(newInfo);
      } else {
        setFilteredInfo(originalLabelInfo);
      }
    }
  }, [originalLabelInfo]);

  return (
    <div className="app-results">
      <div className="content">
        <button className="back-button" onClick={() => navigate("/scan")}>
          <FaArrowLeft />
        </button>

        <div className="card-container" style={{ padding: "24px" }}>
          {filteredInfo && Object.keys(filteredInfo).length > 0 ? (
            <>
              <h1 style={{ marginBottom: "16px", textAlign: "center" }}>
                Scan Results
              </h1>
              <LabelResults data={filteredInfo} />
            </>
          ) : (
            <div className="empty-state">
              <p>No scan results available or all parameters are hidden.</p>
              <button className="back-to-scan-btn" onClick={() => navigate("/scan")}>
                <FaArrowLeft /> Return to Scan
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LabelResultsPage;