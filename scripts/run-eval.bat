@echo off
chcp 65001 >nul
cd /d "%~dp0.."

set LOG=evals\results\last-run.log

echo ============================================================ > "%LOG%"
echo  EVAL RUN  %DATE% %TIME%                                    >> "%LOG%"
echo ============================================================ >> "%LOG%"
echo. >> "%LOG%"

echo [1/2] selftest ...
echo === SELFTEST (API cagirisi yoxdur) === >> "%LOG%"
python scripts\eval.py --selftest >> "%LOG%" 2>&1
echo. >> "%LOG%"

echo [2/2] canli test (fixtures) ...
echo === PIPELINE B / evals/fixtures.jsonl (canli) === >> "%LOG%"
python scripts\eval.py --pipeline B --set evals/fixtures.jsonl >> "%LOG%" 2>&1
echo. >> "%LOG%"

if exist evals\golden-set.jsonl (
  for /f %%A in ('find /c /v "" ^< evals\golden-set.jsonl') do set LINES=%%A
)

type "%LOG%"
echo.
echo ------------------------------------------------------------
echo  Bitdi. Netice: %LOG%
echo  Cowork-a sadece "hazirdir" yaz - qalanini ozu oxuyacaq.
echo ------------------------------------------------------------
pause
