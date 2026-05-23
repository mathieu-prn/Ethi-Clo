import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/settings.css';

interface EthiCloSettings {
  brand: boolean;
  size: boolean;
  material: boolean;
  care: boolean;
  country: boolean;
  detailedScore: boolean;
  globalScore: boolean;
}

const defaultSettings: EthiCloSettings = {
  brand: true,
  size: true,
  material: true,
  care: true,
  country: true,
  detailedScore: true,
  globalScore: false,
};

const Settings: React.FC = () => {
  const navigate = useNavigate();

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
      globalScore: !isChecked,
    }));
  };

  const handleGlobalToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setSettings((prev) => ({
      ...prev,
      globalScore: isChecked,
      detailedScore: !isChecked,
    }));
  };

  return (
    <div id="settings-page">
      <div className="settings-container">
        
        <h1 className="settings-title">Parameters</h1>
        <hr></hr>
        <h2 className="settings-subtitle">Results page</h2>

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

        <div className="setting-item">
          <span>Global Score</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.globalScore}
              onChange={handleGlobalToggle}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="settings-footer">
          <button className="back-button-bottom" onClick={() => navigate('/')}>
            Save & Quit
          </button>
        </div>

      </div>
    </div>
  );
};

export default Settings;