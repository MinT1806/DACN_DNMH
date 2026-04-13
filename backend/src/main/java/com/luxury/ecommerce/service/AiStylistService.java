package com.luxury.ecommerce.service;

import com.luxury.ecommerce.dto.ChatResponse;
import com.luxury.ecommerce.entity.ChatHistory;
import com.luxury.ecommerce.entity.Product;
import com.luxury.ecommerce.entity.User;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.luxury.ecommerce.repository.ChatHistoryRepository;
import com.luxury.ecommerce.repository.ProductRepository;
import com.luxury.ecommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.time.Duration;

@Service
public class AiStylistService {

    private static final Logger logger = LoggerFactory.getLogger(AiStylistService.class);
    private static final Pattern BUDGET_PATTERN = Pattern.compile("(\\d+[\\d\\.,]*)\\s*(trieu|tr|m|k|nghin|ngan|usd|\\$)?");

    @Autowired
    private ChatHistoryRepository chatHistoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${ai.python.enabled:true}")
    private boolean pythonEnabled;

    @Value("${ai.python.base-url:http://localhost:8001}")
    private String pythonBaseUrl;

    @Value("${ai.python.timeout-ms:5000}")
    private long pythonTimeoutMs;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .build();

    public void clearHistory(Long userId) {
        chatHistoryRepository.deleteByUserId(userId);
    }

    public ChatResponse generateRecommendation(Long userId, String prompt) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String safePrompt = prompt == null ? "" : prompt.trim();
        if (safePrompt.isEmpty()) {
            safePrompt = "Tu van phong cach phu hop";
        }

        List<Product> allProducts = productRepository.findAll();
        ChatResponse pythonRecommendation = getPythonRecommendation(safePrompt, user, allProducts);

        String response;
        List<Product> recommendedProducts;

        if (pythonRecommendation != null) {
            response = pythonRecommendation.getResponse();
            recommendedProducts = pythonRecommendation.getRecommendedProducts();
        } else {
            response = generateResponse(safePrompt, user);
            recommendedProducts = getRecommendedProducts(safePrompt, user, allProducts);
        }

        // Save chat history
        ChatHistory chatHistory = new ChatHistory();
        chatHistory.setUser(user);
        chatHistory.setPrompt(safePrompt);
        chatHistory.setResponse(response);
        chatHistory.setRecommendedProducts(
                recommendedProducts.stream()
                        .map(p -> p.getId().toString())
                        .collect(Collectors.joining(","))
        );
        chatHistoryRepository.save(chatHistory);

        return new ChatResponse(response, recommendedProducts);
    }

    private ChatResponse getPythonRecommendation(String prompt, User user, List<Product> allProducts) {
        if (!pythonEnabled) {
            return null;
        }

        try {
            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("prompt", prompt);

            ObjectNode userNode = payload.putObject("user");
            userNode.put("id", user.getId());
            userNode.put("username", user.getUsername());
            userNode.put("gender", safeText(user.getGender()));
            userNode.put("style", safeText(user.getStyle()));
            userNode.put("favorite_color", safeText(user.getFavoriteColor()));

            ArrayNode productsNode = payload.putArray("products");
            for (Product product : allProducts) {
                ObjectNode productNode = productsNode.addObject();
                productNode.put("id", product.getId());
                productNode.put("name", safeText(product.getName()));
                productNode.put("description", safeText(product.getDescription()));
                productNode.put("category", safeText(product.getCategory()));
                productNode.put("color", safeText(product.getColor()));
                productNode.put("brand", safeText(product.getBrand()));
                productNode.put("material", safeText(product.getMaterial()));
                productNode.put("is_premium", Boolean.TRUE.equals(product.getIsPremium()));
                productNode.put("stock_quantity", product.getStockQuantity() == null ? 0 : product.getStockQuantity());

                if (product.getPrice() != null) {
                    productNode.put("price", product.getPrice());
                } else {
                    productNode.put("price", BigDecimal.ZERO);
                }
            }

            List<ChatHistory> recentHistory = chatHistoryRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                    .stream()
                    .limit(6)
                    .collect(Collectors.toList());

            ArrayNode historyNode = payload.putArray("history");
            for (int i = recentHistory.size() - 1; i >= 0; i--) {
                ChatHistory chat = recentHistory.get(i);
                ObjectNode chatNode = historyNode.addObject();
                chatNode.put("prompt", safeText(chat.getPrompt()));
                chatNode.put("response", safeText(chat.getResponse()));
            }

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(pythonBaseUrl + "/advise"))
                    .timeout(Duration.ofMillis(pythonTimeoutMs))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                logger.warn("Python advisor returned HTTP {}", response.statusCode());
                return null;
            }

            JsonNode body = objectMapper.readTree(response.body());
            String advice = body.path("response").asText("");

            List<Long> recommendedProductIds = new ArrayList<>();
            JsonNode idsNode = body.path("recommended_product_ids");
            if (idsNode.isArray()) {
                for (JsonNode idNode : idsNode) {
                    if (idNode.canConvertToLong()) {
                        recommendedProductIds.add(idNode.asLong());
                    }
                }
            }

            Map<Long, Product> productById = allProducts.stream()
                    .collect(Collectors.toMap(Product::getId, p -> p));

            List<Product> recommendedProducts = recommendedProductIds.stream()
                    .map(productById::get)
                    .filter(p -> p != null)
                    .limit(6)
                    .collect(Collectors.toList());

            if (recommendedProducts.isEmpty()) {
                recommendedProducts = getRecommendedProducts(prompt, user, allProducts);
            }

            if (advice == null || advice.isBlank()) {
                advice = generateResponse(prompt, user);
            }

            return new ChatResponse(advice, recommendedProducts);
        } catch (Exception ex) {
            logger.warn("Python advisor unavailable, fallback to Java rules: {}", ex.getMessage());
            return null;
        }
    }

    private String safeText(String value) {
        return value == null ? "" : value;
    }

    private String generateResponse(String prompt, User user) {
        String normalizedPrompt = normalizeText(prompt);
        BigDecimal budget = extractBudget(normalizedPrompt);

        boolean party = containsAny(normalizedPrompt, "di tiec", "party", "formal", "sang trong", "luxury", "cao cap");
        boolean casual = containsAny(normalizedPrompt, "di choi", "casual", "hang out", "dao pho", "thoai mai");
        boolean work = containsAny(normalizedPrompt, "di hoc", "school", "work", "cong so", "van phong");
        boolean summer = containsAny(normalizedPrompt, "mua he", "summer", "nong");

        StringBuilder advice = new StringBuilder();

        if (party) {
            advice.append("Ban dang can outfit du tiec theo huong sang trong. ")
                    .append("Uu tien phu kien cao cap, tong the gon gang va nhan manh diem nhan chat lieu.");
        } else if (work) {
            advice.append("Ban dang tim phong cach lich su cho hoc tap/cong viec. ")
                    .append("Nen uu tien tong the toi gian, de phoi va tao cam giac chuyen nghiep.");
        } else if (casual) {
            advice.append("Ban dang huong den outfit casual, de chiu va de van dong. ")
                    .append("Nen chon item linh hoat, phoi nhanh cho cac tinh huong hang ngay.");
        } else if (summer) {
            advice.append("Ban dang can trang phuc cho thoi tiet nong. ")
                    .append("Nen uu tien item nhe, thoang va mau sac sang de tao cam giac mat me.");
        } else {
            advice.append("Minh da phan tich nhu cau va chon san pham phu hop tu kho du lieu hien tai. ")
                    .append("Neu ban muon ket qua sat hon, hay noi ro dip su dung, mau sac va ngan sach.");
        }

        if (budget != null) {
            advice.append(" Ngan sach uoc tinh: ").append(budget.stripTrailingZeros().toPlainString()).append(".");
        }

        advice.append(" ").append(getUserStyleHint(user));
        return advice.toString();
    }

    private String getUserStyleHint(User user) {
        if (user.getStyle() != null) {
            return String.format("Dua tren phong cach %s cua ban, minh da uu tien cac san pham phu hop nhat.",
                    user.getStyle());
        }
        return "Hay cap nhat phong cach yeu thich trong profile de nhan goi y ca nhan hoa tot hon!";
    }

    private List<Product> getRecommendedProducts(String prompt, User user, List<Product> allProducts) {
        if (allProducts.isEmpty()) {
            return List.of();
        }

        String normalizedPrompt = normalizeText(prompt);
        BigDecimal budget = extractBudget(normalizedPrompt);

        boolean preferPremium = containsAny(normalizedPrompt, "sang trong", "luxury", "cao cap", "premium", "di tiec", "party", "formal");
        boolean preferAffordable = containsAny(normalizedPrompt, "tiet kiem", "re", "gia mem", "budget", "cheap", "it tien");

        Set<String> categoryHints = inferCategoryHints(normalizedPrompt);
        List<ScoredProduct> scored = new ArrayList<>();

        for (Product product : allProducts) {
            int score = 0;
            BigDecimal price = product.getPrice() == null ? BigDecimal.ZERO : product.getPrice();
            boolean isPremium = Boolean.TRUE.equals(product.getIsPremium());

            if (preferPremium) {
                score += isPremium ? 4 : -1;
            }

            if (preferAffordable) {
                score += isPremium ? -1 : 3;
            }

            if (budget != null) {
                score += price.compareTo(budget) <= 0 ? 4 : -3;
            }

            String productText = normalizeText(
                    (product.getName() == null ? "" : product.getName()) + " "
                            + (product.getDescription() == null ? "" : product.getDescription()) + " "
                            + (product.getCategory() == null ? "" : product.getCategory()) + " "
                            + (product.getBrand() == null ? "" : product.getBrand()) + " "
                            + (product.getMaterial() == null ? "" : product.getMaterial()) + " "
                            + (product.getColor() == null ? "" : product.getColor())
            );

            for (String hint : categoryHints) {
                if (productText.contains(hint)) {
                    score += 4;
                }
            }

            if (user.getStyle() != null && product.getCategory() != null
                    && normalizeText(user.getStyle()).equals(normalizeText(product.getCategory()))) {
                score += 3;
            }

            if (user.getFavoriteColor() != null && product.getColor() != null
                    && normalizeText(user.getFavoriteColor()).equals(normalizeText(product.getColor()))) {
                score += 3;
            }

            for (String token : normalizedPrompt.split("\\s+")) {
                if (token.length() >= 4 && productText.contains(token)) {
                    score += 1;
                }
            }

            if (score > 0) {
                scored.add(new ScoredProduct(product, score));
            }
        }

        Comparator<ScoredProduct> comparator = Comparator
                .comparingInt(ScoredProduct::score).reversed()
                .thenComparing(sp -> {
                    BigDecimal price = sp.product().getPrice() == null ? BigDecimal.ZERO : sp.product().getPrice();
                    return preferAffordable ? price : price.negate();
                });

        List<Product> rankedProducts = scored.stream()
                .sorted(comparator)
                .map(ScoredProduct::product)
                .limit(6)
                .collect(Collectors.toList());

        if (!rankedProducts.isEmpty()) {
            return rankedProducts;
        }

        if (preferPremium) {
            List<Product> premiumProducts = allProducts.stream()
                    .filter(p -> Boolean.TRUE.equals(p.getIsPremium()))
                    .limit(6)
                    .collect(Collectors.toList());
            if (!premiumProducts.isEmpty()) {
                return premiumProducts;
            }
        }

        if (preferAffordable) {
            List<Product> affordableProducts = allProducts.stream()
                    .filter(p -> !Boolean.TRUE.equals(p.getIsPremium()))
                    .sorted(Comparator.comparing(p -> p.getPrice() == null ? BigDecimal.ZERO : p.getPrice()))
                    .limit(6)
                    .collect(Collectors.toList());
            if (!affordableProducts.isEmpty()) {
                return affordableProducts;
            }
        }

        return allProducts.stream().limit(6).collect(Collectors.toList());
    }

    private String normalizeText(String input) {
        if (input == null) {
            return "";
        }

        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .toLowerCase();

        return normalized;
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private Set<String> inferCategoryHints(String normalizedPrompt) {
        Set<String> hints = new HashSet<>();

        if (containsAny(normalizedPrompt, "dong ho", "watch", "timepiece")) {
            hints.add("timepieces");
            hints.add("watch");
        }

        if (containsAny(normalizedPrompt, "trang suc", "jewelry", "day chuyen", "nhan", "vong", "cufflink", "necklace", "diamond", "gold", "sapphire")) {
            hints.add("jewelry");
            hints.add("necklace");
            hints.add("cufflinks");
        }

        if (containsAny(normalizedPrompt, "phu kien", "accessory", "briefcase", "wallet", "bag", "tui", "vi", "ca vat", "tie", "pen")) {
            hints.add("accessories");
            hints.add("briefcase");
            hints.add("wallet");
        }

        if (containsAny(normalizedPrompt, "trang phuc", "outfit", "ao", "quan", "coat", "overcoat", "apparel")) {
            hints.add("apparel");
            hints.add("coat");
        }

        return hints;
    }

    private BigDecimal extractBudget(String normalizedPrompt) {
        Matcher matcher = BUDGET_PATTERN.matcher(normalizedPrompt);
        if (!matcher.find()) {
            return null;
        }

        String numberPart = matcher.group(1);
        String unitPart = matcher.group(2);

        if (numberPart == null || numberPart.isBlank()) {
            return null;
        }

        String sanitized = numberPart.replace(",", "").replace(".", "");
        if (sanitized.isBlank()) {
            return null;
        }

        BigDecimal amount;
        try {
            amount = new BigDecimal(sanitized);
        } catch (NumberFormatException ex) {
            return null;
        }

        if (unitPart == null) {
            return amount;
        }

        return switch (unitPart) {
            case "trieu", "tr", "m" -> amount.multiply(BigDecimal.valueOf(1_000_000L));
            case "k", "nghin", "ngan" -> amount.multiply(BigDecimal.valueOf(1_000L));
            default -> amount;
        };
    }

    private record ScoredProduct(Product product, int score) {
    }

    public List<ChatHistory> getChatHistory(Long userId) {
        return chatHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
}
