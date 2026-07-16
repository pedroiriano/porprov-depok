import zipfile
import xml.etree.ElementTree as ET
import os

def extract_text_from_docx(docx_path):
    try:
        document = zipfile.ZipFile(docx_path)
        xml_content = document.read('word/document.xml')
        document.close()
        tree = ET.XML(xml_content)
        
        paragraphs = []
        for paragraph in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
            texts = [node.text
                     for node in paragraph.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t')
                     if node.text]
            if texts:
                paragraphs.append(''.join(texts))
        return '\n'.join(paragraphs)
    except Exception as e:
        return f"Error reading {docx_path}: {str(e)}"

docx_dir = r"D:\Porprov XV\porprov-depok\design"
output_dir = r"D:\Porprov XV\porprov-depok\design\extracted_text"

os.makedirs(output_dir, exist_ok=True)

for filename in os.listdir(docx_dir):
    if filename.endswith(".docx"):
        docx_path = os.path.join(docx_dir, filename)
        text = extract_text_from_docx(docx_path)
        out_path = os.path.join(output_dir, filename + ".txt")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"Extracted {filename} to {out_path}")
