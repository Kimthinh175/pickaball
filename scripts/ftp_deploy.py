import ftplib
import os
import subprocess
import sys

FTP_HOST = 'picko247.com'
FTP_USER = 'twsieupy'
FTP_PASS = 'T3Yj88S]7Jy[rl'
LOCAL_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def get_git_modified_files():
    try:
        out = subprocess.check_output(['git', 'diff', '--name-only', 'HEAD~1', 'HEAD'], cwd=LOCAL_ROOT).decode('utf-8')
        files = [line.strip() for line in out.splitlines() if line.strip()]
        return files
    except Exception as e:
        print(f"Error getting git files: {e}")
        return []

def upload_files(file_list):
    if not file_list:
        print("No files to upload.")
        return

    print(f"Connecting to FTP {FTP_HOST}...")
    try:
        ftp = ftplib.FTP(FTP_HOST, timeout=20)
        ftp.login(FTP_USER, FTP_PASS)
        base_dir = '/public_html' if 'public_html' in ftp.nlst() else ''

        for rel_path in file_list:
            local_path = os.path.join(LOCAL_ROOT, rel_path.replace('/', os.sep))
            if not os.path.exists(local_path):
                print(f"[SKIP] File deleted or missing: {rel_path}")
                continue

            if os.path.isdir(local_path):
                continue

            parts = rel_path.replace('\\', '/').split('/')
            filename = parts[-1]
            remote_dir_path = (base_dir + '/' + '/'.join(parts[:-1])).strip('/')

            ftp.cwd('/')
            if remote_dir_path:
                for folder in remote_dir_path.split('/'):
                    if not folder: continue
                    try:
                        ftp.cwd(folder)
                    except:
                        try:
                            ftp.mkd(folder)
                            ftp.cwd(folder)
                        except Exception as ex:
                            print(f"Error creating/cd directory {folder}: {ex}")

            with open(local_path, 'rb') as f:
                ftp.storbinary(f'STOR {filename}', f)
            print(f"[OK] Uploaded -> {rel_path}")

        ftp.quit()
        print(">>> DEPLOYMENT TO HOSTING SUCCESSFUL! <<<")
    except Exception as e:
        print(f"FTP Deployment Error: {e}")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        files = sys.argv[1:]
    else:
        files = get_git_modified_files()
    upload_files(files)
