import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './styles/settings.css';

interface EthiCloSettings {
  brand: boolean;
  size: boolean;
  material: boolean;
  care: boolean;
  country: boolean;
  detailedScore: boolean;
}

const defaultSettings: EthiCloSettings = {
  brand: true,
  size: true,
  material: true,
  care: false,
  country: true,
  detailedScore: false,
};

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [settings, setSettings] = useState<EthiCloSettings>(() => {
    const saved = localStorage.getItem('ethiCloSettings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('ethiCloSettings', JSON.stringify(settings));
  }, [settings]);

  const handleToggle = (key: keyof EthiCloSettings) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      [key]: !prevSettings[key],
    }));
  };

  const handleDetailedToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setSettings((prev) => ({
      ...prev,
      detailedScore: isChecked,
      // Le score global n'est plus impacté ici, il reste affiché.
    }));
  };

  const handleSaveAndQuit = () => {
    if (location.state?.from) {
      navigate(location.state.from, { state: location.state });
    } else {
      navigate('/');
    }
  };

  return (
    <div id="settings-page">
      <div className="settings-container">
        
        <h2 className="settings-title">Scan Parameters</h2>

        <div className="setting-item">
          <span>Brand</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.brand}
              onChange={() => handleToggle('brand')}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <span>Size</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.size}
              onChange={() => handleToggle('size')}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <span>Material</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.material}
              onChange={() => handleToggle('material')}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <span>Care Instructions</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.care}
              onChange={() => handleToggle('care')}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <span>Country of Origin</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.country}
              onChange={() => handleToggle('country')}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <span>Ethical & Environmental Score</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.detailedScore}
              onChange={handleDetailedToggle}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="settings-footer">
          <button className="back-button-bottom" onClick={handleSaveAndQuit}>
            Save & Quit
          </button>
        </div>

      </div>
    </div>
  );
};

export default Settings;