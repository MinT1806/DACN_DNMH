package com.luxury.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequest {
    private Long userId;
    private List<OrderItemRequest> items;
    private String shippingAddress;
    private String paymentMethod;
    private BigDecimal totalAmount;
}
