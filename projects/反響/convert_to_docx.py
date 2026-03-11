import re
import subprocess
import os

md_path = "/Users/delaxpro/.gemini/antigravity/brain/23c640cc-59b0-4800-888f-33bc62d4bc4b/puratto_feedback_report.md"
with open(md_path, encoding='utf-8') as f:
    lines = f.readlines()

html = ['<html><head><meta charset="utf-8"><style>table, th, td { border: 1px solid black; border-collapse: collapse; padding: 5px; }</style></head><body>']
in_table = False

for line in lines:
    line = line.strip()
    if line.startswith('## '):
        html.append(f'<h2>{line[3:]}</h2>')
    elif line.startswith('# '):
        html.append(f'<h1>{line[2:]}</h1>')
    elif line.startswith('|'):
        if not in_table:
            html.append('<table>')
            in_table = True
        if '---' in line: 
            continue
        parts = [p.strip() for p in line.strip('|').split('|')]
        row = '<tr>'
        for p in parts:
            p = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', p)
            row += f'<td>{p}</td>'
        row += '</tr>'
        html.append(row)
    else:
        if in_table:
            html.append('</table>')
            in_table = False
        if line:
            html.append(f'<p>{line}</p>')

if in_table:
    html.append('</table>')
            
html.append('</body></html>')

tmp_html = '/Users/delaxpro/src/反響/report.html'
with open(tmp_html, 'w', encoding='utf-8') as f:
    f.write('\n'.join(html))

docx_path = '/Users/delaxpro/src/反響/NHKラジオ「プラッと」反響調査レポート.docx'
subprocess.run(['textutil', '-convert', 'docx', '-output', docx_path, tmp_html])
print(f"Successfully converted to {docx_path}")
