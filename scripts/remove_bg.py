
import sys
import os
from PIL import Image
import numpy as np

def remove_background_rembg(input_path, output_path):
    try:
        from rembg import remove
        print(f"Using rembg to remove background from {input_path}...")
        inp = Image.open(input_path)
        out = remove(inp)
        out.save(output_path)
        print(f"Saved to {output_path}")
    except ImportError:
        print("Error: 'rembg' library not found. Please install it using: pip install rembg[cli]")
        sys.exit(1)

def remove_background_color_key(input_path, output_path, color_hex="#465867", tolerance=30):
    """
    Fallback method: Removes a specific solid background color using PIL/Numpy.
    Useful if you don't want to install the heavy 'rembg' library and have a solid background.
    """
    print(f"Removing solid color {color_hex} from {input_path}...")
    
    img = Image.open(input_path).convert("RGBA")
    data = np.array(img)
    
    # Parse hex color
    color_hex = color_hex.lstrip('#')
    target_rgb = tuple(int(color_hex[i:i+2], 16) for i in (0, 2, 4))
    
    # Calculate distance
    red, green, blue, alpha = data.T
    
    color_dist = np.sqrt(
        (red - target_rgb[0]) ** 2 + 
        (green - target_rgb[1]) ** 2 + 
        (blue - target_rgb[2]) ** 2
    )
    
    # Set alpha to 0 where distance < tolerance
    data[..., 3] = np.where(color_dist < tolerance, 0, 255).astype(np.uint8)
    
    new_img = Image.fromarray(data)
    new_img.save(output_path)
    print(f"Saved to {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python remove_bg.py <input_path> <output_path> [mode: rembg|color]")
        print("Example: python remove_bg.py image.png image_no_bg.png rembg")
        sys.exit(1)

    input_p = sys.argv[1]
    output_p = sys.argv[2]
    mode = sys.argv[3] if len(sys.argv) > 3 else "rembg"

    if mode == "color":
        # Defaulting to the Cool Grey used in this project
        remove_background_color_key(input_p, output_p, color_hex="#465867")
    else:
        remove_background_rembg(input_p, output_p)
