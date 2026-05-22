import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { useEffect, useState } from "react";
import LabelResults from "./LabelResults";
import { calculateLabelScores, type ScoredLabelInfo } from "./scoreCalculator";
import "./styles/labelresults.css";

function LabelResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { labelInfo?: ScoredLabelInfo } | null;
  const originalLabelInfo = state?.labelInfo;

  const [filteredInfo, setFilteredInfo] = useState<ScoredLabelInfo | null>(null);

  useEffect(() => {
    if (originalLabelInfo) {
      const labelInfoWithScores = calculateLabelScores(originalLabelInfo);
      const savedSettings = localStorage.getItem('ethiCloSettings');
      
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        const newInfo: ScoredLabelInfo = {};

        if (settings.brand && labelInfoWithScores.brand) newInfo.brand = labelInfoWithScores.brand;
        if (settings.size && labelInfoWithScores.size) newInfo.size = labelInfoWithScores.size;
        if (settings.material && labelInfoWithScores.material) newInfo.material = labelInfoWithScores.material;
        if (settings.care && labelInfoWithScores.care_instructions) newInfo.care_instructions = labelInfoWithScores.care_instructions;
        if (settings.country && labelInfoWithScores.country_of_origin) newInfo.country_of_origin = labelInfoWithScores.country_of_origin;

        if (settings.detailedScore) {
          if (labelInfoWithScores.ethical_score !== null) newInfo.ethical_score = labelInfoWithScores.ethical_score;
          if (labelInfoWithScores.environmental_score !== null) newInfo.environmental_score = labelInfoWithScores.environmental_score;
        }
        if (labelInfoWithScores.global_score !== null) newInfo.global_score = labelInfoWithScores.global_score;

        setFilteredInfo(newInfo);
      } else {
        setFilteredInfo(labelInfoWithScores);
      }
    }
  }, [originalLabelInfo]);

  return (
    <div className="app-results">
      <div className="content">
        <button className="back-button-results" onClick={() => navigate("/scan")}>
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
