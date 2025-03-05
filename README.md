# Quản lý kho hàng

Ứng dụng quản lý kho hàng xây dựng bằng Next.js.

# Hướng dẫn thiết lập ứng dụng QLKho

## Các bước thiết lập sau khi clone dự án từ git về

1. **Cài đặt các phụ thuộc**
   ```bash
   npm install
   ```

2. **Tạo cơ sở dữ liệu và áp dụng schema Prisma**
   ```bash
   npx prisma migrate dev --name init
   ```
   *Lưu ý: Lệnh này sẽ tạo file `dev.db` chứa dữ liệu SQLite*

3. **Tạo thư mục uploads (nếu cần)**
   ```bash
   mkdir -p public/uploads
   ```

4. **Tạo tài khoản admin và user**
   ```bash
   node create-admin.js
   ```
   *Sau khi chạy, bạn sẽ có tài khoản mặc định:*
   + Admin:
     -   Số điện thoại: 0987654321
     -   Mật khẩu: 123456789
  
   + User thường
     -   Số điện thoại: 0987654322
     -   Mật khẩu: 123456789

6. **(Tùy chọn) Tạo dữ liệu thiết bị mẫu**
   ```bash
   node sample-device.js
   ```
   **Lưu ý về hình ảnh:** Dữ liệu mẫu sử dụng URL hình ảnh từ internet. Bạn cần tự tải và lưu hình ảnh vào thư mục `uploads` để hiển thị đúng.

7. **Chạy ứng dụng**
   ```bash
   npm run dev
   ```
   Sau đó truy cập: http://localhost:3000

## Cấu trúc thư mục

```
khoHTNS/
├─ components/       # Các component UI 
├─ contexts/         # React contexts
├─ lib/              # Các helper function
├─ pages/            # Các trang và API
│  ├─ api/           # API endpoints
│  ├─ devices/       # Trang quản lý thiết bị
│  ├─ events/        # Trang quản lý sự kiện
│  └─ ...            # Các trang khác
├─ prisma/           # Model và migration DB
├─ public/           # Assets tĩnh
│  └─ uploads/       # Thư mục chứa ảnh tải lên
└─ styles/           # CSS
```

**Các tính năng chính**
**1. Quản lý thiết bị**

* Thêm, sửa, xóa thiết bị
* Theo dõi trạng thái (sẵn có/đã mượn)
* Quản lý hình ảnh thiết bị
* Quản lý sự kiện

**2. Tạo sự kiện mới**
* Gán thiết bị cho sự kiện
* Theo dõi thời gian sử dụng
* Hệ thống mượn/trả

**3. Quy trình mượn/trả thiết bị**
* Lịch sử mượn/trả
* Chuyển giao thiết bị giữa người dùng
* Thông báo thời gian thực

**4. Nhận thông báo khi có yêu cầu mượn/trả**
* Thông báo khi thiết bị được chuyển giao

## Xử lý lỗi thường gặp

### 1. Lỗi "Không thể tải danh sách thiết bị"
- Đảm bảo đã chạy lệnh `npx prisma migrate dev --name init`
- Kiểm tra file `dev.db` đã được tạo
- Thử restart server

### 2. Lỗi hiển thị hình ảnh
- Kiểm tra thư mục `public/uploads` đã được tạo
- Đảm bảo đường dẫn hình ảnh trong DB chính xác (bắt đầu bằng `/uploads/`)

### 3. Lỗi đăng nhập
- Đảm bảo đã chạy script `create-admin.js`
- Kiểm tra thông tin đăng nhập: 0987654321 / 123456789 

### 4. Lỗi "The "to" argument must be of type string. Received undefined"
- Xóa thư mục `.next` và khởi động lại ứng dụng
  ```bash
  rm -rf .next && npm run dev
  ```
- Hoặc thử chạy trên port khác
  ```bash
  npm run dev -- -p 3001
  ```

## Tài khoản demo

**Admin**
- Số điện thoại: 0987654321
- Mật khẩu: 123456789

**Thường**
- Bạn có thể tạo tài khoản thường bằng cách đăng ký mới

**Liên kết**
* GitHub Repository: https://github.com/quannnt-real/khoHTNS
***
© 2025 - Quản lý kho HTNS
