import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "services")))

from generator import generate_portfolio_zip, _latent_sections


SAMPLE = {
    "name": "Aya Voss",
    "title": "AI / ML Engineer",
    "summary": "I build intelligent systems that combine machine learning, software engineering, experimentation, and practical problem solving.",
    "contact": {"email": "aya@example.com", "github": "https://github.com/ayavoss", "linkedin": "https://linkedin.com/in/ayavoss"},
    "skills": ["Python", "PyTorch", "Transformers", "FastAPI", "React", "Docker", "Git", "SQL", "Scikit-learn", "NumPy"],
    "experience": [
        {"role": "ML Engineer", "company": "Signal Foundry", "duration": "2024–2026", "description": "Built fine-tuning pipelines for language models."},
        {"role": "Software Engineer", "company": "Fieldwork", "duration": "2022–2024", "description": "Shipped data products used in production."},
    ],
    "education": [
        {"degree": "MSc Applied Mathematics", "institution": "ETH Zürich", "year": "2022"},
    ],
    "projects": [
        {"name": "Otera-50M", "description": "A 50M-parameter causal language model trained from scratch.", "tech_stack": ["PyTorch", "Transformers"], "type": "Language Model", "status": "Active", "year": "2025", "link": "https://github.com/ayavoss/otera"},
        {"name": "FlickerX", "description": "Computer-vision gesture engine running on-device.", "tech_stack": ["MediaPipe", "OpenCV", "Python"], "type": "CV System", "status": "Deployed", "year": "2024"},
    ],
    "certifications": [{"name": "Deep Learning Specialization", "issuer": "DeepLearning.AI", "year": "2023"}],
    "languages": [{"language": "German", "proficiency": "Native"}, {"language": "English", "proficiency": "Fluent"}],
}


def test_latent_zip_contains_slots():
    data, html = generate_portfolio_zip(dict(SAMPLE), "machine learning", "latent")
    assert data.startswith(b"PK")
    assert "Aya Voss" in html
    for token in ("{section_identity}", "{section_projects}", "{section_features}", "{section_log}", "{section_trajectory}", "{section_query}", "{footer_links}"):
        assert token not in html, f"unrendered/phantom token: {token}"
    # latent-specific architecture
    for needle in ("LATENT//SPACE", "EMBEDDING_FIELD", "IDENTITY_VECTOR", "PROJECT_EMBEDDINGS",
                   "FEATURE_SPACE", "RESEARCH_LOG", "LATENT_TRAJECTORY", "QUERY_SPACE",
                   "SYSTEM ONLINE", "pn class=\"pnode\"", "ls-field", "corner-btn", "Space+Grotesk"):
        assert needle in html, f"missing {needle}"


def test_latent_user_content_present():
    _, html = generate_portfolio_zip(dict(SAMPLE), "ml", "latent")
    assert "Aya Voss" in html
    assert "Otera-50M" in html
    assert "FlickerX" in html
    assert "Signal Foundry" in html
    assert "ETH Zürich" in html
    assert "PyTorch" in html
    assert "aya@example.com" in html
    assert "Deep Learning Specialization" in html


def test_latent_empty_sections_hidden():
    data, html = generate_portfolio_zip({"name": "Only Me", "title": "N/A", "summary": "Hi.", "contact": {}}, "ml", "latent")
    assert data.startswith(b"PK")
    assert "{section_projects}" not in html
    assert 'id="work"' not in html
    assert 'id="identity"' not in html
    assert 'id="trajectory"' not in html
    assert "PROJECT_EMBEDDINGS" not in html
    assert "RESEARCH_LOG" not in html


def test_latent_constellation_nodelimit():
    many = dict(SAMPLE)
    many["projects"] = [{"name": f"P{i:02d}", "description": "d", "tech_stack": [], "status": "Active", "year": "2025"} for i in range(12)]
    _, html = generate_portfolio_zip(many, "ml", "latent")
    assert html.count("class=\"pnode\"") <= 7, "constellation must cap node count"


def test_latent_status_cls():
    assert _latent_log_status("Completed") == ("#22D3EE", "COMPLETED")
    assert _latent_log_status("In Progress") == ("#8B5CF6", "IN PROGRESS")
    assert _latent_log_status("Exploring") == ("#4F8CFF", "EXPLORING")
    assert _latent_log_status("") == ("#5F6675", "LOGGED")