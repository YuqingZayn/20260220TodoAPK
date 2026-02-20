FROM node:18-slim

WORKDIR /app

# 先拷贝 package.json 及其 lock 文件
COPY todo-api/package*.json ./todo-api/
COPY package*.json ./

# 安装依赖
RUN npm install

# 拷贝所有代码
COPY . .

# 执行构建
RUN cd todo-api && npm install && npm run build

# 暴露端口（Railway 默认会通过 PORT 环境变量覆盖，但声明一下比较好）
EXPOSE 3000

# 启动命令
CMD ["node", "todo-api/dist/main.js"]
