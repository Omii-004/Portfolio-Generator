import os
import re
import json
import io
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from openai import OpenAI

load_dotenv()


# ---------------------------------------------------------------------------
# 1. Pydantic Schema Definitions
# ---------------------------------------------------------------------------
class ContactInfo(BaseModel):
    email: str = Field(default="", description="Email address")
    phone: str = Field(default="", description="Phone number")
    linkedin: str = Field(default="", description="Full LinkedIn profile URL")
    github: str = Field(default="", description="Full GitHub profile URL")
    website: str = Field(default="", description="Personal website or portfolio URL")


class ExperienceItem(BaseModel):
    role: str = Field(default="", description="Official job title")
    company: str = Field(default="", description="Company or organization name")
    duration: str = Field(default="", description="Employment duration, e.g. 'Jun 2024 - Present'")
    description: str = Field(default="", description="Key duties and achievements")


class EducationItem(BaseModel):
    degree: str = Field(default="", description="Degree and major, e.g. B.Tech in Artificial Intelligence")
    institution: str = Field(default="", description="University or college name")
    year: str = Field(default="", description="Graduation year or date range, e.g. '2020 - 2024'")
    description: str = Field(default="", description="Relevant coursework, GPA, or honors")


class ProjectItem(BaseModel):
    name: str = Field(default="", description="Project or system title")
    description: str = Field(default="", description="Description of project and impact")
    tech_stack: list[str] = Field(default_factory=list, description="Technologies used")
    link: str = Field(default="", description="Project URL or GitHub repository")
    type: str = Field(default="Web Platform", description="Category: Web Platform, ML Pipeline, Mobile App, etc.")
    status: str = Field(default="Completed", description="Deployed, In Development, or Completed")
    year: str = Field(default="", description="Year built")


class CertificationItem(BaseModel):
    name: str = Field(default="", description="Certification name or award")
    issuer: str = Field(default="", description="Issuing organization")
    year: str = Field(default="", description="Year earned")


class LanguageItem(BaseModel):
    language: str = Field(default="", description="Language name")
    proficiency: str = Field(default="Fluent", description="Proficiency: Native, Fluent, Professional, Intermediate")


class ResumeData(BaseModel):
    name: str = Field(default="", description="Candidate full name")
    title: str = Field(default="", description="Professional title")
    contact: ContactInfo = Field(default_factory=ContactInfo)
    summary: str = Field(default="", description="2-3 sentence executive summary")
    skills: list[str] = Field(default_factory=list, description="Technical skill keywords")
    experience: list[ExperienceItem] = Field(default_factory=list)
    education: list[EducationItem] = Field(default_factory=list)
    projects: list[ProjectItem] = Field(default_factory=list)
    certifications: list[CertificationItem] = Field(default_factory=list)
    languages: list[LanguageItem] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# 2. Defensive Coercion: Converts plain strings into valid dictionaries
# ---------------------------------------------------------------------------
def _coerce_experience(items: list) -> list:
    out = []
    for it in items:
        if isinstance(it, dict):
            out.append(it)
        elif isinstance(it, str):
            parts = [p.strip() for p in it.split("|") if p.strip()]
            role = parts[0] if len(parts) > 0 else it
            company = parts[1] if len(parts) > 1 else ""
            duration = parts[2] if len(parts) > 2 else ""
            desc = parts[3] if len(parts) > 3 else ""
            out.append({"role": role, "company": company, "duration": duration, "description": desc})
    return out


def _coerce_education(items: list) -> list:
    out = []
    for it in items:
        if isinstance(it, dict):
            out.append(it)
        elif isinstance(it, str):
            parts = [p.strip() for p in it.split("|") if p.strip()]
            degree = parts[0] if len(parts) > 0 else it
            institution = parts[1] if len(parts) > 1 else ""
            year = parts[2] if len(parts) > 2 else ""
            desc = parts[3] if len(parts) > 3 else ""
            out.append({"degree": degree, "institution": institution, "year": year, "description": desc})
    return out


def _coerce_projects(items: list) -> list:
    out = []
    for it in items:
        if isinstance(it, dict):
            out.append(it)
        elif isinstance(it, str):
            parts = [p.strip() for p in re.split(r"[-—|]", it) if p.strip()]
            name = parts[0] if len(parts) > 0 else it
            tech = [t.strip() for t in parts[1].split(",") if t.strip()] if len(parts) > 1 else []
            desc = parts[2] if len(parts) > 2 else (parts[1] if len(parts) > 1 else "")
            out.append({"name": name, "description": desc, "tech_stack": tech, "link": "", "type": "Web Platform", "status": "Completed", "year": ""})
    return out


def _coerce_certifications(items: list) -> list:
    out = []
    for it in items:
        if isinstance(it, dict):
            out.append(it)
        elif isinstance(it, str):
            parts = [p.strip() for p in re.split(r"[-—|]", it) if p.strip()]
            name = parts[0] if len(parts) > 0 else it
            issuer = parts[1] if len(parts) > 1 else ""
            year = parts[2] if len(parts) > 2 else ""
            out.append({"name": name, "issuer": issuer, "year": year})
    return out


def _coerce_languages(items: list) -> list:
    out = []
    for it in items:
        if isinstance(it, dict):
            out.append(it)
        elif isinstance(it, str):
            match = re.match(r"^([^(]+)(?:\(([^)]+)\))?$", it.strip())
            if match:
                lang = match.group(1).strip()
                prof = match.group(2).strip() if match.group(2) else "Fluent"
            else:
                lang = it.strip()
                prof = "Fluent"
            out.append({"language": lang, "proficiency": prof})
    return out


def _normalize_url(url: str) -> str:
    if not url:
        return ""
    cleaned = url.strip().rstrip(".,;)")
    if not cleaned:
        return ""
    if not cleaned.lower().startswith(("http://", "https://", "mailto:")):
        return f"https://{cleaned}"
    return cleaned


def _clean_resume_data(data: dict) -> dict:
    """Pre-processes and coerces raw data so Pydantic validation never fails."""
    # Ensure all top-level keys exist
    for key in ("experience", "education", "projects", "certifications", "languages", "skills"):
        if not isinstance(data.get(key), list):
            data[key] = []

    if not isinstance(data.get("contact"), dict):
        data["contact"] = {}

    # Coerce any string items into structured dicts
    data["experience"] = _coerce_experience(data["experience"])
    data["education"] = _coerce_education(data["education"])
    data["projects"] = _coerce_projects(data["projects"])
    data["certifications"] = _coerce_certifications(data["certifications"])
    data["languages"] = _coerce_languages(data["languages"])

    # Clean URLs
    contact = data["contact"]
    for key in ("linkedin", "github", "website"):
        if contact.get(key):
            contact[key] = _normalize_url(contact[key])

    for proj in data.get("projects", []):
        if proj.get("link"):
            proj["link"] = _normalize_url(proj["link"])

    # Deduplicate skills
    seen = set()
    cleaned_skills = []
    for skill in data.get("skills", []):
        s = str(skill).strip()
        if s and s.lower() not in seen:
            seen.add(s.lower())
            cleaned_skills.append(s)
    data["skills"] = cleaned_skills

    return data


# ---------------------------------------------------------------------------
# 3. Main Resume Parsing Function
# ---------------------------------------------------------------------------
def parse_resume(pdf_bytes: bytes | None = None, raw_text: str = "") -> dict:
    """
    Parses resume text using NVIDIA NIM and returns a guaranteed Pydantic dictionary.
    """
    api_key = os.getenv("NVIDIA_API_KEY")
    if not api_key:
        raise RuntimeError("NVIDIA_API_KEY missing. Add it to backend/.env")

    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=api_key,
    )

    if not raw_text.strip() and pdf_bytes:
        try:
            import PyPDF2
            reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
            raw_text = "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as e:
            print(f"PDF extraction error: {e}")

    if not raw_text.strip():
        raise ValueError("No readable text found in resume.")

    system_prompt = """
You are an expert AI resume extraction system.
Extract all resume data into a single valid JSON object. Every item in experience, education, projects, certifications, and languages MUST be an object with keys, NOT a plain string.

STRICT JSON OUTPUT FORMAT EXAMPLE:
{
  "name": "Alex Mercer",
  "title": "Machine Learning Engineer",
  "contact": {
    "email": "alex@example.com",
    "phone": "+1 234 567 8900",
    "linkedin": "https://linkedin.com/in/alex",
    "github": "https://github.com/alex",
    "website": ""
  },
  "summary": "Experienced engineer with a focus on deep learning systems...",
  "skills": ["Python", "PyTorch", "FastAPI", "Docker"],
  "experience": [
    {
      "role": "Machine Learning Engineer",
      "company": "Acme AI Corp",
      "duration": "Jun 2024 – Present",
      "description": "Built scalable ML inference pipelines with 99.9% uptime."
    }
  ],
  "education": [
    {
      "degree": "B.Tech in Artificial Intelligence",
      "institution": "Stanford University",
      "year": "2020 – 2024",
      "description": "CGPA: 8.7/10. Specialized in computer vision."
    }
  ],
  "projects": [
    {
      "name": "RoadGuard AI",
      "description": "Computer vision system for detecting road hazards.",
      "tech_stack": ["Python", "PyTorch", "OpenCV"],
      "link": "https://github.com/alex/roadguard",
      "type": "ML Pipeline",
      "status": "Deployed",
      "year": "2024"
    }
  ],
  "certifications": [
    {
      "name": "Machine Learning Specialization",
      "issuer": "DeepLearning.AI / Coursera",
      "year": "2023"
    }
  ],
  "languages": [
    {
      "language": "English",
      "proficiency": "Fluent"
    }
  ]
}

RULES:
1. "experience" must contain objects with keys: role, company, duration, description.
2. "education" must contain objects with keys: degree, institution, year, description.
3. "projects" must contain objects with keys: name, description, tech_stack, link, type, status, year.
4. "certifications" must contain objects with keys: name, issuer, year.
5. "languages" must contain objects with keys: language, proficiency.
6. Do NOT return flat strings for any of the above lists. Always return objects.
7. Return ONLY valid JSON with no markdown wrapping.
"""

    models_to_try = [
        "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
        "openai/gpt-oss-20b",
        "meta/llama-3.2-11b-vision-instruct",
    ]

    response_text = None
    last_error = None

    for model_name in models_to_try:
        try:
            print(f"Attempting resume extraction with NVIDIA NIM ({model_name})...")
            completion = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Resume Text to Parse:\n\n{raw_text}"}
                ],
                temperature=0.1,
                max_tokens=4096,
            )
            response_text = completion.choices[0].message.content
            if response_text:
                print(f"Extraction succeeded using {model_name}!")
                break
        except Exception as e:
            print(f"Model {model_name} failed: {e}")
            last_error = e
            continue

    if not response_text:
        raise Exception(f"AI resume parsing failed with NVIDIA NIM: {last_error or 'All models unavailable'}")

    # Extract JSON string safely
    try:
        parsed_json = json.loads(response_text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", response_text, re.DOTALL)
        if match:
            parsed_json = json.loads(match.group(0))
        else:
            raise Exception("NVIDIA model response could not be parsed as JSON.")

    # 1. Clean and coerce strings into dicts
    cleaned_json = _clean_resume_data(parsed_json)

    # 2. Validate against Pydantic schema (now 100% crash-proof)
    validated_data = ResumeData.model_validate(cleaned_json).model_dump()
    return validated_data


def parse_resume_text(raw_text: str) -> dict:
    return parse_resume(pdf_bytes=None, raw_text=raw_text)