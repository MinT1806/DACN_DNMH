from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional
from fastapi import FastAPI
from pydantic import BaseModel, Field
import re
import unicodedata

try:
    from sentence_transformers import SentenceTransformer
except Exception:  # pragma: no cover
    SentenceTransformer = None


class UserContext(BaseModel):
    id: Optional[int] = None
    username: Optional[str] = None
    gender: Optional[str] = None
    style: Optional[str] = None
    favorite_color: Optional[str] = Field(default=None, alias="favorite_color")


class ProductItem(BaseModel):
    id: int
    name: str = ""
    description: str = ""
    category: str = ""
    color: str = ""
    brand: str = ""
    material: str = ""
    is_premium: bool = False
    stock_quantity: int = 0
    price: float = 0.0


class HistoryItem(BaseModel):
    prompt: str = ""
    response: str = ""


class AdvisorRequest(BaseModel):
    prompt: str
    user: Optional[UserContext] = None
    products: List[ProductItem] = Field(default_factory=list)
    history: List[HistoryItem] = Field(default_factory=list)


class AdvisorResponse(BaseModel):
    response: str
    recommended_product_ids: List[int]
    confidence: float
    framework: str


@dataclass
class ScoredProduct:
    product_id: int
    score: float


class SalesSemanticAdvisor:
    def __init__(self) -> None:
        self.embedder = None
        if SentenceTransformer is not None:
            try:
                self.embedder = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
            except Exception:
                self.embedder = None

    def advise(self, req: AdvisorRequest) -> AdvisorResponse:
        prompt = self._normalize(req.prompt)
        history_text = " ".join(self._normalize(h.prompt + " " + h.response) for h in req.history[-5:])
        full_context = (prompt + " " + history_text).strip()

        budget = self._extract_budget(full_context)
        intent = self._detect_intent(full_context)

        # For pure greetings, return a welcome without products
        is_greeting = self._is_greeting(prompt)
        if is_greeting and not self._is_product_query(prompt):
            return AdvisorResponse(
                response=self._greeting_response(req.user),
                recommended_product_ids=[],
                confidence=0.99,
                framework="conversational",
            )

        scored = self._rank_products(full_context, req.products, req.user, budget, intent)
        top_ids = [item.product_id for item in scored[:6]]

        response = self._build_sales_response(req, intent, budget, len(top_ids), prompt)
        confidence = min(0.98, 0.5 + (0.07 * min(len(top_ids), 6)))

        return AdvisorResponse(
            response=response,
            recommended_product_ids=top_ids,
            confidence=round(confidence, 2),
            framework="SPIN+FAB contextual semantic ranking",
        )

    def _normalize(self, text: str) -> str:
        if not text:
            return ""
        text = unicodedata.normalize("NFD", text)
        text = "".join(ch for ch in text if not unicodedata.combining(ch))
        return text.replace("đ", "d").replace("Đ", "D").lower()

    def _extract_budget(self, text: str) -> Optional[float]:
        match = re.search(r"(\d+[\d\.,]*)\s*(trieu|tr|m|k|nghin|ngan|\$|usd)?", text)
        if not match:
            return None
        raw = match.group(1).replace(",", "").replace(".", "")
        if not raw.isdigit():
            return None
        amount = float(raw)
        unit = match.group(2)
        if unit in {"trieu", "tr", "m"}:
            amount *= 1_000_000
        elif unit in {"k", "nghin", "ngan"}:
            amount *= 1_000
        return amount

    def _is_greeting(self, norm_prompt: str) -> bool:
        greet_kw = ["hi", "hello", "hey", "xin chao", "chao", "alo", "good morning",
                    "good afternoon", "good evening", "chao buoi sang", "chao buoi toi"]
        return self._contains_any(norm_prompt, greet_kw)

    def _is_product_query(self, norm_prompt: str) -> bool:
        product_kw = ["muon mua", "tim", "goi y", "san pham", "outfit", "phong cach",
                      "mac gi", "nen mac", "tu van", "mac", "trang phuc", "gia", "bao nhieu",
                      "suggest", "recommend", "wear", "style", "buy", "purchase"]
        return self._contains_any(norm_prompt, product_kw)

    def _greeting_response(self, user: Optional[UserContext]) -> str:
        name = user.username if user and user.username else "bạn"
        style = user.style if user and user.style else None
        style_hint = f" Mình thấy bạn yêu thích phong cách **{style}** — mình sẽ ưu tiên gợi ý theo hướng đó nhé!" if style else ""
        return (
            f"Xin chào **{name}**! 👋 Mình là AI Stylist của Luxury Shop, sẵn sàng tư vấn thời trang cho bạn.{style_hint}\n\n"
            "Bạn có thể hỏi mình về:\n"
            "• Gợi ý outfit cho dịp cụ thể (tiệc, đi làm, dạo phố...)\n"
            "• Tìm sản phẩm phù hợp với ngân sách\n"
            "• Tư vấn phong cách theo màu sắc yêu thích\n"
            "• Xu hướng thời trang hiện tại\n\n"
            "Bạn muốn mình tư vấn gì hôm nay? 😊"
        )

    def _detect_intent(self, context: str) -> str:
        if self._contains_any(context, ["party", "di tiec", "formal", "sang trong", "luxury",
                                         "dam cuoi", "su kien", "gala", "cao cap", "vip"]):
            return "party"
        if self._contains_any(context, ["work", "cong so", "van phong", "school", "di hoc",
                                         "hop", "meeting", "chuyen nghiep", "lich su"]):
            return "work"
        if self._contains_any(context, ["summer", "mua he", "nong", "bien", "beach",
                                         "du lich", "nghi mat"]):
            return "summer"
        if self._contains_any(context, ["casual", "di choi", "hang out", "dao pho",
                                         "cuoi tuan", "weekend", "thoai mai", "don gian"]):
            return "casual"
        if self._contains_any(context, ["gia", "bao nhieu", "price", "cost", "cheap",
                                         "tiet kiem", "budget", "re", "gia tot"]):
            return "budget"
        return "general"

    def _rank_products(
        self,
        context: str,
        products: List[ProductItem],
        user: Optional[UserContext],
        budget: Optional[float],
        intent: str,
    ) -> List[ScoredProduct]:
        if not products:
            return []

        semantic_scores = {}
        if self.embedder is not None:
            try:
                corpus = [self._product_text(p) for p in products]
                embeddings = self.embedder.encode([context] + corpus, normalize_embeddings=True)
                query_vec = embeddings[0]
                for i, p in enumerate(products, start=1):
                    sim = float((query_vec * embeddings[i]).sum())
                    semantic_scores[p.id] = max(0.0, sim)
            except Exception:
                semantic_scores = {}

        scored: List[ScoredProduct] = []
        tokens = [t for t in context.split() if len(t) >= 4]

        for p in products:
            score = 0.0
            text = self._normalize(self._product_text(p))

            for token in tokens:
                if token in text:
                    score += 1.2

            if intent == "party":
                score += 3.0 if p.is_premium else 0.5
            elif intent == "work":
                score += 2.5 if self._contains_any(text, ["shirt", "blazer", "briefcase", "formal"]) else 0.4
            elif intent == "summer":
                score += 2.5 if self._contains_any(text, ["light", "cotton", "silk", "summer"]) else 0.4
            elif intent == "casual":
                score += 2.0 if self._contains_any(text, ["casual", "wallet", "tie", "accessories"]) else 0.4

            if user and user.style and user.style.strip():
                if self._normalize(user.style) in text:
                    score += 2.5

            if user and user.favorite_color and user.favorite_color.strip():
                if self._normalize(user.favorite_color) in text:
                    score += 1.8

            if budget is not None:
                score += 3.0 if p.price <= budget else -2.0

            score += semantic_scores.get(p.id, 0.0) * 4.0
            if p.stock_quantity <= 0:
                score -= 3.0

            scored.append(ScoredProduct(product_id=p.id, score=score))

        scored.sort(key=lambda x: x.score, reverse=True)
        return [s for s in scored if s.score > 0]

    def _build_sales_response(
        self,
        req: AdvisorRequest,
        intent: str,
        budget: Optional[float],
        rec_count: int,
        norm_prompt: str,
    ) -> str:
        user = req.user
        user_name = user.username if user and user.username else "bạn"
        user_style = user.style if user and user.style else None
        fav_color = user.favorite_color if user and user.favorite_color else None

        # Budget line
        if budget:
            budget_vnd = int(budget)
            if budget_vnd >= 1_000_000:
                budget_text = f"{budget_vnd // 1_000_000:,} triệu VND".replace(",", ".")
            else:
                budget_text = f"{budget_vnd:,} VND".replace(",", ".")
            budget_line = f"Với ngân sách **{budget_text}**, mình đã lọc ra các sản phẩm phù hợp nhất."
        else:
            budget_line = "Bạn chưa đề cập ngân sách — mình đang ưu tiên những sản phẩm có giá trị sử dụng cao nhất."

        # Intent-based opener
        intent_lines = {
            "party": (
                f"Bạn đang cần outfit cho **sự kiện trang trọng** — đây là lúc để tỏa sáng thật sự! ✨\n"
                "Mình gợi ý những item cao cấp có điểm nhấn, dễ tạo ấn tượng tốt."
            ),
            "work": (
                f"Bạn đang tìm phong cách **lịch sự cho công việc/học tập** — chuyên nghiệp mà vẫn cá tính. 💼\n"
                "Mình ưu tiên những item tinh tế, dễ phối và tạo sự tự tin."
            ),
            "summer": (
                f"Mùa hè năng động đang đến — mình chọn những item **nhẹ nhàng, thoáng mát** cho bạn. ☀️\n"
                "Vải tự nhiên, màu sáng và thiết kế đơn giản sẽ giúp bạn luôn tươi mới."
            ),
            "casual": (
                f"Cho những ngày **thả lỏng, đi chơi hay dạo phố** — thoải mái mà vẫn stylish. 🌟\n"
                "Mình chọn những combo dễ mặc, linh hoạt và cá tính."
            ),
            "budget": (
                f"Bạn đang tìm kiếm **lựa chọn tốt với ngân sách hợp lý** — mình hiểu! 💡\n"
                "Dưới đây là những sản phẩm chất lượng với giá trị tốt nhất mình tìm được."
            ),
            "general": (
                f"Mình đã phân tích yêu cầu của bạn và chọn ra những sản phẩm **phù hợp nhất**. 🎯\n"
                "Để gợi ý chính xác hơn, bạn có thể cho mình biết thêm dịp sử dụng và màu sắc yêu thích!"
            ),
        }
        opener = intent_lines.get(intent, intent_lines["general"])

        # Personalization hint
        hints = []
        if user_style:
            hints.append(f"phong cách **{user_style}**")
        if fav_color:
            hints.append(f"màu **{fav_color}**")
        if hints:
            personal_line = f"Dựa trên sở thích của bạn ({', '.join(hints)}), mình đã điều chỉnh thứ tự ưu tiên."
        else:
            personal_line = "Cập nhật phong cách và màu sắc yêu thích trong hồ sơ để nhận gợi ý cá nhân hóa hơn nhé!"

        # Recommendation summary
        if rec_count > 0:
            rec_line = f"Mình tìm được **{rec_count} sản phẩm** phù hợp — hãy xem qua bên dưới và nhấn để xem chi tiết hoặc thêm vào giỏ hàng!"
        else:
            rec_line = "Hiện tại kho hàng chưa có sản phẩm khớp hoàn toàn — bạn thử đặt lại câu hỏi với từ khóa cụ thể hơn nhé!"

        return f"{opener}\n\n{budget_line}\n\n{personal_line}\n\n{rec_line}"

    def _product_text(self, p: ProductItem) -> str:
        return " ".join(
            [
                p.name or "",
                p.description or "",
                p.category or "",
                p.color or "",
                p.brand or "",
                p.material or "",
            ]
        )

    def _contains_any(self, text: str, keywords: List[str]) -> bool:
        return any(k in text for k in keywords)


app = FastAPI(title="Luxury Semantic Sales Advisor", version="1.0.0")
advisor = SalesSemanticAdvisor()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "semantic_model": bool(advisor.embedder)}


@app.post("/advise", response_model=AdvisorResponse)
def advise(req: AdvisorRequest) -> AdvisorResponse:
    return advisor.advise(req)
