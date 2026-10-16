import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services.generator import _skill_group  # noqa: E402


def test_groups():
    assert _skill_group("Python") == "Coding languages"
    assert _skill_group("TypeScript") == "Coding languages"
    assert _skill_group("Git") == "Version control"
    assert _skill_group("GitHub") == "Version control"
    assert _skill_group("VS Code") == "IDEs & editors"
    assert _skill_group("PyCharm") == "IDEs & editors"
    assert _skill_group("PostgreSQL") == "Databases"
    assert _skill_group("Docker") == "Cloud & DevOps"
    assert _skill_group("React") == "Frameworks"


def test_no_false_positive_on_c_short_token():
    assert _skill_group("Cisco Networking") == "Other"
    assert _skill_group("C++") == "Coding languages"
    assert _skill_group("Go") == "Coding languages"
    assert _skill_group("Golang") != "Coding languages"


def test_unknown_lands_in_other():
    assert _skill_group("Spreadsheets") == "Other"


if __name__ == "__main__":
    for fn in (test_groups, test_no_false_positive_on_c_short_token, test_unknown_lands_in_other):
        fn()
        print(f"ok {fn.__name__}")
    print("all skill-group checks passed")