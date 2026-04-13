-- Luxury E-Commerce Database Schema
-- PostgreSQL

-- Drop existing tables if they exist
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(500),
    category VARCHAR(100),
    is_premium BOOLEAN DEFAULT false,
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    shipping_address TEXT,
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Order Items table
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_premium ON products(is_premium);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Insert sample admin user (password: admin123)
-- Password is hashed with BCrypt
INSERT INTO users (username, email, password, first_name, last_name, role) VALUES
('admin', 'admin@luxury.com', '$2b$10$S5hNrukrz6nP5zDN/YI5ruqIqsv1zCsiPfj5TmwpWT39e21W2XGim', 'Admin', 'User', 'ADMIN');

-- Insert sample user (password: user123)
INSERT INTO users (username, email, password, first_name, last_name, role) VALUES
('johndoe', 'john@example.com', '$2b$10$oyp9Yuo86GoA4HIFZiYDr.iK9q0tjrv5RaXgrqt8rAeiJwiYO.oGS', 'John', 'Doe', 'USER');

-- Insert sample premium products
INSERT INTO products (name, description, price, image_url, category, is_premium, stock_quantity) VALUES
('Diamond Essence Watch', 'Exquisite timepiece crafted with precision and adorned with carefully selected diamonds', 12500.00, 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&h=800&fit=crop', 'Timepieces', true, 5),
('Platinum Chain Necklace', 'Handcrafted platinum necklace with a timeless design', 8900.00, 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=800&fit=crop', 'Jewelry', true, 8),
('Italian Leather Briefcase', 'Premium Italian leather briefcase with hand-stitched details', 3200.00, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=800&fit=crop', 'Accessories', true, 12),
('Sapphire Cufflinks', 'Elegant cufflinks featuring natural sapphires set in white gold', 2800.00, 'https://images.unsplash.com/photo-1611923134239-a9a99c97d76c?w=600&h=800&fit=crop', 'Jewelry', true, 15),
('Cashmere Overcoat', 'Luxurious cashmere overcoat with impeccable tailoring', 4500.00, 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b52f?w=600&h=800&fit=crop', 'Apparel', true, 10),
('Gold Fountain Pen', 'Limited edition fountain pen crafted from 18k gold', 1800.00, 'https://images.unsplash.com/photo-1565735149911-4c62f72f1aca?w=600&h=800&fit=crop', 'Accessories', true, 20),
('Silk Tie Collection', 'Set of 3 handwoven silk ties in classic patterns', 450.00, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=800&fit=crop', 'Accessories', false, 30),
('Leather Wallet', 'Premium leather bifold wallet with RFID protection', 280.00, 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&h=800&fit=crop', 'Accessories', false, 50);
