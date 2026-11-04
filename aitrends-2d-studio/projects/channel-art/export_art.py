"""Xuất ảnh kênh từ build/stills: ảnh bìa 2560x1440 và ảnh kênh 800x800, kèm bản xem thử trang kênh.

Chạy sau: node render.mjs --project projects/channel-art --stills 0.5,1.5
"""
import sys
from PIL import Image, ImageDraw

b = Image.open('build/stills/0.5s_0.50.png').convert('RGB')
a = Image.open('build/stills/1.5s_1.50.png').convert('RGB')
W, H = a.size
a = a.crop(((W - H) // 2, 0, (W + H) // 2, H)).resize((800, 800), Image.LANCZOS)
b.save('art/banner_2560x1440.jpg', quality=92)
a.save('art/avatar_800x800.png')

# xem thử: dải ảnh bìa trên desktop (2560x423) + khung vùng an toàn 1546x423 + ảnh kênh tròn ở 2 cỡ
band = b.crop((0, (1440 - 423) // 2, 2560, (1440 + 423) // 2)).resize((1280, 212))
pv = Image.new('RGB', (1280, 430), '#0f0f0f')
pv.paste(band, (0, 0))
d = ImageDraw.Draw(pv)
sx = (2560 - 1546) // 4
d.rectangle([sx, 0, sx + 773, 211], outline='#00e676', width=2)
for size, pos in [(160, (20, 240)), (48, (200, 330))]:
    m = Image.new('L', (size, size), 0)
    ImageDraw.Draw(m).ellipse([0, 0, size - 1, size - 1], fill=255)
    pv.paste(a.resize((size, size), Image.LANCZOS), pos, m)
pv.save(sys.argv[1] if len(sys.argv) > 1 else 'build/channel_preview.png')
