# Dòng Tiền

Ứng dụng Android theo dõi thu chi, tài sản và khoản nợ cá nhân; dữ liệu mặc định được lưu cục bộ trên thiết bị.

## Run & Operate

- pnpm --filter @workspace/money-flow-mobile run dev — chạy ứng dụng Expo trên Replit.
- pnpm --filter @workspace/api-server run dev — chạy API server; cần PORT (mặc định môi trường Replit dùng cổng 5000).
- pnpm run typecheck — kiểm tra TypeScript trên workspace.
- pnpm run build — typecheck và build các package có script build.
- pnpm --filter @workspace/api-spec run codegen — tạo lại client và Zod schema từ OpenAPI spec.
- pnpm --filter @workspace/db run push — chỉ dùng cho môi trường phát triển sau khi cấu hình database.
- PORT — bắt buộc khi chạy API server.
- DATABASE_URL — cần cho công cụ/package cơ sở dữ liệu; ứng dụng mobile hiện không lưu sổ thu chi vào Postgres.
- GEMINI_API_KEY — tùy chọn, cần để bật endpoint phân tích Gemini ở backend.

## Stack

- pnpm workspaces, Node.js 24; TypeScript 5.9 ở workspace root và TypeScript 6.0.3 trong package mobile.
- Mobile: Expo SDK 57, React Native 0.86, Expo Router.
- API: Express 5.
- Database tooling: PostgreSQL + Drizzle ORM; schema hiện chưa có bảng ứng dụng.
- Validation/API codegen: Zod v4 và Orval từ OpenAPI spec.
- Build API: esbuild.

## Where things live

- artifacts/money-flow-mobile/ — ứng dụng mobile Expo.
  - app/(tabs)/ — màn hình Tổng quan, Giao dịch, Tài sản & nợ, Phân tích; app/settings.tsx — cài đặt.
  - context/FinanceContext.tsx — kiểu dữ liệu tài chính, trạng thái dùng chung, thao tác thêm/xóa và lưu AsyncStorage.
  - components/FinanceFormSheet.tsx — biểu mẫu thêm giao dịch, tài sản và khoản nợ.
  - utils/financeBackup.ts — định dạng và kiểm tra tệp sao lưu JSON.
  - utils/debtReminders.ts — quyền thông báo và lịch nhắc khoản nợ cục bộ.
- artifacts/api-server/src/routes/ — endpoint /api/healthz và /api/gemini/insights.
- artifacts/mockup-sandbox/ — sandbox Vite/React cho mockup, tách khỏi ứng dụng mobile.
- lib/api-spec/openapi.yaml — hợp đồng API nguồn.
- lib/api-zod/ và lib/api-client-react/ — schema Zod và React client được tạo từ API spec.
- lib/db/src/schema/ và lib/db/drizzle.config.ts — schema Drizzle và cấu hình kết nối database.
- pnpm-workspace.yaml — danh sách workspace, catalog dependency và chính sách cài package.

## Architecture decisions

- Mobile dùng mô hình local-first: giao dịch, tài sản và khoản nợ nằm trong FinanceContext và được lưu bằng AsyncStorage; không cần tài khoản cho theo dõi cơ bản.
- Tổng quan và phân tích tháng được tính trên thiết bị từ dữ liệu cục bộ; không gửi sổ giao dịch lên backend để tính các báo cáo này.
- Backend là phần riêng. API hiện có health check và endpoint Gemini tùy chọn nhận số liệu tổng hợp; màn hình Phân tích hiện vẫn chạy cục bộ và Gemini chưa được nối vào UI.
- OpenAPI spec là nguồn hợp đồng API; các package api-zod và api-client-react được tạo từ spec, nên cập nhật spec trước khi chạy codegen.
- Database package mới là nền tảng Drizzle; schema hiện trống và chưa thay thế lưu trữ cục bộ của ứng dụng.

## Product

- Ghi thu nhập và chi tiêu bằng VND, kèm danh mục và ghi chú; danh sách giao dịch có bộ lọc thu/chi.
- Theo dõi tài sản theo loại và khoản phải trả như vay, thẻ tín dụng hoặc trả góp; khoản nợ có thể có ngày đến hạn.
- Màn hình Tổng quan hiển thị giá trị ròng, dòng tiền tháng và giao dịch gần đây; Phân tích tổng hợp thu chi tháng và tỷ trọng chi tiêu theo danh mục.
- Cài đặt hỗ trợ xuất/nhập bản sao JSON, xóa dữ liệu trên thiết bị và bật nhắc hạn bằng thông báo cục bộ.
- Google Calendar, Drive/OneDrive và Gemini xuất hiện dưới dạng kết nối tùy chọn trong UI; OAuth/sync chưa được triển khai trong mobile app.

## User preferences

- Chưa có yêu cầu sản phẩm riêng nào được xác nhận; không tự suy đoán sở thích người dùng.

## Gotchas

- Dữ liệu chính nằm trong AsyncStorage trên thiết bị, không được đồng bộ đám mây. Xuất bản sao trước khi xóa dữ liệu ứng dụng hoặc chuyển thiết bị.
- Bản sao là JSON thuần và có thể chứa thông tin tài chính. Nhập bản sao sẽ thay thế toàn bộ dữ liệu hiện có sau bước xác nhận; chỉ chấp nhận format dong-tien-backup-v1.
- Nhắc hạn dùng thông báo cục bộ, cần quyền của hệ điều hành và không hoạt động trên web. Ngày nhập theo YYYY-MM-DD; ngày quá hạn không được lên lịch.
- Endpoint Gemini trả 503 nếu thiếu GEMINI_API_KEY; giới hạn hiện tại là 5 yêu cầu mỗi IP mỗi giờ trong bộ nhớ tiến trình, không phải bộ đếm bền vững.
- lib/db/src/schema/index.ts hiện chưa định nghĩa bảng. Không giả định dữ liệu mobile đã có bản lưu trên Postgres.
- Dùng pnpm, không dùng npm/yarn; preinstall từ chối package manager khác. Giữ minimumReleaseAge: 1440 trong pnpm-workspace.yaml, không tắt chính sách này.

## Pointers

- Xem skill pnpm-workspace để biết chi tiết workspace, TypeScript và package.
