FROM node:18-slim

WORKDIR /app

# 安装 Prisma 需要的 OpenSSL 运行时依赖
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# 调试：查看根目录内容
RUN ls -al

# 拷贝 todo-api 目录下的 package.json 及其 lock 文件到当前目录 (/app)
COPY todo-api/package*.json ./

# 调试：查看拷贝后的内容，确认 package.json 是否存在
RUN pwd && ls -al

# 安装 todo-api 依赖
RUN npm install

# 拷贝所有代码
COPY . .

# 生成 Prisma Client（必须在 build 之前）
RUN cd todo-api && npx prisma generate

# 执行构建 (代码在 /app/todo-api)
RUN cd todo-api && npm run build

# 暴露端口 (与 Railway 环境变量 PORT 保持一致)
EXPOSE 8080

# 启动命令
CMD ["node", "todo-api/dist/main.js"]
