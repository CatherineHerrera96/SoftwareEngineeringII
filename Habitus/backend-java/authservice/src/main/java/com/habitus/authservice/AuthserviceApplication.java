package com.habitus.authservice;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AuthserviceApplication {

    public static void main(String[] args) {

        // Load .env variables before Spring starts
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();

        String dbUrl = dotenv.get("DB_URL");
        String dbUser = dotenv.get("DB_USERNAME");
        String dbPassword = dotenv.get("DB_PASSWORD");

        if (dbUrl == null || dbUser == null || dbPassword == null) {
            System.err.println("ERROR: Missing database configuration in .env file.");
            System.err.println("Please ensure DB_URL, DB_USERNAME, and DB_PASSWORD are set.");
            System.exit(1);
        }

        System.setProperty("DB_URL", dbUrl);
        System.setProperty("DB_USERNAME", dbUser);
        System.setProperty("DB_PASSWORD", dbPassword);

        SpringApplication.run(AuthserviceApplication.class, args);
    }
}
