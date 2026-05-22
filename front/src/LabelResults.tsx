import styled from "styled-components";
import type { ScoredLabelInfo } from "./scoreCalculator";

const ResultsContainer = styled.div`
  width: 100%;
  max-width: 85%;
  background: white;
  border-radius: 15px;
  padding: 24px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
`;

const ResultTitle = styled.h2`
  color: #333;
  margin: 0 0 20px 0;
  text-align: center;
  font-size: 24px;
`;

const ResultGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  
  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const ResultItem = styled.div`
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  border-left: 4px solid #5A8C89;
`;

const ScoreItem = styled(ResultItem)`
  background: #e8ffe8;
  border-left: 4px solid #41715e;
`;

const ResultLabel = styled.div`
  font-weight: 600;
  color: #666;
  font-size: 12px;
  text-transform: uppercase;
  margin-bottom: 4px;
`;

const ResultValue = styled.div`
  color: #333;
  font-size: 16px;
  word-break: break-word;
  min-height: 24px;
  display: flex;
  align-items: center;
  font-weight: 500;
  
  &:empty::before {
    content: "N/A";
    color: #ccc;
  }
`;

interface LabelResultsProps {
  data: ScoredLabelInfo;
}

const LabelResults = ({ data }: LabelResultsProps) => {
  return (
    <ResultsContainer>
      <ResultTitle>Label Information</ResultTitle>
      <ResultGrid>
        
        {data.brand != null && (
          <ResultItem>
            <ResultLabel>Brand</ResultLabel>
            <ResultValue>{data.brand || "Unknown"}</ResultValue>
          </ResultItem>
        )}

        {data.size != null && (
          <ResultItem>
            <ResultLabel>Size</ResultLabel>
            <ResultValue>{data.size || "Unknown"}</ResultValue>
          </ResultItem>
        )}

        {data.material != null && (
          <ResultItem>
            <ResultLabel>Material</ResultLabel>
            <ResultValue>{data.material || "Unknown"}</ResultValue>
          </ResultItem>
        )}

        {data.country_of_origin != null && (
          <ResultItem>
            <ResultLabel>Country of Origin</ResultLabel>
            <ResultValue>{data.country_of_origin || "Unknown"}</ResultValue>
          </ResultItem>
        )}

        {data.care_instructions != null && (
          <ResultItem style={{ gridColumn: "1 / -1" }}>
            <ResultLabel>Care Instructions</ResultLabel>
            <ResultValue>{data.care_instructions || "Unknown"}</ResultValue>
          </ResultItem>
        )}

        {data.ethical_score != null && (
          <ScoreItem>
            <ResultLabel>Ethical Score</ResultLabel>
            <ResultValue>{data.ethical_score}/100</ResultValue>
          </ScoreItem>
        )}

        {data.environmental_score != null && (
          <ScoreItem>
            <ResultLabel>Environmental Score</ResultLabel>
            <ResultValue>{data.environmental_score}/100</ResultValue>
          </ScoreItem>
        )}

        {data.global_score != null && (
          <ScoreItem style={{ gridColumn: "1 / -1" }}>
            <ResultLabel>Global Score</ResultLabel>
            <ResultValue>{data.global_score}/100</ResultValue>
          </ScoreItem>
        )}

      </ResultGrid>
    </ResultsContainer>
  );
};

export default LabelResults;