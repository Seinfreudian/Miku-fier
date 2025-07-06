from pathlib import Path

folder = Path("miku_img")
image_files = list(folder.glob("*.[jp][pn]g"))

escaped_paths = [f"    '{str(img).replace('\\', '/')}'" for img in image_files]

js_content = "let miku_pics = [\n" + ",\n".join(escaped_paths) + "\n];\n"

with open("miku_pics.js", "w", encoding="utf-8") as f:
    f.write(js_content)

print("Generated miku_pics.js with", len(image_files), "images.")
