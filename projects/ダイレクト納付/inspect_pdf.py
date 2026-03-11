import fitz

pdf_path = "/Users/delaxpro/src/ダイレクト納付/direct_tax.pdf"
doc = fitz.open(pdf_path)

for page in doc:
    for widget in page.widgets():
        print(f"Field Name: {widget.field_name}, Type: {widget.field_type}, Rect: {widget.rect}")
