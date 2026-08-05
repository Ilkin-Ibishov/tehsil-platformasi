@echo off
chcp 65001 >nul
cd /d "%~dp0.."

set LOG=evals\results\last-run.log

echo ============================================================ > "%LOG%"
echo  FAZA 0-LITE RUN  %DATE% %TIME%                             >> "%LOG%"
echo ============================================================ >> "%LOG%"
echo. >> "%LOG%"

echo [1/3] selftest ...
echo === SELFTEST (API cagirisi yoxdur) === >> "%LOG%"
python scripts\eval.py --selftest >> "%LOG%" 2>&1
echo. >> "%LOG%"

echo [2/3] KESILMIS dest - hell yolu (10 sekil) ...
echo ============================================================ >> "%LOG%"
echo === B / golden-set-cropped.jsonl  --  HELL YOLU           === >> "%LOG%"
echo === her sekilde tek mesele, hamisi "ok" gozlenilir        === >> "%LOG%"
echo ============================================================ >> "%LOG%"
python scripts\eval.py --pipeline B --set evals/golden-set-cropped.jsonl >> "%LOG%" 2>&1
echo. >> "%LOG%"

echo     30 saniye gozleyirem (pulsuz limit: 20 sorgu/deqiqe) ...
timeout /t 30 /nobreak >nul

echo [3/3] XAM dest - askarlama yolu (10 sekil) ...
echo ============================================================ >> "%LOG%"
echo === B / golden-set.jsonl  --  ASKARLAMA YOLU              === >> "%LOG%"
echo === coxsualli kadr, 9-u "multiple_problems" gozlenilir    === >> "%LOG%"
echo ============================================================ >> "%LOG%"
python scripts\eval.py --pipeline B --set evals/golden-set.jsonl >> "%LOG%" 2>&1
echo. >> "%LOG%"

type "%LOG%"
echo.
echo ------------------------------------------------------------
echo  Bitdi. Netice: %LOG%  +  evals\results\B-*.json
echo  Cowork-a sadece "hazirdir" yaz - qalanini ozu oxuyacaq.
echo ------------------------------------------------------------
pause
