FROM node:18-slim

WORKDIR /app

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

# 执行构建 (代码在 /app/todo-api)
RUN cd todo-api && npm run build

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "todo-api/dist/main.js"]
