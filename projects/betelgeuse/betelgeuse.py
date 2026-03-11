import argparse
import csv
import os
import sys
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path

# Namespaces for parsing Word XML
NS = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'w14': 'http://schemas.microsoft.com/office/word/2010/wordml',
    'w15': 'http://schemas.microsoft.com/office/word/2012/wordml',
}

def parse_docx(docx_path):
    """
    Extracts comments and associated text from a .docx file.
    """
    comments_data = []
    
    try:
        with zipfile.ZipFile(docx_path, 'r') as z:
            # Check for required files
            file_list = z.namelist()
            if 'word/comments.xml' not in file_list:
                print(f"No comments found in {docx_path}")
                return []

            # 1. Parse comments content
            comments_xml = z.read('word/comments.xml')
            comments_root = ET.fromstring(comments_xml)
            
            comments_map = {}
            for comment in comments_root.findall('.//w:comment', NS):
                c_id = comment.get(f"{{{NS['w']}}}id")
                author = comment.get(f"{{{NS['w']}}}author", "Unknown")
                date_str = comment.get(f"{{{NS['w']}}}date", "")
                
                # Extract comment text
                text_parts = []
                for t in comment.findall('.//w:t', NS):
                    if t.text:
                        text_parts.append(t.text)
                comment_text = "".join(text_parts)
                
                comments_map[c_id] = {
                    'id': c_id,
                    'author': author,
                    'date': date_str,
                    'comment_text': comment_text,
                    'target_text': "",
                    'reply_comments': [] # Placeholder
                }

            # 2. Parse document to find target text (referenced by comment ranges)
            # This is complex because ranges can span paragraphs.
            # We will try a simplified linear scan or extraction method.
            # Because XML parsing gives a tree, finding text between Start and End tags 
            # (which are empty elements) requires traversing the document order.
            
            document_xml = z.read('word/document.xml')
            doc_root = ET.fromstring(document_xml)
            body = doc_root.find('.//w:body', NS)
            
            # We will iterate through all paragraphs and runs to build the logical text map
            # and simultaneously check for comment ranges.
            
            # State tracking: which comment IDs are currently "open" (inside start/end range)
            active_ranges = {} # {id: [list of text chunks]}
            
            # Helper to recurse or iterate
            def extract_text_and_ranges(element):
                tag = element.tag
                if tag == f"{{{NS['w']}}}commentRangeStart":
                    c_id = element.get(f"{{{NS['w']}}}id")
                    if c_id in comments_map:
                        active_ranges[c_id] = []
                elif tag == f"{{{NS['w']}}}commentRangeEnd":
                    c_id = element.get(f"{{{NS['w']}}}id")
                    if c_id in active_ranges:
                        # Join collected text and store in comments_map
                        full_text = "".join(active_ranges[c_id])
                        comments_map[c_id]['target_text'] = full_text
                        del active_ranges[c_id]
                elif tag == f"{{{NS['w']}}}t":
                    text = element.text or ""
                    # Append text to all active ranges
                    for c_id in active_ranges:
                        active_ranges[c_id].append(text)
                
                # Recurse children
                for child in element:
                    extract_text_and_ranges(child)
            
            extract_text_and_ranges(body)


            # 3. Handle replies (commentsExtended) if exists
            para_id_map = {} # paraId -> cid
            parent_link_map = {} # cid -> parent_paraId
            
            if 'word/commentsExtended.xml' in file_list:
                try:
                    ext_xml = z.read('word/commentsExtended.xml')
                    ext_root = ET.fromstring(ext_xml)
                    
                    for comment_ex in ext_root.findall('.//w15:commentEx', NS):
                        cid = comment_ex.get(f"{{{NS['w15']}}}cid")
                        para_id = comment_ex.get(f"{{{NS['w15']}}}paraId")
                        para_id_parent = comment_ex.get(f"{{{NS['w15']}}}paraIdParent")
                        
                        if cid and para_id:
                            para_id_map[para_id] = cid
                        
                        if cid and para_id_parent:
                            parent_link_map[cid] = para_id_parent
                            
                except Exception as e:
                    print(f"Warning: Failed to parse commentsExtended.xml: {e}")

            # Resolve parent links and nest comments
            child_ids = set()
            
            # Link children to parents
            for cid_child, parent_para_id in parent_link_map.items():
                if parent_para_id in para_id_map:
                    cid_parent = para_id_map[parent_para_id]
                    if cid_parent in comments_map and cid_child in comments_map:
                        comments_map[cid_parent]['reply_comments'].append(comments_map[cid_child])
                        child_ids.add(cid_child)

            # Determine final order (Appearance order of Top-Level comments)
            appearance_order = []
            def find_order(element):
                if element.tag == f"{{{NS['w']}}}commentRangeStart":
                     c_id = element.get(f"{{{NS['w']}}}id")
                     # We only care about this ID if it is a top-level comment (or we handle bubbling later)
                     # But anchor usually belongs to the parent (or both share same range).
                     if c_id in comments_map and c_id not in appearance_order:
                         appearance_order.append(c_id)
                for child in element:
                    find_order(child)
            find_order(body)
            
            final_ordered_comments = []
            seen_ids = set()
            
            # Add sorted top-level comments
            for c_id in appearance_order:
                if c_id in comments_map and c_id not in child_ids:
                    final_ordered_comments.append(comments_map[c_id])
                    seen_ids.add(c_id)
            
            # Add remaining top-level comments not found in doc order
            for c_id, data in comments_map.items():
                if c_id not in seen_ids and c_id not in child_ids:
                    final_ordered_comments.append(data)

            return final_ordered_comments

    except Exception as e:
        print(f"Error processing {docx_path}: {e}")
        return []

def export_tsv(comments, output_path):
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, delimiter='\t')
        writer.writerow(['id', 'author', 'date', 'target_text', 'comment_text', 'reply_comments', 'status'])
        for c in comments:
            # Format replies
            replies_str = ""
            if c['reply_comments']:
                lines = []
                for r in c['reply_comments']:
                    lines.append(f"[{r['author']}]: {r['comment_text']}")
                replies_str = "\n".join(lines)
            
            writer.writerow([
                c['id'],
                c['author'],
                c['date'],
                c['target_text'],
                c['comment_text'],
                replies_str,
                ""
            ])

def export_markdown(comments, output_path, doc_name):
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(f"## {doc_name}\n\n")
        for c in comments:
            f.write(f"### #{c['id']}\n")
            f.write(f"- **投稿者**: {c['author']}\n")
            f.write(f"- **日時**: {c['date']}\n")
            f.write(f"- **対象箇所**: 「{c['target_text']}」\n")
            f.write(f"- **コメント**: {c['comment_text']}\n")
            
            if c['reply_comments']:
                f.write(f"- **返信**:\n")
                for r in c['reply_comments']:
                    f.write(f"  - **{r['author']}** ({r['date']}): {r['comment_text']}\n")
            
            f.write(f"- **対応方針**: ___\n\n")
            f.write("---\n\n")

def main():
    parser = argparse.ArgumentParser(description="Extract comments from Word docs")
    parser.add_argument("files", nargs='+', help="Input .docx files")
    parser.add_argument("-o", "--output", help="Output directory", default="./output")
    parser.add_argument("--format", choices=['tsv', 'md', 'all'], default='all', help="Output format")
    
    args = parser.parse_args()
    
    out_dir = Path(args.output)
    out_dir.mkdir(parents=True, exist_ok=True)
    
    for file_pattern in args.files:
        # argparse handles globbing if shell expands it, but if passed as string literals (e.g. windows or quoted), 
        # we might need to glob manually. However, on Unix typical shell expands.
        # We'll assume the list is valid paths.
        path = Path(file_pattern)
        if not path.exists():
            # Try globbing just in case content passed quoted wildcard
            import glob
            expanded = glob.glob(file_pattern)
            paths = [Path(p) for p in expanded]
        else:
            paths = [path]
            
        for file_path in paths:
            if file_path.suffix.lower() != '.docx':
                continue
                
            print(f"Processing {file_path.name}...")
            comments = parse_docx(file_path)
            
            if not comments:
                continue

            base_name = file_path.stem
            
            if args.format in ['tsv', 'all']:
                tsv_path = out_dir / f"{base_name}_comments.tsv"
                export_tsv(comments, tsv_path)
                print(f"  Saved TSV: {tsv_path}")
                
            if args.format in ['md', 'all']:
                md_path = out_dir / f"{base_name}_comments.md"
                export_markdown(comments, md_path, file_path.name)
                print(f"  Saved Markdown: {md_path}")

if __name__ == '__main__':
    main()
