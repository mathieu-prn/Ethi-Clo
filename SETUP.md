# Ethi-Clo Backend-Frontend Integration Setup

## Overview
This system integrates your clothing label scanning application with the Gemini API through a Flask backend. When you capture an image on the frontend, it's automatically sent to the backend, processed through the Gemini API, and the results are displayed in real-time.

## Prerequisites
- Python 3.8+ (with venv)
- Node.js 16+ (for npm)
- GEMINI_API_KEY in your `.env` file

## Installation

### 1. Install Python Dependencies
Make sure you're in the project root and your virtual environment is activated:

```bash
# Activate virtual environment
.\venv\Scripts\Activate.ps1  # PowerShell
# or
.\venv\Scripts\activate.bat  # Command Prompt

# Install dependencies
pip install -r requirements.txt
```

### 2. Install Frontend Dependencies
```bash
cd front
npm install
```

## Running the Application

### Option 1: Using the Startup Script (Easiest)
**PowerShell:**
```bash
.\start.ps1
```

**Command Prompt:**
```bash
start.bat
```

This will open two terminal windows:
- One for the Flask backend (port 5000)
- One for the Vite frontend (port 5173)

### Option 2: Manual Setup
**Terminal 1 - Backend:**
```bash
python app.py
```

**Terminal 2 - Frontend:**
```bash
cd front
npm run dev
```

## Architecture

### Backend (`app.py`)
- **Framework**: Flask with CORS support
- **Endpoint**: `POST /api/scan`
- **Flow**: 
  1. Receives base64-encoded image from frontend
  2. Decodes the image data
  3. Sends to Gemini API with extraction prompt
  4. Returns JSON with extracted label information

### Frontend
- **Capture**: `WebcamCapture.tsx` - Captures image from device camera
- **Processing**: `Scan.tsx` - Manages the scanning workflow and API communication
- **Display**: `LabelResults.tsx` - Shows extracted label information

### Data Flow
```
Camera Input → Image Capture → Base64 Encoding → 
Backend API → Gemini API → JSON Response → 
Display Results in Frontend
```

## API Endpoints

### POST /api/scan
Processes an image and extracts clothing label information.

**Request:**
```json
{
  "imageDataUrl": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "brand": "Nike",
  "size": "M",
  "material": "100% Cotton",
  "care_instructions": "Machine wash cold",
  "country_of_origin": "Vietnam"
}
```

### GET /health
Health check endpoint.

## Modifying the Extraction Prompt

The Gemini API prompt is defined in `app.py` in the `scan_label()` function. You can modify it to extract different information:

```python
"Your custom prompt here with extraction instructions..."
```

## Troubleshooting

### Backend won't start
- Ensure Python is in your PATH
- Check that port 5000 is not in use: `netstat -ano | findstr :5000`
- Verify GEMINI_API_KEY is set in `.env`

### Frontend can't connect to backend
- Make sure Flask is running: `curl http://localhost:5000/health`
- Check browser console for CORS errors
- Ensure firewall allows localhost communication

### Image processing fails
- Verify the image is a valid JPEG
- Check that GEMINI_API_KEY is valid and has appropriate permissions
- Check Flask console for detailed error messages

## Files Modified/Created

### New Files
- `app.py` - Flask backend application
- `requirements.txt` - Python dependencies
- `front/src/LabelResults.tsx` - Results display component
- `start.bat` - Windows batch startup script
- `start.ps1` - PowerShell startup script
- `SETUP.md` - This file

### Modified Files
- `front/src/WebcamCapture.tsx` - Added `onImageCaptured` callback
- `front/src/Scan.tsx` - Added backend API integration

## Next Steps

1. Test image capture and processing
2. Customize the extraction prompt in `app.py` if needed
3. Enhance error handling and loading states
4. Consider adding image validation before sending to API
5. Add database persistence if needed

## Performance Notes

- Image processing takes 2-5 seconds depending on Gemini API response time
- The frontend shows a "Processing image..." indicator during this time
- No image is stored on disk; all processing is in-memory
