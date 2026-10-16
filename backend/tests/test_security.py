import io
import os
import sys
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# must be set before anything imports database/engine
_db = os.path.join(tempfile.mkdtemp(), "test.db")
os.environ["DATABASE_URL"] = f"sqlite:///{_db}"
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("GEMINI_API_KEY", "test-key")

import warnings  # noqa: E402

warnings.filterwarnings("ignore")

from fastapi.testclient import TestClient  # noqa: E402
from main import app  # noqa: E402

client = TestClient(app, raise_server_exceptions=False)


def register_and_login(email):
    client.post("/api/auth/register",
                json={"full_name": "U", "email": email, "password": "Passw0rd!"})
    token = client.post("/api/auth/login",
                        json={"email": email, "password": "Passw0rd!"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def make_portfolio(headers, link="https://example.com"):
    res = client.post("/api/portfolio/generate", headers=headers, json={
        "resume_data": {"name": "Omkar", "projects": [{"name": "p", "link": link}]},
        "selected_stack": "HTML", "selected_theme": "professional",
    })
    return res.json()["portfolio_id"]


def test_register_returns_token_so_signup_can_log_in():
    res = client.post("/api/auth/register",
                      json={"full_name": "New", "email": "new@x.com", "password": "Passw0rd!"})
    assert res.status_code == 200
    assert res.json()["access_token"]


def test_portfolio_is_not_readable_by_anyone():
    owner = register_and_login("owner@x.com")
    pid = make_portfolio(owner)

    assert client.get(f"/api/portfolio/preview/{pid}").status_code == 401
    assert client.get(f"/api/portfolio/download/{pid}").status_code == 401

    stranger = register_and_login("stranger@x.com")
    assert client.get(f"/api/portfolio/preview/{pid}", headers=stranger).status_code == 403
    assert client.get(f"/api/portfolio/download/{pid}", headers=stranger).status_code == 403

    assert client.get(f"/api/portfolio/preview/{pid}", headers=owner).status_code == 200
    assert client.get(f"/api/portfolio/download/{pid}", headers=owner).status_code == 200


def test_javascript_url_is_not_emitted_into_generated_html():
    owner = register_and_login("xss@x.com")
    pid = make_portfolio(owner, link="javascript:alert(document.cookie)")
    html = client.get(f"/api/portfolio/preview/{pid}", headers=owner).text
    assert "javascript:alert" not in html


def test_partial_profile_update_keeps_other_fields():
    headers = register_and_login("partial@x.com")
    client.put("/api/users/me", headers=headers,
               json={"full_name": "Real Name", "username": "realname", "bio": "old"})
    client.put("/api/users/me", headers=headers, json={"bio": "new"})

    me = client.get("/api/users/me", headers=headers).json()
    assert me["full_name"] == "Real Name"
    assert me["username"] == "realname"
    assert me["bio"] == "new"


def test_duplicate_username_is_a_409_not_a_500():
    first = register_and_login("first@x.com")
    second = register_and_login("second@x.com")
    client.put("/api/users/me", headers=first, json={"username": "samename"})
    res = client.put("/api/users/me", headers=second, json={"username": "samename"})
    assert res.status_code == 409


def test_password_bounds_are_enforced():
    short = client.post("/api/auth/register",
                        json={"full_name": "S", "email": "s@x.com", "password": "Ab1"})
    assert short.status_code == 422

    long = client.post("/api/auth/register",
                       json={"full_name": "L", "email": "l@x.com", "password": "A1" + "a" * 80})
    assert long.status_code == 422


def test_unreadable_pdf_reports_400_not_500():
    from PyPDF2 import PdfWriter

    headers = register_and_login("pdf@x.com")
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    buf = io.BytesIO()
    writer.write(buf)

    res = client.post("/api/resume/upload", headers=headers,
                      files={"file": ("blank.pdf", buf.getvalue(), "application/pdf")})
    assert res.status_code == 400


def test_resume_upload_requires_auth():
    from PyPDF2 import PdfWriter

    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    buf = io.BytesIO()
    writer.write(buf)

    res = client.post("/api/resume/upload",
                      files={"file": ("blank.pdf", buf.getvalue(), "application/pdf")})
    assert res.status_code == 401