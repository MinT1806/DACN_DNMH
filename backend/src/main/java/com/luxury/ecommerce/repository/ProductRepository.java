package com.luxury.ecommerce.repository;

import com.luxury.ecommerce.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByIsPremium(Boolean isPremium);
    List<Product> findByCategory(String category);
    List<Product> findByNameContainingIgnoreCase(String name);
    List<Product> findByColor(String color);
    List<Product> findBySize(String size);
    List<Product> findByPriceBetween(BigDecimal minPrice, BigDecimal maxPrice);

    @Query("SELECT p FROM Product p WHERE " +
           "(:category IS NULL OR p.category = :category) AND " +
           "(:color IS NULL OR p.color = :color) AND " +
           "(:size IS NULL OR p.size = :size) AND " +
           "(:minPrice IS NULL OR p.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
           "(:isPremium IS NULL OR p.isPremium = :isPremium)")
    List<Product> findByFilters(@Param("category") String category,
                                @Param("color") String color,
                                @Param("size") String size,
                                @Param("minPrice") BigDecimal minPrice,
                                @Param("maxPrice") BigDecimal maxPrice,
                                @Param("isPremium") Boolean isPremium);
}
