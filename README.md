# 👗 Hệ Thống Web Kinh Doanh Thời Trang Tích Hợp AI Stylist

## 📋 Tổng Quan Dự Án

Hệ thống web thương mại điện tử chuyên về kinh doanh thời trang, tích hợp công nghệ AI để đưa ra gợi ý phối đồ thông minh cho khách hàng, giúp nâng cao trải nghiệm mua sắm và tăng tỷ lệ chuyển đổi.

## 🎯 Mục Tiêu Hệ Thống

- **Quản lý sản phẩm thời trang** hiệu quả với đầy đủ thông tin chi tiết
- **Trải nghiệm mua sắm** mượt mà với giỏ hàng và thanh toán online
- **AI Stylist** - Gợi ý outfit thông minh dựa trên sở thích và thông tin người dùng
- **Quản trị hệ thống** toàn diện cho Admin

## 🎭 Đối Tượng Người Dùng

### 👤 Customer (Khách hàng)
- Đăng ký/Đăng nhập tài khoản
- Xem, tìm kiếm và lọc sản phẩm
- Thêm sản phẩm vào giỏ hàng
- Thanh toán online
- Xem lịch sử đơn hàng
- Sử dụng AI Stylist để nhận gợi ý phối đồ

### 👨‍💼 Admin (Quản trị viên)
- Quản lý sản phẩm (CRUD)
- Quản lý đơn hàng
- Quản lý người dùng
- Thống kê báo cáo

### 🤖 AI API (External System)
- Nhận thông tin từ hệ thống
- Phân tích và đưa ra gợi ý outfit
- Trả về kết quả dưới dạng JSON

## 🏗 Kiến Trúc Hệ Thống

### Tech Stack
- **Frontend**: React.js / Vue.js
- **Backend**: Spring Boot (Java)
- **Database**: MySQL / PostgreSQL
- **AI Integration**: OpenAI API / Custom AI Service
- **Payment**: VNPay / MoMo / Stripe

### Kiến trúc 3 lớp
```
┌─────────────────┐
│   Frontend      │ (Web UI - React/Vue)
└────────┬────────┘
         │
┌────────▼────────┐
│   Backend API   │ (Spring Boot)
└────┬────────┬───┘
     │        │
┌────▼────┐  │
│ Database│  │
└─────────┘  │
             │
        ┌────▼─────────┐
        │ External APIs│
        │ - AI API     │
        │ - Payment    │
        └──────────────┘
```

## 📚 Tài Liệu Thiết Kế

1. **[Use Case Diagram](use-case-diagram.md)** - Sơ đồ ca sử dụng
2. **[Class Diagram](class-diagram.md)** - Sơ đồ lớp
3. **[Sequence Diagram](sequence-diagram.md)** - Sơ đồ tuần tự
4. **[Activity Diagram](activity-diagram.md)** - Sơ đồ hoạt động
5. **[Component & Deployment Diagram](component-deployment-diagram.md)** - Sơ đồ thành phần và triển khai
6. **[System Architecture](system-architecture.md)** - Kiến trúc hệ thống chi tiết

### 📖 Hướng Dẫn
- 📊 **[Hướng Dẫn Xem Sơ Đồ PlantUML](HOW-TO-VIEW-DIAGRAMS.md)** - Cách render và xem các diagram
- 🔧 **[Fix PlantUML Error](FIX-PLANTUML-ERROR.md)** - Giải quyết lỗi "plantuml.jar not found"

## 🚀 Tính Năng Chính

### 🛍️ E-commerce Core
- ✅ Quản lý sản phẩm với phân loại chi tiết (size, màu sắc, style)
- ✅ Giỏ hàng thông minh
- ✅ Thanh toán online đa dạng
- ✅ Quản lý đơn hàng
- ✅ Lịch sử mua hàng

### 🤖 AI Features
- ✅ **AI Stylist** - Gợi ý phối đồ dựa trên:
  - Thông tin cá nhân (tuổi, giới tính, phong cách)
  - Dịp sử dụng
  - Sở thích màu sắc
- ✅ Giải thích lý do gợi ý
- ✅ Link trực tiếp đến sản phẩm

## 📊 Database Schema

### Core Tables
- `users` - Thông tin người dùng
- `roles` - Phân quyền
- `products` - Sản phẩm
- `categories` - Danh mục sản phẩm
- `carts` - Giỏ hàng
- `cart_items` - Chi tiết giỏ hàng
- `orders` - Đơn hàng
- `order_items` - Chi tiết đơn hàng
- `payments` - Thanh toán

## 🔐 Bảo Mật

- Authentication với JWT Token
- Password encryption (BCrypt)
- Role-based access control (RBAC)
- HTTPS/SSL
- Input validation & sanitization
- API rate limiting

## 🌟 Điểm Nổi Bật

1. **Tích hợp AI thông minh** - Trải nghiệm mua sắm cá nhân hóa
2. **UX/UI hiện đại** - Giao diện thân thiện, dễ sử dụng
3. **Hiệu suất cao** - Tối ưu hóa database và caching
4. **Mở rộng dễ dàng** - Kiến trúc module, dễ bảo trì

## 📝 Hướng Dẫn Sử Dụng Tài Liệu

1. Đọc **README.md** (file này) để hiểu tổng quan
2. Xem **Use Case Diagram** để hiểu chức năng
3. Tham khảo **Class Diagram** để hiểu cấu trúc dữ liệu
4. Đọc **Sequence Diagram** để hiểu luồng xử lý
5. Xem các sơ đồ còn lại để hiểu chi tiết kỹ thuật

## 👥 Nhóm Phát Triển

- **Tác giả**: [Tên của bạn]
- **Ngày**: 04/03/2026
- **Mục đích**: Đồ án tốt nghiệp / Dự án thực tế

## 📞 Liên Hệ

- Email: [your-email@example.com]
- GitHub: [your-github]

---

**© 2026 Fashion AI System. All rights reserved.**
# DACN_NguyenNhatMinh
