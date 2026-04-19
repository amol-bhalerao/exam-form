from pypdf import PdfReader
p = r"c:\Users\UT\OneDrive\Desktop\hsc_exam\HSC BOARD EXAM-BLANK FORM (1).pdf"
r = PdfReader(p)
out = []
for i, pg in enumerate(r.pages, start=1):
    out.append(f"\n--- PAGE {i} ---\n" + (pg.extract_text() or ""))
with open(r"c:\Users\UT\OneDrive\Desktop\hsc_exam\hsc_blank_form_extracted.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out))
print("pages", len(r.pages))
