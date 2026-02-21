# Alpine + netty-tcnative(gRPC/Google Vision) 조합에서 SIGSEGV 발생 → Debian 기반 이미지 사용
FROM --platform=linux/amd64 eclipse-temurin:17-jre
WORKDIR /app
COPY app.jar app.jar
ENTRYPOINT ["java", "-Xmx256m", "-Xms128m", "-jar", "app.jar"]
