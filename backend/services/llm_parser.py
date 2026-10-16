import json
import os
from dotenv import load_dotenv
from google import genai

# 1. Load variables from the .env file
load_dotenv()


def parse_resume_text(raw_text: str):
    # built here, not at import: a missing key then fails the one request that
    # needs it instead of taking the whole API down at startup
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    prompt = f"""
    You are an expert resume analyzer. I am providing you with the raw text extracted from a resume PDF.
    Please extract the information and return ONLY a valid JSON object matching the following structure. Do not include markdown blocks like ```json.

    {{
        "name": "Full Name",
        "title": "Professional Title (e.g. Software Engineer)",
        "contact": {{ "email": "", "phone": "", "linkedin": "", "github": "" }},
        "summary": "A 2-3 sentence professional summary based on the resume.",
        "skills": ["Skill 1", "Skill 2"],
        "experience": [
            {{ "role": "", "company": "", "duration": "", "description": "Short description of duties" }}
        ],
        "education": [
            {{ "degree": "", "institution": "", "year": "", "description": "Short detail: relevant coursework, GPA, honours, or achievements if listed" }}
        ],
"projects": [
            {{ "name": "", "description": "Short description", "tech_stack": ["Tech"],
              "link": "", "type": "e.g. Web Platform / ML Pipeline / Research",
              "status": "e.g. Deployed / In Development / Research / Archived", "year": "" }}
        ],
        "certifications": [
            {{ "name": "", "issuer": "", "year": "" }}
        ],
        "languages": [
            {{ "language": "", "proficiency": "e.g. Native/Fluent" }}
        ]
    }}

    Include projects, certifications, and languages from the resume if present.
    Notable awards and achievements also belong under certifications. If a section
    is absent from the resume, return its array as empty [].
    For education, include a short description when the resume mentions coursework, GPA, or achievements.
    For each project, add a type (category like Web Platform, ML Pipeline), a
    status (Deployed, In Development, Research, Archived), and a year when
    inferable. Omit fields the resume does not support (use empty strings).
    Raw Resume Text:
    {raw_text}
    """

    # Send the prompt using the new client syntax
    models_to_try = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite']
    response = None

    for model_name in models_to_try:
        try:
            print(f"Attempting to use {model_name}...")
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            print(f"Success with {model_name}!")
            break  # It worked! Break out of the loop and stop trying.

        except Exception as e:
            print(f"Failed with {model_name}. Moving to backup... Error: {e}")
            continue  # Skip to the next model in the list

    # If we tried all of them and response is still None, throw a clean error
    if not response:
        raise Exception("All AI models are currently overwhelmed. Please try again in a few minutes.")

    # Clean up the response to ensure it's pure JSON string
    json_string = response.text.replace('```json', '').replace('```', '').strip()

    # Convert string to a Python dictionary
    data = json.loads(json_string)

    # Guard against null/missing sections – absent data means the section
    # simply wont render instead of crashing the generator.
    for key in ("contact", "skills", "experience", "education", "projects", "certifications", "languages"):
        if not isinstance(data.get(key), list if key != "contact" else dict):
            data[key] = [] if key != "contact" else {}
    return data