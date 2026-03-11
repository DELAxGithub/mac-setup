import fitz
import os
import glob

def get_font_path():
    fonts = glob.glob("/System/Library/Fonts/ヒラギノ*.ttc")
    if fonts: return fonts[0]
    return "/System/Library/Fonts/AppleSDGothicNeo.ttc"

def create_mailing_label():
    doc = fitz.open()
    page = doc.new_page(width=595, height=842) # A4
    font_path = get_font_path()
    
    text = """
〒920-8526
金沢市戸水2丁目30番地（金沢国税局戸水分庁舎）

金沢国税局業務センター（金沢税務署）行
    """
    
    rect = fitz.Rect(100, 100, 500, 400)
    page.insert_textbox(rect, text, fontsize=24, fontname="cjk", fontfile=font_path, align=0)
    
    label_path = "/Users/delaxpro/src/ダイレクト納付/宛名ラベル.pdf"
    doc.save(label_path)
    print(f"Created: {label_path}")

def fill_direct_tax_pdf():
    pdf_path = "/Users/delaxpro/src/ダイレクト納付/direct_tax.pdf"
    output_path = "/Users/delaxpro/src/ダイレクト納付/ダイレクト納付届出書_プレビュー.pdf"
    
    doc = fitz.open(pdf_path)
    page = doc[0]
    font_path = get_font_path()

    # Define fields to draw text
    # These coordinates are estimated from typical NTA form
    # 税務署 (Tax Office)
    page.insert_text((70, 140), "金沢", fontsize=12, fontname="cjk", fontfile=font_path)
    
    # 住所 (Address) - leaving blank or putting placeholder
    # 会社名 (Company Name)
    page.insert_text((180, 275), "株式会社DELAX", fontsize=12, fontname="cjk", fontfile=font_path)
    # page.insert_text((180, 305), "代表取締役 小寺 寛", fontsize=12, fontname="cjk", fontfile=font_path) # Commented out for stamp
    
    # 銀行名 (Bank Name)
    page.insert_text((140, 425), "GMOあおぞらネット", fontsize=10, fontname="cjk", fontfile=font_path)
    
    # 支店名 (Branch Name)
    page.insert_text((275, 425), "法人第二営業部", fontsize=10, fontname="cjk", fontfile=font_path)
    
    # 口座種類 (Account Type)
    page.insert_text((420, 395), "〇", fontsize=14, fontname="cjk", fontfile=font_path) # Circle around 普通
    
    # 口座番号 (Account Number)
    page.insert_text((345, 425), "2357993", fontsize=10, fontname="cjk", fontfile=font_path)
    
    doc.save(output_path)
    print(f"Created: {output_path}")

if __name__ == "__main__":
    create_mailing_label()
    fill_direct_tax_pdf()
