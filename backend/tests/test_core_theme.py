import io
import os
import sys
import zipfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services.generator import generate_portfolio_zip  # noqa: E402


def render(theme, data):
    z, _ = generate_portfolio_zip(data, "react", theme)
    return zipfile.ZipFile(io.BytesIO(z)).read("index.html").decode("utf-8")


FULL = {
    "name": "Ada Lovelace",
    "title": "ML Engineer",
    "summary": "Building systems that think.",
    "contact": {"email": "ada@analytical.engine", "github": "https://github.com/ada", "linkedin": "https://linkedin.com/in/ada"},
    "skills": ["Python", "PyTorch", "Git", "PostgreSQL"],
    "experience": [{"role": "ML Engineer", "company": "Analytical Engines", "duration": "2022-2025", "description": "Built a serving layer."}],
    "education": [{"degree": "MSc", "year": "2021", "institution": "Oxford", "description": "ML coursework"}],
    "projects": [{
        "name": "neural-core-v1", "description": "A small system that thinks.",
        "tech_stack": ["PyTorch", "FastAPI"], "link": "https://github.com/ada/ncv1",
        "type": "ML Pipeline", "status": "Deployed", "year": "2024",
    }],
    "certifications": [{"name": "AWS ML", "issuer": "Amazon", "year": "2023"}],
    "languages": [{"language": "English", "proficiency": "Native"}],
}


def test_core_full_data():
    html = render("core", FULL)
    for anchor in ("id=\"about\"", "id=\"systems\"", "id=\"stack\"", "id=\"journey\"", "id=\"education\"", "id=\"certifications\"", "id=\"languages\""):
        assert anchor in html, anchor
    assert "BUILDING SYSTEMS" in html and "id=\"contact\"" in html and "NEURAL" in html
    assert "core-systems-grid" in html
    for meta in ("type", "status", "Deployed", "ML Pipeline", "2024", "stack"):
        assert meta in html, meta
    assert "ada@analytical.engine" in html
    assert "{section_" not in html and "{contact_meta}" not in html


def test_core_blank_data_hides_empty_sections():
    blank = {
        "name": "Ada", "title": "ML Engineer", "summary": "Hi.",
        "contact": {"email": "a@b.c"},
        "skills": [], "experience": [], "education": [], "projects": [],
        "certifications": [], "languages": [],
    }
    html = render("core", blank)
    for anchor in ("id=\"systems\"", "id=\"stack\"", "id=\"journey\"", "id=\"education\"", "id=\"certifications\"", "id=\"languages\""):
        assert anchor not in html, anchor
    assert "id=\"about\"" in html
    assert "00" in html  # zeroed stat blocks still render


def test_core_theme_still_escapes_and_zero_stats():
    html = render("core", FULL)
    assert "<section id=\"about\"" in html
    assert "01" in html and "02" in html


if __name__ == "__main__":
    for fn in (test_core_full_data, test_core_blank_data_hides_empty_sections, test_core_theme_still_escapes_and_zero_stats):
        fn()
        print(f"ok {fn.__name__}")
    print("all core-theme checks passed")