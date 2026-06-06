from pathlib import Path
from PIL import Image

TARGETS = [
    Path('assets/backgrounds'),
    Path('assets/previews/levels'),
]

created = []

for folder in TARGETS:
    if not folder.exists():
        print(f'skip missing folder: {folder}')
        continue

    for source in sorted(folder.glob('*.png')):
        dest = source.with_suffix('.webp')
        with Image.open(source) as image:
            image = image.convert('RGBA')
            image.save(dest, 'WEBP', quality=86, method=6)
        created.append(dest)
        print(f'{source} -> {dest}')

if not created:
    print('No PNG files found for WebP conversion.')
else:
    print('Created WebP files:')
    for item in created:
        print(f'  {item}')
