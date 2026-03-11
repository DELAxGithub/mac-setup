
import zipfile
import xml.etree.ElementTree as ET
import sys
import re

NS = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
}

def extract_text_from_docx(docx_path):
    try:
        with zipfile.ZipFile(docx_path, 'r') as z:
            xml_content = z.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            body = tree.find('.//w:body', NS)
            
            pars = []
            for p in body.findall('.//w:p', NS):
                texts = [t.text for t in p.findall('.//w:t', NS) if t.text]
                if texts:
                    pars.append("".join(texts))
            return pars
    except Exception as e:
        return [f"Error: {e}"]

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python inspect_docx.py <docx_file>")
        sys.exit(1)
        
    lines = extract_text_from_docx(sys.argv[1])
    for line in lines[:20]: # Print first 20 lines to check structure
        print(line)
