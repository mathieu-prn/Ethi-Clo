from google import genai 
from google.genai import types
from dotenv import load_dotenv
import os 

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

def main(): 
    with open("./front/public/scan/image.jpg", 'rb') as f: 
        image_bytes = f.read() 
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content( 
            model='gemini-3-flash-preview', 
            contents=[ 
                types.Part.from_bytes( 
                    data=image_bytes, 
                    mime_type='image/jpeg', 
            ), 
            "You'll be given an image. This image should represent a clothing label. If you do not recognize a clothing label, please respond with 'I don't know'. Otherwise, please extract the following information if available: brand, size, material, care instructions, and country of origin. Please respond in JSON format with the following keys: 'brand', 'size', 'material', 'care_instructions', and 'country_of_origin'. If any of the information is not available, please set the corresponding value to null. You should not include the json markup in your response, only the JSON object itself. Here is the image:" 
            ] 
        ) 
        print(response.text) 
    with open('./data/label_info.json', 'w+') as f: 
        f.write(response.text) 
            
main()