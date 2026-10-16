import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "services")))

from generator import generate_portfolio_zip, _sakura_sections, _build_sections


SAMPLE = {
    "name": "Hana Mori",
    "title": "Creative Technologist",
    "summary": "A creative technologist weaving design and code into calm, considered digital experiences.",
    "contact": {"email": "hana@example.com", "github": "https://github.com/hana", "linkedin": "https://linkedin.com/in/hana"},
    "skills": ["React", "TypeScript", "Figma", "Python", "Git", "HTML", "CSS"],
    "experience": [
        {"role": "Senior Creative Technologist", "company": "Studio Flow", "duration": "2023–2026", "description": "Built interactive brand systems."},
        {"role": "Frontend Developer", "company": "Mori Lab", "duration": "2020–2023", "description": "Shipped editorial products."},
    ],
    "education": [
        {"degree": "BSc Computer Science", "institution": "Tokyo University", "year": "2020"},
    ],
    "projects": [
        {"name": "Sakura Thread", "description": "Interactive installation celebrating impermanence.", "tech_stack": ["React", "Three.js"], "type": "Web Platform", "status": "Launched", "year": "2025", "link": "https://example.com/sakura"},
        {"name": "Mori Notes", "description": "A calm writing tool for focused thinkers.", "tech_stack": ["TypeScript", "Node"], "type": "Product", "status": "Building", "year": "2026"},
    ],
    "certifications": [{"name": "Creative Leadership", "issuer": "Coursera", "year": "2024"}],
    "languages": [{"language": "Japanese", "proficiency": "Native"}, {"language": "English", "proficiency": "Fluent"}],
}


def test_sakura_zip_contains_slots():
    data, html = generate_portfolio_zip(dict(SAMPLE), "web development", "sakura")
    assert data.startswith(b"PK")
    assert "Hana Mori" in html
    for token in ("{section_about}", "{section_projects}", "{section_skills}", "{section_journey}", "{section_contact}", "{sakura_contact_rows}"):
        assert token not in html, f"unrendered/phantom token: {token}"
    assert "#work" in html
    assert "#expertise" in html
    assert "#journey" in html
    assert "#contact" in html
    assert "#about" in html
    # editorial words + sakura-specific architecture
    for needle in ("SAKURA", "Cormorant", "branch", "petal", "blossom", "Foundation", "Exploration", "Building", "Bloom"):
        assert needle in html, f"missing {needle}"


def test_sakura_user_content_present():
    _, html = generate_portfolio_zip(dict(SAMPLE), "design", "sakura")
    assert "Hana Mori" in html
    assert "Sakura Thread" in html
    assert "Mori Notes" in html
    assert "Studio Flow" in html
    assert "Tokyo University" in html
    assert "React" in html
    assert "Creative Technologist" in html
    assert "hana@example.com" in html


def test_sakura_empty_sections_hidden():
    data, html = generate_portfolio_zip({"name": "Only Me", "title": "Designer", "summary": "Hi.", "contact": {}}, "design", "sakura")
    assert data.startswith(b"PK")
    for absent in ("#journey", "Foundation", "Bloom", "{section_projects}"):
        assert absent not in html, f"sakura should hide {absent}"
    assert "#work" not in html
    assert "#contact" not in html


def test_sakura_languages_render():
    _, html = generate_portfolio_zip(dict(SAMPLE), "design", "sakura")
    assert "Japanese" in html
    assert "Fluent" in html