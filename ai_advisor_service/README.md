# Python Semantic Sales Advisor (FastAPI)

Service nay dung framework FastAPI de xu ly hieu ngu canh nguu nghia va tu van theo phong cach sale (SPIN + FAB).

## 1. Cai dat

```powershell
cd ai_advisor_service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## 2. Chay service

```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

## 3. Kiem tra health

```powershell
Invoke-RestMethod http://localhost:8001/health
```

## 4. API chinh

- `POST /advise`
- Input: prompt + user profile + product catalog + history
- Output: response + recommended_product_ids + confidence + framework

## 5. Tich hop voi backend Java

Backend da duoc noi san qua config:

- `ai.python.enabled=true`
- `ai.python.base-url=http://localhost:8001`
- `ai.python.timeout-ms=5000`

Neu service Python khong san sang, backend se tu dong fallback ve bo luat Java hien co.
