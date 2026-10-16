import os
import io
import re
import math
import zipfile
import html as html_mod

# ---------------------------------------------------------------------------
# Skill taxonomy: keyword -> category. First match wins, else "Other".
# Deterministic on purpose: a static mapping is more reliable than letting
# an LLM invent categories for arbitrary resume text.
# ---------------------------------------------------------------------------
_SKILL_GROUPS = (
    ("Coding languages", (
        "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "C",
        "Go", "Rust", "Swift", "Kotlin", "Ruby", "PHP", "Scala", "Perl",
        "SQL", "HTML", "CSS", "Bash", "PowerShell", "Dart", "Lua", "MATLAB",
    )),
    ("Frameworks", (
        "React", "Angular", "Vue", "Svelte", "Next.js", "Node.js", "Django",
        "Flask", "FastAPI", "Express", "Spring", "Laravel", "Rails",
        ".NET", "Tailwind", "Bootstrap", "Redux", "GraphQL", "jQuery",
        "Terraform", "Flutter",
    )),
    ("Version control", (
        "Git", "GitHub", "GitLab", "Bitbucket", "SVN", "Subversion",
        "Mercurial", "Perforce",
    )),
    ("Databases", (
        "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis", "Firebase",
        "DynamoDB", "Oracle", "Cassandra", "Elasticsearch",
    )),
    ("IDEs & editors", (
        "VS Code", "Visual Studio", "IntelliJ", "PyCharm", "WebStorm",
        "Eclipse", "Vim", "Neovim", "Sublime Text", "Xcode", "Android Studio",
        "NetBeans",
    )),
    ("Cloud & DevOps", (
        "AWS", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes",
        "CI/CD", "Jenkins", "Linux", "Nginx", "Kafka", "Ansible",
    )),
    ("Design tools", (
        "Figma", "Photoshop", "Illustrator", "Sketch", "InDesign",
        "Blender", "Framer",
    )),
)
_SKILL_GROUP_ORDER = tuple(label for label, _ in _SKILL_GROUPS) + ("Other",)

_SKILL_PATTERNS = [
    (label, tuple(re.compile(rf"\b{re.escape(kw)}\b", re.IGNORECASE) for kw in kws))
    for label, kws in _SKILL_GROUPS
]


def _skill_group(name: str) -> str:
    n = str(name).strip()
    for label, patterns in _SKILL_PATTERNS:
        if any(p.search(n) for p in patterns):
            return label
    return "Other"

# ---------------------------------------------------------------------------
# Per-theme class strings
# ---------------------------------------------------------------------------
_STYLE = {
    "professional": dict(
        heading="text-3xl font-bold text-slate-900 mb-10 pb-2 inline-block border-b-4 border-blue-600",
        icon="text-blue-600",
        exp_wrap="space-y-8 border-l-4 border-blue-200 pl-8 ml-4",
        skills_wrap="grid grid-cols-2 md:grid-cols-3 gap-4",
        skill="flex items-center gap-3 bg-white rounded-xl px-5 py-3.5 border border-gray-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-300",
        card="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6 hover:-translate-y-1 hover:shadow-xl transition-all duration-300",
        card_title="text-xl font-bold text-slate-900",
        muted="text-gray-500",
        text="text-gray-700",
        body="text-gray-600 leading-relaxed",
        subtitle="text-lg font-medium text-gray-600",
        subtle="text-gray-600",
        badge="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-full text-sm font-bold",
        dot="bg-blue-500 border-white",
        chip="bg-slate-100 text-slate-800 px-4 py-1.5 font-medium rounded-full text-sm",
        link="text-blue-600 hover:text-blue-800 font-medium hover:underline",
    ),
    "minimalist": dict(
        heading="text-3xl font-extrabold tracking-tight mb-10 pb-2 border-b-2 border-gray-200 flex items-center gap-3",
        icon="text-gray-900",
        exp_wrap="space-y-10 border-l-2 border-gray-300 pl-6 ml-3",
        skills_wrap="grid grid-cols-2 md:grid-cols-3 gap-3",
        skill="flex items-center gap-3 bg-gray-50 rounded-xl px-5 py-3.5 border border-gray-200 hover:border-gray-400 transition-all duration-300",
        card="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6 hover:border-gray-400 hover:shadow-md transition-all duration-300",
        card_title="text-xl font-bold text-gray-900",
        muted="text-gray-500",
        text="text-gray-700",
        body="text-gray-600 leading-relaxed",
        subtitle="text-lg font-medium text-gray-500",
        subtle="text-gray-500",
        badge="bg-gray-900 text-white px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide",
        dot="bg-gray-900 border-white",
        chip="bg-gray-100 text-gray-800 px-4 py-1.5 rounded-full text-sm font-medium",
        link="text-gray-900 font-bold hover:underline",
    ),
    "creative": dict(
        heading="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 mb-10",
        icon="text-pink-400",
        exp_wrap="space-y-10 border-l-2 border-pink-500/50 pl-8 ml-4",
        skills_wrap="grid grid-cols-2 md:grid-cols-3 gap-4",
        skill="flex items-center gap-3 bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-3.5 hover:border-pink-500/40 transition-all duration-300",
        card="bg-white/[0.04] backdrop-blur-sm rounded-3xl p-6 border border-white/10 mb-6 hover:border-pink-500/40 hover:bg-white/[0.08] hover:-translate-y-1 transition-all duration-300",
        card_title="text-xl font-bold text-white",
        muted="text-gray-400",
        text="text-gray-300",
        body="text-gray-300 leading-relaxed",
        subtitle="text-lg font-medium text-gray-400",
        subtle="text-gray-400",
        badge="bg-pink-500/20 text-pink-300 border border-pink-500/30 px-3 py-1 rounded-full text-sm font-bold",
        dot="bg-gradient-to-br from-purple-400 to-pink-500 border-gray-900",
        chip="bg-white/[0.06] text-gray-200 border border-white/10 px-4 py-1.5 rounded-full text-sm font-medium",
        link="text-pink-400 hover:text-pink-300 hover:underline",
    ),
    # "core" — NEURAL//CORE: dark AI research-lab aesthetic. Electric violet
    # primary, restrained cyan data accents, mono technical metadata.
    "core": dict(
        heading="text-3xl md:text-4xl font-extrabold tracking-tighter text-gray-100 mb-10 flex items-center gap-3",
        icon="text-violet-400",
        exp_wrap="border-l border-white/10 pl-8 ml-1 space-y-10",
        skills_wrap="grid grid-cols-2 md:grid-cols-3 gap-3",
        skill="flex items-center gap-2.5 bg-white/[0.02] border border-white/10 rounded-sm px-4 py-3 font-mono text-[13px] text-gray-300 hover:border-violet-500/60 hover:text-white transition-colors duration-200",
        card="bg-white/[0.02] border border-white/10 rounded-sm p-6 mb-6",
        card_title="text-xl font-bold text-gray-100",
        muted="text-gray-500 font-mono text-sm",
        text="text-gray-400",
        body="text-gray-400 leading-relaxed",
        subtitle="text-lg font-medium text-gray-400",
        subtle="text-gray-500",
        badge="font-mono text-[11px] uppercase tracking-widest text-violet-300 bg-violet-500/10 border border-violet-500/30 px-3 py-1 rounded-sm",
        dot="bg-violet-400 border-gray-950",
        chip="font-mono text-xs text-gray-300 bg-white/[0.03] border border-white/10 px-3 py-1.5 rounded-sm hover:border-cyan-400/50 transition-colors",
        link="text-violet-400 hover:text-white font-mono text-sm underline-offset-4 hover:underline",
        titles={
            "experience": "Journey",
            "skills": "Technical Stack",
            "projects": "Selected Systems",
            "certifications": "Credentials",
            "languages": "Languages",
            "education": "Education",
        },
        ids={"projects": "systems", "skills": "stack", "experience": "journey"},
    ),
    # "lotus" — LOTUS//BLOOM: luxury botanical + soft digital editorial.
    # Custom builders (_lotus_*_section) own the markup; this palette only
    # carries the shared color language.
    "lotus": dict(
        heading="font-editorial text-4xl md:text-6xl tracking-tight text-[#30252A] mb-10",
        icon="text-[#A9576B]",
        exp_wrap="",
        skills_wrap="",
        skill="",
        card="",
        card_title="font-editorial text-2xl text-[#30252A]",
        muted="text-[#8A7179]",
        text="text-[#6F5E64]",
        body="text-[#6F5E64] leading-relaxed",
        subtitle="text-[#A9576B]",
        subtle="text-[#8A7179]",
        badge="",
        dot="",
        chip="",
        link="text-[#A9576B] hover:text-[#30252A] font-medium hover:underline",
    ),
    # "sakura" — SAKURA//FLOW: Japanese editorial minimalism with cherry
    # blossom motif. Custom _sakura_*_section builders own the markup.
    "sakura": dict(
        heading="font-editorial text-4xl md:text-6xl tracking-tight text-[#282525] mb-10",
        icon="text-[#C98291]",
        exp_wrap="",
        skills_wrap="",
        skill="",
        card="",
        card_title="font-editorial text-2xl text-[#282525]",
        muted="text-[#7D6A63]",
        text="text-[#7D6A63]",
        body="text-[#7D6A63] leading-relaxed",
        subtitle="text-[#C98291]",
        subtle="text-[#7D6A63]",
        badge="",
        dot="",
        chip="",
        link="text-[#C98291] hover:text-[#282525] font-medium hover:underline",
    ),
    # "latent" — LATENT//SPACE: dark AI research-lab × embedding-field console.
    # Custom _latent_*_section builders own the markup entirely.
    "latent": dict(
        heading="f-disp text-3xl sm:text-4xl tracking-[-.01em] text-[#F4F5F7]",
        icon="text-[#8B5CF6]",
        exp_wrap="",
        skills_wrap="",
        skill="",
        card="",
        card_title="f-disp text-2xl text-[#F4F5F7]",
        muted="text-[#8C93A3]",
        text="text-[#8C93A3]",
        body="text-[#8C93A3] leading-relaxed",
        subtitle="text-[#8C93A3]",
        subtle="text-[#5F6675]",
        badge="",
        dot="",
        chip="",
        link="text-[#8B5CF6] hover:text-[#F4F5F7] font-medium",
    ),
}


def _h(val) -> str:
    return html_mod.escape(str(val))


def _url(href) -> str:
    # ponytail: allowlist beats trying to blacklist javascript:/data: etc.
    # Add a scheme only when the resume parser starts emitting one.
    href = str(href or "").strip()
    if not href.lower().startswith(("http://", "https://", "mailto:")):
        return "#"
    return html_mod.escape(href)


def _section(sec_id, title, icon, inner, pal, wrap_class="", delay=0):
    if not inner.strip():
        return ""
    body = f'<div class="{wrap_class}">{inner}</div>' if wrap_class else inner
    aos = f' data-aos-delay="{delay}"' if delay else ""
    return (
        f'<section id="{sec_id}" class="mb-16 md:mb-24" data-aos="fade-up"{aos}>\n'
        f'  <h3 class="{pal["heading"]}"><i class="{icon} mr-2 {pal["icon"]}"></i>{title}</h3>\n'
        f"  {body}\n"
        f"</section>"
    )


# ---------------------------------------------------------------------------
# Item builders (return inner HTML only, no section wrapper)
# ---------------------------------------------------------------------------

def _exp_items(items, pal):
    h = ""
    for exp in items:
        h += (
            '<div class="relative">'
            f'<div class="absolute w-4 h-4 {pal["dot"]} rounded-full -left-[33px] top-1 border-4"></div>'
            '<div class="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-2 gap-2">'
            f'<h4 class="{pal["card_title"]}">{_h(exp.get("role",""))}</h4>'
            f'<span class="{pal["badge"]}">{_h(exp.get("duration",""))}</span>'
            "</div>"
            f'<h5 class="{pal["subtitle"]} mb-3"><i class="fa-regular fa-building mr-2 opacity-60"></i>{_h(exp.get("company",""))}</h5>'
            f'<p class="{pal["body"]}">{_h(exp.get("description",""))}</p>'
            "</div>"
        )
    return h


def _skill_items(items, pal):
    groups = {}
    for s in items:
        groups.setdefault(_skill_group(s), []).append(s)

    h = ""
    first_block = True
    for label in _SKILL_GROUP_ORDER:
        group_items = groups.get(label)
        if not group_items:
            continue
        heading_cls = f'{pal["subtitle"]} mb-4' + ("" if first_block else " mt-10")
        first_block = False
        cards = "".join(
            f'<div class="{pal["skill"]}"><i class="fa-solid fa-circle-check text-sm {pal["icon"]}"></i>'
            f'<span class="font-semibold">{_h(s)}</span></div>'
            for s in group_items
        )
        h += (
            f'<h4 class="{heading_cls}">{_h(label)}</h4>'
            f'<div class="{pal["skills_wrap"]}">{cards}</div>'
        )
    return h


def _edu_items(items, pal):
    h = ""
    for edu in items:
        desc = f'<p class="{pal["body"]} mt-3">{_h(edu.get("description",""))}</p>' if edu.get("description") else ""
        h += (
            f'<div class="{pal["card"]}">'
            '<div class="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-2">'
            f'<h4 class="{pal["card_title"]}">{_h(edu.get("degree",""))}</h4>'
            f'<span class="{pal["badge"]}">{_h(edu.get("year",""))}</span>'
            "</div>"
            f'<h5 class="{pal["subtitle"]} mt-2"><i class="fa-solid fa-graduation-cap mr-2 opacity-60"></i>{_h(edu.get("institution",""))}</h5>'
            f"{desc}</div>"
        )
    return h


def _proj_items(items, pal):
    h = ""
    for p in items:
        chips = " ".join(
            f'<span class="{pal["chip"]}">{_h(t)}</span>'
            for t in (p.get("tech_stack") or [])
        )
        desc = f'<p class="{pal["text"]} mt-3">{_h(p.get("description",""))}</p>' if p.get("description") else ""
        link = (
            f'<a href="{_url(p["link"])}" target="_blank" '
            f'class="{pal["link"]} text-sm mt-2 inline-block">View Project &rarr;</a>'
            if p.get("link") else ""
        )
        h += (
            f'<div class="{pal["card"]}">'
            f'<h4 class="{pal["card_title"]}">{_h(p.get("name",""))}</h4>'
            f"{desc}"
            f'<div class="flex flex-wrap gap-2 mt-3">{chips}</div>'
            f"{link}</div>"
        )
    return h


def _core_status_cls(status) -> str:
    s = str(status or "").lower()
    if any(w in s for w in ("deploy", "prod", "live", "online", "launch")):
        return "text-cyan-300 border-cyan-500/40 bg-cyan-500/10"
    if any(w in s for w in ("research", "experiment", "prototype", "wip", "active", "build")):
        return "text-violet-300 border-violet-500/40 bg-violet-500/10"
    if any(w in s for w in ("archiv", "done", "ship", "complet", "release")):
        return "text-emerald-300 border-emerald-500/40 bg-emerald-500/10"
    return "text-gray-400 border-white/15 bg-white/5"


def _core_proj_items(items, pal):
    """NEURAL//CORE systems: projects rendered as engineered systems with
    a mono metadata table (type / status / stack / year / parameters)."""
    h = ""
    for i, p in enumerate(items, start=1):
        meta = ""
        for key in ("type", "status", "year"):
            val = p.get(key)
            if val:
                meta += (
                    f'<div class="flex items-baseline justify-between gap-6 py-2 border-b border-white/5">'
                    f'<span class="font-mono text-[10px] uppercase tracking-[.2em] text-gray-500">{_h(key)}</span>'
                    f'<span class="font-mono text-xs text-gray-300 text-right break-all">{_h(val)}</span></div>'
                )
        stack = ", ".join(p.get("tech_stack") or [])
        if stack:
            meta += (
                f'<div class="flex items-baseline justify-between gap-6 py-2 border-b border-white/5">'
                f'<span class="font-mono text-[10px] uppercase tracking-[.2em] text-gray-500">stack</span>'
                f'<span class="font-mono text-xs text-cyan-300/90 text-right break-all">{_h(stack)}</span></div>'
            )
        params = p.get("parameters")
        if isinstance(params, dict):
            for par_key, par_val in list(params.items())[:3]:
                meta += (
                    f'<div class="flex items-baseline justify-between gap-6 py-2 border-b border-white/5">'
                    f'<span class="font-mono text-[10px] uppercase tracking-[.2em] text-gray-500">{_h(par_key)}</span>'
                    f'<span class="font-mono text-xs text-violet-300/90 text-right break-all">{_h(par_val)}</span></div>'
                )
        status = p.get("status")
        status_chip = (
            f'<span class="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 border rounded-sm {_core_status_cls(status)}">{_h(status)}</span>'
            if status else ""
        )
        link = (
            f'<a href="{_url(p["link"])}" target="_blank" rel="noopener" '
            f'class="font-mono text-[11px] uppercase tracking-widest text-violet-400 hover:text-white transition-colors">'
            f'open source <span aria-hidden="true">&nearr;</span></a>'
            if p.get("link") else ""
        )
        h += (
            f'<article class="core-card relative bg-white/[0.02] border border-white/10 rounded-sm p-6 md:p-7 '
            f'flex flex-col hover:border-violet-500/40 transition-colors duration-300">'
            f'<div class="flex items-center justify-between gap-4 mb-5">'
            f'<span class="font-mono text-xs text-gray-600" aria-hidden="true">{i:02d}</span>'
            f"{status_chip}</div>"
            f'<h4 class="text-xl font-semibold tracking-tight text-gray-100">{_h(p.get("name",""))}</h4>'
            f'<p class="text-gray-400 leading-relaxed mt-3 mb-6">{_h(p.get("description",""))}</p>'
            f'<div class="mt-auto border-t border-white/10">{meta}'
            f'<div class="flex justify-end pt-3">{link}</div></div>'
            f"</article>"
        )
    return h


def _about_block(pal, resume_data):
    summary = (resume_data.get("summary") or "").strip() or \
        "Research-minded engineer focused on machine learning and software systems."

    def n(key):
        return len(resume_data.get(key) or [])

    stats = [
        ("systems", n("projects")),
        ("stack", n("skills")),
        ("journey", n("experience") + n("education")),
        ("langs", n("languages")),
    ]
    stat_html = "".join(
        f'<div class="border-l-2 border-violet-500/40 pl-4">'
        f'<p class="font-mono text-2xl md:text-3xl font-bold text-gray-100">{v:02d}</p>'
        f'<p class="font-mono text-[10px] uppercase tracking-[.2em] text-gray-500 mt-1.5">{_h(k)}</p></div>'
        for k, v in stats
    )
    return (
        '<section id="about" class="mb-20 md:mb-28" data-aos="fade-up">'
        '<div class="grid lg:grid-cols-[1.1fr_.9fr] gap-12 items-end">'
        '<div>'
        '<p class="font-mono text-xs tracking-[.35em] uppercase text-violet-400 mb-6">01 / About</p>'
        '<h2 class="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-100">An engineer building<br/>'
        '<span class="text-gray-500">with intent.</span></h2>'
        f'<p class="mt-6 text-gray-400 text-lg leading-relaxed max-w-xl">{_h(summary)}</p>'
        "</div>"
        f'<div class="grid grid-cols-2 gap-x-8 gap-y-10">{stat_html}</div>'
        "</div></section>"
    )


def _cert_items(items, pal):
    h = ""
    for c in items:
        yr = f' &middot; {_h(c.get("year",""))}' if c.get("year") else ""
        h += (
            f'<div class="{pal["card"]}">'
            f'<h4 class="{pal["card_title"]}">{_h(c.get("name",""))}</h4>'
            f'<p class="{pal["muted"]} text-sm">{_h(c.get("issuer",""))}{yr}</p></div>'
        )
    return h


def _lang_items(items, pal):
    h = ""
    for l in items:
        label = f"{_h(l.get('language',''))} &middot; {_h(l.get('proficiency',''))}" if l.get("proficiency") else _h(l.get("language",""))
        h += f'<span class="{pal["chip"]}">{label}</span>'
    return h


# ---------------------------------------------------------------------------
# Main generator
# ---------------------------------------------------------------------------

_SECTION_TITLES = {
    "experience": "Experience", "skills": "Skills", "education": "Education",
    "projects": "Projects", "certifications": "Certifications", "languages": "Languages",
}
_SECTION_ICONS = {
    "experience": "fa-solid fa-briefcase",
    "skills": "fa-solid fa-microchip",
    "education": "fa-solid fa-graduation-cap",
    "projects": "fa-solid fa-diagram-project",
    "certifications": "fa-solid fa-certificate",
    "languages": "fa-solid fa-globe",
}
_SECTION_ORDER = ("experience", "skills", "education", "projects", "certifications", "languages")
_CORE_ORDER = ("projects", "skills", "experience", "education", "certifications", "languages")


def _contact_meta(pal, contact):
    rows = ""
    for label, href, text in (
        ("email", f"mailto:{contact.get('email','')}", contact.get("email")),
        ("github", contact.get("github"), contact.get("github")),
        ("linkedin", contact.get("linkedin"), contact.get("linkedin")),
    ):
        if not text:
            continue
        target = ' target="_blank" rel="noopener"' if href.startswith("http") else ""
        rows += (
            f'<p class="text-gray-400"><span class="text-gray-600">{label} · </span>'
            f'<a href="{_url(href)}"{target} class="text-gray-200 hover:text-violet-300 transition-colors break-all">'
            f"{_h(text)}</a></p>"
        )
    return rows


# ---------------------------------------------------------------------------
# LOTUS//BLOOM builders — luxury botanical editorial theme.
# Theme owns every section's markup; palette only supplies shared colors.
# ---------------------------------------------------------------------------
_LOTUS_PETAL = '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="0.8" aria-hidden="true"><path d="M32 58C32 46 22 34 32 18C42 34 32 46 32 58Z"/><path d="M32 58C40 46 48 35 52 22C43 31 37 44 32 58Z"/><path d="M32 58C24 46 16 35 12 22C21 31 27 44 32 58Z"/></svg>'
_LOTUS_TONES = ["#F8E4E8", "#E8F0E5", "#F5E9DA", "#EFE2EC", "#E4ECE9"]
_C = {
    "ink": "#30252A",
    "body": "#6F5E64",
    "muted": "#8A7179",
    "rose": "#A9576B",
    "rose2": "#D98C9B",
    "line": "#EBDDD7",
    "cream": "#FFF9F7",
}


def _lotus_kicker(text):
    return f'<p class="lotus-eyebrow">{_h(text)}</p>'


def _lotus_heading(inner):
    return (
        f'<h2 class="font-editorial text-4xl md:text-6xl leading-[1.08] tracking-tight mt-5 text-[#30252A]">'
        f"{inner}</h2>"
    )


def _lotus_about(pal, resume_data):
    summary = (resume_data.get("summary") or "").strip()
    if not summary:
        return ""

    def n(key):
        return len(resume_data.get(key) or [])

    cells = ""
    for label, value in (("Projects", n("projects")), ("Expertise areas", n("skills")), ("Languages", n("languages"))):
        if value:
            cells += (
                f'<div class="py-6 px-2 first:pl-0">'
                f'<p class="font-editorial text-4xl md:text-5xl text-[#A9576B]">{value}</p>'
                f'<p class="mt-3 text-[11px] uppercase tracking-[.22em] text-[#8A7179]">{_h(label)}</p>'
                f"</div>"
            )
    if cells:
        cells = f'<div class="grid grid-cols-2 gap-x-8 border-t border-[#EBDDD7]">{cells}</div>'
    return (
        f'<section id="about" class="mb-24 md:mb-36" data-aos="fade-up">\n'
        f'  <div class="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">\n'
        f'    <div class="lg:col-span-7">\n'
        f'      {_lotus_kicker("01 / About")}\n'
        f'      {_lotus_heading("Designing with <em>grace</em> and <em>intention</em>.")}\n'
        f'      <p class="mt-8 max-w-xl text-[17px] leading-relaxed text-[#6F5E64]">{_h(summary)}</p>\n'
        f'      <p class="mt-8 font-editorial italic text-2xl text-[#A9576B]">&mdash; {_h(resume_data.get("name") or "The Artist")}</p>\n'
        f"    </div>"
        f'    <div class="lg:col-span-5">\n      {cells}\n    </div>\n'
        f"  </div>\n"
        f"</section>\n"
    )


def _lotus_projects_section(pal, resume_data):
    projects = resume_data.get("projects") or []
    if not projects:
        return ""
    articles = ""
    for i, p in enumerate(projects):
        name = (p.get("name") or "Untitled").strip()
        fig_order = "lg:order-2" if i % 2 else ""
        txt_order = "lg:order-1" if i % 2 else ""
        letter = (name[0] if name else "L").upper()
        tone = _LOTUS_TONES[i % len(_LOTUS_TONES)]
        meta = " &middot; ".join(_h(x) for x in (p.get("year"), p.get("type"), p.get("status")) if x)
        stack = ", ".join(str(s) for s in (p.get("tech_stack") or []))
        link = ""
        if p.get("link"):
            link = (
                f'<a href="{_url(p["link"])}" target="_blank" rel="noopener" '
                f'class="inline-flex items-center gap-2 mt-8 text-[13px] uppercase tracking-[.18em] font-medium text-[#A9576B] hover:text-[#30252A] transition-colors group/lnk">'
                f"View case study"
                f'<span class="inline-block transition-transform duration-300 group-hover/lnk:translate-x-1" aria-hidden="true">&rarr;</span></a>'
            )
        articles += (
            f'  <article class="group grid lg:grid-cols-12 gap-8 lg:gap-16 items-center py-14 md:py-20 border-t border-[#EBDDD7]">\n'
            f'    <div class="lg:col-span-5 {fig_order}">\n'
            f'      <div class="relative h-72 md:h-96 overflow-hidden flex items-center justify-center" style="background:{tone}">\n'
            f'        <span class="font-editorial text-[11rem] md:text-[14rem] leading-none text-white/90 select-none transition-transform duration-1000 ease-out group-hover:scale-110" aria-hidden="true">{_h(letter)}</span>\n'
            f'        <span class="absolute -bottom-10 -right-10 w-64 h-64 text-[#30252A]/[0.07] transition-transform duration-1000 ease-out group-hover:rotate-45" aria-hidden="true">{_LOTUS_PETAL}</span>\n'
            f"      </div>\n"
            f"    </div>\n"
            f'    <div class="lg:col-span-7 {txt_order}">\n'
            f'      {_lotus_kicker(f"{i+1:02d} / " + str(p.get("type") or "Creative work"))}\n'
            f'      <h3 class="font-editorial text-3xl md:text-5xl leading-tight mt-4 text-[#30252A]">{_h(name)}</h3>\n'
            f'      <p class="mt-5 max-w-xl text-[16px] leading-relaxed text-[#6F5E64]">{_h(p.get("description") or "")}</p>\n'
            f'      <p class="mt-5 text-[12px] uppercase tracking-[.2em] text-[#A9576B]">{meta}</p>\n'
            + (f'      <p class="mt-2 text-[13px] text-[#8A7179]">{_h(stack)}</p>\n' if stack else "")
            + f"      {link}\n"
            f"    </div>\n"
            f"  </article>\n"
        )
    return (
        f'<section id="blooms" class="mb-24 md:mb-36" data-aos="fade-up">\n'
        f'  <div class="max-w-3xl mb-6">\n'
        f'    {_lotus_kicker("02 / Selected Blooms")}\n'
        f'    {_lotus_heading("A selection of <em>recent work</em>")}\n'
        f'    <p class="mt-6 max-w-lg text-[17px] text-[#6F5E64]">Pieces chosen for craft, care, and quiet confidence.</p>\n'
        f"  </div>\n"
        f"  <div class=\"border-b border-[#EBDDD7]\">{articles}</div>\n"
        f"</section>\n"
    )


def _lotus_skills_section(pal, resume_data):
    skills = resume_data.get("skills") or []
    if not skills:
        return ""
    groups = {}
    for s in skills:
        groups.setdefault(_skill_group(str(s)), []).append(str(s))
    rows = ""
    for label in _SKILL_GROUP_ORDER:
        items = groups.get(label)
        if not items:
            continue
        listed = '<span class="text-[#D98C9B]" aria-hidden="true">&#183; </span>'.join(f"<span>{_h(x)}</span>" for x in items)
        rows += (
            f'  <div class="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-10 py-6 md:py-7 border-b border-[#EBDDD7]">\n'
            f'    <span class="lotus-eyebrow md:w-56 md:shrink-0">{_h(label)}</span>\n'
            f'    <p class="text-[17px] leading-relaxed text-[#30252A]">{listed}</p>\n'
            f"  </div>\n"
        )
    return (
        f'<section id="expertise" class="mb-24 md:mb-36" data-aos="fade-up">\n'
        f'  <div class="max-w-3xl mb-12">\n'
        f'    {_lotus_kicker("03 / Expertise")}\n'
        f'    {_lotus_heading("Craft, <em>sharpened</em> over time")}\n'
        f"  </div>\n"
        f"  <div class=\"border-t border-[#EBDDD7]\">{rows}</div>\n"
        f"</section>\n"
    )


def _lotus_journey(pal, resume_data):
    edu = resume_data.get("education") or []
    exp = resume_data.get("experience") or []
    proj = resume_data.get("projects") or []
    cert = resume_data.get("certifications") or []
    if not (edu or exp or proj or cert):
        return ""

    def grad(e):
        return (e.get("degree") or "Studies"), " &middot; ".join(_h(x) for x in (e.get("institution"), e.get("year")) if x)

    def role(e):
        return (e.get("role") or "Role"), " &middot; ".join(_h(x) for x in (e.get("company"), e.get("duration")) if x)

    def bloom(p):
        return (p.get("name") or "Project"), str(p.get("year") or "")

    stages = []
    if edu:
        stages.append(("I", "Root", "Foundations &amp; beginnings", [grad(e) for e in edu[:2]]))
    if exp:
        stages.append(("II", "Rise", "Growth through practice", [role(e) for e in exp[:2]]))
    bloom_items = [bloom(p) for p in proj[:2]] + [(c.get("name") or "Certification", str(c.get("issuer") or c.get("year") or "")) for c in cert[:1]]
    if bloom_items:
        stages.append(("III", "Bloom", "Ideas made visible", bloom_items[:3]))
    if not stages:
        return ""

    blocks = ""
    for num, name, subtitle, items in stages:
        item_rows = "".join(
            f'      <div class="py-4 border-b border-[#EBDDD7] last:border-0">'
            f'<p class="font-editorial text-xl md:text-2xl text-[#30252A]">{_h(title)}</p>'
            + (f'<p class="mt-1.5 text-[12px] uppercase tracking-[.16em] text-[#8A7179]">{detail}</p>' if detail else "")
            + f"</div>\n"
            for title, detail in items
        )
        blocks += (
            f'  <div class="relative pl-14 md:pl-24 pb-12 last:pb-0">\n'
            f'    <span class="absolute left-1 top-3 bottom-0 w-px bg-[#EBDDD7]" aria-hidden="true"></span>\n'
            f'    <span class="absolute left-1 top-1 -translate-x-1/2 h-11 w-11 rounded-full border border-[#A9576B]/40 bg-[#FFF9F7] flex items-center justify-center text-[#A9576B]" aria-hidden="true">{_LOTUS_PETAL}</span>\n'
            f'    {_lotus_kicker(f"{num} / {name}")}\n'
            f'    <h3 class="font-editorial text-3xl md:text-4xl mt-3 mb-7 text-[#30252A]">{subtitle}</h3>\n'
            f'    <div class="max-w-xl border-t border-[#EBDDD7]">\n{item_rows}    </div>\n'
            f"  </div>\n"
        )
    return (
        f'<section id="journey" class="mb-24 md:mb-36" data-aos="fade-up">\n'
        f'  <div class="max-w-3xl mb-14">\n'
        f'    {_lotus_kicker("04 / Bloom Journey")}\n'
        f'    {_lotus_heading("From <em>root</em> to <em>bloom</em>")}\n'
        f'    <p class="mt-6 max-w-lg text-[17px] text-[#6F5E64]">Personal growth told in three quiet stages &mdash; foundations, practice, and visible bloom.</p>\n'
        f"  </div>\n"
        f"  <div>{blocks}</div>\n"
        f"</section>\n"
    )


def _lotus_contact_rows(contact):
    rows = ""
    for label, href, text in (
        ("Email", f"mailto:{contact.get('email', '')}", contact.get("email")),
        ("LinkedIn", contact.get("linkedin"), contact.get("linkedin")),
        ("GitHub", contact.get("github"), contact.get("github")),
    ):
        if not text:
            continue
        target = ' target="_blank" rel="noopener"' if href.startswith("http") else ""
        rows += (
            f'  <a href="{_url(href)}"{target} '
            f'class="group flex items-center justify-between gap-6 border-t border-[#EBDDD7] py-6 md:py-7">\n'
            f'    <span class="lotus-eyebrow">{_h(label)}</span>\n'
            f'    <span class="font-editorial text-xl md:text-3xl text-[#30252A] group-hover:text-[#A9576B] transition-colors break-all">{_h(text)}</span>\n'
            f'    <span class="text-[#A9576B] opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0" aria-hidden="true">&nearr;</span>\n'
            f"  </a>\n"
        )
    return rows


def _lotus_sections(pal, resume_data):
    section_map = {
        "about": _lotus_about(pal, resume_data),
        "projects": _lotus_projects_section(pal, resume_data),
        "skills": _lotus_skills_section(pal, resume_data),
        "journey": _lotus_journey(pal, resume_data),
    }
    section_map = {k: v for k, v in section_map.items() if v}
    return section_map, tuple(section_map)


# ---------------------------------------------------------------------------
# SAKURA//FLOW builders — Japanese editorial minimalism with cherry blossoms.
# ---------------------------------------------------------------------------

_SAURA_CREAM = "#FCFAF7"
_SAURA_SAKURA = "#EBCED3"
_SAURA_ROSE  = "#C98291"
_SAURA_INK   = "#282525"
_SAURA_TAUPE = "#7D6A63"
_SAURA_MOSS  = "#B6C1A8"

_SAURA_PETAL_SVG = '<svg viewBox="0 0 24 32" fill="currentColor" class="w-4 h-5"><path d="M12 0C12 12 2 20 12 32C22 20 12 12 12 0Z"/></svg>'

_SAURA_TONES = ["#F8EDE5", "#F5E3E8", "#EEF2EA", "#F3EAE5", "#EAF0F0"]


def _sakura_skicker(text):
    """Section kicker: '01 / ABOUT'."""
    return f'<p class="sk">{_h(text)}</p>'


def _sakura_heading(inner):
    return (
        f'<h2 class="font-editorial text-4xl md:text-6xl leading-[1.08] tracking-tight mt-5 text-[#282525]">'
        f"{inner}</h2>"
    )


def _sakura_about(pal, resume_data):
    summary = (resume_data.get("summary") or "").strip()
    if not summary:
        return ""

    def n(key):
        return len(resume_data.get(key) or [])

    cells = ""
    for label, value in (
        ("Projects", n("projects")),
        ("Skills", n("skills")),
        ("Languages", n("languages")),
    ):
        if value:
            cells += (
                f'<div class="py-6 px-2 first:pl-0">'
                f'<p class="font-editorial text-4xl md:text-5xl text-[#C98291]">{value}</p>'
                f'<p class="mt-3 text-[11px] uppercase tracking-[.22em] text-[#7D6A63]">{_h(label)}</p>'
                f"</div>"
            )
    if cells:
        cells = f'<div class="grid grid-cols-3 gap-x-6 border-t border-[#EBCED3]/60">{cells}</div>'

    return (
        f'<section id="about" class="px-6 sm:px-10 lg:px-16 mb-24 md:mb-36" data-aos="fade-up">\n'
        f'  <div class="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">\n'
        f'    <div class="lg:col-span-7">\n'
        f'      {_sakura_skicker("01 / About")}\n'
        f'      {_sakura_heading("A creative mind guided by <em class=\'italic text-[#C98291]\'>flow</em>.")}\n'
        f'      <p class="mt-8 max-w-xl text-[17px] leading-[1.75] text-[#7D6A63]">{_h(summary)}</p>\n'
        f'      <p class="mt-8 font-editorial italic text-2xl text-[#C98291]">&mdash; {_h(resume_data.get("name") or "The Artist")}</p>\n'
        f"    </div>"
        f'    <div class="lg:col-span-5">\n      {cells}\n    </div>\n'
        f"  </div>\n"
        f"</section>\n"
    )


def _sakura_projects_section(pal, resume_data):
    projects = resume_data.get("projects") or []
    if not projects:
        return ""

    articles = ""
    for i, p in enumerate(projects):
        name = (p.get("name") or "Untitled").strip()
        fig_order = "lg:order-2" if i % 2 else ""
        txt_order = "lg:order-1" if i % 2 else ""
        letter = (name[0] if name else "W").upper()
        tone = _SAURA_TONES[i % len(_SAURA_TONES)]
        meta_parts = [str(x) for x in (p.get("type"), p.get("status"), p.get("year")) if x]
        meta = " &middot; ".join(_h(x) for x in meta_parts)
        stack = ", ".join(str(s) for s in (p.get("tech_stack") or []))
        link = ""
        if p.get("link"):
            link = (
                f'<a href="{_url(p["link"])}" target="_blank" rel="noopener" '
                f'class="inline-flex items-center gap-2 mt-8 text-[12px] uppercase tracking-[.18em] font-semibold text-[#C98291] hover:text-[#282525] transition-colors group/slnk">'
                f"View project"
                f'<span class="inline-block transition-transform duration-300 group-hover/slnk:translate-x-1" aria-hidden="true">&rarr;</span></a>'
            )
        articles += (
            f'  <article class="group grid lg:grid-cols-12 gap-8 lg:gap-16 items-center py-14 md:py-20 border-t border-[#EBCED3]/60">\n'
            f'    <div class="lg:col-span-5 {fig_order}">\n'
            f'      <div class="relative h-72 md:h-96 overflow-hidden flex items-center justify-center" style="background:{tone}">\n'
            f'        <span class="font-editorial text-[11rem] md:text-[14rem] leading-none text-white/90 select-none transition-transform duration-1000 ease-out group-hover:scale-110" aria-hidden="true">{_h(letter)}</span>\n'
            f'      </div>\n'
            f"    </div>\n"
            f'    <div class="lg:col-span-7 {txt_order}">\n'
            f'      {_sakura_skicker(f"{i+1:02d} / " + str(p.get("type") or "Selected work"))}\n'
            f'      <h3 class="font-editorial text-3xl md:text-5xl leading-tight mt-4 text-[#282525]">{_h(name)}</h3>\n'
            f'      <p class="mt-5 max-w-xl text-[16px] leading-[1.75] text-[#7D6A63]">{_h(p.get("description") or "")}</p>\n'
            + (f'<p class="mt-5 text-[11px] uppercase tracking-[.2em] text-[#C98291]">{meta}</p>\n' if meta else "")
            + (f'<p class="mt-2 text-[13px] text-[#7D6A63]/70">{_h(stack)}</p>\n' if stack else "")
            + f"      {link}\n"
            f"    </div>\n"
            f"  </article>\n"
        )
    return (
        f'<section id="work" class="px-6 sm:px-10 lg:px-16 mb-24 md:mb-36" data-aos="fade-up">\n'
        f'  <div class="max-w-3xl mb-6">\n'
        f'    {_sakura_skicker("02 / Selected Work")}\n'
        f'    {_sakura_heading("Stories told through <em class=\'italic text-[#C98291]\'>craft</em>.")}\n'
        f'    <p class="mt-6 max-w-lg text-[17px] text-[#7D6A63]">Projects shaped with care, curiosity, and a quiet attention to detail.</p>\n'
        f"  </div>\n"
        f'  <div class="border-b border-[#EBCED3]/60">{articles}</div>\n'
        f"</section>\n"
    )


def _sakura_skills_section(pal, resume_data):
    skills = resume_data.get("skills") or []
    if not skills:
        return ""
    groups = {}
    for s in skills:
        groups.setdefault(_skill_group(str(s)), []).append(str(s))
    rows = ""
    for label in _SKILL_GROUP_ORDER:
        items = groups.get(label)
        if not items:
            continue
        listed = (
            '<span class="text-[#C98291]/60" aria-hidden="true">&middot; </span>'
            .join(f"<span>{_h(x)}</span>" for x in items)
        )
        rows += (
            f'  <div class="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-10 py-6 md:py-7 border-b border-[#EBCED3]/60">\n'
            f'    <span class="sk md:w-56 md:shrink-0">{_h(label)}</span>\n'
            f'    <p class="text-[16px] leading-[1.75] text-[#282525]">{listed}</p>\n'
            f"  </div>\n"
        )
    return (
        f'<section id="expertise" class="px-6 sm:px-10 lg:px-16 mb-24 md:mb-36" data-aos="fade-up">\n'
        f'  <div class="max-w-3xl mb-12">\n'
        f'    {_sakura_skicker("03 / Expertise")}\n'
        f'    {_sakura_heading("Skills <em class=\'italic text-[#C98291]\'>refined</em> through practice.")}\n'
        f"  </div>\n"
        f'  <div class="border-t border-[#EBCED3]/60">{rows}</div>\n'
        f"</section>\n"
    )


def _sakura_journey(pal, resume_data):
    edu = resume_data.get("education") or []
    exp = resume_data.get("experience") or []
    proj = resume_data.get("projects") or []
    cert = resume_data.get("certifications") or []
    if not (edu or exp or proj or cert):
        return ""

    def grad(e):
        return (e.get("degree") or "Studies"), " &middot; ".join(_h(x) for x in (e.get("institution"), e.get("year")) if x)

    def role(e):
        return (e.get("role") or "Role"), " &middot; ".join(_h(x) for x in (e.get("company"), e.get("duration")) if x)

    def proj_name(p):
        return (p.get("name") or "Project"), str(p.get("year") or "")

    # Four journey stages: Foundation → Exploration → Building → Bloom
    stages = []
    if edu:
        stages.append(("I", "Foundation", "Where it all began", [grad(e) for e in edu[:2]]))
    if exp:
        stages.append(("II", "Exploration", "Learning by doing", [role(e) for e in exp[:3]]))
    build_items = [proj_name(p) for p in proj[:2]]
    if build_items:
        stages.append(("III", "Building", "Ideas taking shape", build_items))
    bloom_items = [
        (c.get("name") or "Certification", str(c.get("issuer") or c.get("year") or ""))
        for c in cert[:2]
    ]
    if proj and not build_items:
        bloom_items = [proj_name(proj[0])] + bloom_items
    if bloom_items:
        stages.append(("IV", "Bloom", "Visible impact", bloom_items[:3]))
    if not stages:
        return ""

    blocks = ""
    for num, name, subtitle, items in stages:
        item_rows = "".join(
            f'      <div class="py-4 border-b border-[#EBCED3]/40 last:border-0">'
            f'<p class="font-editorial text-xl md:text-2xl text-[#282525]">{_h(title)}</p>'
            + (f'<p class="mt-1.5 text-[11px] uppercase tracking-[.16em] text-[#7D6A63]">{detail}</p>' if detail else "")
            + f"</div>\n"
            for title, detail in items
        )
        blocks += (
            f'  <div class="relative pl-14 md:pl-24 pb-12 last:pb-0">\n'
            f'    <span class="absolute left-1 top-3 bottom-0 w-px bg-[#EBCED3]/70" aria-hidden="true"></span>\n'
            f'    <span class="absolute left-1 top-1 -translate-x-1/2 h-10 w-10 rounded-full border border-[#C98291]/40 bg-[#FCFAF7] flex items-center justify-center" aria-hidden="true"><span class="text-[#C98291]">{_SAURA_PETAL_SVG}</span></span>\n'
            f'    {_sakura_skicker(f"{num} / {name}")}\n'
            f'    <h3 class="font-editorial text-3xl md:text-4xl mt-3 mb-7 text-[#282525]">{subtitle}</h3>\n'
            f'    <div class="max-w-xl border-t border-[#EBCED3]/60">\n{item_rows}    </div>\n'
            f"  </div>\n"
        )
    return (
        f'<section id="journey" class="px-6 sm:px-10 lg:px-16 mb-24 md:mb-36" data-aos="fade-up">\n'
        f'  <div class="max-w-3xl mb-14">\n'
        f'    {_sakura_skicker("04 / Journey")}\n'
        f'    {_sakura_heading("From <em class=\'italic text-[#C98291]\'>root</em> to <em class=\'italic text-[#C98291]\'>bloom</em>.")}\n'
        f'    <p class="mt-6 max-w-lg text-[17px] text-[#7D6A63]">A creative path shaped by curiosity, practice, and quiet perseverance.</p>\n'
        f"  </div>\n"
        f'  <div>{blocks}</div>\n'
        f"</section>\n"
    )


def _sakura_contact_section(contact):
    rows = ""
    for label, href, text in (
        ("Email", f"mailto:{contact.get('email', '')}", contact.get("email")),
        ("LinkedIn", contact.get("linkedin"), contact.get("linkedin")),
        ("GitHub", contact.get("github"), contact.get("github")),
    ):
        if not text:
            continue
        target = ' target="_blank" rel="noopener"' if href.startswith("http") else ""
        rows += (
            f'  <a href="{_url(href)}"{target} '
            f'class="group flex items-center justify-between gap-6 border-t border-[#EBCED3]/60 py-6 md:py-7">\n'
            f'    <span class="sk">{_h(label)}</span>\n'
            f'    <span class="font-editorial text-xl md:text-3xl text-[#282525] group-hover:text-[#C98291] transition-colors break-all">{_h(text)}</span>\n'
            f'    <span class="text-[#C98291] opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0" aria-hidden="true">&nearr;</span>\n'
            f"  </a>\n"
        )
    if not rows:
        return ""
    return (
        f'<section id="contact" class="px-6 sm:px-10 lg:px-16 mb-24 md:mb-36" data-aos="fade-up">\n'
        f'  <div class="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">\n'
        f'    <div class="lg:col-span-6">\n'
        f'      {_sakura_skicker("05 / Contact")}\n'
        f'      {_sakura_heading("Let&rsquo;s create something <em class=\'italic text-[#C98291]\'>together</em>")}\n'
        f'      <p class="mt-8 max-w-md text-[17px] leading-[1.75] text-[#7D6A63]">'
        f"Whether it's a new collaboration, a curious note, or just a hello &mdash; the inbox is always open.</p>\n"
        f'      <div class="mt-4 border-b border-[#EBCED3]/60">\n{rows}      </div>\n'
        f"    </div>\n"
        f'    <div class="lg:col-span-6 lg:pl-8">\n'
        f'      <div class="relative border border-[#EBCED3]/70 p-8 md:p-12 bg-white/60">\n'
        f'        <svg class="absolute -top-5 -right-5 w-14 h-14 text-[#EBCED3]/80" viewBox="0 0 64 64" fill="currentColor" aria-hidden="true"><path d="M32 58C32 46 22 34 32 18C42 34 32 46 32 58Z"/><path d="M32 58C40 46 48 35 52 22C43 31 37 44 32 58Z"/><path d="M32 58C24 46 16 35 12 22C21 31 27 44 32 58Z"/></svg>\n'
        f'        <p class="sk">Current chapter</p>\n'
        f'        <p class="font-editorial text-3xl md:text-4xl mt-5 leading-snug text-[#282525]">\n'
        f'          Open to <em class=\'italic text-[#C98291]\'>meaningful</em> collaborations\n'
        f"        </p>\n"
        f'        <div class="mt-8 flex items-center gap-3">\n'
        f'          <span class="relative flex h-2.5 w-2.5">\n'
        f'            <span class="absolute inline-flex h-full w-full rounded-full bg-[#B6C1A8] opacity-75 animate-ping"></span>\n'
        f'            <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#B6C1A8]"></span>\n'
        f"          </span>\n"
        f'          <span class="text-[11px] uppercase tracking-[.2em] text-[#7D6A63]">Available for select projects</span>\n'
        f"        </div>\n"
        f"      </div>\n"
        f"    </div>\n"
        f"  </div>\n"
        f"</section>\n"
    )


# ---------------------------------------------------------------------------
# LATENT//SPACE — dark AI research-lab × embedding-field console.
# Custom builders own the markup; the template slots in {section_X}.
# ---------------------------------------------------------------------------

def _latent_section(sec_id, num, name, meta, inner, head=None, sub=None):
    """System section frame: XOR kicker + right-hand mono metadata."""
    if head is None:
        head = name.replace("_", " ")
    sub_html = sub or ""
    head_html = (
        f'<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">'
        f'  <div>'
        f'    <p class="f-mono text-[11px] tracking-[.24em] text-[#8B5CF6]">{num} // {_h(name)}</p>'
        f'    <h2 class="f-disp mt-4 text-3xl sm:text-4xl lg:text-[2.6rem] tracking-[-.01em]">{_h(head)}</h2>'
        f"    {sub_html}"
        f"  </div>"
        f'  <p class="f-mono text-[10px] tracking-[.2em] text-[#5F6675]">{_h(meta)}</p>'
        f"</div>"
    )
    return (
        f'<section id="{sec_id}" class="relative mx-auto max-w-7xl px-5 sm:px-8 py-20 md:py-28 border-t border-[#202532]" data-aos="fade-up">\n'
        f"  {head_html}\n"
        f"  {inner}\n"
        f"</section>\n"
    )


def _latent_identity(pal, resume_data):
    summary = (resume_data.get("summary") or "").strip()
    if not summary:
        return ""

    focus_map = {
        "Coding languages": "Languages", "Frameworks": "Engineering",
        "Version control": "Tooling", "Databases": "Data",
        "IDEs & editors": "Tooling", "Cloud & DevOps": "Infrastructure",
        "Design tools": "Design", "Other": "Experiments",
    }
    groups = {}
    for s in (resume_data.get("skills") or []):
        groups.setdefault(_skill_group(str(s)), []).append(str(s))
    focus = " · ".join(focus_map.get(g, g) for g in _SKILL_GROUP_ORDER if g in groups)
    if not focus:
        focus = "Machine Intelligence"

    mode_bits = []
    if resume_data.get("projects") or resume_data.get("experience"):
        mode_bits.append("BUILD")
    if resume_data.get("projects"):
        mode_bits.append("EXPERIMENT")
    if resume_data.get("education") or resume_data.get("certifications"):
        mode_bits.append("LEARN")
    mode = " / ".join(mode_bits) if mode_bits else "EXPLORE"

    counts = ""
    rows = [("PROJECTS", "projects"), ("SKILLS", "skills"), ("EXPERIENCE", "experience"), ("LANGUAGES", "languages")]
    cells = ""
    for label, key in rows:
        n = len(resume_data.get(key) or [])
        if not n:
            continue
        cells += (
            f'<div class="border-t border-[#202532] py-4 flex items-baseline justify-between gap-4">'
            f'<span class="f-mono text-[10px] tracking-[.2em] text-[#5F6675]">{label}</span>'
            f'<span class="f-mono text-lg text-[#8B5CF6]">{n:02d}</span>'
            f"</div>"
        )
    if cells:
        counts = f'<div class="mt-10">{cells}</div>'

    name = resume_data.get("name") or "The Engineer"
    meta_rows = (
        ('<div class="flex justify-between gap-6 py-4 border-b border-[#202532]">'
         '<span class="f-mono text-[10px] tracking-[.2em] text-[#5F6675]">FIELD</span>'
         '<span class="f-mono text-[12px] text-[#8C93A3]">Artificial Intelligence</span></div>\n'),
        (f'<div class="flex justify-between gap-6 py-4 border-b border-[#202532]">'
         f'<span class="f-mono text-[10px] tracking-[.2em] text-[#5F6675]">FOCUS</span>'
         f'<span class="f-mono text-[12px] text-[#8C93A3]">{_h(focus)}</span></div>\n'),
        (f'<div class="flex justify-between gap-6 py-4 border-b border-[#202532]">'
         f'<span class="f-mono text-[10px] tracking-[.2em] text-[#5F6675]">MODE</span>'
         f'<span class="f-mono text-[12px] text-[#22D3EE]">{_h(mode)}</span></div>\n'),
        ('<div class="flex justify-between gap-6 py-4">'
         '<span class="f-mono text-[10px] tracking-[.2em] text-[#5F6675]">STATUS</span>'
         '<span class="f-mono flex items-center gap-2 text-[12px] text-[#4ADE80]"><span class="status-dot" aria-hidden="true"></span>ACTIVE</span></div>\n'),
    )

    return _latent_section(
        "identity", "01", "IDENTITY_VECTOR", "VECTOR_SPACE: 01",
        f'<div class="mt-12 grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">'
        f'  <div class="lg:col-span-7">'
        f'    <p class="f-mono text-[11px] tracking-[.2em] text-[#8C93A3]">AI / ML ENGINEER</p>'
        f'    <p class="mt-6 max-w-xl text-[16px] leading-[1.8] text-[#8C93A3]">{_h(summary)}</p>'
        f'    <p class="f-disp mt-10 text-lg text-[#8B5CF6]">&mdash; {_h(name)}</p>'
        f"    {counts}"
        f"  </div>"
        f'  <div class="lg:col-span-5">'
        f'    <div class="border border-[#202532] bg-[#0D1018]/70 px-6 py-2">\n{"".join(meta_rows)}    </div>'
        f"  </div>"
        f"</div>",
    )


_LATENT_NODE_POS = [
    (140, 92), (470, 84), (500, 206), (466, 352), (172, 362), (84, 224), (322, 54),
]
_LATENT_NODE_ACC = ["#8B5CF6", "#4F8CFF", "#22D3EE", "#8B5CF6", "#4F8CFF", "#8B5CF6", "#4F8CFF"]


def _latent_projects(pal, resume_data):
    projects = resume_data.get("projects") or []
    if not projects:
        return ""
    items = projects[:7]

    links_svg = ""
    nodes_svg = ""
    for i, p in enumerate(items):
        x, y = _LATENT_NODE_POS[i]
        acc = _LATENT_NODE_ACC[i % len(_LATENT_NODE_ACC)]
        pid = f"p{i}"
        name = (p.get("name") or "Untitled").strip()
        status = (p.get("status") or "").strip()
        stack = ",".join(str(t) for t in (p.get("tech_stack") or []))
        links_svg += (
            f'<line x1="322" y1="220" x2="{x}" y2="{y}" class="plink" data-src="{pid}" '
            f'stroke-width="1" stroke="#202532"/>'
        )
        nodes_svg += (
            f'<g class="pnode" tabindex="0" role="button" data-id="{pid}" data-index="{i+1:03d}" '
            f'data-name="{_h(name)}" data-type="{_h(p.get("type") or "")}" '
            f'data-status="{_h(status)}" data-year="{_h(p.get("year") or "")}" '
            f'data-desc="{_h(p.get("description") or "")}" data-stack="{_h(stack)}" '
            f'data-link="{_h(p.get("link") or "#")}" aria-label="Inspect project: {_h(name)}">'
            f'<circle cx="{x}" cy="{y}" r="5" fill="{acc}"/><circle cx="{x}" cy="{y}" r="11" fill="none" stroke="{acc}" stroke-opacity=".3"/>'
            f'<text x="{x}" y="{y + 20}" class="f-mono" font-size="9" fill="#8C93A3" '
            + ('text-anchor="start">' if x > 420 else 'text-anchor="middle">')
            + f'{_h(name)}</text></g>'
        )

    return _latent_section(
        "work", "02", "PROJECT_EMBEDDINGS", "VECTOR_SPACE: 02",
        f'<p class="mt-4 max-w-lg text-[14px] leading-relaxed text-[#5F6675]">Systems built while exploring the space. Select a node to inspect the artifact.</p>'
        f'<p class="f-mono mt-2 text-[10px] tracking-[.2em] text-[#8B5CF6]">CLICK A NODE TO INSPECT</p>'
        f'<div class="mt-10 field-grid relative border border-[#202532] bg-[#0D1018]/60 rounded-b-lg overflow-hidden">'
        f'<svg class="ls-field w-full h-auto max-h-[520px]" viewBox="0 0 640 440" aria-label="Portfolio projects mapped as nodes in a latent space">'
        f'<rect width="640" height="440" fill="url(#microgrid)"/>'
        f'{links_svg}'
        f'<circle cx="322" cy="220" r="7" fill="#8B5CF6"/><circle cx="322" cy="220" r="18" fill="none" stroke="#8B5CF6" stroke-opacity=".4" stroke-dasharray="2 4"/>'
        f'<text x="322" y="252" class="f-mono" font-size="9" fill="#F4F5F7" text-anchor="middle" letter-spacing="2">CORE</text>'
        f'{nodes_svg}'
        f'<g class="f-mono" font-size="8" fill="#5F6675"><text x="6" y="434">x:0</text><text x="560" y="434">x:320</text></g>'
        f'</svg>'
        f'<p class="absolute bottom-3 left-5 f-mono text-[9px] tracking-[.18em] text-[#5F6675]">SELECT NODE &rarr; INSPECT SYSTEM</p>'
        f"</div>",
        sub=None,
    )


def _latent_features(pal, resume_data):
    skills = resume_data.get("skills") or []
    if not skills:
        return ""
    groups = {}
    for s in skills:
        groups.setdefault(_skill_group(str(s)), []).append(str(s))
    short = {
        "Coding languages": "LANGUAGE", "Frameworks": "ENGINEERING",
        "Version control": "TOOLING", "Databases": "DATA",
        "IDEs & editors": "TOOLING", "Cloud & DevOps": "INFRA",
        "Design tools": "DESIGN", "Other": "EXPERIMENTS",
    }
    rows = ""
    for g in _SKILL_GROUP_ORDER:
        gitems = groups.get(g)
        if not gitems:
            continue
        chips = " ".join(
            f'<span class="border border-[#202532] px-2.5 py-1 rounded-sm text-[12px] hover:border-[#8B5CF6] hover:text-[#F4F5F7] transition-colors">{_h(s)}</span>'
            for s in gitems
        )
        rows += (
            f'<div class="relative">'
            f'<div class="axis-line" aria-hidden="true"></div>'
            f'<div class="relative flex items-center gap-6 py-6">'
            f'<span class="relative z-10 h-3 w-3 rounded-full border border-[#8B5CF6] bg-[#0D1018]" aria-hidden="true"></span>'
            f'<div class="flex-1">'
            f'<h3 class="f-mono text-[11px] tracking-[.2em] text-[#F4F5F7]">{_h(short.get(g, g.upper()))}</h3>'
            f'<div class="f-mono mt-2.5 flex flex-wrap gap-2 text-[#8C93A3]">{chips}</div>'
            f"</div></div></div>"
        )
    return _latent_section(
        "features", "03", "FEATURE_SPACE", "VECTOR_SPACE: 03",
        f'<p class="mt-4 max-w-lg text-[14px] leading-relaxed text-[#5F6675]">Technologies mapped as connected clusters along a single feature axis.</p>'
        f'<div class="mt-12">{rows}</div>',
    )


def _latent_log_status(status) -> tuple:
    s = str(status or "").lower()
    if any(w in s for w in ("complete", "done", "ship", "graduat", "certif")):
        return "#22D3EE", "COMPLETED"
    if any(w in s for w in ("active", "build", "in progress", "wip", "deploy", "live")):
        return "#8B5CF6", "IN PROGRESS"
    if any(w in s for w in ("research", "explor", "prototype", "plann", "next")):
        return "#4F8CFF", "EXPLORING"
    return "#5F6675", (str(status or "LOGGED").upper())


def _latent_log(pal, resume_data):
    entries = []
    for cert in (resume_data.get("certifications") or []):
        entries.append((cert.get("name") or "Certification", "CERTIFICATION",
                        "SOURCE: " + " · ".join(str(x) for x in (cert.get("issuer"), cert.get("year")) if x),
                        "COMPLETED"))
    for edu in (resume_data.get("education") or []):
        entries.append((edu.get("degree") or "Education", "FOUNDATION",
                        "SOURCE: " + " · ".join(str(x) for x in (edu.get("institution"), edu.get("year")) if x),
                        "COMPLETED"))
    for p in (resume_data.get("projects") or []):
        st = (p.get("status") or "").strip()
        if not st:
            continue
        entries.append(((p.get("name") or "Experiment"), "PROJECT",
                        "STACK: " + ", ".join(str(x) for x in (p.get("tech_stack") or [])) if p.get("tech_stack") else "",
                        st))
    if not entries:
        return ""

    rows = ""
    for i, (label, kind, meta, status) in enumerate(entries[:7], start=1):
        color, stxt = _latent_log_status(status)
        meta_note = f' <span class="text-[#5F6675]">({_h(meta)})</span>' if meta else ""
        rows += (
            f'<details class="rx group border-b border-[#202532]">'
            f'<summary class="flex items-center justify-between gap-6 py-5 cursor-pointer list-none hover:bg-white/[.015] rounded-sm -mx-3 px-3">'
            f'<span class="flex items-baseline gap-4 sm:gap-6 min-w-0">'
            f'<span class="f-mono text-[10px] tracking-[.15em] text-[#5F6675] shrink-0">EXP / {i:03d}</span>'
            f'<span class="f-disp text-lg sm:text-xl tracking-tight truncate">{_h(label)}</span>'
            f'<span class="f-mono hidden sm:inline text-[10px] tracking-[.15em] text-[#5F6675] shrink-0">{_h(kind)}</span>'
            f"</span>"
            f'<span class="flex items-center gap-4 sm:gap-6 shrink-0">'
            f'<span class="f-mono text-[10px] tracking-[.18em]" style="color:{color}">&#9679; {stxt}</span>'
            f'<span class="rx-marker f-mono text-[#5F6675] text-lg leading-none" aria-hidden="true">+</span>'
            f"</span></summary>"
            f'<div class="pb-6 border-t border-[#202532] -mx-3 px-3 pt-5 text-[#8C93A3]">'
            f'<p class="f-mono text-[12px] leading-relaxed max-w-3xl">{_h(label)} &mdash; logged in the research log.{meta_note}</p>'
            f"</div></details>"
        )
    return _latent_section(
        "log", "04", "RESEARCH_LOG", "VECTOR_SPACE: 04",
        f'<p class="mt-4 max-w-lg text-[14px] leading-relaxed text-[#5F6675]">A ledger of experiments, foundations and open threads. Expand an entry to inspect it.</p>'
        f'<div class="mt-10">{rows}</div>',
    )


def _latent_trajectory(pal, resume_data):
    milestones = []
    for e in (resume_data.get("education") or []):
        milestones.append((e.get("degree") or "Foundation", e.get("institution") or "",
                           (e.get("year") or "—"), "FOUNDATION"))
    exps = resume_data.get("experience") or []
    exp_kinds = ["EXPLORATION"] * len(exps)
    if len(exps) > 1:
        exp_kinds[-1] = "BUILDING"
    for e, kind in zip(exps, exp_kinds):
        milestones.append((e.get("role") or "Role", e.get("company") or "",
                           (e.get("duration") or "—"), kind))
    for p in (resume_data.get("projects") or []):
        years = [str(x) for x in (p.get("year"),) if x]
        if not years:
            continue
        milestones.append((p.get("name") or "Experiment", p.get("type") or "", years[0], "EXPERIMENT"))
    if len(milestones) < 2:
        return ""
    milestones = milestones[:6]
    n = len(milestones)

    def pos(t):
        x = 120 + t * 880 + 34 * math.sin(t * 6.2)
        y = 70 + t * 320 + 40 * math.sin(t * math.pi)
        return x, y

    d = "M " + " ".join(f"{pos(t / 80)[0]:.1f} {pos(t / 80)[1]:.1f}" for t in range(81))
    parts = []
    for i, (label, sub, period, kind) in enumerate(milestones):
        x, y = pos(i / (n - 1))
        above = i % 2 == 0
        if above:
            yk, yn, yp = y - 42, y - 28, y - 14
        else:
            yk, yn, yp = y + 40, y + 54, y + 68
        parts.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="4.5" fill="#8B5CF6"/>'
                     f'<circle cx="{x:.1f}" cy="{y:.1f}" r="11" fill="none" stroke="#8B5CF6" stroke-opacity=".35"/>')
        parts.append(
            f'<text class="f-mono" text-anchor="middle" font-size="9" fill="#F4F5F7">'
            f'<tspan x="{x:.1f}" y="{yk:.1f}" letter-spacing="2">{_h(kind)}</tspan>'
            f'<tspan x="{x:.1f}" y="{yn:.1f}" font-size="11" fill="#8C93A3">{_h(label[:26])}</tspan>'
            f'<tspan x="{x:.1f}" y="{yp:.1f}" font-size="8" fill="#5F6675">{_h(period)}</tspan>'
            f"</text>"
        )

    return _latent_section(
        "trajectory", "05", "LATENT_TRAJECTORY", "VECTOR_SPACE: 05",
        f'<p class="mt-4 max-w-lg text-[14px] leading-relaxed text-[#5F6675]">A path through the space &mdash; from foundations to the front.</p>'
        f'<div class="mt-10 border border-[#202532] bg-[#0D1018]/60 rounded-b-lg overflow-hidden">'
        f'<svg viewBox="0 0 1120 460" class="w-full h-auto" role="img" aria-label="Career and learning trajectory plotted as a curved path">'
        f'<path class="traj-line" d="{d}" fill="none" stroke="#8B5CF6" stroke-width="1.5" pathLength="1"/>'
        f'{"".join(parts)}'
        f"</svg></div>",
    )


def _latent_query(pal, resume_data):
    contact = resume_data.get("contact", {})
    rows = ""
    for label, href, text in (
        ("EMAIL", f"mailto:{contact.get('email', '')}", contact.get("email")),
        ("GITHUB", contact.get("github"), contact.get("github")),
        ("LINKEDIN", contact.get("linkedin"), contact.get("linkedin")),
    ):
        if not text:
            continue
        target = ' target="_blank" rel="noopener"' if str(href).startswith("http") else ""
        rows += (
            f'<a class="qrow group flex items-center justify-between gap-6 border-t border-[#202532] -mx-3 px-3 py-5" href="{_url(href)}"{target}>'
            f'<span class="f-mono text-[10px] tracking-[.2em] text-[#8C93A3]">{label}</span>'
            f'<span class="f-mono text-[13px] text-[#F4F5F7] break-all group-hover:text-[#8B5CF6] transition-colors">{_h(text)}</span>'
            f'<span class="text-[#8B5CF6] opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">&#8599;</span>'
            f"</a>"
        )
    if not rows:
        return ""

    return _latent_section(
        "query", "06", "QUERY_SPACE", "VECTOR_SPACE: 06",
        f'<p class="mt-4 max-w-xl text-[16px] leading-[1.8] text-[#8C93A3]">Have an idea worth exploring? Open a channel and send a query.</p>'
        f'<div class="mt-12 grid lg:grid-cols-12 gap-12 items-start">'
        f'  <div class="lg:col-span-7 border-b border-[#202532]">{rows}</div>'
        f'  <div class="lg:col-span-5">'
        f'    <div class="f-mono flex items-center gap-3 border border-[#202532] bg-[#0D1018]/70 px-6 py-5">'
        f'      <span class="status-dot" aria-hidden="true"></span>'
        f'      <span class="text-[11px] tracking-[.18em] text-[#4ADE80]">SYSTEM ONLINE</span>'
        f'      <span class="ml-auto text-[10px] tracking-[.15em] text-[#5F6675]">ACCEPTING QUERIES</span>'
        f"    </div>"
        f"  </div>"
        f"</div>",
    )


def _latent_sections(pal, resume_data):
    section_map = {
        "identity": _latent_identity(pal, resume_data),
        "projects": _latent_projects(pal, resume_data),
        "features": _latent_features(pal, resume_data),
        "log": _latent_log(pal, resume_data),
        "trajectory": _latent_trajectory(pal, resume_data),
        "query": _latent_query(pal, resume_data),
    }
    section_map = {k: v for k, v in section_map.items() if v}
    return section_map, (
        "identity", "projects", "features", "log", "trajectory", "query",
    )


# ---------------------------------------------------------------------------
# NOVA//SPACE — futuristic AI world with a guide robot. Teal/amber on navy.
# Entirely custom builders; template slots {section_X} + {footer_links}.
# ---------------------------------------------------------------------------

def _nova_section(sec_id, num, name, meta, inner, display=None, aos=True):
    a = ' data-aos="fade-up"' if aos else ""
    d = display or name.replace("_", " ")
    return (
        f'<section id="{sec_id}" class="relative mx-auto max-w-7xl px-5 sm:px-8 py-20 md:py-28 border-t border-[#1B2540]"{a}>\n'
        f'  <div class="flex items-end justify-between gap-3">'
        f'    <div>'
        f'      <p class="f-mono text-[11px] tracking-[.26em] text-[#3EC6B4]">[ {num:02d} ] // {_h(name)}</p>'
        f'      <h2 class="f-disp mt-4 text-4xl md:text-5xl font-bold tracking-[-.02em]">{_h(d)}</h2>'
        f"    </div>"
        f'    <p class="f-mono text-[10px] tracking-[.22em] text-[#5C6B85] shrink-0">RUN: {_h(meta)}</p>'
        f"  </div>\n"
        f"  {inner}\n"
        f"</section>\n"
    )


def _nova_origin(pal, resume_data):
    name = (resume_data.get("name") or "").strip()
    summary = (resume_data.get("summary") or "").strip()
    if not name and not summary:
        return ""

    steps = []
    if summary:
        note = summary if len(summary) <= 88 else summary[:88] + "…"
        steps.append(("CURIOSITY", None, None))
        steps.append(("LEARNING", None, None))
        for e in (resume_data.get("education") or [])[:2]:
            steps[1] = ("LEARNING", (e.get("degree") or "Education").strip(),
                        " · ".join(str(x) for x in (e.get("institution"), e.get("year")) if x))
        for c in (resume_data.get("certifications") or [])[:1]:
            steps.append(("EXPERIMENTATION", (c.get("name") or "Training").strip(),
                          " · ".join(str(x) for x in (c.get("issuer"), c.get("year")) if x)))
        for e in (resume_data.get("experience") or [])[:1]:
            steps.append(("BUILDING", f"{e.get('role') or 'Engineer'} @ {e.get('company') or 'Studio'}".strip(),
                          (e.get("duration") or "").strip() or None))
        n_projects = len(resume_data.get("projects") or [])
        if n_projects:
            steps.append(("INTELLIGENCE", f"{n_projects:02d} systems built", "every experiment counts"))

    rows = ""
    if steps:
        chain = ""
        for i, (word, title, sub) in enumerate(steps, start=1):
            body = ""
            if title:
                body = f"<em>{_h(title)}</em>"
                if sub:
                    body += f' <span class="text-[#5C6B85]">· {_h(sub)}</span>'
            chain += (
                f'<li class="relative flex items-baseline gap-4 sm:gap-6 py-4">'
                f'<span class="f-mono text-[10px] tracking-[.14em] text-[#3EC6B4]">{{{i:02d}}}</span>'
                f'<span class="f-disp text-2xl md:text-3xl font-semibold tracking-tight">{_h(word)}</span>'
                f'<span class="f-mono text-[11px] text-[#93A0B8]">{body}</span>'
                f"</li>"
            )
        rows = (
            f'<div class="relative mt-10">'
            f'<svg class="d-line absolute left-[3px] top-6 bottom-6 w-px" width="2" height="100%">'
            f'<line x1="1" y1="0" x2="1" y2="100%" stroke="#3EC6B4" stroke-width="1" pathLength="1"/></svg>'
            f'<ol class="relative pl-12 sm:pl-14">{chain}</ol></div>'
        )

    return _nova_section(
        "origin", 1, "ORIGIN", "01",
        f'<div class="mt-12 grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">'
        f'  <div class="lg:col-span-5 lg:sticky lg:top-28">'
        f'    <p class="f-mono text-[10px] tracking-[.2em] text-[#5C6B85]">THE STORY</p>'
        f'    <p class="mt-6 f-disp text-2xl md:text-[1.7rem] leading-[1.4] text-[#93A0B8]">'
        f'      Every system begins as a single question. Then a notebook. Then a model.</p>'
        f'    <p class="mt-6 max-w-md text-[15px] leading-[1.8] text-[#93A0B8]">{_h(summary)}</p>'
        f'    <p class="f-mono mt-8 text-[11px] tracking-[.18em] text-[#3EC6B4]">&mdash; {_h(name or "The Builder")}</p>'
        f"  </div>"
        f'  <div class="lg:col-span-7">{rows}</div>'
        f"</div>",
    )


_NOVA_GROUP_LABEL = {
    "Coding languages": "LANGUAGE", "Frameworks": "ENGINEERING",
    "Version control": "TOOLING", "Databases": "DATA",
    "IDEs & editors": "TOOLING", "Cloud & DevOps": "INFRA",
    "Design tools": "DESIGN", "Other": "LAB",
}


def _nova_constellation(pal, resume_data):
    skills = resume_data.get("skills") or []
    if not skills:
        return ""
    groups = {}
    for s in skills:
        groups.setdefault(_skill_group(str(s)), []).append(str(s))

    panels = ""
    for g in _SKILL_GROUP_ORDER:
        items = [str(s) for s in groups.get(g, [])]
        if not items:
            continue
        items = items[:9]
        n = len(items)
        cat = _NOVA_GROUP_LABEL.get(g, g.upper())
        nodes = ""
        for i, s in enumerate(items):
            a = i * 360 / n - 90
            r = math.radians(a)
            nx, ny = 100 + 88 * math.cos(r), 100 + 88 * math.sin(r)
            lx, ly = 100 + 67 * math.cos(r), 100 + 67 * math.sin(r)
            accent = "#3EC6B4" if i % 2 == 0 else "#7FB6FF"
            nodes += (
                f'<line x1="100" y1="100" x2="{nx:.1f}" y2="{ny:.1f}" stroke="#1B2540" stroke-width="1"/>'
                f'<g class="orb-node"><circle cx="{nx:.1f}" cy="{ny:.1f}" r="5" fill="{accent}"/>'
                f'<text x="{lx:.1f}" y="{ly + 3:.1f}" class="f-mono" font-size="8" fill="#93A0B8" text-anchor="middle">{_h(s[:11])}</text></g>'
            )
        panels += (
            f'<div class="r-in ter p-5">'
            f'<div class="flex items-center justify-between mb-1">'
            f'<p class="f-mono text-[10px] tracking-[.2em] text-[#3EC6B4]">CLUSTER // {_h(cat)}</p>'
            f'<p class="f-mono text-[9px] tracking-[.16em] text-[#5C6B85]">N={n:02d}</p>'
            f"</div>"
            f'<svg viewBox="0 0 200 200" class="orb-g w-full h-auto" role="img" aria-label="{_h(cat)} cluster with {n} technology nodes">'
            f'<g class="ring-dash"><circle cx="100" cy="100" r="88" fill="none" stroke="#1B2540" stroke-width="1" stroke-dasharray="2 6"/></g>'
            f'<circle cx="100" cy="100" r="62" fill="none" stroke="#3EC6B4" stroke-opacity=".14"/>'
            f'<circle cx="100" cy="100" r="6" fill="#3EC6B4"/><circle cx="100" cy="100" r="13" fill="none" stroke="#3EC6B4" stroke-opacity=".35" stroke-dasharray="2 4"/>'
            f'<text x="100" y="132" class="f-mono" font-size="9" fill="#EEF2F8" text-anchor="middle" letter-spacing="1.5">{_h(cat[:10])}</text>'
            f'{nodes}</svg>'
            f"</div>"
        )
    return _nova_section(
        "constellation", 2, "AI CONSTELLATION", "02",
        f'<p class="mt-4 max-w-lg text-[14px] leading-relaxed text-[#5C6B85]">Technologies around me, mapped as orbiting clusters &mdash; each ring is an area I work across.</p>'
        f'<div class="mt-12 grid sm:grid-cols-2 gap-5">{panels}</div>',
    )


def _nova_arc(cx, cy, r, a1, a2):
    p1 = (cx + r * math.cos(math.radians(a1)), cy + r * math.sin(math.radians(a1)))
    p2 = (cx + r * math.cos(math.radians(a2)), cy + r * math.sin(math.radians(a2)))
    return f"M{p1[0]:.1f} {p1[1]:.1f} A{r} {r} 0 0 1 {p2[0]:.1f} {p2[1]:.1f}"


def _nova_universe(pal, resume_data):
    projects = resume_data.get("projects") or []
    if not projects:
        return ""
    items = projects[:7]
    n = len(items)

    rays = ""
    planets = ""
    for i, p in enumerate(items):
        a = -90 + i * 360 / n
        r = math.radians(a)
        x, y = 320 + 185 * math.cos(r), 240 + 185 * math.sin(r)
        pid = f"u{i}"
        accent = "#3EC6B4" if i % 2 == 0 else "#7FB6FF"
        name = (p.get("name") or "Untitled").strip()
        stack = ",".join(str(t) for t in (p.get("tech_stack") or []))
        rays += f'<line x1="320" y1="240" x2="{x:.1f}" y2="{y:.1f}" class="pray" data-src="{pid}" stroke="#1B2540" stroke-width="1"/>'
        planets += (
            f'<g class="planet" tabindex="0" role="button" data-id="{pid}" data-index="{i+1:03d}" '
            f'data-name="{_h(name)}" data-type="{_h(p.get("type") or "")}" data-status="{_h(p.get("status") or "")}" '
            f'data-year="{_h(p.get("year") or "")}" data-desc="{_h(p.get("description") or "")}" data-stack="{_h(stack)}" '
            f'data-link="{_h(p.get("link") or "#")}" aria-label="Inspect project: {_h(name)}">'
            f'<path class="orbit-ring-active" data-src="{pid}" d="{_nova_arc(320, 240, 185, a - 14, a + 14)}" fill="none" stroke="#1B2540" stroke-width="1.5"/>'
            f'<circle cx="{x:.1f}" cy="{y:.1f}" r="9" fill="none" stroke="{accent}" stroke-opacity=".4" stroke-dasharray="2 3"/>'
            f'<circle cx="{x:.1f}" cy="{y:.1f}" r="5.5" fill="{accent}"/>'
            f'<text x="{x:.1f}" y="{y + 26:.1f}" class="f-mono" font-size="9" fill="#93A0B8" text-anchor="middle">{_h(name[:16])}</text>'
            f'</g>'
        )

    deco = (
        '<circle cx="120" cy="90" r="1.6" fill="#5C6B85"/>'
        '<circle cx="540" cy="120" r="1.4" fill="#5C6B85"/>'
        '<circle cx="500" cy="380" r="1.6" fill="#F5B85C" opacity=".7"/>'
        '<circle cx="150" cy="360" r="1.3" fill="#5C6B85"/>'
        '<path d="M60 210 C 140 150 220 160 300 150" fill="none" stroke="#1D2A47" stroke-width="1"/>'
    )

    return _nova_section(
        "universe", 3, "PROJECT UNIVERSE", "03",
        f'<p class="mt-4 max-w-lg text-[14px] leading-relaxed text-[#5C6B85]">Systems I have built, orbiting a single core. Select a planet to scan it.</p>'
        f'<p class="f-mono mt-2 text-[10px] tracking-[.2em] text-[#3EC6B4]">SELECT A PLANET TO SCAN</p>'
        f'<div class="mt-10 field-grid relative border border-[#1B2540] bg-[#0B1020]/60 rounded-b-lg overflow-hidden">'
        f'<svg class="nu-field w-full h-auto max-h-[520px]" viewBox="0 0 640 480" aria-label="Projects mapped as planets orbiting a central core">'
        f'<circle cx="320" cy="240" r="185" fill="none" stroke="#1B2540" stroke-width="1" stroke-dasharray="3 7"/>'
        f'{deco}{rays}'
        f'<circle cx="320" cy="240" r="10" fill="#3EC6B4"/><circle cx="320" cy="240" r="20" fill="none" stroke="#3EC6B4" stroke-opacity=".35" stroke-dasharray="2 4"/>'
        f'<circle cx="320" cy="240" r="42" fill="none" stroke="#3EC6B4" stroke-opacity=".08"/>'
        f'<text x="320" y="272" class="f-mono" font-size="9" fill="#EEF2F8" text-anchor="middle" letter-spacing="2">CORE</text>'
        f'{planets}'
        f'<g class="f-mono" font-size="8" fill="#5C6B85"><text x="8" y="470">RING: 42.0</text><text x="560" y="470">N: {n:02d}</text></g>'
        f"</svg>"
        f'<p class="absolute bottom-3 left-5 f-mono text-[9px] tracking-[.18em] text-[#5C6B85]">SELECT NODE &rarr; SYSTEM SCAN</p>'
        f"</div>",
    )


def _nova_lab(pal, resume_data):
    entries = []
    for c in (resume_data.get("certifications") or []):
        entries.append(("TRAINING", (c.get("name") or "Certification").strip(),
                        (c.get("issuer") or "").strip(), (c.get("year") or "").strip(), "COMPLETED"))
    for e in (resume_data.get("education") or []):
        entries.append(("FOUNDATION", (e.get("degree") or "Education").strip(),
                        (e.get("institution") or "").strip(), (e.get("year") or "").strip(), "COMPLETED"))
    for p in (resume_data.get("projects") or []):
        st = (p.get("status") or "").strip()
        if not st:
            continue
        entries.append((str(p.get("type") or "EXPERIMENT").upper(), (p.get("name") or "Experiment").strip(),
                        ", ".join(str(t) for t in (p.get("tech_stack") or [])), (p.get("description") or "").strip(), st))
    if not entries:
        return ""

    cards = ""
    for i, (kind, title, method, result, status) in enumerate(entries[:8], start=1):
        color, stxt = _latent_log_status(status)
        rows = ""
        for label, val in (("OBJECTIVE", title), ("METHOD", method), ("RESULT", result)):
            if not val:
                continue
            rows += f'<div class="flex flex-col gap-1"><span class="f-mono text-[9px] tracking-[.18em] text-[#5C6B85]">{label}</span><span class="f-mono text-[12px] text-[#93A0B8]">{_h(val[:70])}</span></div>'
        cards += (
            f'<div class="ter p-0 r-in">'
            f'<div class="flex items-center justify-between border-b border-[#1B2540] px-4 py-2.5">'
            f'<span class="flex items-center gap-1.5" aria-hidden="true"><span class="h-2 w-2 rounded-full bg-[#22304F]"></span><span class="h-2 w-2 rounded-full bg-[#22304F]"></span><span class="h-2 w-2 rounded-full bg-[#3EC6B4]"></span></span>'
            f'<span class="f-mono text-[9px] tracking-[.16em] text-[#5C6B85]">lab/runs/0{i:02d}</span>'
            f'<span class="f-mono text-[9px] tracking-[.14em]" style="color:{color}">&#9679; {stxt}</span>'
            f"</div>"
            f'<div class="p-5">'
            f'<p class="f-mono text-[10px] tracking-[.2em] text-[#3EC6B4]">EXPERIMENT {i:03d} · {_h(kind)}</p>'
            f'<h3 class="f-disp mt-2 text-xl tracking-tight">{_h(title)}</h3>'
            f'<div class="mt-4 space-y-3">{rows}</div>'
            f"</div></div>"
        )
    return _nova_section(
        "lab", 4, "THE LAB", "04",
        f'<p class="mt-4 max-w-lg text-[14px] leading-relaxed text-[#5C6B85]">A live experiment ledger &mdash; foundations, training runs and open work.</p>'
        f'<div class="mt-12 grid sm:grid-cols-2 gap-5">{cards}</div>',
    )


def _nova_roadmap(pal, resume_data):
    stages = []
    edu = (resume_data.get("education") or [])[:2]
    if edu:
        stages.append(("FOUNDATION", [(f"{e.get('degree') or 'Education'}",
                                       " · ".join(str(x) for x in (e.get("institution"), e.get("year")) if x))
                                      for e in edu]))
    certs = (resume_data.get("certifications") or [])[:2]
    if certs:
        stages.append(("EXPERIMENTATION", [(c.get("name") or "Training",
                                            " · ".join(str(x) for x in (c.get("issuer"), c.get("year")) if x))
                                           for c in certs]))
    exps = (resume_data.get("experience") or [])[:2]
    if exps:
        stages.append(("PROFESSIONAL", [(f"{e.get('role') or 'Role'} @ {e.get('company') or 'Studio'}",
                                         e.get("duration") or "") for e in exps]))
    projs = (resume_data.get("projects") or [])[:3]
    if projs:
        stages.append(("APPLICATION", [(p.get("name") or "Project",
                                        " · ".join(str(x) for x in (p.get("type"), p.get("year")) if x))
                                       for p in projs]))
    groups = {}
    for s in (resume_data.get("skills") or []):
        groups.setdefault(_skill_group(str(s)), []).append(str(s))
    focus = [_NOVA_GROUP_LABEL.get(g, g.upper()) for g in _SKILL_GROUP_ORDER if g in groups][:3]
    if focus:
        stages.append(("CURRENT VECTOR", [(f, "active exploration") for f in focus]))
    if len(stages) < 2:
        return ""

    steps = ""
    for i, (kind, rows) in enumerate(stages, start=1):
        side = "md:col-start-1" if i % 2 else "md:col-start-2"
        lines = "".join(
            f'<li class="flex justify-between gap-4 py-1.5"><span class="text-[#93A0B8]">{_h(m)}</span>'
            + (f'<span class="text-[#3EC6B4]">{_h(y)}</span>' if y else "")
            + "</li>"
            for m, y in rows
        )
        steps += (
            f'<li class="relative grid md:grid-cols-2 gap-6 py-8">'
            f'<span class="absolute left-5 md:left-1/2 top-6 -translate-x-1/2 h-3.5 w-3.5 rounded-full border-2 border-[#3EC6B4] bg-[#0B1020] z-10" aria-hidden="true"></span>'
            f'<div class="{side} ter p-6 r-in">'
            f'<p class="f-mono text-[10px] tracking-[.2em] text-[#3EC6B4]">STAGE / 0{i}</p>'
            f'<h3 class="f-disp mt-2 text-2xl font-semibold tracking-tight">{_h(kind)}</h3>'
            f'<ul class="mt-4 f-mono text-[12px] divide-y divide-[#1B2540]/70">{lines}</ul>'
            f"</div></li>"
        )
    spine = (
        f'<svg class="d-line absolute left-5 md:left-1/2 top-4 bottom-4 w-px -translate-x-1/2" width="2" height="100%">'
        f'<line x1="1" y1="0" x2="1" y2="100%" stroke="#3EC6B4" stroke-opacity=".5" stroke-width="1" pathLength="1"/></svg>'
    )
    return _nova_section(
        "roadmap", 5, "MODEL TRAINING ROADMAP", "05",
        f'<p class="mt-4 max-w-lg text-[14px] leading-relaxed text-[#5C6B85]">The training path &mdash; each stage lit only when it has been reached.</p>'
        f'<div class="relative mt-10">{spine}<ol>{steps}</ol></div>',
    )


_NOVA_BUILD = [
    ("IDEA", ("Concept", "Constraints", "Sketch")),
    ("DATA", ("Collection", "Cleaning", "Exploration")),
    ("EXPERIMENT", ("Baselines", "Hypotheses", "Iteration")),
    ("MODEL", ("Architecture", "Training", "Fine-tune")),
    ("EVALUATE", ("Metrics", "Error analysis", "Testing")),
    ("DEPLOY", ("API", "Application", "Monitoring")),
    ("ITERATE", ("Feedback", "Retrain", "Ship")),
]


def _nova_build(pal, resume_data):
    cells = ""
    for i, (stage, inner) in enumerate(_NOVA_BUILD):
        bullets = "".join(f'<li class="flex items-center gap-2"><span class="h-1 w-1 rounded-full bg-[#3EC6B4]" aria-hidden="true"></span>{_h(b)}</li>' for b in inner)
        cells += (
            f'<details class="stg ter p-5 r-in group" style="transition-delay:{i * 80}ms">'
            f'<summary class="list-none cursor-pointer flex items-center justify-between">'
            f'<span class="flex items-center gap-3">'
            f'<span class="f-mono text-[10px] text-[#5C6B85]">0{i+1}</span>'
            f'<span class="f-disp text-lg font-semibold tracking-tight">{_h(stage)}</span>'
            f'</span>'
            f'<span class="chev text-[#3EC6B4] transition-transform" aria-hidden="true">&#9654;</span>'
            f"</summary>"
            f'<ul class="mt-4 pt-4 border-t border-[#1B2540] f-mono text-[11px] text-[#93A0B8] space-y-2">{bullets}</ul>'
            f"</details>"
        )
    return _nova_section(
        "build", 6, "HOW I BUILD", "06",
        f'<p class="mt-4 max-w-lg text-[14px] leading-relaxed text-[#5C6B85]">The method behind the machines &mdash; open each stage to inspect the process.</p>'
        f'<div class="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{cells}</div>',
    )


def _nova_tech_slug(name):
    base = str(name).strip().lower()
    table = {
        "python": "python", "javascript": "javascript", "typescript": "typescript", "java": "java",
        "c++": "cpp", "cplusplus": "cpp", "c": "c", "c sharp": "csharp", "c#": "csharp",
        "go": "go", "rust": "rust", "sql": "sql", "html": "html", "css": "css",
        "react": "react", "node.js": "nodejs", "node": "nodejs", "next.js": "nextjs", "nextjs": "nextjs",
        "django": "django", "flask": "flask", "fastapi": "fastapi", "express": "express",
        "git": "git", "github": "github", "docker": "docker", "kubernetes": "kubernetes", "k8s": "kubernetes",
        "aws": "aws", "gcp": "gcp", "azure": "azure", "mongodb": "mongodb", "mongo": "mongodb",
        "postgresql": "postgres", "postgres": "postgres", "mysql": "mysql", "redis": "redis",
        "tensorflow": "tensorflow", "pytorch": "pytorch", "torch": "pytorch", "opencv": "opencv",
        "numpy": "numpy", "pandas": "pandas", "tailwind": "tailwind", "vite": "vite",
        "linux": "linux", "bash": "bash", "graphql": "graphql", "figma": "figma", "android": "android",
    }
    return table.get(base)


def _nova_ecosystem(pal, resume_data):
    skills = resume_data.get("skills") or []
    if not skills:
        return ""
    groups = {}
    for s in skills:
        groups.setdefault(_skill_group(str(s)), []).append(str(s))
    cols = ""
    for g in _SKILL_GROUP_ORDER:
        items = [str(s) for s in groups.get(g, [])]
        if not items:
            continue
        cat = _NOVA_GROUP_LABEL.get(g, g.upper())
        icons = ""
        for s in items:
            slug = _nova_tech_slug(s)
            if slug:
                icons += (
                    f'<img src="https://skillicons.dev/icons?i={slug}&theme=dark" alt="{_h(s)}" width="44" height="44" '
                    f'title="{_h(s)} · {_h(cat)}" loading="lazy" class="transition-transform hover:scale-110 hover:drop-shadow-[0_0_6px_rgba(62,198,180,.65)]"/>'
                )
            else:
                icons += f'<span class="f-mono border border-[#1B2540] px-2.5 py-1.5 text-[11px] text-[#93A0B8] rounded-sm">{_h(s)}</span>'
        cols += (
            f'<div class="r-in ter p-6">'
            f'<p class="f-mono text-[10px] tracking-[.2em] text-[#3EC6B4]">{_h(cat)}</p>'
            f'<div class="my-3 h-px w-full" style="background:linear-gradient(90deg,rgba(62,198,180,.5),transparent)"></div>'
            f'<div class="flex flex-wrap items-center gap-2.5">{icons}</div>'
            f"</div>"
        )
    return _nova_section(
        "ecosystem", 7, "TECH ECOSYSTEM", "07",
        f'<p class="mt-4 max-w-lg text-[14px] leading-relaxed text-[#5C6B85]">The technologies in my ecosystem, grouped by the systems they power.</p>'
        f'<div class="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{cols}</div>',
    )


def _nova_state(pal, resume_data):
    mode = []
    if resume_data.get("projects"):
        mode.append("EXPERIMENTING")
    if resume_data.get("experience"):
        mode.append("BUILDING")
    if resume_data.get("education") or resume_data.get("certifications"):
        mode.append("LEARNING")
    if not mode:
        return ""
    mode_dots = "".join(
        f'<li class="flex items-center gap-2.5 py-1"><span class="dot-on" aria-hidden="true"></span><span class="f-mono text-[12px] text-[#EEF2F8]">{_h(m)}</span></li>'
        for m in mode
    )
    groups = {}
    for s in (resume_data.get("skills") or []):
        groups.setdefault(_skill_group(str(s)), []).append(str(s))
    focus = [_NOVA_GROUP_LABEL.get(g, g.upper()) for g in _SKILL_GROUP_ORDER if g in groups][:4]
    focus_html = "".join(f'<li class="f-mono text-[12px] text-[#93A0B8] py-1">{_h(f)}</li>' for f in focus) if focus else '<li class="f-mono text-[12px] text-[#5C6B85]">—</li>'
    nxt = []
    if resume_data.get("certifications"):
        nxt.append("RESEARCH")
    if resume_data.get("experience"):
        nxt.append("DEPLOYMENT")
    if (resume_data.get("contact") or {}).get("github"):
        nxt.append("OPEN SOURCE")
    nxt_html = "".join(f'<li class="f-mono text-[12px] text-[#3EC6B4] py-1">&#9654; {_h(x)}</li>' for x in nxt) if nxt else '<li class="f-mono text-[12px] text-[#5C6B85]">&#9654; EXPLORATION</li>'
    return _nova_section(
        "state", 8, "CURRENT STATE", "08",
        f'<div class="mt-12 ter p-0 r-in">'
        f'<div class="flex items-center justify-between border-b border-[#1B2540] px-6 py-3">'
        f'<span class="f-mono text-[10px] tracking-[.22em] text-[#3EC6B4]">SYSTEM STATE</span>'
        f'<span class="f-mono text-[9px] tracking-[.16em] text-[#5C6B85]">MODEL: NOVA//SPACE</span>'
        f"</div>"
        f'<div class="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#1B2540]">'
        f'<div class="p-6"><p class="f-mono text-[10px] tracking-[.2em] text-[#5C6B85] mb-3">ACTIVE MODES</p><ul>{mode_dots}</ul></div>'
        f'<div class="p-6"><p class="f-mono text-[10px] tracking-[.2em] text-[#5C6B85] mb-3">CURRENT FOCUS</p><ul>{focus_html}</ul></div>'
        f'<div class="p-6"><p class="f-mono text-[10px] tracking-[.2em] text-[#5C6B85] mb-3">NEXT VECTOR</p><ul>{nxt_html}</ul></div>'
        f"</div></div>",
    )


def _nova_vector(pal, resume_data):
    groups = {}
    for s in (resume_data.get("skills") or []):
        groups.setdefault(_skill_group(str(s)), []).append(str(s))
    focus = [_NOVA_GROUP_LABEL.get(g, g.upper()) for g in _SKILL_GROUP_ORDER if g in groups][:3]
    words = "".join(f'<span class="f-disp text-lg md:text-xl font-semibold text-[#3EC6B4]">{_h(w)}</span>' for w in focus) if focus else '<span class="f-disp text-lg text-[#3EC6B4]">EXPLORATION</span>'
    return _nova_section(
        "vector", 9, "NEXT VECTOR", "09",
        f'<div class="mt-12 grid lg:grid-cols-2 gap-12 items-center">'
        f'<div>'
        f'<p class="f-mono text-[11px] tracking-[.22em] text-[#5C6B85]">FROM THE CURRENT STATE</p>'
        f'<p class="f-disp mt-6 text-3xl md:text-4xl font-bold tracking-tight leading-[1.15]">The space keeps <span class="text-[#3EC6B4]">expanding</span>.</p>'
        f'<p class="mt-5 max-w-md text-[14px] leading-relaxed text-[#93A0B8]">The direction of my training &mdash; wherever the data leads next.</p>'
        f'<div class="mt-8 flex flex-wrap gap-4">{words}</div>'
        f"</div>"
        f'<div class="field-grid relative border border-[#1B2540] bg-[#0B1020]/60 rounded-b-lg overflow-hidden p-6">'
        f'<svg viewBox="0 0 460 220" class="w-full h-auto" role="img" aria-label="Trajectory heading toward a next vector node">'
        f'<path class="d-line" d="M40 180 C 150 120 250 100 360 60" fill="none" stroke="#3EC6B4" stroke-width="1.5" pathLength="1"/>'
        f'<circle cx="40" cy="180" r="4" fill="#F5B85C"/><text x="52" y="196" class="f-mono" font-size="9" fill="#5C6B85">NOW</text>'
        f'<circle cx="360" cy="60" r="7" fill="#3EC6B4"/><circle cx="360" cy="60" r="15" fill="none" stroke="#3EC6B4" stroke-opacity=".4" stroke-dasharray="2 4"/>'
        f'<text x="376" y="52" class="f-mono" font-size="9" fill="#EEF2F8">NEXT &mdash;&gt;</text>'
        f'<g class="f-mono" font-size="8" fill="#5C6B85"><text x="8" y="20">VECT v0.3</text><text x="360" y="214">+SIGMA</text></g>'
        f"</svg></div>"
        f"</div>",
    )


def _nova_connect(pal, resume_data):
    contact = resume_data.get("contact", {})
    rows = ""
    for label, href, text in (
        ("EMAIL", f"mailto:{contact.get('email', '')}", contact.get("email")),
        ("GITHUB", contact.get("github"), contact.get("github")),
        ("LINKEDIN", contact.get("linkedin"), contact.get("linkedin")),
    ):
        if not text:
            continue
        target = ' target="_blank" rel="noopener"' if str(href).startswith("http") else ""
        rows += (
            f'<a class="group flex items-center justify-between gap-6 border-t border-[#1B2540] -mx-3 px-3 py-5 hover:bg-white/[.02] transition-colors" href="{_url(href)}"{target}>'
            f'<span class="f-mono text-[10px] tracking-[.2em] text-[#3EC6B4]">{_h(label)}</span>'
            f'<span class="f-mono text-[12px] text-[#93A0B8] break-all group-hover:text-[#EEF2F8] transition-colors">{_h(text)}</span>'
            f'<span class="text-[#3EC6B4] opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">&#8599;</span>'
            f"</a>"
        )
    email = contact.get("email", "")
    form = ""
    if email:
        form = (
            f'<form id="nc-form" class="f-mono mt-2" data-to="{_h(email)}">'
            f'<label class="block mb-2 text-[10px] tracking-[.2em] text-[#5C6B85]" for="nc-name">NAME</label>'
            f'<input id="nc-name" name="name" type="text" required class="n-input mb-5" placeholder="Ada Lovelace">'
            f'<label class="block mb-2 text-[10px] tracking-[.2em] text-[#5C6B85]" for="nc-email">EMAIL</label>'
            f'<input id="nc-email" name="email" type="email" required class="n-input mb-5" placeholder="ada@example.com">'
            f'<label class="block mb-2 text-[10px] tracking-[.2em] text-[#5C6B85]" for="nc-msg">MESSAGE</label>'
            f'<textarea id="nc-msg" name="message" rows="4" required class="n-input mb-6 resize-none" placeholder="What should we build?"></textarea>'
            f'<button id="nc-send" type="submit" class="btn w-full justify-center">Initialize Connection</button>'
            f'<ol id="nc-status" class="hidden mt-6 space-y-2 text-[11px] tracking-[.1em] text-[#93A0B8]">'
            f'<li class="opacity-0 transition-opacity duration-500">CONNECTION REQUESTED</li>'
            f'<li class="opacity-0 transition-opacity duration-500">ESTABLISHING CHANNEL&hellip;</li>'
            f'<li class="opacity-0 transition-opacity duration-500 text-[#3EC6B4]">&#9679; CHANNEL OPEN</li>'
            f'</ol></form>'
        )
    if not rows and not form:
        return ""
    return _nova_section(
        "connect", 10, "OPEN CONNECTION", "10",
        f'<div class="mt-12 grid lg:grid-cols-12 gap-12 items-start">'
        f'<div class="lg:col-span-6">'
        f'<p class="f-disp text-2xl md:text-3xl font-semibold tracking-tight leading-[1.2]">Establish a channel to the space.</p>'
        f'<p class="mt-4 max-w-md text-[14px] leading-relaxed text-[#93A0B8]">Questions, ideas or experiments &mdash; every good system starts with a signal.</p>'
        f'<div class="mt-8 border-b border-[#1B2540]">{rows}</div>'
        f"</div>"
        f'<div class="lg:col-span-6">{form or ""}</div>'
        f"</div>",
    )


def _nova_guide(pal, resume_data):
    name = (resume_data.get("name") or "").strip()
    return (
        f'<section id="guide" class="mx-auto max-w-7xl px-5 sm:px-8 py-20 md:py-24 border-t border-[#1B2540]" data-aos="fade-up">'
        f'<div class="robo-return border border-[#1B2540] bg-[#0B1020]/60 rounded-b-lg px-8 py-8 flex flex-col sm:flex-row items-center gap-8">'
        f'<div class="shrink-0">'
        f'<svg viewBox="0 0 200 170" class="w-36 sm:w-40 h-auto" role="img" aria-label="NOVA, the guide robot, waves goodbye">'
        f'<ellipse cx="100" cy="162" rx="52" ry="6" fill="#000" opacity=".4"/>'
        f'<line x1="82" y1="96" x2="118" y2="96" stroke="#1B2540" stroke-width="2"/>'
        f'<circle cx="100" cy="93" r="4" fill="#F5B85C" class="ant"/>'
        f'<g class="arm-l" style="transform-origin:68px 122px"><line x1="68" y1="122" x2="54" y2="146" stroke="#16203A" stroke-width="9" stroke-linecap="round"/><circle cx="53" cy="154" r="6" fill="#3EC6B4"/></g>'
        f'<rect x="60" y="96" width="80" height="58" rx="16" fill="#0E1425" stroke="#2A3757" stroke-width="2"/>'
        f'<rect x="70" y="112" width="60" height="28" rx="10" fill="#060A13" stroke="#22304F"/>'
        f'<ellipse class="eye glow" cx="84" cy="126" rx="6" ry="7.5" fill="#3EC6B4"/>'
        f'<ellipse class="eye glow" cx="116" cy="126" rx="6" ry="7.5" fill="#3EC6B4"/>'
        f'<path d="M88 140 h24" stroke="#2A3757" stroke-width="2.5" stroke-linecap="round"/>'
        f'<rect x="30" y="126" width="18" height="26" rx="8" fill="#111729" stroke="#2A3757"/>'
        f'<rect x="152" y="126" width="18" height="26" rx="8" fill="#111729" stroke="#2A3757"/>'
        f"</svg></div>"
        f'<div class="text-center sm:text-left">'
        f'<p class="f-mono text-[10px] tracking-[.22em] text-[#3EC6B4]">THE GUIDE</p>'
        f'<p class="f-disp mt-2 text-xl md:text-2xl font-semibold tracking-tight">Ready when you are.</p>'
        f'<p class="mt-2 f-mono text-[12px] text-[#93A0B8]">{"NOVA has seen the whole space." if not name else f"NOVA has guided you through {name}'s space."}</p>'
        f"</div></div>"
        f"</section>"
    )


def _nova_sections(pal, resume_data):
    section_map = {
        "origin": _nova_origin(pal, resume_data),
        "constellation": _nova_constellation(pal, resume_data),
        "universe": _nova_universe(pal, resume_data),
        "lab": _nova_lab(pal, resume_data),
        "roadmap": _nova_roadmap(pal, resume_data),
        "build": _nova_build(pal, resume_data),
        "ecosystem": _nova_ecosystem(pal, resume_data),
        "state": _nova_state(pal, resume_data),
        "vector": _nova_vector(pal, resume_data),
        "connect": _nova_connect(pal, resume_data),
    }
    guide = _nova_guide(pal, resume_data)
    section_map = {k: v for k, v in section_map.items() if v}
    section_map["guide"] = guide
    return section_map, (
        "origin", "constellation", "universe", "lab", "roadmap",
        "build", "ecosystem", "state", "vector", "connect", "guide",
    )


def _sakura_sections(pal, resume_data):
    section_map = {
        "about": _sakura_about(pal, resume_data),
        "projects": _sakura_projects_section(pal, resume_data),
        "skills": _sakura_skills_section(pal, resume_data),
        "journey": _sakura_journey(pal, resume_data),
    }
    section_map = {k: v for k, v in section_map.items() if v}
    section_map["contact"] = _sakura_contact_section(resume_data.get("contact", {}))
    return section_map, ("about", "projects", "skills", "journey", "contact")


def _build_sections(theme, pal, resume_data):
    if theme == "lotus":
        return _lotus_sections(pal, resume_data)
    if theme == "sakura":
        return _sakura_sections(pal, resume_data)
    if theme == "latent":
        return _latent_sections(pal, resume_data)
    if theme == "nova":
        return _nova_sections(pal, resume_data)
    titles = {**_SECTION_TITLES, **(pal.get("titles") or {})}
    ids = pal.get("ids") or {}
    proj_builder = _core_proj_items if theme == "core" else _proj_items
    wraps = {"experience": pal["exp_wrap"]}
    if theme == "core":
        wraps["projects"] = "core-systems-grid"

    content = {
        "experience": _exp_items(resume_data.get("experience", []), pal),
        "skills": _skill_items(resume_data.get("skills", []), pal),
        "education": _edu_items(resume_data.get("education", []), pal),
        "projects": proj_builder(resume_data.get("projects", []), pal),
        "certifications": _cert_items(resume_data.get("certifications", []), pal),
        "languages": _lang_items(resume_data.get("languages", []), pal),
    }

    order = _CORE_ORDER if theme == "core" else _SECTION_ORDER
    section_map = {}
    for i, sid in enumerate(order):
        section_map[sid] = _section(
            ids.get(sid, sid),
            titles[sid],
            _SECTION_ICONS[sid],
            content[sid],
            pal,
            wraps.get(sid, ""),
            i * 60,
        )
    if theme == "core":
        section_map["about"] = _about_block(pal, resume_data)
    return section_map, order


def generate_portfolio_zip(resume_data: dict, stack: str, theme: str):
    template_map = {
        "professional": "professional_html.html",
        "creative": "creative_html.html",
        "core": "core_html.html",
        "lotus": "lotus_html.html",
        "sakura": "sakura_html.html",
        "latent": "latent_html.html",
        "nova": "nova_html.html",
    }
    filename = template_map.get(theme, "minimalist_html.html")
    template_path = os.path.join(os.path.dirname(__file__), '..', 'templates', filename)
    with open(template_path, 'r', encoding='utf-8') as f:
        html = f.read()

    for key in ("contact", "skills", "experience", "education", "projects", "certifications", "languages"):
        if resume_data.get(key) is None:
            resume_data[key] = [] if key != "contact" else {}

    pal = _STYLE.get(theme, _STYLE["professional"])
    section_map, order = _build_sections(theme, pal, resume_data)

    contact = resume_data.get("contact", {})
    html = html.replace("{name}",         _h(resume_data.get("name", "My Portfolio")))
    html = html.replace("{title}",        _h(resume_data.get("title", "Professional")))
    html = html.replace("{summary}",      _h(resume_data.get("summary", "")))
    html = html.replace("{email}",        _h(contact.get("email", "")))
    html = html.replace("{linkedin}",     _h(contact.get("linkedin", "#")))
    html = html.replace("{github}",       _h(contact.get("github", "#")))
    html = html.replace("{all_sections}", "\n".join(section_map[s] for s in order if s in section_map))
    for sid, section_html in section_map.items():
        html = html.replace(f"{{section_{sid}}}", section_html)
    html = html.replace("{contact_meta}", _contact_meta(pal, contact))
    html = html.replace("{lotus_contact_rows}", _lotus_contact_rows(contact))

    footer_links = ""
    for label, href in (("GITHUB", contact.get("github")), ("LINKEDIN", contact.get("linkedin")), ("EMAIL", contact.get("email"))):
        if not href:
            continue
        href = f"mailto:{href}" if label == "EMAIL" else href
        target = ' target="_blank" rel="noopener"' if str(href).startswith("http") else ""
        footer_links += f'<a class="hover:text-[#F4F5F7] transition-colors" href="{_url(href)}"{target}>{label}</a>'
    html = html.replace("{footer_links}", footer_links)

    html = re.sub(r"\{section_[a-z]+\}", "", html)

    readme = f"""# {resume_data.get('name', 'Portfolio')}

## Deploy to Vercel or GitHub Pages for free:
1. Create a free account on GitHub.com.
2. Create a new repository and upload `index.html`.
3. Go to Repository Settings -> Pages, select 'main' branch to deploy instantly!
"""
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as z:
        z.writestr("index.html", html)
        z.writestr("README.md", readme)
    return zip_buffer.getvalue(), html
