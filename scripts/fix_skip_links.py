from pathlib import Path

root = Path(__file__).resolve().parents[1]
old = (
    '<a href="#main" class="btn btn-ghost" style="position:absolute;left:-9999px;top:0;z-index:200" '
    "onfocus=\"this.style.left='1rem';this.style.top='1rem'\" "
    "onblur=\"this.style.left='-9999px'\">К содержанию</a>"
)
new = '<a href="#main" class="btn btn-ghost skip-link">К содержанию</a>'
count = 0
for p in root.rglob("*.html"):
    text = p.read_text(encoding="utf-8")
    if old in text:
        p.write_text(text.replace(old, new), encoding="utf-8")
        count += 1
print(f"updated {count} files")
