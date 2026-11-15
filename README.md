# Đảo Kỳ Diệu

https://thanhbinhhd.github.io/dao_ky_dieu/

Website tĩnh HTML/CSS/JavaScript dành cho bé 3–6 tuổi. Website không có tài khoản, không yêu cầu đăng nhập và không gửi dữ liệu lên máy chủ. Tiến trình học được lưu bằng `localStorage` trên chính trình duyệt đang chơi.

## Chạy ở máy local

Có thể mở `index.html` trực tiếp, hoặc chạy một web server tĩnh trong thư mục này. Ví dụ với Node.js:

```powershell
node preview-server.mjs
```

Sau đó mở `http://127.0.0.1:4173`. Nếu cổng này đang được dùng, có thể chọn cổng khác bằng `$env:PORT=4174; node preview-server.mjs`.

## Đưa lên GitHub Pages

1. Tạo một repository GitHub và push toàn bộ nội dung thư mục này lên nhánh `main`.
2. Trong repository, mở **Settings → Pages**.
3. Chọn **Deploy from a branch**, nhánh `main`, thư mục `/ (root)` rồi lưu.
4. Nếu dùng domain riêng, nhập domain tại **Custom domain** và cấu hình DNS theo hướng dẫn của GitHub.

`index.html` nằm ngay thư mục gốc nên không cần bước build. Khi chuyển sang domain mới, dữ liệu tiến trình cũ không tự chuyển theo vì `localStorage` được tách riêng theo từng domain.
