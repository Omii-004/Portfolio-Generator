import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "services")))

from generator import generate_portfolio_zip


SAMPLE = {
    "name": "Iris Petal",
    "title": "Art Director",
    "summary": "A creative director shaping calm, confident digital experiences across fashion, beauty, and culture.",
    "email": "iris@example.com",
    "github": "https://github.com/iris",
    "linkedin": "https://linkedin.com/in/iris",
    "skills": ["Figma", "Photoshop", "Illustrator", "Git", "HTML", "CSS"],
    "experience": [
        {"role": "Senior Art Director", "company": "Studio Bloom", "duration": "2023–2026", "description": "Led brand systems."},
        {"role": "Designer", "company": "Maison Claire", "duration": "2020–2023", "description": "Editorial design."},
    ],
    "education": [
        {"degree": "BDes Visual Communication", "institution": "Central Saint Martins", "year": "2019"},
    ],
    "projects": [
        {"name": "Aurelia", "description": "Brand identity for a slow-luxury skincare house.", "tech_stack": ["Figma", "After Effects"], "type": "Brand Identity", "status": "Launched", "year": "2025", "link": "https://example.com/aurelia"},
        {"name": "Bloom Journal", "description": "Editorial site for an independent print magazine.", "tech_stack": ["React", "TypeScript"], "type": "Web Design", "status": "Shipping", "year": "2026"},
    ],
    "certifications": [{"name": "Creative Leadership", "issuer": "Coursera", "year": "2024"}],
    "languages": ["English", "French"],
}


def test_lotus_zip_contains_slots():
    data, html = generate_portfolio_zip(dict(SAMPLE), "web development", "lotus")
    assert data.startswith(b"PK")
    assert dict(SAMPLE)["name"] in html
    for token in ("#blooms", "#expertise", "#journey", "#philosophy", "{section_about}", "{lotus_contact_rows}"):
        assert token not in html, f"unrendered/phantom token: {token}"
    assert "#about" in html
    # editorial words + lotus-specific architecture
    for needle in ("LOTUS", "Root", "Rise", "Bloom", "Playfair", "DM+Sans", "petal-spin"):
        assert needle in html, f"missing {needle}"


def test_lotus_user_content_present():
    _, html = generate_portfolio_zip(dict(SAMPLE), "design", "lotus")
    assert "Iris Petal" in html
    assert "Aurelia" in html
    assert "Aurelia" in html  # project letter panel + title
    assert "Studio Bloom" in html
    assert "Central Saint Martins" in html
    assert "Figma" in html
    # skills appear inline (not as chips)
    assert "Figma" in html and "Photoshop" in html
    assert "Art Director" in html


def test_lotus_empty_sections_hidden():
    data, html = generate_portfolio_zip({"name": "Only Me", "title": "Designer", "summary": "Hi."}, "design", "lotus")
    assert data.startswith(b"PK")
    for absent in ("#journey", "{section_projects}"):
        assert absent not in html, f"lotus should hide {absent}"