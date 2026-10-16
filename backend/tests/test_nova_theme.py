import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "services")))

from generator import generate_portfolio_zip, _nova_tech_slug


SAMPLE = {
    "name": "Aya Voss",
    "title": "AI / ML Engineer",
    "summary": "I build intelligent systems that combine machine learning, software engineering, experimentation, and practical problem solving.",
    "contact": {"email": "aya@example.com", "github": "https://github.com/ayavoss", "linkedin": "https://linkedin.com/in/ayavoss"},
    "skills": ["Python", "PyTorch", "FastAPI", "React", "Docker", "Git", "SQL"],
    "experience": [
        {"role": "ML Engineer", "company": "Signal Foundry", "duration": "2024–2026", "description": "Built fine-tuning pipelines."},
        {"role": "Software Engineer", "company": "Fieldwork", "duration": "2022–2024", "description": "Shipped data products."},
    ],
    "education": [{"degree": "MSc Applied Mathematics", "institution": "ETH Zürich", "year": "2022"}],
    "projects": [
        {"name": "Otera-50M", "description": "A 50M-parameter causal language model trained from scratch.", "tech_stack": ["PyTorch", "Transformers"], "type": "Language Model", "status": "Active", "year": "2025", "link": "https://github.com/ayavoss/otera"},
        {"name": "FlickerX", "description": "Computer-vision gesture engine on-device.", "tech_stack": ["OpenCV", "Python"], "type": "CV System", "status": "Deployed", "year": "2024"},
    ],
    "certifications": [{"name": "Deep Learning Specialization", "issuer": "DeepLearning.AI", "year": "2023"}],
}


def test_nova_zip_contains_slots():
    data, html = generate_portfolio_zip(dict(SAMPLE), "ml", "nova")
    assert data.startswith(b"PK")
    assert "Aya Voss" in html
    for token in ("{section_origin}", "{section_constellation}", "{section_universe}", "{section_lab}",
                  "{section_roadmap}", "{section_build}", "{section_ecosystem}", "{section_state}",
                  "{section_vector}", "{section_connect}", "{section_guide}", "{footer_links}"):
        assert token not in html, f"unrendered/phantom token: {token}"
    for needle in ("NOVA//SPACE", "SYSTEM ONLINE", "PROJECT UNIVERSE", "ORIGIN", "THE LAB",
                   "TECH ECOSYSTEM", "OPEN CONNECTION", "arm-l", "orbit-ring-active", "nc-form",
                   "class=\"planet\"", "skillicons.dev", "Sora"):
        assert needle in html, f"missing {needle}"


def test_nova_user_content_present():
    _, html = generate_portfolio_zip(dict(SAMPLE), "ml", "nova")
    for text in ("Otera-50M", "FlickerX", "Signal Foundry", "ETH Zürich", "PyTorch",
                 "aya@example.com", "Deep Learning Specialization", "MSc Applied Mathematics"):
        assert text in html, f"missing user content: {text}"


def test_nova_empty_sections_hidden():
    data, html = generate_portfolio_zip({"name": "Only Me", "title": "N/A", "summary": "Hi.", "contact": {}}, "ml", "nova")
    assert data.startswith(b"PK")
    for sid in ("universe", "lab", "roadmap", "ecosystem", "state", "connect"):
        assert f"id=\"{sid}\"" not in html, f"empty section rendered: {sid}"


def test_nova_planet_cap():
    many = dict(SAMPLE)
    many["projects"] = [{"name": f"P{i:02d}", "description": "d", "tech_stack": [], "status": "Active", "year": "2025"} for i in range(12)]
    _, html = generate_portfolio_zip(many, "ml", "nova")
    assert html.count("class=\"planet\"") <= 7, "universe must cap planet count"


def test_nova_tech_slug_map():
    assert _nova_tech_slug("Python") == "python"
    assert _nova_tech_slug("TypeScript") == "typescript"
    assert _nova_tech_slug("C++") == "cpp"
    assert _nova_tech_slug("Next.js") == "nextjs"
    assert _nova_tech_slug("Kubernetes") == "kubernetes"
    assert _nova_tech_slug("Figment") is None


if __name__ == "__main__":
    for fn in (test_nova_zip_contains_slots, test_nova_user_content_present,
               test_nova_empty_sections_hidden, test_nova_planet_cap, test_nova_tech_slug_map):
        fn()
    print("all nova-theme checks passed")