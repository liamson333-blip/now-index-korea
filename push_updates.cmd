@echo off
cd /d C:\Users\SonSeongchan\now-index-korea
"C:\Program Files\Git\cmd\git.exe" add .
"C:\Program Files\Git\cmd\git.exe" commit -m "Add package, sample script, tests, and CI workflow"
"C:\Program Files\Git\cmd\git.exe" push -u origin main
