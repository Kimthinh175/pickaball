# 🏓 Pickaball - Pickleball Tournament & Ranking Management System

Hệ thống quản lý bảng xếp hạng tuyển thủ và tổ chức giải đấu Pickleball toàn diện, hỗ trợ quản trị viên tạo giải đấu, chia bảng, tạo nhánh đấu (bracket), cập nhật tỉ số, quản lý điểm trình và minigame giải trí.

---

## 🌟 Tính Năng Nổi Bật

### 1. Dành cho Khách & Vận Động Viên (Client)
- **Bảng Xếp Hạng Tuyển Thủ (Ranking)**:
  - Hiển thị danh sách vận động viên theo điểm trình tích lũy.
  - Tìm kiếm và lọc theo giới tính, xem hồ sơ chi tiết (avatar, thành tích, tiểu sử).
- **Danh Sách & Chi Tiết Giải Đấu (Tournaments)**:
  - Xem thông tin các giải đấu: Sắp diễn ra, Đang diễn ra, Đã kết thúc.
  - Xem sơ đồ nhánh đấu (Knockout Brackets), bảng đấu (Group Stage) và kết quả trận đấu trực tiếp.
  - Cơ cấu giải thưởng và điều lệ giải đấu rõ ràng.
- **Banners & Tin Tức**:
  - Slider banner quảng bá các giải đấu hot.
- **Pickleball Mini-game**:
  - Mini-game bóng bàn/pickleball 2D canvas tích hợp sẵn để giải trí.

### 2. Dành cho Ban Tổ Chức (Admin Dashboard)
- **Quản lý Vận Động Viên (Players)**: Thêm mới, chỉnh sửa thông tin, cập nhật avatar và điểm trình.
- **Quản lý Giải Đấu (Tournaments)**:
  - Tạo giải đấu với cấu hình linh hoạt (vòng bảng + playoff, loại trực tiếp).
  - Thêm / bớt VĐV vào giải, xếp cặp đấu (Team Pool).
  - Tự động chia bảng và sinh lịch thi đấu (Group Builder).
  - Xây dựng sơ đồ nhánh đấu trực quan (Bracket Builder).
  - Quản lý trạng thái thanh toán lệ phí thi đấu.
  - Cập nhật tỉ số trận đấu, xác định đội thắng và hoàn tất giải đấu.
- **Bảo Mật & Phân Quyền**:
  - Đăng nhập xác thực bằng **JWT (JSON Web Token)**.
  - Đổi mật khẩu quản trị viên an toàn (mã hóa bcrypt).

---

## 🏗️ Cấu Trúc Thư Mục

```text
pickaball/
├── Back-end/                  # Mã nguồn PHP xử lý REST API
│   ├── core/                  # Database PDO & Router engine
│   ├── modules/               # Controller modules (auth, player, tournament)
│   ├── services/              # Business logic & data services
│   ├── init.php               # Khởi tạo môi trường & nạp autoload
│   └── index.php              # API Dispatcher
├── Front-end/                 # Giao diện người dùng
│   ├── admin/                 # Giao diện quản trị (HTML, CSS, JS Modules)
│   ├── css/                   # Stylesheet giao diện khách
│   ├── js/                    # JavaScript ES6 Modules
│   ├── minigame/              # Mini-game 2D Engine
│   ├── public/                # Assets, logo, favicon
│   ├── index.html             # Trang chủ / Bảng xếp hạng
│   ├── tournaments.html       # Danh sách giải đấu
│   └── tournament.html        # Chi tiết giải đấu
├── public/                    # Thư mục lưu trữ banners, assets public
├── uploads/                   # Thư mục upload ảnh avatar tuyển thủ
├── .env.example               # Mẫu biến môi trường
├── .htaccess                  # Cấu hình URL Rewrite cho Apache
├── composer.json              # Quản lý thư viện PHP (Dotenv, JWT)
├── pickaball.sql              # Database dump mẫu
├── router.php                 # Router cho PHP Built-in server
├── run.sh                     # Script khởi động nhanh server trên Linux/WSL
├── start_tunnel.sh            # Script tạo link public qua Cloudflare Tunnel
└── stop.sh                    # Script dừng server và database
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### Yêu Cầu Hệ Thống:
- **PHP** >= 8.0 (hỗ trợ extensions: `pdo_mysql`, `curl`, `mbstring`, `openssl`, `fileinfo`)
- **MySQL** / **MariaDB** Server (Port 3306)
- **Composer**

---

### Cách 1: Chạy nhanh bằng script (Linux / WSL)

1. Cài đặt các gói phụ thuộc PHP:
   ```bash
   composer install
   ```

2. Tạo database và nạp dữ liệu mẫu:
   ```bash
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS pickaball_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   mysql -u root -p pickaball_db < pickaball.sql
   ```

3. Cấu hình file `.env`:
   ```bash
   cp .env.example .env
   # Chỉnh sửa thông tin kết nối DB nếu cần
   ```

4. Khởi động server:
   ```bash
   ./run.sh
   # Hoặc chọn port tùy ý: ./run.sh 8080
   ```

5. Dừng server khi không sử dụng:
   ```bash
   ./stop.sh
   ```

---

### Cách 2: Chạy trên XAMPP / Laragon (Windows)

1. **Composer**: Mở terminal trong thư mục dự án và chạy `composer install`.
2. **Database**:
   - Mở `phpMyAdmin` (`http://localhost/phpmyadmin`).
   - Tạo CSDL tên `pickaball_db`.
   - Chọn tab **Import** và chọn file `pickaball.sql`.
3. **Cấu hình**: Kiểm tra file `.env` (mặc định user `root`, mật khẩu để trống).
4. **Chạy**:
   - Copy thư mục vào `htdocs` (XAMPP) hoặc `www` (Laragon).
   - Truy cập qua `http://localhost/pickaball`.

---

## 🔑 Tài Khoản Quản Trị Mặc Định

- **Đường dẫn Admin**: `/admin` (Ví dụ: `http://localhost:8080/admin`)
- **Tài khoản**: `admin`
- **Mật khẩu**: `123456`

---

## 🌐 Tạo Link Public Truy Cập Online (Cloudflare Tunnel)

Để người khác hoặc khách hàng có thể truy cập dự án trực tiếp từ xa mà không cần mở port modem:
```bash
./start_tunnel.sh 8080
```
Terminal sẽ hiển thị đường link dạng `https://xxxx.trycloudflare.com` có HTTPS bảo mật.

---

## 📄 License
Dự án phát triển bởi Kim Thinh. Mọi quyền được bảo lưu.
