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
        prompt = """
        You are an OCR extraction system for clothing labels.

You will be given an image of a clothing label.

If the image does not contain a recognizable clothing label, respond with exactly:

{"brand":null,"size":null,"material":null,"care_instructions":null,"country_of_origin":null}

Otherwise, extract ONLY these fields:

- brand
- size
- material
- care_instructions
- country_of_origin

Rules:

- Respond with valid JSON only.
- Do not use markdown.
- Do not use code fences.
- Do not add explanations or extra text.
- Do not use arrays, objects, or nested structures.
- Every value must be either a string or null.
- Preserve material qualifiers such as "organic", "recycled", "recycled polyester", "organic cotton", "linen", "hemp", etc.
- Preserve percentages when present.
- For material, return a single string formatted as:
  "percentage% material, percentage% material, ..."
- Use commas to separate materials.
- If percentages are not visible, return the material names separated by commas.
- Return country names exactly as written on the label.
- Return care instructions as a single readable string.
- Use null for any missing field.

Example 1:

Input label:
PATAGONIA
Made in Vietnam
80% Organic Cotton
20% Recycled Polyester
Machine wash cold

Output:
{"brand":"Patagonia","size":null,"material":"80% organic cotton, 20% recycled polyester","care_instructions":"machine wash cold","country_of_origin":"Vietnam"}

Example 2:

Input label:
ZARA
M
100% Cotton
Made in Turkey

Output:
{"brand":"Zara","size":"M","material":"100% cotton","care_instructions":null,"country_of_origin":"Turkey"}

Example 3:

Input label:
45% Recycled Cotton
35% Cotton
20% Polyester

Output:
{"brand":null,"size":null,"material":"45% recycled cotton, 35% cotton, 20% polyester","care_instructions":null,"country_of_origin":null}

Return JSON only.

Here is the image:
"""
        
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
            model='gemini-3.1-flash-lite',
            contents=[
                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type='image/jpeg',
                ),
                prompt
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
