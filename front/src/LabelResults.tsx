import styled from "styled-components";

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
  border-left: 4px solid #8b5cf6;
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

interface LabelResultsProps {
  data: LabelInfo;
}

const LabelResults = ({ data }: LabelResultsProps) => {
  return (
    <ResultsContainer>
      <ResultTitle>Label Information</ResultTitle>
      <ResultGrid>
        
        {data.brand !== undefined && (
          <ResultItem>
            <ResultLabel>Brand</ResultLabel>
            <ResultValue>{data.brand}</ResultValue>
          </ResultItem>
        )}

        {data.size !== undefined && (
          <ResultItem>
            <ResultLabel>Size</ResultLabel>
            <ResultValue>{data.size}</ResultValue>
          </ResultItem>
        )}

        {data.material !== undefined && (
          <ResultItem>
            <ResultLabel>Material</ResultLabel>
            <ResultValue>{data.material}</ResultValue>
          </ResultItem>
        )}

        {data.country_of_origin !== undefined && (
          <ResultItem>
            <ResultLabel>Country of Origin</ResultLabel>
            <ResultValue>{data.country_of_origin}</ResultValue>
          </ResultItem>
        )}

        {data.care_instructions !== undefined && (
          <ResultItem style={{ gridColumn: "1 / -1" }}>
            <ResultLabel>Care Instructions</ResultLabel>
            <ResultValue>{data.care_instructions}</ResultValue>
          </ResultItem>
        )}

        {data.ethical_score !== undefined && (
          <ScoreItem>
            <ResultLabel>Ethical Score</ResultLabel>
            <ResultValue>{data.ethical_score}/100</ResultValue>
          </ScoreItem>
        )}

        {data.environmental_score !== undefined && (
          <ScoreItem>
            <ResultLabel>Environmental Score</ResultLabel>
            <ResultValue>{data.environmental_score}/100</ResultValue>
          </ScoreItem>
        )}

        {data.global_score !== undefined && (
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