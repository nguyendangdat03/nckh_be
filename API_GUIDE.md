# Hướng dẫn sử dụng API

## Cài đặt và chạy dự án

1. Cài đặt các gói phụ thuộc:
   ```
   npm install
   ```

2. Thêm dữ liệu mẫu vào cơ sở dữ liệu:
   ```
   npm run seed
   ```

3. Khởi động server:
   ```
   npm run start:dev
   ```

## Thông tin tài khoản mẫu

Tất cả tài khoản đều có mật khẩu: `password123`

### Admin
- Username: admin
- Student Code: ADMIN001

### Giảng viên
- Username: advisor1
- Student Code: GV001
- Username: advisor2
- Student Code: GV002

### Sinh viên
- Username: student1
- Student Code: SV001
- Username: student2
- Student Code: SV002
- Username: student3
- Student Code: SV003
- Username: student4
- Student Code: SV004

## API Endpoints

### Xác thực

#### Đăng nhập
```
POST /auth/login
```
Body:
```json
{
  "student_code": "SV001",
  "password": "password123"
}
```

#### Đăng ký
```
POST /auth/register
```
Body:
```json
{
  "username": "newstudent",
  "password": "password123",
  "email": "newstudent@example.com",
  "student_code": "SV999",
  "class_name": "CNTT1",
  "phone_number": "0123456999",
  "role": "student"
}
```

### Chat Box

#### Tạo box chat mới
```
POST /chat/boxes
```
Body (nếu là sinh viên):
```json
{
  "student_id": 5,
  "advisor_id": 2
}
```
Body (nếu là giảng viên):
```json
{
  "student_id": 5,
  "advisor_id": 2
}
```

#### Lấy danh sách box chat
```
GET /chat/boxes
```

#### Xem chi tiết box chat
```
GET /chat/boxes/1
```

#### Lấy tin nhắn trong box chat
```
GET /chat/boxes/1/messages
```

#### Gửi tin nhắn trong box chat
```
POST /chat/boxes/1/messages
```
Body:
```json
{
  "content": "Xin chào, tôi cần hỗ trợ về bài tập"
}
```

### Tin nhắn

#### Lấy lịch sử chat với một người dùng
```
GET /chat/messages/2
```

#### Lấy danh sách tin nhắn chưa đọc
```
GET /chat/unread
```

#### Đánh dấu tin nhắn đã đọc
```
POST /chat/messages/1/read
```

#### Gửi tin nhắn mới
```
POST /chat/messages
```
Body:
```json
{
  "receiverId": 2,
  "content": "Xin chào, tôi cần hỗ trợ"
}
```

## Luồng sử dụng API chat box

### Đối với sinh viên:

1. Đăng nhập với tài khoản sinh viên
2. Lấy danh sách box chat của mình: `GET /chat/boxes`
3. Nếu chưa có box chat với giảng viên, tạo box chat mới: `POST /chat/boxes`
4. Xem tin nhắn trong box chat: `GET /chat/boxes/1/messages`
5. Gửi tin nhắn trong box chat: `POST /chat/boxes/1/messages`

### Đối với giảng viên:

1. Đăng nhập với tài khoản giảng viên
2. Lấy danh sách box chat của mình: `GET /chat/boxes`
3. Xem tin nhắn trong box chat: `GET /chat/boxes/1/messages`
4. Gửi tin nhắn trong box chat: `POST /chat/boxes/1/messages`

## Lưu ý

- Sinh viên chỉ có thể tạo box chat với giảng viên của lớp mình
- Giảng viên có thể nhắn tin với tất cả sinh viên thuộc lớp mình quản lý
- Người dùng chỉ có thể xem và gửi tin nhắn trong box chat của chính mình 