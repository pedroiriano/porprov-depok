import fitz # PyMuPDF
import os

pdf_path = "Booklet PORPROV XV.pdf"
output_dir = "extracted_assets"

os.makedirs(output_dir, exist_ok=True)

doc = fitz.open(pdf_path)

# Dictionary to keep track of image occurrences
image_hashes = set()
image_count = 0

for page_index in range(len(doc)):
    page = doc[page_index]
    image_list = page.get_images(full=True)
    
    # Also render the whole page as an image to use as fallback/preview if needed
    # We will just extract raw images first
    for image_index, img in enumerate(image_list, start=1):
        xref = img[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        image_ext = base_image["ext"]
        
        # Simple hash to avoid duplicates
        img_hash = hash(image_bytes)
        if img_hash not in image_hashes:
            image_hashes.add(img_hash)
            image_name = f"page{page_index+1}_img{image_index}.{image_ext}"
            image_filepath = os.path.join(output_dir, image_name)
            
            with open(image_filepath, "wb") as f:
                f.write(image_bytes)
            image_count += 1

print(f"Extracted {image_count} unique images to {output_dir}")
