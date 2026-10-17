import os
import sys
import zipfile

def create_project_zip():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    zip_path = os.path.join(base_dir, 'digishop-project.zip')
    
    exclude_dirs = {'node_modules', '.git', 'dist', '.cache', '__pycache__'}
    exclude_files = {'digishop-project.zip'}
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(base_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for f in files:
                if f in exclude_files:
                    continue
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, base_dir)
                zf.write(full_path, rel_path)
    
    print(f"OK:{zip_path}")

if __name__ == '__main__':
    create_project_zip()
