
import zipfile
import xml.etree.ElementTree as ET
import sys
import re
from pathlib import Path

NS = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
}

def normalize(text):
    """Remove whitespace and common punctuation for comparison."""
    # Remove whitespace
    text = re.sub(r'\s+', '', text)
    # Remove some punctuation that might vary (full width/half width space is handled by \s)
    # Maybe strict comparison is better?
    # If we regenerate narration, we want to know if the TEXT changed.
    # "Hello." vs "Hello" -> same audio usually.
    # But let's stick to simple whitespace normalization first.
    return text

def extract_docx_paragraphs(docx_path):
    try:
        with zipfile.ZipFile(docx_path, 'r') as z:
            xml_content = z.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            body = tree.find('.//w:body', NS)
            
            pars = []
            for p in body.findall('.//w:p', NS):
                texts = [t.text for t in p.findall('.//w:t', NS) if t.text]
                full_text = "".join(texts).strip()
                if full_text:
                    pars.append(full_text)
            return pars
    except Exception as e:
        print(f"Error reading docx: {e}")
        return []

def clean_line_for_narration(line):
    """Check if a line should be included in narration."""
    # Skip Header lines
    if re.match(r'^【.+】$', line):
        return None
    if re.match(r'^\*\*.+\*\*$', line):
        return None
    if re.match(r'^#+\s', line):
        return None
    if "修正箇所と" in line or "テロップ用出典" in line:
        return None
    return line

def clean_paragraph_text(text):
    """Clean specific patterns within a paragraph."""
    # Handle "Original Text —— Translation"
    # Example: "Foreign"——「Japanese」
    # Pattern: quoted text followed by —— followed by Japanese quote
    match = re.search(r'".+"[—―-]+(「.+」)', text)
    if match:
        return match.group(1)
    return text

def extract_md_paragraphs(md_path):
    pars = []
    current_par = []
    
    with open(md_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            
            # Stop sections
            if "修正箇所と" in line or "追加の整合性チェック" in line or "修正対応まとめ" in line or "修正対応" in line:
                break
                
            if not line:
                if current_par:
                    full_text = "".join(current_par)
                    cleaned = clean_paragraph_text(full_text)
                    if cleaned:
                        pars.append(cleaned)
                    current_par = []
                continue
            
            # Check if line is valid content
            if clean_line_for_narration(line):
                # Also skip separators if any
                if line.startswith('---'): continue
                if line.startswith('|'): continue
                
                current_par.append(line)
            
    if current_par:
        full_text = "".join(current_par)
        cleaned = clean_paragraph_text(full_text)
        if cleaned:
            pars.append(cleaned)
            
    return pars

def main():
    if len(sys.argv) < 3:
        print("Usage: python diff_narration.py <md_file> <docx_file>")
        sys.exit(1)

    md_path = sys.argv[1]
    docx_path = sys.argv[2]
    
    # 1. Get Old Paragraphs
    old_pars = extract_docx_paragraphs(docx_path)
    old_pars_norm = set(normalize(p) for p in old_pars)
    
    # 2. Get New Paragraphs
    new_pars = extract_md_paragraphs(md_path)
    
    # 3. Find Diff
    diff_pars = []
    for p in new_pars:
        p_norm = normalize(p)
        if p_norm not in old_pars_norm:
            diff_pars.append(p)
            
    # Output result to file and stdout
    output_path = "diff_narration.txt"
    with open(output_path, "w", encoding='utf-8') as f:
        for p in diff_pars:
            f.write(p + "\n\n")
            print(f"I found a changed paragraph: {p[:30]}...")

    print(f"\nSaved diff narration to {output_path}")

if __name__ == "__main__":
    main()
