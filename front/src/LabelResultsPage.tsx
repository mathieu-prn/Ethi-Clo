import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import LabelResults from "./LabelResults";
import "./styles/Scan.css";

interface LabelInfo {
  brand?: string | null;
  size?: string | null;
  material?: string | null;
  care_instructions?: string | null;
  country_of_origin?: string | null;
}

function LabelResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { labelInfo?: LabelInfo } | null;
  const labelInfo = state?.labelInfo;

  return (
    <div className="app">
      <div className="bg-circle-top"></div>
      <div className="bg-circle-bottom"></div>

      <div className="content">
        <button className="back-button" onClick={() => navigate("/scan")}>
          <FaArrowLeft />
        </button>

        <div className="card" style={{ padding: "24px" }}>
          {labelInfo ? (
            <>
              <h1 style={{ marginBottom: "16px", textAlign: "center" }}>
                Scan Results
              </h1>
              <LabelResults data={labelInfo} />
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "32px" }}>
              <p>No scan results available.</p>
              <button className="scan-btn" onClick={() => navigate("/scan")}>Return to Scan</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LabelResultsPage;
