package com.luxury.ecommerce.service;

import com.luxury.ecommerce.entity.Product;
import com.luxury.ecommerce.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
    }

    public List<Product> getPremiumProducts() {
        return productRepository.findByIsPremium(true);
    }

    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategory(category);
    }

    public List<Product> searchProducts(String keyword) {
        return productRepository.findByNameContainingIgnoreCase(keyword);
    }

    public List<Product> filterProducts(String category, String color, String size,
                                       BigDecimal minPrice, BigDecimal maxPrice, Boolean isPremium) {
        return productRepository.findByFilters(category, color, size, minPrice, maxPrice, isPremium);
    }

    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    public Product updateProduct(Long id, Product productDetails) {
        Product product = getProductById(id);

        product.setName(productDetails.getName());
        product.setDescription(productDetails.getDescription());
        product.setPrice(productDetails.getPrice());
        product.setImageUrl(productDetails.getImageUrl());
        product.setCategory(productDetails.getCategory());
        product.setIsPremium(productDetails.getIsPremium());
        product.setStockQuantity(productDetails.getStockQuantity());
        if (productDetails.getSize() != null) product.setSize(productDetails.getSize());
        if (productDetails.getColor() != null) product.setColor(productDetails.getColor());
        if (productDetails.getBrand() != null) product.setBrand(productDetails.getBrand());
        if (productDetails.getMaterial() != null) product.setMaterial(productDetails.getMaterial());

        return productRepository.save(product);
    }

    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        productRepository.delete(product);
    }
}
