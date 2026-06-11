@echo off
cd /d C:\Dev\metaxsports
git add -A
git commit -m "Calendario page with 104 matches"
git push origin main
echo.
echo Listo! Espera 2-3 minutos y entra a:
echo https://paniniswap-6hlt.vercel.app/calendario
pause
