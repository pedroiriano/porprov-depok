import os

folder = 'apps/public-web-nextjs/public/assets/extracted'
files = [f for f in os.listdir(folder) if f.endswith('.png') or f.endswith('.jpeg')]

html = '<html><body style="background:#111;color:#eee;font-family:sans-serif;"><h1>Gallery</h1><div style="display:flex;flex-wrap:wrap;gap:20px;">'
for f in files:
    size = os.path.getsize(os.path.join(folder, f)) // 1024
    if size > 10: # Only images larger than 10KB
        html += f'<div style="width:250px;border:1px solid #444;padding:10px;"><p style="font-size:12px;word-break:break-all;">{f} ({size}KB)</p><img src="/assets/extracted/{f}" style="max-width:100%;max-height:200px;background:#fff;" loading="lazy"/></div>'

html += '</div></body></html>'

with open('apps/public-web-nextjs/public/gallery.html', 'w') as f:
    f.write(html)
