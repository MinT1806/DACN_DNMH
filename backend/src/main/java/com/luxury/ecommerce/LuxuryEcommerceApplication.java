package com.luxury.ecommerce;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class LuxuryEcommerceApplication {
    public static void main(String[] args) {
        // Avoid PostgreSQL startup failure on systems where default timezone resolves to Asia/Saigon.
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        SpringApplication.run(LuxuryEcommerceApplication.class, args);
    }
}
