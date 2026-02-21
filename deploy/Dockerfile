FROM --platform=linux/amd64 eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY app.jar app.jar
ENTRYPOINT ["java", "-Xmx256m", "-Xms128m", "-jar", "app.jar"]
