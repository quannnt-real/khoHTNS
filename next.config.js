/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
    ],
    unoptimized: true, // Tắt tối ưu hóa hình ảnh để hiển thị hình ảnh từ thư mục uploads
  },
  experimental: {
    workerThreads: true, // worker threads để giảm tải spawn child process
    cpus: 1, // Giới hạn số lượng CPU sử dụng
  },
}

module.exports = nextConfig