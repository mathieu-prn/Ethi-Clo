from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from google.genai import types
from dotenv import load_dotenv
import os
import base64
import json

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

app = Flask(__name__)
CORS(app)

@app.route('/api/scan', methods=['POST'])
def scan_label():
    """Receive a base64-encoded image and process it through Gemini API"""
    print("Received scan request")
    try:
        data = request.json
        image_data_url = data.get('imageDataUrl')
        
        if not image_data_url:
            return jsonify({'error': 'No image provided'}), 400
        
        # Extract base64 data from data URL
        if ',' in image_data_url:
            image_data = image_data_url.split(',')[1]
        else:
            image_data = image_data_url
        
        # Decode base64 to bytes
        image_bytes = base64.b64decode(image_data)
        
        # Call Gemini API
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-3-flash-preview',
            contents=[
                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type='image/jpeg',
                ),
                "You will be given an image of a clothing label. If you do not recognize a clothing label, respond with exactly: {\"brand\": null, \"size\": null, \"material\": null, \"care_instructions\": null, \"country_of_origin\": null}. Otherwise, extract only the following fields if available: brand, size, material, care_instructions, and country_of_origin. Respond with valid JSON only. Do not add any markdown, explanation, or extra text. Use null for missing values. Your response must be parsable by `json.loads` without modification. Here is the image:" 
            ]
        )
        
        # Parse the response as JSON
        result_text = response.text.strip()
        # Attempt to parse directly, but allow extraction of the JSON object if the model adds whitespace or extra text.
        try:
            result_json = json.loads(result_text)
        except json.JSONDecodeError:
            import re
            match = re.search(r"\{.*\}", result_text, flags=re.DOTALL)
            if match:
                result_json = json.loads(match.group(0))
            else:
                raise
        
        return jsonify(result_json), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
